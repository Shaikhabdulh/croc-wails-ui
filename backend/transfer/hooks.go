package transfer

// ProgressInfo is emitted periodically to update UI transfer progress.
type ProgressInfo struct {
	Percentage float64 `json:"percentage"`
	SpeedMBs   float64 `json:"speedMBs"`
	EtaSeconds int     `json:"etaSeconds"`
	FileName   string  `json:"fileName"`
	BytesDone  int64   `json:"bytesDone"`
	BytesTotal int64   `json:"bytesTotal"`
	FilesDone  int     `json:"filesDone"`
	FilesTotal int     `json:"filesTotal"`
}

// State constants for transfer lifecycle.
const (
	StateIdle         = "idle"
	StatePreparing    = "preparing"
	StateWaiting      = "waiting"
	StateConnecting   = "connecting"
	StateTransferring = "transferring"
	StateCompleted    = "completed"
	StateCancelled    = "cancelled"
	StateError        = "error"
)
