export type TransferState =
  | 'idle'
  | 'preparing'
  | 'waiting'
  | 'connecting'
  | 'transferring'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface ProgressInfo {
  percentage: number;
  speedMBs: number;
  etaSeconds: number;
  fileName: string;
  bytesDone: number;
  bytesTotal: number;
  filesDone?: number;
  filesTotal?: number;
}

export interface TransferHookState {
  state: TransferState;
  progress: ProgressInfo;
  codePhrase: string;
  qrCodeUrl: string;
  error: string | null;
  send: (pathOrPaths: string | string[], isLocalOnly?: boolean) => Promise<string>;
  receive: (codePhrase: string, isLocalOnly?: boolean) => Promise<void>;
  cancel: () => Promise<void>;
  openFolder: (fileName?: string) => Promise<void>;
  reset: () => void;
}
