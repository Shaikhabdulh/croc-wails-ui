package transfer

import (
	"testing"
)

func TestTransferManagerLifecycle(t *testing.T) {
	tm := NewTransferManager()
	if tm.IsRunning() {
		t.Fatal("expected manager not running on init")
	}
	_, err := tm.TryStart(true)
	if err != nil {
		t.Fatalf("failed to start: %v", err)
	}
	if !tm.IsRunning() {
		t.Fatal("expected manager to be running")
	}
	// Attempting concurrent transfer must fail
	_, errConcurrent := tm.TryStart(false)
	if errConcurrent == nil {
		t.Fatal("expected error on concurrent transfer start")
	}
	tm.Cancel()
	if tm.IsRunning() {
		t.Fatal("expected manager not running after cancel")
	}
}

func TestTransferManagerCallbacks(t *testing.T) {
	tm := NewTransferManager()
	stateReported := ""
	tm.OnStateChange = func(state string) {
		stateReported = state
	}

	progressReported := ProgressInfo{}
	tm.OnProgress = func(p ProgressInfo) {
		progressReported = p
	}

	tm.EmitState("connecting")
	if stateReported != "connecting" {
		t.Fatalf("expected state 'connecting', got '%s'", stateReported)
	}

	tm.EmitProgress(ProgressInfo{Percentage: 50, SpeedMBs: 12.5, EtaSeconds: 10, FileName: "test.zip"})
	if progressReported.Percentage != 50 || progressReported.FileName != "test.zip" {
		t.Fatalf("unexpected progress info: %+v", progressReported)
	}
}
