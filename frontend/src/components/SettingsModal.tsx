import { useState, useEffect } from 'react';
import {
  X,
  Folder,
  RotateCcw,
  Server,
  HardDrive,
  Check,
  Copy,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { UserConfig, RelayStatus, api } from '../api';

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

  // Embedded Relay Hosting State
  const [relayStatus, setRelayStatus] = useState<RelayStatus | null>(null);
  const [hostPort, setHostPort] = useState<string>('9009');
  const [hostPassword, setHostPassword] = useState<string>('');
  const [isRelayLoading, setIsRelayLoading] = useState<boolean>(false);
  const [relayError, setRelayError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    setLocalCfg(config);
    setUseCustomRelay(Boolean(config.relay_address));
  }, [config, isOpen]);

  // Sync embedded relay status on modal open
  useEffect(() => {
    if (isOpen) {
      api.GetEmbeddedRelayStatus()
        .then((status) => {
          setRelayStatus(status);
          if (status?.control_port) {
            setHostPort(status.control_port);
          }
          if (status?.password) {
            setHostPassword(status.password);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

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

  const handleToggleHostRelay = async (enable: boolean) => {
    setIsRelayLoading(true);
    setRelayError(null);
    try {
      if (enable) {
        const status = await api.StartEmbeddedRelay(hostPort.trim() || '9009', hostPassword);
        setRelayStatus(status);
        if (status.error_message) {
          setRelayError(status.error_message);
        }
      } else {
        const status = await api.StopEmbeddedRelay();
        setRelayStatus(status);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRelayError(msg || 'Failed to toggle relay');
    } finally {
      setIsRelayLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const isRelayRunning = Boolean(relayStatus?.is_running);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-left max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/40">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Preferences & Options</h2>
            {savedFeedback && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 animate-in fade-in">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Card 1: General & Storage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                <HardDrive className="h-3 w-3" />
              </div>
              General & Storage
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
              {/* Default Download Folder */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1">
                  Default Download Folder
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-700 shadow-2xs truncate">
                    <Folder className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate" title={localCfg.download_dir}>
                      {localCfg.download_dir || 'Default (~/Downloads)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePickDir}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Overwrite Files Toggle */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-800">
                  Overwrite Existing Files
                </span>
                <button
                  role="switch"
                  aria-label="Overwrite Existing Files"
                  aria-checked={localCfg.overwrite}
                  onClick={() => handleToggle('overwrite', !localCfg.overwrite)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    localCfg.overwrite ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      localCfg.overwrite ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Network & Private Relay */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <Server className="h-3 w-3" />
              </div>
              Network & Private Relay
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
              {/* Local LAN Only */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Local LAN Only</span>
                  <span className="text-[11px] text-slate-400 block">Offline transfer: skips internet relays</span>
                </div>
                <button
                  role="switch"
                  aria-label="Local LAN Only"
                  aria-checked={localCfg.only_local}
                  onClick={() => handleToggle('only_local', !localCfg.only_local)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    localCfg.only_local ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      localCfg.only_local ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Custom Relay Server Toggle */}
              <div className="pt-2.5 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Custom Relay Server</span>
                    <span className="text-[11px] text-slate-400 block">
                      {useCustomRelay ? 'Route via custom server' : 'Using default public relay (getcroc.com)'}
                    </span>
                  </div>
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
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      useCustomRelay ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        useCustomRelay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {useCustomRelay && (
                  <div className="grid grid-cols-2 gap-2 pt-2.5 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Relay Address
                      </label>
                      <input
                        type="text"
                        value={localCfg.relay_address}
                        onChange={(e) => handleRelayChange(e.target.value)}
                        placeholder="e.g. relay.example.com:9009"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Password (optional)
                      </label>
                      <input
                        type="password"
                        value={localCfg.relay_password}
                        onChange={(e) => handleRelayChange(localCfg.relay_address, e.target.value)}
                        placeholder="Default if blank"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Host Private Relay on this Machine */}
              <div className="pt-2.5 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">Host Private Relay</span>
                      <span className="text-[11px] text-slate-400 block">
                        {isRelayRunning ? 'Listening on this machine' : 'Run relay on this machine for peers'}
                      </span>
                    </div>
                    {isRelayRunning && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 animate-in fade-in">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Relay Active
                      </span>
                    )}
                  </div>
                  <button
                    role="switch"
                    aria-label="Host Relay Server"
                    aria-checked={isRelayRunning}
                    disabled={isRelayLoading}
                    onClick={() => handleToggleHostRelay(!isRelayRunning)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      isRelayRunning ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        isRelayRunning ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {relayError && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200/70 text-[11px] text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{relayError}</span>
                  </div>
                )}

                {/* Stopped configuration */}
                {!isRelayRunning ? (
                  <div className="flex items-center gap-2 pt-2 text-xs">
                    <span className="text-[11px] text-slate-500">Port:</span>
                    <input
                      type="text"
                      value={hostPort}
                      onChange={(e) => setHostPort(e.target.value)}
                      placeholder="9009"
                      className="w-20 rounded-xl border border-slate-200 bg-white py-1 px-2.5 text-xs font-mono text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400">(Default: 9009)</span>
                  </div>
                ) : (
                  /* Running Address List */
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div className="space-y-1">
                      {relayStatus?.addresses && relayStatus.addresses.length > 0 ? (
                        relayStatus.addresses.map((addr) => (
                          <div
                            key={addr}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono"
                          >
                            <span className="text-slate-800">{addr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(addr)}
                              aria-label={`Copy ${addr}`}
                              className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-sans font-medium text-slate-600 hover:bg-slate-100 transition"
                            >
                              {copiedAddress === addr ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Listening on 0.0.0.0:{hostPort}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const localAddr = `127.0.0.1:${hostPort || '9009'}`;
                        setUseCustomRelay(true);
                        handleRelayChange(localAddr, hostPassword);
                      }}
                      className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 active:scale-95 transition"
                    >
                      Use as Active Relay on this PC
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Core Engine Attribution & Credits */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-3 space-y-1.5 text-left">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 shrink-0" />
                Backend Engine: croc by Zack Scholl
              </span>
              <span className="text-[10px] text-slate-400 font-mono">MIT License</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The cryptographic engine, zero-knowledge PAKE key exchange, multi-stream transfer, and relay architecture are created by <strong>Zack Scholl (@schollz)</strong>. Desktop UI built with <strong>Wails</strong> by Lea Anthony.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <button
            type="button"
            onClick={onResetConfig}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
