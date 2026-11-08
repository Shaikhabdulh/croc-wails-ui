import { ArrowUpRight } from 'lucide-react';
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
  const roundedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <div className="w-full space-y-3">
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
    </div>
  );
}
