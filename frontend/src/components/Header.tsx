import { UploadCloud, Download, Settings, Wifi, Server, Globe } from 'lucide-react';

interface HeaderProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
  onOpenSettings: () => void;
  isLocalOnly: boolean;
  isTransferActive: boolean;
  relayAddress?: string;
}

export function Header({
  activeTab,
  onTabChange,
  onOpenSettings,
  isLocalOnly,
  isTransferActive,
  relayAddress,
}: HeaderProps) {
  const isPrivate = !isLocalOnly && Boolean(relayAddress && relayAddress.trim().length > 0);

  return (
    <header className="relative flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur select-none shrink-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-2.5">
        <img
          src="/croc-wails-ui-logo.svg"
          alt="croc"
          className="h-8 w-8 rounded-xl shadow-xs object-cover"
        />
        <span className="font-extrabold text-slate-900 tracking-tight text-base leading-none">croc</span>
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

      {/* Network & Relay Status Badge */}
      <div className="flex items-center gap-2">
        {isLocalOnly ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 border border-cyan-200/60 shadow-2xs"
            title="Air-Gapped: P2P transfer over local network only without internet relays"
          >
            <Wifi className="h-3 w-3" />
            LAN Only
          </span>
        ) : isPrivate ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 border border-violet-200/60 shadow-2xs"
            title={`Private Hosted Relay: ${relayAddress}`}
          >
            <Server className="h-3 w-3" />
            Private Relay
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200/60 shadow-2xs"
            title="Default Public Relay: getcroc.com:9009 (Zero payload access)"
          >
            <Globe className="h-3 w-3 text-slate-500" />
            Public Relay
          </span>
        )}

        <button
          type="button"
          aria-label="Settings"
          disabled={isTransferActive}
          onClick={onOpenSettings}
          className={`relative rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
            isLocalOnly || isPrivate ? 'text-indigo-600 bg-indigo-50/60' : ''
          } ${isTransferActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Preferences and Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
