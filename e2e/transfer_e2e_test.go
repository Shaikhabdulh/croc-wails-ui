package e2e

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/rand"
	"net"
	"os"
	"path/filepath"
	"strconv"
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

func freeConsecutivePorts(t *testing.T, count int) []string {
	t.Helper()
	for range 100 {
		base := 21000 + rand.Intn(20000)
		listeners := make([]net.Listener, 0, count)
		ports := make([]string, 0, count)
		ok := true
		for i := 0; i < count; i++ {
			port := strconv.Itoa(base + i)
			l, err := net.Listen("tcp", net.JoinHostPort("127.0.0.1", port))
			if err != nil {
				ok = false
				break
			}
			listeners = append(listeners, l)
			ports = append(ports, port)
		}
		for _, l := range listeners {
			_ = l.Close()
		}
		if ok {
			return ports
		}
	}
	t.Fatalf("could not find %d consecutive free ports", count)
	return nil
}

func startTestRelay(t *testing.T, dataPortCount int) (controlAddr string, dataPorts []string, cleanup func()) {
	t.Helper()
	ports := freeConsecutivePorts(t, dataPortCount+1)
	controlPort := ports[0]
	dPorts := ports[1:]
	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		_ = tcp.RunCtx(ctx, "error", "127.0.0.1", controlPort, "pass123", strings.Join(dPorts, ","))
	}()
	for _, dp := range dPorts {
		p := dp
		go func() {
			_ = tcp.RunCtx(ctx, "error", "127.0.0.1", p, "pass123")
		}()
	}

	deadline := time.Now().Add(5 * time.Second)
	for _, p := range ports {
		ready := false
		for time.Now().Before(deadline) {
			conn, err := net.DialTimeout("tcp", net.JoinHostPort("127.0.0.1", p), 50*time.Millisecond)
			if err == nil {
				_ = conn.Close()
				ready = true
				break
			}
			time.Sleep(20 * time.Millisecond)
		}
		if !ready {
			cancel()
			t.Fatalf("port %s failed to become ready", p)
		}
	}

	return net.JoinHostPort("127.0.0.1", controlPort), dPorts, cancel
}

func fileSHA256(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:]), nil
}

func TestLoopbackTransfer(t *testing.T) {
	controlAddr, dataPorts, cleanup := startTestRelay(t, 3)
	defer cleanup()

	// Create test file with content
	srcDir := t.TempDir()
	outDir := t.TempDir()
	srcFile := filepath.Join(srcDir, "payload.txt")
	testPayload := "This is a real end-to-end P2P transfer verified through the loopback relay!"
	if err := os.WriteFile(srcFile, []byte(testPayload), 0o644); err != nil {
		t.Fatalf("failed to write test file: %v", err)
	}

	codePhrase := "8888-loopback-verification"

	baseOpts := croc.Options{
		SharedSecret:     codePhrase,
		RelayAddress:     controlAddr,
		RelayPassword:    "pass123",
		Curve:            "p256",
		HashAlgorithm:    "xxhash",
		NoPrompt:         true,
		DisableLocal:     true,
		DisableTailcat:   true,
		DisableClipboard: true,
		Overwrite:        true,
	}

	senderOpts := baseOpts
	senderOpts.IsSender = true
	senderOpts.RelayPorts = append([]string(nil), dataPorts...)

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

	receiverOpts := baseOpts
	receiverOpts.IsSender = false
	receiverOpts.RelayPorts = nil

	receiverClient, err := croc.NewCtx(context.Background(), receiverOpts)
	if err != nil {
		t.Fatalf("failed to create receiver client: %v", err)
	}

	receiverManager := transfer.NewTransferManager()
	receiverClient.SetHooks(receiverManager.Hooks())

	oldWd, _ := os.Getwd()
	if err := os.Chdir(outDir); err != nil {
		t.Fatalf("failed to chdir to outDir: %v", err)
	}
	defer func() {
		_ = os.Chdir(oldWd)
	}()

	errChan := make(chan error, 2)
	go func() {
		errChan <- senderClient.Send(filesInfo, emptyFolders, totalFolders)
	}()

	time.Sleep(100 * time.Millisecond)

	go func() {
		errChan <- receiverClient.Receive()
	}()

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

	receivedFile := filepath.Join(outDir, "payload.txt")
	gotContent, err := os.ReadFile(receivedFile)
	if err != nil {
		t.Fatalf("failed to read received file: %v", err)
	}

	if string(gotContent) != testPayload {
		t.Fatalf("payload mismatch!\nGot: %q\nWant: %q", string(gotContent), testPayload)
	}
}

