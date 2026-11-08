package service

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"croc-interface/backend/transfer"

	"github.com/schollz/croc/v11/src/codephrase"
	"github.com/schollz/croc/v11/src/croc"
	"github.com/schollz/croc/v11/src/models"
	qrcode "github.com/skip2/go-qrcode"
	"github.com/wailsapp/wails/v3/pkg/application"
)

// AppService bridges GUI actions to the underlying Croc transfer engine.
type AppService struct {
	mu      sync.Mutex
	tm      *transfer.TransferManager
	prefs   *PreferencesManager
	emitter func(event string, data any)
}

// NewAppService creates an initialized AppService.
func NewAppService() *AppService {
	svc := &AppService{
		tm:    transfer.NewTransferManager(),
		prefs: NewPreferencesManager(),
	}

	svc.tm.OnStateChange = func(state string) {
		svc.emitEvent("transfer:state", state)
	}
	svc.tm.OnProgress = func(p transfer.ProgressInfo) {
		svc.emitEvent("transfer:progress", p)
	}
	svc.tm.OnDone = func(err error) {
		svc.emitEvent("transfer:done", map[string]any{"success": true})
	}
	svc.tm.OnError = func(err error) {
		svc.emitEvent("transfer:error", err.Error())
	}

	return svc
}

// SetEventEmitter configures the callback used to publish events to the frontend.
func (s *AppService) SetEventEmitter(emitter func(event string, data any)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.emitter = emitter
}

func (s *AppService) emitEvent(event string, data any) {
	s.mu.Lock()
	fn := s.emitter
	s.mu.Unlock()

	if fn != nil {
		fn(event, data)
	}
}

// PickFile displays the native OS file picker and returns the selected file path.
func (s *AppService) PickFile() (string, error) {
	app := application.Get()
	if app == nil {
		return "", nil
	}
	dialog := app.Dialog.OpenFile()
	dialog.CanChooseFiles(true).CanChooseDirectories(false).SetTitle("Select File to Send")
	return dialog.PromptForSingleSelection()
}

// PickFolder displays the native OS folder picker and returns the selected directory path.
func (s *AppService) PickFolder() (string, error) {
	app := application.Get()
	if app == nil {
		return "", nil
	}
	dialog := app.Dialog.OpenFile()
	dialog.CanChooseFiles(false).CanChooseDirectories(true).SetTitle("Select Folder to Send")
	return dialog.PromptForSingleSelection()
}

// SendFile initiates an outbound file transfer and returns the generated code phrase.
func (s *AppService) SendFile(filePath string, isLocalOnly bool) (string, error) {
	filePath = strings.TrimSpace(filePath)
	if filePath == "" {
		return "", errors.New("file path cannot be empty")
	}

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return "", fmt.Errorf("file not found: %w", err)
	}
	_ = fileInfo

	ctx, err := s.tm.TryStart(true)
	if err != nil {
		return "", err
	}

	code, err := codephrase.Generate()
	if err != nil {
		s.tm.Reset()
		return "", fmt.Errorf("failed to generate code phrase: %w", err)
	}

	opts := s.buildOptions(code, true, isLocalOnly)
	client, err := croc.NewCtx(ctx, opts)
	if err != nil {
		s.tm.Reset()
		return "", fmt.Errorf("failed to initialize croc client: %w", err)
	}

	client.SetHooks(s.tm.Hooks())
	s.tm.SetClient(client)

	filesInfo, emptyFolders, totalFolders, err := croc.GetFilesInfoContext(ctx, []string{filePath}, false, false, nil)
	if err != nil {
		s.tm.Reset()
		return "", fmt.Errorf("failed to gather file information: %w", err)
	}

	s.tm.EmitState(transfer.StateWaiting)

	go func() {
		sendErr := client.Send(filesInfo, emptyFolders, totalFolders)
		s.tm.Finish(sendErr)
	}()

	return code, nil
}

