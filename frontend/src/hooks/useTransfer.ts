import { useState, useEffect, useCallback } from 'react';
import { api, subscribeToEvent } from '../api';
import { ProgressInfo, TransferHookState, TransferState } from '../types/transfer';

const initialProgress: ProgressInfo = {
  percentage: 0,
  speedMBs: 0,
  etaSeconds: 0,
  fileName: '',
  bytesDone: 0,
  bytesTotal: 0,
};

export function useTransfer(): TransferHookState {
  const [state, setState] = useState<TransferState>('idle');
  const [progress, setProgress] = useState<ProgressInfo>(initialProgress);
  const [codePhrase, setCodePhrase] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubState = subscribeToEvent<TransferState>('transfer:state', (newState) => {
      setState(newState);
    });

    const unsubProgress = subscribeToEvent<ProgressInfo>('transfer:progress', (p) => {
      setProgress(p);
      if (p.percentage > 0 && p.percentage < 100) {
        setState('transferring');
      }
    });

    const unsubDone = subscribeToEvent<{ success: boolean }>('transfer:done', () => {
      setState('completed');
    });

    const unsubError = subscribeToEvent<string>('transfer:error', (err) => {
      setError(err);
      setState('error');
    });

    return () => {
      unsubState();
      unsubProgress();
      unsubDone();
      unsubError();
    };
  }, []);

  const send = useCallback(async (pathOrPaths: string | string[], isLocalOnly: boolean = false): Promise<string> => {
    try {
      setError(null);
      setState('preparing');
      let code: string;
      if (Array.isArray(pathOrPaths)) {
        if (pathOrPaths.length === 1) {
          code = await api.SendFile(pathOrPaths[0], isLocalOnly);
        } else {
          code = await api.SendFiles(pathOrPaths, isLocalOnly);
        }
      } else {
        code = await api.SendFile(pathOrPaths, isLocalOnly);
      }
      setCodePhrase(code);

      try {
        const qr = await api.GenerateQRCode(code);
        setQrCodeUrl(qr);
      } catch {
        // QR generation is non-fatal
      }

      setState('waiting');
      return code;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('error');
      throw err;
    }
  }, []);

  const receive = useCallback(async (code: string, isLocalOnly: boolean = false): Promise<void> => {
    try {
      setError(null);
      setState('connecting');
      setCodePhrase(code);
      await api.ReceiveFile(code, isLocalOnly);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState('error');
      throw err;
    }
  }, []);

  const cancel = useCallback(async (): Promise<void> => {
    try {
      await api.CancelTransfer();
      setState('cancelled');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, []);

  const openFolder = useCallback(async (fileName: string = ''): Promise<void> => {
    try {
      await api.OpenDownloadsFolder(fileName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, []);

  const reset = useCallback((): void => {
    setState('idle');
    setProgress(initialProgress);
    setCodePhrase('');
    setQrCodeUrl('');
    setError(null);
  }, []);

  return {
    state,
    progress,
    codePhrase,
    qrCodeUrl,
    error,
    send,
    receive,
    cancel,
    openFolder,
    reset,
  };
}
