//go:build android || ios

package service

func (s *AppService) pickFilesNative() ([]string, error) {
	return []string{}, nil
}

func (s *AppService) pickFolderNative() (string, error) {
	return "", nil
}

func (s *AppService) pickDownloadDirNative() (string, error) {
	return s.GetDownloadDir()
}
