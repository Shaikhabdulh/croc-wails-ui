import { UploadCloud, Download, Settings, ShieldCheck, Wifi } from 'lucide-react';

interface HeaderProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
  onOpenSettings: () => void;
  isLocalOnly: boolean;
  isTransferActive: boolean;
}

export function Header({
  activeTab,
  onTabChange,
  onOpenSettings,
  isLocalOnly,
  isTransferActive,
}: HeaderProps) {
  return (
    <header className="relative flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur select-none shrink-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs shadow-indigo-600/20">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-slate-900 tracking-tight text-base leading-none">croc</span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/60 leading-none">
            v11 P2P
          </span>
        </div>
      </div>

      {/* Segmented Pill Navigation */}
      <div
        className="flex items-center rounded-full bg-slate-100/90 p-1 border border-slate-200/70 shadow-inner"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'send'}
          disabled={isTransferActive}
          onClick={() => onTabChange('send')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
            activeTab === 'send'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          Send
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'receive'}
          disabled={isTransferActive}
          onClick={() => onTabChange('receive')}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
            activeTab === 'receive'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Download className="h-3.5 w-3.5" />
          Receive
        </button>
      </div>

      {/* Connection Mode Pill & Settings */}
      <div className="flex items-center gap-2">
        {isLocalOnly ? (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 border border-cyan-200/60">
            <Wifi className="h-3 w-3" />
            LAN Only
          </span>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 border border-slate-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Relay Ready
          </span>
        )}

        <button
          type="button"
          aria-label="Settings"
          disabled={isTransferActive}
          onClick={onOpenSettings}
          className={`relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
            isLocalOnly ? 'text-indigo-600 bg-indigo-50/60' : ''
          } ${isTransferActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Preferences and Settings"
        >
          <Settings className="h-4 w-4" />
          {isLocalOnly && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