// ReceiveFile connects to a sender using codePhrase and receives the transfer into the configured download directory.
func (s *AppService) ReceiveFile(codePhrase string, isLocalOnly bool) error {
	codePhrase = strings.TrimSpace(codePhrase)
	if len(codePhrase) < 6 {
		return errors.New("code phrase is invalid or too short (must be at least 6 characters)")
	}

	downloadDir, err := s.GetDownloadDir()
	if err != nil {
		return err
	}

	ctx, err := s.tm.TryStart(false)
	if err != nil {
		return err
	}

	opts := s.buildOptions(codePhrase, false, isLocalOnly)
	client, err := croc.NewCtx(ctx, opts)
	if err != nil {
		s.tm.Reset()
		return fmt.Errorf("failed to initialize croc client: %w", err)
	}

	client.SetHooks(s.tm.Hooks())
	s.tm.SetClient(client)

	oldWd, err := os.Getwd()
	if err != nil {
		oldWd = ""
	}
	if err := os.Chdir(downloadDir); err != nil {
		s.tm.Reset()
		return fmt.Errorf("failed to change directory to %s: %w", downloadDir, err)
	}

	s.tm.EmitState(transfer.StateConnecting)

	go func() {
		defer func() {
			if oldWd != "" {
				_ = os.Chdir(oldWd)
			}
		}()
		receiveErr := client.Receive()
		s.tm.Finish(receiveErr)
	}()

	return nil
}

// CancelTransfer stops the active transfer immediately.
func (s *AppService) CancelTransfer() error {
	s.tm.Cancel()
	return nil
}

// OpenDownloadsFolder reveals the downloaded file or opens the configured download folder in the file manager.
func (s *AppService) OpenDownloadsFolder(filename string) error {
	dir, err := s.GetDownloadDir()
	if err != nil {
		return err
	}

	target := dir
	if filename != "" {
		candidate := filepath.Join(dir, filename)
		if _, err := os.Stat(candidate); err == nil {
			target = candidate
		}
	}

	return OpenFolder(target)
}

// GenerateQRCode encodes the given code phrase into a base64 PNG data URL.
func (s *AppService) GenerateQRCode(code string) (string, error) {
	png, err := qrcode.Encode(code, qrcode.Medium, 256)
	if err != nil {
		return "", err
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(png), nil
}

// GetDownloadDir returns the path to the current configured download folder.
func (s *AppService) GetDownloadDir() (string, error) {
	if s.prefs == nil {
		return GetDefaultDownloadDir()
	}
	return s.prefs.GetDownloadDir()
}

// SetDownloadDir updates and persists the preferred download folder.
func (s *AppService) SetDownloadDir(path string) error {
	if s.prefs == nil {
		s.prefs = NewPreferencesManager()
	}
	return s.prefs.SetDownloadDir(path)
}

// ResetDownloadDir resets the download folder to the system default (~/Downloads).
func (s *AppService) ResetDownloadDir() (string, error) {
	if s.prefs == nil {
		return GetDefaultDownloadDir()
	}
	return s.prefs.ResetDownloadDir()
}

// PickDownloadDir prompts the user with a native folder chooser dialog and saves the selection.
func (s *AppService) PickDownloadDir() (string, error) {
	app := application.Get()
	if app == nil {
		return s.GetDownloadDir()
	}

	currentDir, _ := s.GetDownloadDir()
	dialog := app.Dialog.OpenFile()
	dialog.SetTitle("Select Default Download Folder").
		CanChooseDirectories(true).
		CanChooseFiles(false)

	if currentDir != "" {
		dialog.SetDirectory(currentDir)
	}

	selected, err := dialog.PromptForSingleSelection()
	if err != nil || selected == "" {
		return s.GetDownloadDir()
	}

	if err := s.SetDownloadDir(selected); err != nil {
		return "", err
	}

	return selected, nil
}

func (s *AppService) buildOptions(code string, isSender bool, isLocalOnly bool) croc.Options {
	return croc.Options{
		IsSender:         isSender,
		SharedSecret:     code,
		RelayPorts:       []string{"9009", "9010", "9011", "9012"},
		RelayPassword:    models.DEFAULT_PASSPHRASE,
		RelayAddress:     models.DEFAULT_RELAY,
		RelayAddress6:    models.DEFAULT_RELAY6,
		Curve:            "p256",
		HashAlgorithm:    "xxhash",
		OnlyLocal:        isLocalOnly,
		DisableLocal:     false,
		NoPrompt:         true,
		DisableClipboard: true,
		DisableTailcat:   true,
	}
}
