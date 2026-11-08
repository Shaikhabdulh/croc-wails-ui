import { useState, FormEvent } from 'react';
import { Download, ClipboardPaste, FolderOpen, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { ProgressInfo, TransferState } from '../types/transfer';
import { ProgressBar } from './ProgressBar';

interface ReceiveViewProps {
  state: TransferState;
  progress: ProgressInfo;
  codePhrase: string;
  error?: string | null;
  onReceive: (code: string) => Promise<void>;
  onCancel: () => Promise<void>;
  onOpenFolder: (fileName?: string) => Promise<void>;
  onReset: () => void;
}

export function ReceiveView({
  state,
  progress,
  codePhrase,
  error,
  onReceive,
  onCancel,
  onOpenFolder,
  onReset,
}: ReceiveViewProps) {
  const [inputCode, setInputCode] = useState(codePhrase || '');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim();
    if (cleanCode.length >= 6) {
      await onReceive(cleanCode);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputCode(text.trim());
      }
    } catch {
      // clipboard permission denied
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      {state === 'idle' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Download className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Receive Files</h3>
            <p className="text-xs text-slate-500">
              Enter the code phrase shared by the sender to start downloading
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Paste code phrase (e.g. 7777-word-word)"
                autoFocus
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-4 pr-12 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
              >
                <ClipboardPaste className="h-4 w-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={inputCode.trim().length < 6}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
            >
              Receive File
            </button>
          </form>

          <p className="text-xs text-slate-400">
            Files will be automatically saved to your <span className="font-medium text-slate-600">Downloads</span> folder.
          </p>
        </div>
      )}

      {state === 'connecting' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Connecting to Sender...</h3>
            <p className="text-xs text-slate-500 font-mono">{codePhrase || inputCode}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 transition"
          >
            Cancel Transfer
          </button>
        </div>
      )}

      {state === 'transferring' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          <ProgressBar
            percentage={progress.percentage}
            speedMBs={progress.speedMBs}
            etaSeconds={progress.etaSeconds}
            fileName={progress.fileName}
            bytesDone={progress.bytesDone}
            bytesTotal={progress.bytesTotal}
          />
          <button
            onClick={onCancel}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 transition"
          >
            Cancel Transfer
          </button>
        </div>
      )}

      {state === 'completed' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-5 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Download Complete!</h3>
            <p className="text-xs text-slate-500">
              {progress.fileName ? `"${progress.fileName}" saved to Downloads` : 'Saved to Downloads folder'}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            <button
              onClick={() => onOpenFolder(progress.fileName)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
            >
              <FolderOpen className="h-4 w-4" />
              Open Folder
            </button>
            <button
              onClick={onReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition py-1"
            >
              Receive Another File
            </button>
          </div>
        </div>
      )}

      {(state === 'cancelled' || state === 'error') && (
        <div className="flex w-full max-w-md flex-col items-center space-y-4 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            {state === 'error' ? <AlertCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {state === 'error' ? 'Transfer Failed' : 'Transfer Cancelled'}
            </h3>
            <p className="text-xs text-slate-500">
              {error || (state === 'error' ? 'Could not connect to sender with this code' : 'The transfer was aborted')}
            </p>
          </div>
          <button
            onClick={onReset}
            className="mt-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
