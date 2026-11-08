package service

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// UserConfig holds persistent application preferences.
type UserConfig struct {
	DownloadDir string `json:"download_dir"`
}

// PreferencesManager handles persistent user settings stored on disk.
type PreferencesManager struct {
	mu         sync.RWMutex
	configPath string
	config     UserConfig
}

// NewPreferencesManager creates a new preferences manager targeting the OS user config directory.
func NewPreferencesManager() *PreferencesManager {
	configDir, err := os.UserConfigDir()
	if err != nil {
		home, _ := os.UserHomeDir()
		configDir = filepath.Join(home, ".config")
	}
	appConfigDir := filepath.Join(configDir, "croc-wails-ui")
	_ = os.MkdirAll(appConfigDir, 0o755)
	configPath := filepath.Join(appConfigDir, "config.json")

	pm := &PreferencesManager{
		configPath: configPath,
	}
	pm.load()
	return pm
}

// NewPreferencesManagerWithPath allows injecting a custom path for isolated testing.
func NewPreferencesManagerWithPath(path string) *PreferencesManager {
	pm := &PreferencesManager{
		configPath: path,
	}
	pm.load()
	return pm
}

func (pm *PreferencesManager) load() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	data, err := os.ReadFile(pm.configPath)
	if err != nil {
		return
	}
	_ = json.Unmarshal(data, &pm.config)
}

func (pm *PreferencesManager) save() error {
	data, err := json.MarshalIndent(pm.config, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(pm.configPath, data, 0o644)
}

// GetDownloadDir returns the configured download directory, or defaults to ~/Downloads.
func (pm *PreferencesManager) GetDownloadDir() (string, error) {
	pm.mu.RLock()
	customDir := pm.config.DownloadDir
	pm.mu.RUnlock()

	if customDir != "" {
		info, err := os.Stat(customDir)
		if err == nil && info.IsDir() {
			return customDir, nil
		}
	}
	return GetDefaultDownloadDir()
}

// SetDownloadDir sets and persists a custom download folder.
func (pm *PreferencesManager) SetDownloadDir(dir string) error {
	info, err := os.Stat(dir)
	if err != nil {
		return fmt.Errorf("directory does not exist: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("path is not a directory: %s", dir)
	}

	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.config.DownloadDir = dir
	return pm.save()
}

// ResetDownloadDir resets the download folder to default ~/Downloads.
func (pm *PreferencesManager) ResetDownloadDir() (string, error) {
	pm.mu.Lock()
	pm.config.DownloadDir = ""
	_ = pm.save()
	pm.mu.Unlock()

	return GetDefaultDownloadDir()
}