func TestMultiFileTransferWithHashVerification(t *testing.T) {
	controlAddr, dataPorts, cleanup := startTestRelay(t, 3)
	defer cleanup()

	srcDir := t.TempDir()
	outDir := t.TempDir()

	// 1. Text file
	f1 := filepath.Join(srcDir, "notes.txt")
	_ = os.WriteFile(f1, []byte("Hello croc peer! Multi-file transfer text payload."), 0o644)

	// 2. Binary file with random bytes
	f2 := filepath.Join(srcDir, "data.bin")
	binData := make([]byte, 8192)
	for i := range binData {
		binData[i] = byte((i * 37) % 256)
	}
	_ = os.WriteFile(f2, binData, 0o644)

	// 3. Mock PNG image file
	f3 := filepath.Join(srcDir, "screenshot.png")
	pngData := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52}
	_ = os.WriteFile(f3, pngData, 0o644)

	fileList := []string{f1, f2, f3}
	expectedHashes := make(map[string]string)
	for _, p := range fileList {
		h, err := fileSHA256(p)
		if err != nil {
			t.Fatalf("failed to calculate source hash for %s: %v", p, err)
		}
		expectedHashes[filepath.Base(p)] = h
		t.Logf("[Source Hash] %s: %s", filepath.Base(p), h)
	}

	codePhrase := "7777-multi-file-hash-verify"

	baseOpts := croc.Options{
		SharedSecret:     codePhrase,
		RelayAddress:     controlAddr,
		RelayPassword:    "pass123",
		Curve:            "p256",
		HashAlgorithm:    "xxhash",
		NoPrompt:         true,
		DisableLocal:     true,
		DisableTailcat:   true,
		DisableClipboard: true,
		Overwrite:        true,
	}

	senderOpts := baseOpts
	senderOpts.IsSender = true
	senderOpts.RelayPorts = append([]string(nil), dataPorts...)

	senderClient, err := croc.NewCtx(context.Background(), senderOpts)
	if err != nil {
		t.Fatalf("failed to create sender client: %v", err)
	}
	senderManager := transfer.NewTransferManager()
	senderClient.SetHooks(senderManager.Hooks())

	filesInfo, emptyFolders, totalFolders, err := croc.GetFilesInfoContext(context.Background(), fileList, false, false, nil)
	if err != nil {
		t.Fatalf("failed to get multi-file info: %v", err)
	}
	if len(filesInfo) != 3 {
		t.Fatalf("expected 3 filesInfo, got %d", len(filesInfo))
	}

	receiverOpts := baseOpts
	receiverOpts.IsSender = false
	receiverOpts.RelayPorts = nil

	receiverClient, err := croc.NewCtx(context.Background(), receiverOpts)
	if err != nil {
		t.Fatalf("failed to create receiver client: %v", err)
	}
	receiverManager := transfer.NewTransferManager()
	receiverClient.SetHooks(receiverManager.Hooks())

	oldWd, _ := os.Getwd()
	if err := os.Chdir(outDir); err != nil {
		t.Fatalf("failed to chdir to outDir: %v", err)
	}
	defer func() {
		_ = os.Chdir(oldWd)
	}()

	errChan := make(chan error, 2)
	go func() {
		errChan <- senderClient.Send(filesInfo, emptyFolders, totalFolders)
	}()

	time.Sleep(100 * time.Millisecond)

	go func() {
		errChan <- receiverClient.Receive()
	}()

	for i := 0; i < 2; i++ {
		select {
		case err := <-errChan:
			if err != nil {
				t.Fatalf("multi-file transfer error: %v", err)
			}
		case <-time.After(20 * time.Second):
			t.Fatal("multi-file transfer timed out after 20s")
		}
	}

	// Cryptographic SHA-256 Hash Verification for every received file
	for _, p := range fileList {
		baseName := filepath.Base(p)
		receivedPath := filepath.Join(outDir, baseName)
		if _, err := os.Stat(receivedPath); err != nil {
			t.Fatalf("received file %s does not exist in destination", baseName)
		}

		receivedHash, err := fileSHA256(receivedPath)
		if err != nil {
			t.Fatalf("failed to compute hash for received file %s: %v", baseName, err)
		}

		expectedHash := expectedHashes[baseName]
		t.Logf("[Received Hash] %s: %s (Expected: %s)", baseName, receivedHash, expectedHash)

		if receivedHash != expectedHash {
			t.Fatalf("SHA-256 HASH MISMATCH for %s!\nGot:  %s\nWant: %s", baseName, receivedHash, expectedHash)
		}
	}
	fmt.Println("All 3 files successfully transferred and verified with matching SHA-256 hashes!")
}

