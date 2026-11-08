package service

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// UserConfig holds persistent application preferences for both frontend and backend.
type UserConfig struct {
	DownloadDir   string `json:"download_dir"`
	RelayAddress  string `json:"relay_address"`
	RelayPassword string `json:"relay_password"`
	OnlyLocal     bool   `json:"only_local"`
	Overwrite     bool   `json:"overwrite"`
	AutoCopyCode  bool   `json:"auto_copy_code"`
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
		config: UserConfig{
			AutoCopyCode: true,
		},
	}
	pm.load()
	return pm
}

// NewPreferencesManagerWithPath allows injecting a custom path for isolated testing.
func NewPreferencesManagerWithPath(path string) *PreferencesManager {
	pm := &PreferencesManager{
		configPath: path,
		config: UserConfig{
			AutoCopyCode: true,
		},
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

// GetConfig returns the current user configuration, populating sensible defaults where missing.
func (pm *PreferencesManager) GetConfig() UserConfig {
	pm.mu.RLock()
	cfg := pm.config
	pm.mu.RUnlock()

	if cfg.DownloadDir != "" {
		if info, err := os.Stat(cfg.DownloadDir); err != nil || !info.IsDir() {
			cfg.DownloadDir, _ = GetDefaultDownloadDir()
		}
	} else {
		cfg.DownloadDir, _ = GetDefaultDownloadDir()
	}

	return cfg
}

// UpdateConfig validates and persists changes to user preferences.
func (pm *PreferencesManager) UpdateConfig(cfg UserConfig) error {
	if cfg.DownloadDir != "" {
		info, err := os.Stat(cfg.DownloadDir)
		if err != nil {
			return fmt.Errorf("download directory does not exist: %w", err)
		}
		if !info.IsDir() {
			return fmt.Errorf("download path is not a directory: %s", cfg.DownloadDir)
		}
	}

	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.config = cfg
	return pm.save()
}

// ResetConfig restores all settings to default and saves to disk.
func (pm *PreferencesManager) ResetConfig() (UserConfig, error) {
	defaultDir, err := GetDefaultDownloadDir()
	if err != nil {
		defaultDir = ""
	}

	pm.mu.Lock()
	pm.config = UserConfig{
		DownloadDir:  defaultDir,
		AutoCopyCode: true,
	}
	saveErr := pm.save()
	cfg := pm.config
	pm.mu.Unlock()

	return cfg, saveErr
}

// GetDownloadDir returns the configured download directory, or defaults to ~/Downloads.
func (pm *PreferencesManager) GetDownloadDir() (string, error) {
	cfg := pm.GetConfig()
	return cfg.DownloadDir, nil
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
	defaultDir, err := GetDefaultDownloadDir()
	if err != nil {
		return "", err
	}

	pm.mu.Lock()
	pm.config.DownloadDir = ""
	_ = pm.save()
	pm.mu.Unlock()

	return defaultDir, nil
}
