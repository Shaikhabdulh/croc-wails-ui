import { useState } from 'react';
import { ArrowUpRight, Laptop, ChevronDown, ChevronUp, ShieldCheck, Lock, Cpu, Network, CheckCircle2 } from 'lucide-react';
import { formatBytes, formatSeconds } from '../utils/format';

interface ProgressBarProps {
  percentage: number;
  speedMBs: number;
  etaSeconds: number;
  fileName: string;
  bytesDone: number;
  bytesTotal: number;
  filesDone?: number;
  filesTotal?: number;
}

export function ProgressBar({
  percentage,
  speedMBs,
  etaSeconds,
  fileName,
  bytesDone,
  bytesTotal,
  filesDone,
  filesTotal,
}: ProgressBarProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const roundedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <div className="w-full space-y-4">
      {/* Animated P2P Stream Graphic */}
      <div className="relative flex items-center justify-between rounded-2xl bg-slate-50/80 p-3 border border-slate-200/70 shadow-inner">
        {/* Node 1: Sender */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
            <Laptop className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Sender</span>
        </div>

        {/* Animated Data Stream Vector */}
        <div className="flex-1 mx-3 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center">
            {/* SVG Connecting Flow */}
            <svg className="w-full h-4" preserveAspectRatio="none" viewBox="0 0 100 12">
              <line
                x1="0"
                y1="6"
                x2="100"
                y2="6"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              <line
                x1="0"
                y1="6"
                x2="100"
                y2="6"
                stroke="#6366F1"
                strokeWidth="2.5"
                strokeDasharray="6 8"
                className="animate-flow-dash"
              />
            </svg>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded-full border border-indigo-200/60">
            <Lock className="h-2.5 w-2.5 text-indigo-600" />
            <span>ChaCha20-Poly1305</span>
          </div>
        </div>

        {/* Node 2: Receiver */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-2xs">
            <Laptop className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">Receiver</span>
        </div>
      </div>

      {/* Multi-file Queue Counter */}
      {filesTotal && filesTotal > 1 ? (
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Queue Item {Math.min(filesTotal, (filesDone || 0) + 1)} of {filesTotal}
          </span>
          <span className="tabular-nums font-medium text-slate-600">
            {filesDone || 0} of {filesTotal} completed
          </span>
        </div>
      ) : null}

      {/* File Name & Percentage Badge */}
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span
          className="truncate max-w-[280px] font-semibold text-slate-900 tracking-tight"
          title={fileName}
        >
          {fileName || 'Transferring...'}
        </span>
        <span className="inline-flex items-center rounded-lg bg-indigo-50/80 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700 tabular-nums">
          {roundedPct}%
        </span>
      </div>

      {/* Progress Track & Animated Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/60 p-[1px]">
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 transition-all duration-300 ease-out shadow-xs overflow-hidden"
          style={{ width: `${roundedPct}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-shimmer" />
        </div>
      </div>

      {/* Speed, Data Volume & ETA Metrics */}
      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums font-mono pt-0.5">
        <span className="inline-flex items-center gap-1 text-slate-600">
          <ArrowUpRight className="h-3 w-3 text-indigo-500" />
          {speedMBs > 0 ? `${speedMBs.toFixed(1)} MB/s` : 'Calculating speed...'}
        </span>
        <span className="text-right">
          {bytesTotal > 0 && `${formatBytes(bytesDone)} of ${formatBytes(bytesTotal)}`}
          {etaSeconds > 0 && ` • ~${formatSeconds(etaSeconds)} left`}
        </span>
      </div>

      {/* Collapsible Technical Details Inspector */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
            <span>Technical Details</span>
          </span>
          {showTechnical ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showTechnical && (
          <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 space-y-2 text-left animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Protocol Handshake</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> SPAKE2 PAKE
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Stream Cipher</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-indigo-600" /> 256-bit AEAD
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Transport Sockets</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <Network className="h-3 w-3 text-violet-600" /> 4 Multi-Streams
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Checksum Integrity</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> SHA-256 Blocks
                </span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Relay Storage: In-Memory Only</span>
              <span>Snappy / Zstd Stream Compression</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
