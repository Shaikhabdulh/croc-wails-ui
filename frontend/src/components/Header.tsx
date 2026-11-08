import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, Settings } from 'lucide-react';

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
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    if (showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  return (
    <header className="relative flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur select-none shrink-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm shadow-sm">
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
          className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'receive'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          } ${isTransferActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Download className="h-3.5 w-3.5" />
          Receive
        </button>
      </div>

      {/* Options / Settings Popover */}
      <div className="relative flex items-center" ref={settingsRef}>
        <button
          type="button"
          aria-label="Settings"
          disabled={isTransferActive}
          onClick={() => setShowSettings(!showSettings)}
          className={`relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition ${
            isLocalOnly ? 'text-indigo-600 bg-indigo-50/60' : ''
          } ${isTransferActive ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Network settings"
        >
          <Settings className="h-4 w-4" />
          {isLocalOnly && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          )}
        </button>

        {showSettings && (
          <div className="absolute right-0 top-11 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 space-y-3 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Network Options
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Auto-LAN Active
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Croc automatically detects peers on your local Wi-Fi and transfers data directly at maximum local speed.
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="space-y-0.5">
                <label className="text-xs font-medium text-slate-700 block">
                  Local LAN Only
                </label>
                <span className="text-[10px] text-slate-400 block">
                  Air-gapped (no internet relay)
                </span>
              </div>

              <button
                role="switch"
                aria-label="Local LAN Only"
                aria-checked={isLocalOnly}
                onClick={() => onLocalOnlyChange(!isLocalOnly)}
                className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                  isLocalOnly ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                    isLocalOnly ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
