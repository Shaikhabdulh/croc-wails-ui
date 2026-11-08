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
