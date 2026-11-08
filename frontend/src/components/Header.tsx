import { UploadCloud, Download, Wifi } from 'lucide-react';

interface HeaderProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
  isLocalOnly: boolean;
  onLocalOnlyChange: (enabled: boolean) => void;
  isTransferActive: boolean;
}

export function Header({
  activeTab,
  onTabChange,
  isLocalOnly,
  onLocalOnlyChange,
  isTransferActive,
}: HeaderProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md select-none shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm shadow-indigo-200">
          🐊
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight">croc</span>
          <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
            UI
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'send'}
          disabled={isTransferActive}
          onClick={() => onTabChange('send')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'send'
              ? 'bg-white text-indigo-600 shadow-sm'
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
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
            activeTab === 'receive'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Download className="h-3.5 w-3.5" />
          Receive
        </button>
      </div>

      {/* LAN Toggle Switch */}
      <div className="flex items-center gap-2">
        <button
          role="switch"
          aria-label="Local LAN Only"
          aria-checked={isLocalOnly}
          disabled={isTransferActive}
          onClick={() => onLocalOnlyChange(!isLocalOnly)}
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium border transition-all ${
            isLocalOnly
              ? 'border-indigo-300 bg-indigo-50/80 text-indigo-700 shadow-sm'
              : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:bg-slate-100'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Direct local network transfer without internet relays"
        >
          <Wifi className={`h-3.5 w-3.5 ${isLocalOnly ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Local LAN Only</span>
          <div
            className={`h-4 w-7 rounded-full transition-colors relative ${
              isLocalOnly ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                isLocalOnly ? 'left-3.5' : 'left-0.5'
              }`}
            />
          </div>
        </button>
      </div>
    </header>
  );
}
