package e2e

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"croc-interface/backend/service"
	"croc-interface/backend/transfer"

	"github.com/schollz/croc/v11/src/croc"
	"github.com/schollz/croc/v11/src/tcp"
)

func TestEndToEndServiceIntegration(t *testing.T) {
	// 1. Create a temporary file to transfer
	tmpDir := t.TempDir()
	testFilePath := filepath.Join(tmpDir, "sample_document.txt")
	testContent := "End-to-end encrypted transfer verification with croc-interface!"
	if err := os.WriteFile(testFilePath, []byte(testContent), 0o644); err != nil {
		t.Fatalf("failed to create sample file: %v", err)
	}

	// 2. Initialize AppService
	appSvc := service.NewAppService()

	// 3. Verify event plumbing
	receivedEvents := make(map[string]any)
	appSvc.SetEventEmitter(func(event string, data any) {
		receivedEvents[event] = data
	})

	// 4. Verify QR Code generation for code phrase
	testCode := "9999-secure-peer-exchange"
	qrUrl, err := appSvc.GenerateQRCode(testCode)
	if err != nil {
		t.Fatalf("failed to generate QR code: %v", err)
	}
	if !strings.HasPrefix(qrUrl, "data:image/png;base64,") {
		t.Fatalf("expected QR data URL, got: %s", qrUrl)
	}

	// 5. Verify default download folder discovery
	downloadDir, err := appSvc.GetDownloadDir()
	if err != nil {
		t.Fatalf("failed to get download dir: %v", err)
	}
	if downloadDir == "" {
		t.Fatal("expected non-empty download directory")
	}

	// 6. Test cancellation workflow
	tm := transfer.NewTransferManager()
	ctx, err := tm.TryStart(true)
	if err != nil {
		t.Fatalf("failed to start transfer: %v", err)
	}

	// Concurrent start must be rejected
	if _, err := tm.TryStart(false); err == nil {
		t.Fatal("expected error on concurrent transfer attempt")
	}

	// Cancel active transfer
	tm.Cancel()
	if tm.IsRunning() {
		t.Fatal("expected transfer to stop running after cancel")
	}

	select {
	case <-ctx.Done():
		// OK
	case <-time.After(1 * time.Second):
		t.Fatal("expected context to be cancelled immediately")
	}

	// 7. Verify folder opener
	if err := service.OpenFolder(tmpDir); err != nil {
		t.Logf("OpenFolder start returned: %v (expected in headless test environment)", err)
	}
}

func TestLoopbackTransfer(t *testing.T) {
	// Spawns an in-process local relay and performs an actual end-to-end encrypted file transfer
	relayPorts := []string{"18009", "18010", "18011", "18012"}
	relayCtx, cancelRelay := context.WithCancel(context.Background())
	defer cancelRelay()

	for _, port := range relayPorts {
		go func(p string) {
			_ = tcp.RunWithOptionsAsync("127.0.0.1", p, "pass123",
				tcp.WithCtx(relayCtx),
				tcp.WithLogLevel("error"),
				tcp.WithBanner(strings.Join(relayPorts[1:], ",")),
				tcp.WithAdmissionLimits(10000, 10000, time.Minute),
			)
		}(port)
	}

	// Wait for local relay to listen
	deadline := time.Now().Add(5 * time.Second)
	relayReady := false
	for time.Now().Before(deadline) {
		conn, err := net.DialTimeout("tcp", "127.0.0.1:18009", 100*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			relayReady = true
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	if !relayReady {
		t.Fatal("local relay failed to start on 127.0.0.1:18009")
	}

	// Create test file with content
	srcDir := t.TempDir()
	outDir := t.TempDir()
	srcFile := filepath.Join(srcDir, "payload.txt")
	testPayload := "This is a real end-to-end P2P transfer verified through the loopback relay!"
	if err := os.WriteFile(srcFile, []byte(testPayload), 0o644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	codePhrase := "8888-loopback-verification"

	// Sender setup
	senderOpts := croc.Options{
		IsSender:       true,
		SharedSecret:   codePhrase,
		RelayAddress:   "127.0.0.1:18009",
		RelayPorts:     relayPorts,
		RelayPassword:  "pass123",
		Curve:          "p256",
		HashAlgorithm:  "xxhash",
		NoPrompt:       true,
		DisableTailcat: true,
	}

	senderClient, err := croc.NewCtx(context.Background(), senderOpts)
	if err != nil {
		t.Fatalf("failed to create sender client: %v", err)
	}

	senderManager := transfer.NewTransferManager()
	senderClient.SetHooks(senderManager.Hooks())

	filesInfo, emptyFolders, totalFolders, err := croc.GetFilesInfoContext(context.Background(), []string{srcFile}, false, false, nil)
	if err != nil {
		t.Fatalf("failed to get file info: %v", err)
	}

	// Receiver setup
	receiverOpts := croc.Options{
		IsSender:       false,
		SharedSecret:   codePhrase,
		RelayAddress:   "127.0.0.1:18009",
		RelayPorts:     relayPorts,
		RelayPassword:  "pass123",
		Curve:          "p256",
		HashAlgorithm:  "xxhash",
		NoPrompt:       true,
		DisableTailcat: true,
	}

	receiverClient, err := croc.NewCtx(context.Background(), receiverOpts)
	if err != nil {
		t.Fatalf("failed to create receiver client: %v", err)
	}

	receiverManager := transfer.NewTransferManager()
	receiverClient.SetHooks(receiverManager.Hooks())

	// Run transfer
	errChan := make(chan error, 2)
	go func() {
		errChan <- senderClient.Send(filesInfo, emptyFolders, totalFolders)
	}()

	oldWd, _ := os.Getwd()
	if err := os.Chdir(outDir); err != nil {
		t.Fatalf("failed to chdir to outDir: %v", err)
	}
	defer func() {
		_ = os.Chdir(oldWd)
	}()

	go func() {
		errChan <- receiverClient.Receive()
	}()

	// Wait for both sender and receiver to complete
	for i := 0; i < 2; i++ {
		select {
		case err := <-errChan:
			if err != nil {
				t.Fatalf("transfer encountered error: %v", err)
			}
		case <-time.After(15 * time.Second):
			t.Fatal("transfer timed out after 15s")
		}
	}

	// Verify file received and contents match
	receivedFile := filepath.Join(outDir, "payload.txt")
	gotContent, err := os.ReadFile(receivedFile)
	if err != nil {
		t.Fatalf("failed to read received file: %v", err)
	}

	if string(gotContent) != testPayload {
		t.Fatalf("payload mismatch!\nGot: %q\nWant: %q", string(gotContent), testPayload)
	}
}
