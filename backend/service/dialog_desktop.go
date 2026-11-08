//go:build !android && !ios

package service

import (
	"github.com/wailsapp/wails/v3/pkg/application"
)

func (s *AppService) pickFilesNative() ([]string, error) {
	app := application.Get()
	if app == nil {
		return []string{}, nil
	}
	dialog := app.Dialog.OpenFile()
	dialog.CanChooseFiles(true).
		CanChooseDirectories(false).
		SetTitle("Select File(s) to Send")
	return dialog.PromptForMultipleSelection()
}

func (s *AppService) pickFolderNative() (string, error) {
	app := application.Get()
	if app == nil {
		return "", nil
	}
	dialog := app.Dialog.OpenFile()
	dialog.CanChooseFiles(false).CanChooseDirectories(true).SetTitle("Select Folder to Send")
	return dialog.PromptForSingleSelection()
}

func (s *AppService) pickDownloadDirNative() (string, error) {
	app := application.Get()
	if app == nil {
		return s.GetDownloadDir()
	}

	currentDir, _ := s.GetDownloadDir()
	dialog := app.Dialog.OpenFile()
	dialog.SetTitle("Select Default Download Folder").
		CanChooseDirectories(true).
		CanChooseFiles(false)

	if currentDir != "" {
		dialog.SetDirectory(currentDir)
	}

	selected, err := dialog.PromptForSingleSelection()
	if err != nil || selected == "" {
		return s.GetDownloadDir()
	}

	if err := s.SetDownloadDir(selected); err != nil {
		return s.GetDownloadDir()
	}
	return selected, nil
}
