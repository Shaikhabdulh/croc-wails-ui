package service

import (
	"strings"
	"testing"
)

func TestAppServiceValidation(t *testing.T) {
	svc := NewAppService()
	err := svc.ReceiveFile("", false)
	if err == nil {
		t.Fatal("expected error when receiving with empty code phrase")
	}

	err = svc.ReceiveFile("abc", false)
	if err == nil {
		t.Fatal("expected error when receiving with too short code phrase")
	}
}

func TestAppServiceSendValidation(t *testing.T) {
	svc := NewAppService()
	_, err := svc.SendFile("/non/existent/file/path/surely_does_not_exist.xyz", false)
	if err == nil {
		t.Fatal("expected error when sending non-existent file")
	}
}

func TestDownloadsDir(t *testing.T) {
	dir, err := GetDefaultDownloadDir()
	if err != nil {
		t.Fatalf("failed to get download dir: %v", err)
	}
	if dir == "" {
		t.Fatal("expected non-empty download dir")
	}
}

func TestGenerateQRCode(t *testing.T) {
	svc := NewAppService()
	qr, err := svc.GenerateQRCode("7777-test-code")
	if err != nil {
		t.Fatalf("failed to generate qr code: %v", err)
	}
	if !strings.HasPrefix(qr, "data:image/png;base64,") {
		t.Fatalf("expected data URL for qr code, got %s", qr)
	}
}

func TestPickFileWithoutApp(t *testing.T) {
	svc := NewAppService()
	// In headless unit test without running GUI app, PickFile safely returns empty string without crashing
	path, err := svc.PickFile()
	if err != nil {
		t.Fatalf("unexpected error from PickFile: %v", err)
	}
	if path != "" {
		t.Fatalf("expected empty path without app, got %s", path)
	}
}

func TestPickFolderWithoutApp(t *testing.T) {
	svc := NewAppService()
	path, err := svc.PickFolder()
	if err != nil {
		t.Fatalf("unexpected error from PickFolder: %v", err)
	}
	if path != "" {
		t.Fatalf("expected empty path without app, got %s", path)
	}
}

func TestCustomDownloadDirLifecycle(t *testing.T) {
	svc := NewAppService()

	initialDir, err := svc.GetDownloadDir()
	if err != nil {
		t.Fatalf("failed to get initial download dir: %v", err)
	}

	tempDir := t.TempDir()
	err = svc.SetDownloadDir(tempDir)
	if err != nil {
		t.Fatalf("failed to set custom download dir: %v", err)
	}

	updatedDir, err := svc.GetDownloadDir()
	if err != nil {
		t.Fatalf("failed to get updated download dir: %v", err)
	}
	if updatedDir != tempDir {
		t.Fatalf("expected updated dir to be %s, got %s", tempDir, updatedDir)
	}

	// Setting an invalid non-directory or non-existent file should error
	nonExistent := "/non/existent/path/12345/sub"
	err = svc.SetDownloadDir(nonExistent)
	if err == nil {
		t.Fatal("expected error setting non-existent directory")
	}

	// Resetting should return back to initial default
	resetDir, err := svc.ResetDownloadDir()
	if err != nil {
		t.Fatalf("failed to reset download dir: %v", err)
	}
	if resetDir != initialDir {
		t.Fatalf("expected reset dir %s to match initial %s", resetDir, initialDir)
	}
}

func TestPickDownloadDirWithoutApp(t *testing.T) {
	svc := NewAppService()
	currentDir, _ := svc.GetDownloadDir()
	res, err := svc.PickDownloadDir()
	if err != nil {
		t.Fatalf("unexpected error from PickDownloadDir: %v", err)
	}
	if res != currentDir {
		t.Fatalf("expected PickDownloadDir without app to return current dir %s, got %s", currentDir, res)
	}
}

