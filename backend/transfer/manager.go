package transfer

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/schollz/croc/v11/src/croc"
)

// TransferManager controls the lifecycle of in-process Croc transfers.
type TransferManager struct {
	mu              sync.Mutex
	running         bool
	isSender        bool
	cancelRequested bool

	ctx    context.Context
	cancel context.CancelFunc
	client *croc.Client

	startTime time.Time
	lastBytes int64
	lastTime  time.Time
	lastSpeed float64
	lastEta   int

	OnProgress    func(ProgressInfo)
	OnStateChange func(string)
	OnDone        func(error)
	OnError       func(error)
}

// NewTransferManager creates an initialized TransferManager.
func NewTransferManager() *TransferManager {
	return &TransferManager{}
}

// IsRunning returns whether an active transfer is currently in flight.
func (tm *TransferManager) IsRunning() bool {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	return tm.running
}

// TryStart attempts to start a transfer session. Fails if one is already active.
func (tm *TransferManager) TryStart(isSender bool) (context.Context, error) {
	tm.mu.Lock()
	defer tm.mu.Unlock()

	if tm.running {
		return nil, fmt.Errorf("a transfer is already in progress")
	}

	tm.running = true
	tm.isSender = isSender
	tm.cancelRequested = false
	tm.client = nil
	tm.ctx, tm.cancel = context.WithCancel(context.Background())
	tm.startTime = time.Now()
	tm.lastTime = tm.startTime
	tm.lastBytes = 0
	tm.lastSpeed = 0
	tm.lastEta = 0

	return tm.ctx, nil
}

// SetClient assigns the active croc.Client for teardown support.
func (tm *TransferManager) SetClient(c *croc.Client) {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	tm.client = c
}

// Cancel terminates the active transfer and aborts network I/O.
func (tm *TransferManager) Cancel() {
	tm.mu.Lock()
	if !tm.running {
		tm.mu.Unlock()
		return
	}
	tm.cancelRequested = true
	cancel := tm.cancel
	client := tm.client
	tm.running = false
	tm.mu.Unlock()

	if cancel != nil {
		cancel()
	}
	if client != nil {
		client.Cancel()
	}

	tm.EmitState(StateCancelled)
}

// Reset clears the running flag without emitting finish events.
func (tm *TransferManager) Reset() {
	tm.mu.Lock()
	defer tm.mu.Unlock()
	tm.running = false
	if tm.cancel != nil {
		tm.cancel()
		tm.cancel = nil
	}
}

// Finish reports completion or failure of the active transfer.
func (tm *TransferManager) Finish(err error) {
	tm.mu.Lock()
	cancelRequested := tm.cancelRequested
	tm.running = false
	tm.client = nil
	tm.mu.Unlock()

	if cancelRequested || errors.Is(err, context.Canceled) {
		tm.EmitState(StateCancelled)
		return
	}

	if err != nil {
		tm.EmitState(StateError)
		if tm.OnError != nil {
			tm.OnError(err)
		}
		return
	}

	tm.EmitState(StateCompleted)
	if tm.OnDone != nil {
		tm.OnDone(nil)
	}
}

// EmitState sends a state transition notification.
func (tm *TransferManager) EmitState(state string) {
	if tm.OnStateChange != nil {
		tm.OnStateChange(state)
	}
}

// EmitProgress sends a progress update notification.
func (tm *TransferManager) EmitProgress(p ProgressInfo) {
	if tm.OnProgress != nil {
		tm.OnProgress(p)
	}
}

// Hooks returns a configured croc.Hooks adapter wired to this manager.
func (tm *TransferManager) Hooks() *croc.Hooks {
	return &croc.Hooks{
		OnStateChange: func(state string) {
			tm.EmitState(state)
		},
		OnProgress: func(p croc.ProgressEvent) {
			now := time.Now()
			tm.mu.Lock()
			elapsed := now.Sub(tm.lastTime).Seconds()
			if elapsed > 0.2 {
				bytesDelta := p.BytesDone - tm.lastBytes
				if bytesDelta > 0 {
					tm.lastSpeed = (float64(bytesDelta) / (1024 * 1024)) / elapsed
				}
				tm.lastBytes = p.BytesDone
				tm.lastTime = now

				if tm.lastSpeed > 0.05 && p.BytesTotal > 0 {
					remainingBytes := p.BytesTotal - p.BytesDone
					if remainingBytes > 0 {
						tm.lastEta = int(float64(remainingBytes) / (tm.lastSpeed * 1024 * 1024))
					} else {
						tm.lastEta = 0
					}
				}
			}
			speedMBs := tm.lastSpeed
			eta := tm.lastEta
			tm.mu.Unlock()

			pct := float64(0)
			if p.BytesTotal > 0 {
				pct = (float64(p.BytesDone) / float64(p.BytesTotal)) * 100
				if pct > 100 {
					pct = 100
				}
			}

			tm.EmitProgress(ProgressInfo{
				Percentage: pct,
				SpeedMBs:   speedMBs,
				EtaSeconds: eta,
				FileName:   p.Filename,
				BytesDone:  p.BytesDone,
				BytesTotal: p.BytesTotal,
				FilesDone:  p.FilesDone,
				FilesTotal: p.FilesTotal,
			})
		},
		OnAcceptRequest: func(req croc.AcceptRequest) bool {
			// Auto-accept transfers in 1-click GUI mode
			return true
		},
		OnOverwriteRequest: func(path string, resumePct float64) bool {
			// Resume / overwrite automatically
			return true
		},
	}
}
