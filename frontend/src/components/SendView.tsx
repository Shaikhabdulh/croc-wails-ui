import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, Copy, Check, QrCode, XCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ProgressInfo, TransferState } from '../types/transfer';
import { ProgressBar } from './ProgressBar';
import { QRCodeModal } from './QRCodeModal';

interface SendViewProps {
  state: TransferState;
  progress: ProgressInfo;
  codePhrase: string;
  qrCodeUrl: string;
  error?: string | null;
  onSend: (path: string) => Promise<string>;
  onCancel: () => Promise<void>;
  onReset: () => void;
}

export function SendView({
  state,
  progress,
  codePhrase,
  qrCodeUrl,
  error,
  onSend,
  onCancel,
  onReset,
}: SendViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // In webview/desktop, file object may have path property
      const filePath = (file as unknown as { path?: string }).path || file.name;
      await onSend(filePath);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const filePath = (file as unknown as { path?: string }).path || file.name;
      await onSend(filePath);
    }
  };

  const handleCopyCode = async () => {
    if (!codePhrase) return;
    try {
      await navigator.clipboard.writeText(codePhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        codePhrase={codePhrase}
        qrCodeUrl={qrCodeUrl}
      />

      {state === 'idle' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            Drag and drop a file or folder here
          </p>
          <p className="mt-1 text-sm text-slate-500">
            or <span className="text-indigo-600 font-medium hover:underline">browse from your computer</span>
          </p>
          <p className="mt-4 text-xs text-slate-400">
            End-to-end encrypted peer-to-peer transfer
          </p>
        </div>
      )}

      {state === 'preparing' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">Generating secure channel...</p>
        </div>
      )}

      {state === 'waiting' && (
        <div className="flex w-full max-w-md flex-col items-center space-y-6 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready to send
            </span>
            <h3 className="text-lg font-bold text-slate-900 pt-2">Share this Code Phrase</h3>
            <p className="text-xs text-slate-500">Give this phrase to the recipient to begin downloading</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 border border-slate-200 w-full justify-between">
            <span className="font-mono text-base font-bold text-slate-800 px-3 select-all truncate">
              {codePhrase}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
                aria-label="Copy Code"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                aria-label="Show QR Code"
                title="Show QR Code"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">Waiting for recipient to accept...</p>

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
        <div className="flex w-full max-w-md flex-col items-center space-y-4 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Transfer Complete!</h3>
            <p className="text-xs text-slate-500">The recipient has successfully received the file.</p>
          </div>
          <button
            onClick={onReset}
            className="mt-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            Send Another File
          </button>
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
              {error || (state === 'error' ? 'An unexpected network error occurred' : 'The transfer was aborted')}
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
