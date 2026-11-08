import { useState, useEffect } from 'react';
import { X, Folder, RotateCcw, Server, Shield, HardDrive, Check } from 'lucide-react';
import { UserConfig } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  onUpdateConfig: (cfg: UserConfig) => Promise<void>;
  onPickFolder: () => Promise<string>;
  onResetConfig: () => Promise<void>;
}

export function SettingsModal({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onPickFolder,
  onResetConfig,
}: SettingsModalProps) {
  const [localCfg, setLocalCfg] = useState<UserConfig>(config);
  const [useCustomRelay, setUseCustomRelay] = useState<boolean>(Boolean(config.relay_address));
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    setLocalCfg(config);
    setUseCustomRelay(Boolean(config.relay_address));
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleToggle = async (key: keyof UserConfig, val: boolean) => {
    const next = { ...localCfg, [key]: val };
    setLocalCfg(next);
    await onUpdateConfig(next);
    triggerSaved();
  };

  const handlePickDir = async () => {
    const selected = await onPickFolder();
    if (selected) {
      const next = { ...localCfg, download_dir: selected };
      setLocalCfg(next);
      await onUpdateConfig(next);
      triggerSaved();
    }
  };

  const handleRelayChange = async (address: string, password?: string) => {
    const next = {
      ...localCfg,
      relay_address: address,
      relay_password: password !== undefined ? password : localCfg.relay_password,
    };
    setLocalCfg(next);
    await onUpdateConfig(next);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-left max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Preferences & Options</h2>
            {savedFeedback && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-in fade-in">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General & Storage Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <HardDrive className="h-3.5 w-3.5 text-indigo-600" />
              General & Storage
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Download Folder
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 truncate">
                    <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={localCfg.download_dir}>
                      {localCfg.download_dir || 'Default (~/Downloads)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePickDir}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95 transition shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Overwrite Files Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-800 block">
                    Overwrite Existing Files
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Automatically overwrite destination files without prompt
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Overwrite Existing Files"
                  aria-checked={localCfg.overwrite}
                  onClick={() => handleToggle('overwrite', !localCfg.overwrite)}
                  className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                    localCfg.overwrite ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                      localCfg.overwrite ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-copy Code Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium text-slate-800 block">
                    Auto-Copy Code Phrase
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Copy code phrase to clipboard immediately when generated
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Auto-Copy Code Phrase"
                  aria-checked={localCfg.auto_copy_code}
                  onClick={() => handleToggle('auto_copy_code', !localCfg.auto_copy_code)}
                  className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                    localCfg.auto_copy_code ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                      localCfg.auto_copy_code ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Network & Relay Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              Network & Peer Discovery
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              {/* Local LAN Only Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-800">Local LAN Only</span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.2 rounded-full">
                      Auto-LAN Active
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Air-gapped mode: prevents connecting to any internet relay
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Local LAN Only"
                  aria-checked={localCfg.only_local}
                  onClick={() => handleToggle('only_local', !localCfg.only_local)}
                  className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                    localCfg.only_local ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                      localCfg.only_local ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Relay Server Configuration */}
              <div className="pt-3 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-slate-400" />
                    Custom Relay Server
                  </span>
                  <button
                    role="switch"
                    aria-label="Custom Relay Server"
                    aria-checked={useCustomRelay}
                    onClick={() => {
                      const next = !useCustomRelay;
                      setUseCustomRelay(next);
                      if (!next) {
                        handleRelayChange('', '');
                      }
                    }}
                    className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${
                      useCustomRelay ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                        useCustomRelay ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {useCustomRelay ? (
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-0.5">
                        Relay Address (host:port)
                      </label>
                      <input
                        type="text"
                        value={localCfg.relay_address}
                        onChange={(e) => handleRelayChange(e.target.value)}
                        placeholder="e.g. relay.example.com:9009"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-0.5">
                        Relay Password (optional)
                      </label>
                      <input
                        type="password"
                        value={localCfg.relay_password}
                        onChange={(e) => handleRelayChange(localCfg.relay_address, e.target.value)}
                        placeholder="Default passphrase if blank"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Using default public relay (<span className="font-mono text-slate-600">getcroc.com</span>)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3">
          <button
            type="button"
            onClick={onResetConfig}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
