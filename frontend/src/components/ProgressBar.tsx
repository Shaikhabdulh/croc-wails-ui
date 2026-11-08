import { useState } from 'react';
import {
  ArrowUpRight,
  Laptop,
  Server,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  Heart,
  Wifi,
  Globe,
} from 'lucide-react';
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
  relayAddress?: string;
  isLocalOnly?: boolean;
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
  relayAddress,
  isLocalOnly,
}: ProgressBarProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const roundedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  const isLocal = Boolean(isLocalOnly);
  const isPrivate = !isLocal && Boolean(relayAddress && relayAddress.trim().length > 0);
  const relayHost = isLocal ? 'Direct Local Network' : isPrivate ? relayAddress! : 'getcroc.com:9009';
  const relayLabel = isLocal ? 'Direct LAN' : isPrivate ? 'Private Relay' : 'Public Relay';

  return (
    <div className="w-full space-y-4">
      {/* 3-Node Transparent Network Flow: Sender -> Relay/Direct -> Receiver */}
      <div className="relative flex items-center justify-between rounded-2xl bg-slate-50/90 p-3 border border-slate-200/80 shadow-inner">
        {/* Node 1: Sender */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
            <Laptop className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-600">Sender</span>
        </div>

        {/* Animated Stream 1: Sender -> Middle */}
        <div className="flex-1 mx-1.5 flex flex-col items-center">
          <svg className="w-full h-3" preserveAspectRatio="none" viewBox="0 0 100 8">
            <line x1="0" y1="4" x2="100" y2="4" stroke="#CBD5E1" strokeWidth="2" />
            <line
              x1="0"
              y1="4"
              x2="100"
              y2="4"
              stroke={isLocal ? '#06B6D4' : '#6366F1'}
              strokeWidth="2"
              strokeDasharray="4 6"
              className="animate-flow-dash"
            />
          </svg>
          <span
            className={`text-[9px] font-mono font-medium ${
              isLocal ? 'text-cyan-600' : 'text-indigo-500'
            }`}
          >
            {isLocal ? 'p2p-direct' : 'encrypted'}
          </span>
        </div>

        {/* Node 2: Transparent Relay Server / Direct LAN */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className={`relative flex h-9 w-9 items-center justify-center rounded-xl shadow-2xs ${
              isLocal
                ? 'bg-cyan-50 border border-cyan-200 text-cyan-600'
                : isPrivate
                ? 'bg-violet-50 border border-violet-200 text-violet-600'
                : 'bg-sky-50 border border-sky-200 text-sky-600'
            }`}
            title={
              isLocal
                ? 'Direct Local P2P: No external relay (Air-Gapped)'
                : isPrivate
                ? `Private Relay: ${relayAddress} (Zero-knowledge stream forwarder)`
                : 'Public Relay: getcroc.com:9009 (Zero payload access)'
            }
          >
            {isLocal ? (
              <Wifi className="h-4.5 w-4.5" />
            ) : isPrivate ? (
              <Server className="h-4.5 w-4.5" />
            ) : (
              <Globe className="h-4.5 w-4.5" />
            )}
            <span
              className={`absolute -bottom-1 flex items-center justify-center bg-white rounded-full p-0.5 border shadow-2xs ${
                isLocal
                  ? 'border-cyan-200 text-cyan-600'
                  : isPrivate
                  ? 'border-violet-200 text-violet-600'
                  : 'border-sky-200 text-sky-600'
              }`}
            >
              {isLocal ? <ShieldCheck className="h-2 w-2" /> : <Lock className="h-2 w-2" />}
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold ${
              isLocal
                ? 'text-cyan-700'
                : isPrivate
                ? 'text-violet-700'
                : 'text-sky-700'
            }`}
          >
            {relayLabel}
          </span>
        </div>

        {/* Animated Stream 2: Middle -> Receiver */}
        <div className="flex-1 mx-1.5 flex flex-col items-center">
          <svg className="w-full h-3" preserveAspectRatio="none" viewBox="0 0 100 8">
            <line x1="0" y1="4" x2="100" y2="4" stroke="#CBD5E1" strokeWidth="2" />
            <line
              x1="0"
              y1="4"
              x2="100"
              y2="4"
              stroke="#10B981"
              strokeWidth="2"
              strokeDasharray="4 6"
              className="animate-flow-dash"
            />
          </svg>
          <span className="text-[9px] font-mono text-emerald-600 font-medium">
            {isLocal ? 'p2p-direct' : 'encrypted'}
          </span>
        </div>

        {/* Node 3: Receiver */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-2xs">
            <Laptop className="h-4.5 w-4.5" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-600">Receiver</span>
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
            <Lock className="h-3.5 w-3.5 text-indigo-500" />
            <span>Technical Details & Architecture</span>
          </span>
          {showTechnical ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showTechnical && (
          <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 space-y-2 text-left animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Routing Mode</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  {isLocal ? (
                    <>
                      <Wifi className="h-3 w-3 text-cyan-600" /> Direct LAN (Air-Gapped)
                    </>
                  ) : isPrivate ? (
                    <>
                      <Server className="h-3 w-3 text-violet-600" /> Private Relay
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 text-sky-600" /> Public Relay
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Stream Cipher</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-indigo-600" /> ChaCha20-Poly1305
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Relay Endpoint</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1 truncate" title={relayHost}>
                  {isLocal ? (
                    <>
                      <ShieldCheck className="h-3 w-3 text-cyan-600 shrink-0" />
                      <span className="truncate">Local Multicast</span>
                    </>
                  ) : isPrivate ? (
                    <>
                      <Server className="h-3 w-3 text-violet-600 shrink-0" />
                      <span className="truncate">{relayAddress}</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-3 w-3 text-sky-600 shrink-0" />
                      <span className="truncate">getcroc.com:9009</span>
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 block">Handshake Security</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> SPAKE2 PAKE
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Relay Privacy: <strong>{isLocal ? 'Air-gapped (No relay)' : 'Blind in-memory stream'}</strong></span>
                <span>Verification: <strong>SHA-256 rolling</strong></span>
              </div>
              <div className="flex items-center gap-1 text-slate-600 pt-0.5">
                <Heart className="h-3 w-3 text-rose-500 fill-rose-500 shrink-0" />
                <span>Backend Engine: <strong>croc</strong> by <strong>Zack Scholl (@schollz)</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
