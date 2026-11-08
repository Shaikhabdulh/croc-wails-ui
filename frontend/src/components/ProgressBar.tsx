import { formatBytes, formatSeconds } from '../utils/format';

interface ProgressBarProps {
  percentage: number;
  speedMBs: number;
  etaSeconds: number;
  fileName: string;
  bytesDone: number;
  bytesTotal: number;
}

export function ProgressBar({
  percentage,
  speedMBs,
  etaSeconds,
  fileName,
  bytesDone,
  bytesTotal,
}: ProgressBarProps) {
  const roundedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span className="truncate max-w-[240px] font-semibold text-slate-900" title={fileName}>
          {fileName || 'Transferring...'}
        </span>
        <span className="tabular-nums font-bold text-indigo-600">{roundedPct}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${roundedPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
        <span>
          {speedMBs > 0 ? `${speedMBs.toFixed(1)} MB/s` : 'Calculating speed...'}
        </span>
        <span>
          {bytesTotal > 0 && `${formatBytes(bytesDone)} of ${formatBytes(bytesTotal)}`}
          {etaSeconds > 0 && ` • ~${formatSeconds(etaSeconds)} left`}
        </span>
      </div>
    </div>
  );
}
