package service

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"croc-interface/backend/transfer"

	"github.com/schollz/croc/v11/src/codephrase"
	"github.com/schollz/croc/v11/src/croc"
	"github.com/schollz/croc/v11/src/models"
	qrcode "github.com/skip2/go-qrcode"
)

// AppService bridges GUI actions to the underlying Croc transfer engine.
type AppService struct {
	mu       sync.Mutex
	tm       *transfer.TransferManager
	prefs    *PreferencesManager
	relayMgr *EmbeddedRelayManager
	emitter  func(event string, data any)
}

// NewAppService creates an initialized AppService.
func NewAppService() *AppService {
	svc := &AppService{
		tm:       transfer.NewTransferManager(),
		prefs:    NewPreferencesManager(),
		relayMgr: NewEmbeddedRelayManager(),
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

// PickFile displays the native OS file picker and returns a single selected file path.
func (s *AppService) PickFile() (string, error) {
	files, err := s.PickFiles()
	if err != nil || len(files) == 0 {
		return "", err
	}
	return files[0], nil
}

// PickFiles displays the native OS file picker allowing selection of multiple files.
func (s *AppService) PickFiles() ([]string, error) {
	return s.pickFilesNative()
}

// PickFolder displays the native OS folder picker and returns the selected directory path.
func (s *AppService) PickFolder() (string, error) {
	return s.pickFolderNative()
}

// SavePastedImage saves base64-encoded image data from clipboard into a temporary file for sending.
func (s *AppService) SavePastedImage(filename string, base64Data string) (string, error) {
	if strings.TrimSpace(filename) == "" {
		filename = fmt.Sprintf("pasted_image_%d.png", time.Now().UnixNano()/1e6)
	}
	// Strip optional data URL prefix like "data:image/png;base64,"
	if idx := strings.Index(base64Data, ","); idx != -1 {
		base64Data = base64Data[idx+1:]
	}
	rawBytes, err := base64.StdEncoding.DecodeString(strings.TrimSpace(base64Data))
	if err != nil {
		return "", fmt.Errorf("invalid base64 image data: %w", err)
	}

	tmpDir := filepath.Join(os.TempDir(), "croc-pasted-files")
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		tmpDir = os.TempDir()
	}
	targetPath := filepath.Join(tmpDir, filename)
	if err := os.WriteFile(targetPath, rawBytes, 0o644); err != nil {
		return "", fmt.Errorf("failed to save pasted image to disk: %w", err)
	}

	return targetPath, nil
}

// GetClipboardImage reads any image currently in the system clipboard and saves it to a temp file.
func (s *AppService) GetClipboardImage() (string, error) {
	var rawBytes []byte

	// 1. Try Wayland wl-paste
	if lp, err := exec.LookPath("wl-paste"); err == nil {
		out, err := exec.Command(lp, "--type", "image/png").Output()
		if err == nil && len(out) > 0 {
			rawBytes = out
		} else {
			out, err := exec.Command(lp, "--type", "image/jpeg").Output()
			if err == nil && len(out) > 0 {
				rawBytes = out
			}
		}
	}

	// 2. Try X11 xclip if wl-paste didn't return image
	if len(rawBytes) == 0 {
		if xp, err := exec.LookPath("xclip"); err == nil {
			out, err := exec.Command(xp, "-selection", "clipboard", "-t", "image/png", "-o").Output()
			if err == nil && len(out) > 0 {
				rawBytes = out
			}
		}
	}

	if len(rawBytes) == 0 {
		return "", errors.New("no image found in system clipboard")
	}

	tmpDir := filepath.Join(os.TempDir(), "croc-pasted-files")
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		tmpDir = os.TempDir()
	}
	filename := fmt.Sprintf("pasted_image_%d.png", time.Now().UnixNano()/1e6)
	targetPath := filepath.Join(tmpDir, filename)
	if err := os.WriteFile(targetPath, rawBytes, 0o644); err != nil {
		return "", fmt.Errorf("failed to save clipboard image: %w", err)
	}

	return targetPath, nil
}

// SendFiles initiates an outbound transfer for one or more files/folders.
func (s *AppService) SendFiles(filePaths []string, isLocalOnly bool) (string, error) {
	if len(filePaths) == 0 {
		return "", errors.New("no files selected to send")
	}

	var validPaths []string
	for _, p := range filePaths {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if _, err := os.Stat(p); err != nil {
			return "", fmt.Errorf("file or folder not found: %s (%w)", p, err)
		}
		validPaths = append(validPaths, p)
	}

	if len(validPaths) == 0 {
		return "", errors.New("no valid files or folders to send")
	}

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

	filesInfo, emptyFolders, totalFolders, err := croc.GetFilesInfoContext(ctx, validPaths, false, false, nil)
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

// SendFile initiates an outbound file transfer and returns the generated code phrase.
func (s *AppService) SendFile(filePath string, isLocalOnly bool) (string, error) {
	return s.SendFiles([]string{filePath}, isLocalOnly)
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
	return s.pickDownloadDirNative()
}

// GetConfig retrieves the current user configuration for both FE and BE.
func (s *AppService) GetConfig() (UserConfig, error) {
	if s.prefs == nil {
		s.prefs = NewPreferencesManager()
	}
	return s.prefs.GetConfig(), nil
}

// UpdateConfig persists changes to the user configuration.
func (s *AppService) UpdateConfig(cfg UserConfig) error {
	if s.prefs == nil {
		s.prefs = NewPreferencesManager()
	}
	return s.prefs.UpdateConfig(cfg)
}

// ResetConfig resets all configuration settings to default.
func (s *AppService) ResetConfig() (UserConfig, error) {
	if s.prefs == nil {
		s.prefs = NewPreferencesManager()
	}
	return s.prefs.ResetConfig()
}

func (s *AppService) buildOptions(code string, isSender bool, isLocalOnly bool) croc.Options {
	cfg := s.prefs.GetConfig()
	relayAddr := cfg.RelayAddress
	if relayAddr == "" {
		relayAddr = models.DEFAULT_RELAY
	}
	relayPass := cfg.RelayPassword
	if relayPass == "" {
		relayPass = models.DEFAULT_PASSPHRASE
	}
	onlyLocal := isLocalOnly || cfg.OnlyLocal

	return croc.Options{
		IsSender:         isSender,
		SharedSecret:     code,
		RelayPorts:       []string{"9009", "9010", "9011", "9012"},
		RelayPassword:    relayPass,
		RelayAddress:     relayAddr,
		RelayAddress6:    models.DEFAULT_RELAY6,
		Curve:            "p256",
		HashAlgorithm:    "xxhash",
		OnlyLocal:        onlyLocal,
		DisableLocal:     false,
		Overwrite:        cfg.Overwrite,
		NoPrompt:         true,
		DisableClipboard: true,
		DisableTailcat:   true,
	}
}

// StartEmbeddedRelay starts the in-app private relay server on the designated control port.
func (s *AppService) StartEmbeddedRelay(port string, password string) (RelayStatus, error) {
	err := s.relayMgr.Start(port, 3, password)
	return s.relayMgr.Status(), err
}

// StopEmbeddedRelay stops the in-app private relay server.
func (s *AppService) StopEmbeddedRelay() (RelayStatus, error) {
	err := s.relayMgr.Stop()
	return s.relayMgr.Status(), err
}

// GetEmbeddedRelayStatus returns the status and listening addresses of the embedded relay server.
func (s *AppService) GetEmbeddedRelayStatus() (RelayStatus, error) {
	return s.relayMgr.Status(), nil
}
