import { useState, FormEvent } from 'react';
import { Download, ClipboardPaste, FolderOpen, CheckCircle, AlertCircle, XCircle, Loader2, KeyRound, Folder } from 'lucide-react';
import { ProgressInfo, TransferState } from '../types/transfer';
import { ProgressBar } from './ProgressBar';

interface ReceiveViewProps {
  state: TransferState;
  progress: ProgressInfo;
  codePhrase: string;
  downloadDir?: string;
  onChangeDownloadDir?: () => Promise<void>;
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
  downloadDir,
  onChangeDownloadDir,
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
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/90 text-center">
          {/* Crisp Hero Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 border border-indigo-100 shadow-2xs">
            <Download className="h-8 w-8 text-indigo-600" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Receive Files</h3>
            <p className="text-xs text-slate-500">
              Enter the code phrase to start receiving
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Paste code phrase (e.g. 7777-word-word)"
                autoFocus
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-10 pr-24 text-sm font-mono tracking-wide text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs transition"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition"
                title="Paste from clipboard"
                aria-label="Paste from clipboard"
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={inputCode.trim().length < 6}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.99] transition"
            >
              Receive File
            </button>
          </form>

          {/* Destination Chip */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
            <span>Saving to:</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200/60 max-w-[260px]">
              <Folder className="h-3 w-3 text-indigo-500 shrink-0" />
              <span className="font-mono text-slate-700 truncate" title={downloadDir}>
                {downloadDir || 'Downloads'}
              </span>
            </div>
            {onChangeDownloadDir && (
              <button
                type="button"
                onClick={onChangeDownloadDir}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition ml-0.5"
              >
                (Change)
              </button>
            )}
          </div>
        </div>
      )}

      {state === 'connecting' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/90 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Connecting to Sender...</h3>
            <p className="text-xs text-slate-500 font-mono">{codePhrase || inputCode}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
          >
            Cancel Transfer
          </button>
        </div>
      )}

      {state === 'transferring' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/90">
          <ProgressBar
            percentage={progress.percentage}
            speedMBs={progress.speedMBs}
            etaSeconds={progress.etaSeconds}
            fileName={progress.fileName}
            bytesDone={progress.bytesDone}
            bytesTotal={progress.bytesTotal}
            filesDone={progress.filesDone}
            filesTotal={progress.filesTotal}
          />
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
          >
            Cancel Transfer
          </button>
        </div>
      )}

      {state === 'completed' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-5 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/90 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
            <CheckCircle className="h-9 w-9" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Download Complete!</h3>
            <p className="text-xs text-slate-500 truncate max-w-sm" title={downloadDir}>
              {progress.fileName ? `"${progress.fileName}" saved to ` : 'Saved to '}
              <span className="font-semibold text-slate-700">{downloadDir || 'Downloads'}</span>
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            <button
              onClick={() => onOpenFolder(progress.fileName)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 hover:from-indigo-500 hover:to-indigo-600 active:scale-95 transition"
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
        <div className="flex w-full max-w-md flex-col items-center space-y-4 rounded-3xl bg-white p-8 shadow-sm border border-slate-200/90 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
            {state === 'error' ? <AlertCircle className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {state === 'error' ? 'Transfer Failed' : 'Transfer Cancelled'}
            </h3>
            <p className="text-xs text-slate-500">
              {error || (state === 'error' ? 'Could not connect to sender with this code' : 'The transfer was aborted')}
            </p>
          </div>
          <button
            onClick={onReset}
            className="mt-2 rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
