import { useState, useEffect, DragEvent } from 'react';
import {
  UploadCloud,
  Files,
  FolderUp,
  Copy,
  Check,
  QrCode,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Folder,
  X,
  Clipboard,
  Plus,
} from 'lucide-react';
import { ProgressInfo, TransferState } from '../types/transfer';
import { ProgressBar } from './ProgressBar';
import { QRCodeModal } from './QRCodeModal';
import { api } from '../api';

interface SendViewProps {
  state: TransferState;
  progress: ProgressInfo;
  codePhrase: string;
  qrCodeUrl: string;
  error?: string | null;
  onSend: (pathOrPaths: string | string[]) => Promise<string>;
  onBrowse?: () => Promise<void>;
  onBrowseFolder?: () => Promise<void>;
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
  onBrowse,
  onBrowseFolder,
  onCancel,
  onReset,
}: SendViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [isPasting, setIsPasting] = useState(false);

  // Clear staged queue if transfer completes or resets
  useEffect(() => {
    if (state === 'completed' || state === 'cancelled' || state === 'error') {
      setStagedFiles([]);
    }
  }, [state]);

  // Window-level Ctrl+V / Paste listener for images
  useEffect(() => {
    if (state !== 'idle') return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          setIsPasting(true);
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const base64 = reader.result as string;
              const ext = item.type.split('/')[1] || 'png';
              const name = `pasted_image_${Date.now()}.${ext}`;
              const savedPath = await api.SavePastedImage(name, base64);
              if (savedPath) {
                setStagedFiles((prev) => [...prev, savedPath]);
              }
            } catch (err) {
              console.error('Failed to save pasted clipboard image:', err);
            } finally {
              setIsPasting(false);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [state]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleBrowseFiles = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (onBrowse) {
        await onBrowse();
      } else {
        const paths = await api.PickFiles();
        if (paths && paths.length > 0) {
          setStagedFiles((prev) => Array.from(new Set([...prev, ...paths])));
        }
      }
    } catch {
      // dialog cancelled
    }
  };

  const handleBrowseFolder = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (onBrowseFolder) {
        await onBrowseFolder();
      } else {
        const path = await api.PickFolder();
        if (path) {
          setStagedFiles((prev) => Array.from(new Set([...prev, path])));
        }
      }
    } catch {
      // dialog cancelled
    }
  };

  const handlePasteClipboardImage = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (navigator.clipboard?.read) {
        setIsPasting(true);
        const clipboardItems = await navigator.clipboard.read();
        let foundImage = false;
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            foundImage = true;
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const base64 = reader.result as string;
                const ext = imageType.split('/')[1] || 'png';
                const name = `pasted_image_${Date.now()}.${ext}`;
                const savedPath = await api.SavePastedImage(name, base64);
                if (savedPath) {
                  setStagedFiles((prev) => [...prev, savedPath]);
                }
              } catch (err) {
                console.error('Failed to save clipboard image:', err);
              } finally {
                setIsPasting(false);
              }
            };
            reader.readAsDataURL(blob);
          }
        }
        if (!foundImage) {
          setIsPasting(false);
        }
      }
    } catch {
      setIsPasting(false);
    }
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendStaged = async () => {
    if (stagedFiles.length === 0) return;
    try {
      if (stagedFiles.length === 1) {
        await onSend(stagedFiles[0]);
      } else {
        await onSend(stagedFiles);
      }
    } catch {
      // transfer init failed
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

  const getFileName = (path: string): string => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  return (
    <div
      data-file-drop-target="true"
      className="flex h-full flex-col items-center justify-center p-6"
    >
      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        codePhrase={codePhrase}
        qrCodeUrl={qrCodeUrl}
      />

      {state === 'idle' && stagedFiles.length === 0 && (
        <div
          data-file-drop-target="true"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseFiles}
          className={`flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
            <UploadCloud className="h-8 w-8" />
          </div>
          <p className="text-base font-semibold text-slate-800">
            Drag and drop a file, multiple files, or folder here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            or choose from your computer, or paste clipboard images (Ctrl+V)
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleBrowseFiles}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
            >
              <Files className="h-3.5 w-3.5" />
              Choose Files
            </button>
            <button
              type="button"
              onClick={handleBrowseFolder}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition"
            >
              <FolderUp className="h-3.5 w-3.5" />
              Choose Folder
            </button>
            <button
              type="button"
              onClick={handlePasteClipboardImage}
              disabled={isPasting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition disabled:opacity-50"
              title="Paste image directly from clipboard"
            >
              <Clipboard className="h-3.5 w-3.5" />
              {isPasting ? 'Pasting...' : 'Paste Image'}
            </button>
          </div>

          <p className="mt-5 text-[11px] text-slate-400">
            End-to-end encrypted peer-to-peer transfer
          </p>
        </div>
      )}

      {state === 'idle' && stagedFiles.length > 0 && (
        <div className="flex w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Queue to Send
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                {stagedFiles.length} {stagedFiles.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStagedFiles([])}
              className="text-xs text-slate-400 hover:text-rose-600 transition"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 mb-4">
            {stagedFiles.map((file, idx) => {
              const name = getFileName(file);
              const isPasted = name.startsWith('pasted_image_');
              return (
                <div
                  key={`${file}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isPasted ? (
                      <Clipboard className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="truncate font-medium text-slate-800" title={file}>
                      {name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStagedFile(idx)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition"
                    title="Remove from queue"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mb-4">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleBrowseFiles}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <Plus className="h-3 w-3" />
                Files
              </button>
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <Folder className="h-3 w-3" />
                Folder
              </button>
              <button
                type="button"
                onClick={handlePasteClipboardImage}
                disabled={isPasting}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <Clipboard className="h-3 w-3" />
                Paste
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSendStaged}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition"
          >
            Send {stagedFiles.length} {stagedFiles.length === 1 ? 'Item' : 'Items'}
          </button>
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
            filesDone={progress.filesDone}
            filesTotal={progress.filesTotal}
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
            <p className="text-xs text-slate-500">The recipient has successfully received the files.</p>
          </div>
          <button
            onClick={onReset}
            className="mt-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition"
          >
            Send More Files
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
