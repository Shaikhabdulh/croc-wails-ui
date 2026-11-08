package service

import (
	"os"
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

func TestPickFilesWithoutApp(t *testing.T) {
	svc := NewAppService()
	files, err := svc.PickFiles()
	if err != nil {
		t.Fatalf("unexpected error from PickFiles: %v", err)
	}
	if len(files) != 0 {
		t.Fatalf("expected empty files slice without app, got %v", files)
	}
}

func TestSavePastedImage(t *testing.T) {
	svc := NewAppService()

	// Base64 for 1x1 transparent PNG
	pngBase64 := "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
	filePath, err := svc.SavePastedImage("test_pixel.png", pngBase64)
	if err != nil {
		t.Fatalf("failed to save pasted image: %v", err)
	}
	defer os.Remove(filePath)

	content, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("failed to read saved image file: %v", err)
	}
	if len(content) == 0 {
		t.Fatal("saved image file is empty")
	}

	// Invalid base64 should return error
	_, err = svc.SavePastedImage("bad.png", "not-valid-base64!!!")
	if err == nil {
		t.Fatal("expected error on invalid base64 data")
	}
}

func TestSendFilesValidation(t *testing.T) {
	svc := NewAppService()

	// Empty list should error
	_, err := svc.SendFiles([]string{}, false)
	if err == nil {
		t.Fatal("expected error when sending empty file list")
	}

	// Non-existent path should error
	_, err = svc.SendFiles([]string{"/non/existent/path/never_existed_xyz.123"}, false)
	if err == nil {
		t.Fatal("expected error on non-existent file path")
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

func TestConfigLifecycle(t *testing.T) {
	svc := NewAppService()

	cfg, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("failed to get config: %v", err)
	}
	if cfg.DownloadDir == "" {
		t.Fatal("expected non-empty default download dir in config")
	}

	tempDir := t.TempDir()
	newCfg := UserConfig{
		DownloadDir:   tempDir,
		RelayAddress:  "myrelay.internal:9009",
		RelayPassword: "secret-relay-pass",
		OnlyLocal:     true,
		Overwrite:     true,
		AutoCopyCode:  true,
	}

	err = svc.UpdateConfig(newCfg)
	if err != nil {
		t.Fatalf("failed to update config: %v", err)
	}

	retrieved, err := svc.GetConfig()
	if err != nil {
		t.Fatalf("failed to get updated config: %v", err)
	}
	if retrieved.DownloadDir != tempDir ||
		retrieved.RelayAddress != "myrelay.internal:9009" ||
		retrieved.RelayPassword != "secret-relay-pass" ||
		!retrieved.OnlyLocal ||
		!retrieved.Overwrite {
		t.Fatalf("updated config does not match expected: %+v", retrieved)
	}

	// Reset config
	resetCfg, err := svc.ResetConfig()
	if err != nil {
		t.Fatalf("failed to reset config: %v", err)
	}
	if resetCfg.RelayAddress != "" || resetCfg.OnlyLocal != false || resetCfg.Overwrite != false {
		t.Fatalf("expected reset config to have defaults, got: %+v", resetCfg)
	}
}


