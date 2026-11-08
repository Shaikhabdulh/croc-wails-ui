import { UploadCloud, Download, Settings } from 'lucide-react';

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
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm shadow-xs">
          🐊
        </div>
        <span className="font-bold text-slate-900 tracking-tight text-base">croc</span>
      </div>

      {/* Segmented Pill Tabs */}
      <div
        className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'send'}
          disabled={isTransferActive}
          onClick={() => onTabChange('send')}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
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
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'receive'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Download className="h-3.5 w-3.5" />
          Receive
        </button>
      </div>

      {/* Settings Action Button */}
      <div className="relative flex items-center">
        <button
          type="button"
          aria-label="Settings"
          disabled={isTransferActive}
          onClick={onOpenSettings}
          className={`relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
            isLocalOnly ? 'text-indigo-600 bg-indigo-50/60' : ''
          } ${isTransferActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Settings and Options"
        >
          <Settings className="h-4 w-4" />
          {isLocalOnly && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          )}
        </button>
      </div>
    </header>
  );
}
