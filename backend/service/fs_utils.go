package service

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// GetDefaultDownloadDir returns the user's Downloads directory path.
func GetDefaultDownloadDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("could not find user home directory: %w", err)
	}
	downloads := filepath.Join(home, "Downloads")
	if err := os.MkdirAll(downloads, 0o755); err != nil {
		return home, nil
	}
	return downloads, nil
}

// OpenFolder opens the specified folder (or the folder containing filename) in the native file manager.
func OpenFolder(targetPath string) error {
	info, err := os.Stat(targetPath)
	if err == nil && !info.IsDir() {
		targetPath = filepath.Dir(targetPath)
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", targetPath)
	case "windows":
		cmd = exec.Command("explorer.exe", targetPath)
	default: // linux, freebsd, etc.
		cmd = exec.Command("xdg-open", targetPath)
	}

	return cmd.Start()
}

// OpenURL opens the specified URL in the system default browser.
func OpenURL(targetURL string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", targetURL)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", targetURL)
	default: // linux, etc.
		cmd = exec.Command("xdg-open", targetURL)
	}

	return cmd.Start()
}
