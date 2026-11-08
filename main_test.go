package main

import "testing"

func TestApplicationInit(t *testing.T) {
	if appName != "Croc Interface" {
		t.Fatalf("expected appName 'Croc Interface', got '%s'", appName)
	}
}
