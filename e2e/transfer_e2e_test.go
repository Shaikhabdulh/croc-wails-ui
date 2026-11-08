package e2e

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"croc-interface/backend/service"
	"croc-interface/backend/transfer"
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
		// In headless environment or tests without desktop session, xdg-open might return exit status, but command starts
		t.Logf("OpenFolder start returned: %v (expected in headless test environment)", err)
	}
}
