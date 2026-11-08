package transfer

import (
	"testing"
	"time"

	"github.com/schollz/croc/v11/src/croc"
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

func TestProgressSmoothing(t *testing.T) {
	tm := NewTransferManager()
	_, _ = tm.TryStart(true)

	var lastProgress ProgressInfo
	tm.OnProgress = func(p ProgressInfo) {
		lastProgress = p
	}

	hooks := tm.Hooks()

	// Initial event establishing base
	hooks.OnProgress(croc.ProgressEvent{
		Filename:   "large_file.iso",
		BytesDone:  1024 * 1024,
		BytesTotal: 100 * 1024 * 1024,
	})

	// Advance time by 300ms to calculate initial speed
	time.Sleep(300 * time.Millisecond)
	hooks.OnProgress(croc.ProgressEvent{
		Filename:   "large_file.iso",
		BytesDone:  5 * 1024 * 1024,
		BytesTotal: 100 * 1024 * 1024,
	})

	speed1 := lastProgress.SpeedMBs
	if speed1 <= 0 {
		t.Fatalf("expected speed1 > 0, got %f", speed1)
	}

	// Immediate follow-up event (elapsed < 0.2s) must NOT reset speed to 0!
	hooks.OnProgress(croc.ProgressEvent{
		Filename:   "large_file.iso",
		BytesDone:  5*1024*1024 + 1024,
		BytesTotal: 100 * 1024 * 1024,
	})

	if lastProgress.SpeedMBs == 0 {
		t.Fatalf("speed flickered to 0 on rapid progress event! Expected ~%f, got 0", speed1)
	}
}
