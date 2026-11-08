import { useState, useEffect } from 'react';
import {
  X,
  Folder,
  RotateCcw,
  Server,
  Shield,
  HardDrive,
  Check,
  Key,
  Radio,
  Copy,
  AlertCircle,
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General & Storage Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                <HardDrive className="h-3 w-3" />
              </div>
              General & Storage
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                  Default Download Folder
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 shadow-2xs truncate">
                    <Folder className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate" title={localCfg.download_dir}>
                      {localCfg.download_dir || 'Default (~/Downloads)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePickDir}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition shrink-0"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Overwrite Files Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Overwrite Existing Files
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Automatically overwrite destination files without prompt
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Overwrite Existing Files"
                  aria-checked={localCfg.overwrite}
                  onClick={() => handleToggle('overwrite', !localCfg.overwrite)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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

              {/* Auto-copy Code Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Auto-Copy Code Phrase
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Copy code phrase to clipboard immediately when generated
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Auto-Copy Code Phrase"
                  aria-checked={localCfg.auto_copy_code}
                  onClick={() => handleToggle('auto_copy_code', !localCfg.auto_copy_code)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    localCfg.auto_copy_code ? 'bg-indigo-600' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      localCfg.auto_copy_code ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Network & Relay Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                <Shield className="h-3 w-3" />
              </div>
              Network & Peer Discovery
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4">
              {/* Local LAN Only Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800">Local LAN Only</span>
                    <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 border border-cyan-200/60">
                      Auto-LAN Active
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Air-gapped mode: prevents connecting to any internet relay
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Local LAN Only"
                  aria-checked={localCfg.only_local}
                  onClick={() => handleToggle('only_local', !localCfg.only_local)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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

              {/* Relay Server Configuration */}
              <div className="pt-3 border-t border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-indigo-500" />
                      Custom Relay Server
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Connect through your own private croc relay server
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
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
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

                {useCustomRelay ? (
                  <div className="space-y-2.5 pt-2 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Relay Address (host:port)
                      </label>
                      <div className="relative flex items-center">
                        <Server className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={localCfg.relay_address}
                          onChange={(e) => handleRelayChange(e.target.value)}
                          placeholder="e.g. relay.example.com:9009"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Relay Password (optional)
                      </label>
                      <div className="relative flex items-center">
                        <Key className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="password"
                          value={localCfg.relay_password}
                          onChange={(e) => handleRelayChange(localCfg.relay_address, e.target.value)}
                          placeholder="Default passphrase if blank"
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Using default public relay (<span className="font-mono font-medium text-slate-700">getcroc.com</span>)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Private Relay Server (Host Mode) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                  <Radio className="h-3 w-3" />
                </div>
                Host Private Relay
              </div>
              {isRelayRunning && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 animate-in fade-in">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Relay Active
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Host Relay Server on this Computer
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Run an embedded croc relay on your machine for private LAN or internet transfers
                  </span>
                </div>
                <button
                  role="switch"
                  aria-label="Host Relay Server"
                  aria-checked={isRelayRunning}
                  disabled={isRelayLoading}
                  onClick={() => handleToggleHostRelay(!isRelayRunning)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 disabled:opacity-50 ${
                    isRelayRunning ? 'bg-violet-600' : 'bg-slate-200 hover:bg-slate-300'
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
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200/70 text-[11px] text-rose-700">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{relayError}</span>
                </div>
              )}

              {/* Configuration Inputs (when not running or can configure) */}
              {!isRelayRunning ? (
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Control Port
                      </label>
                      <input
                        type="text"
                        value={hostPort}
                        onChange={(e) => setHostPort(e.target.value)}
                        placeholder="9009"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Password (optional)
                      </label>
                      <input
                        type="password"
                        value={hostPassword}
                        onChange={(e) => setHostPassword(e.target.value)}
                        placeholder="Default if blank"
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Will open port {hostPort || '9009'} (control) and 4 dynamic data ports (e.g. 9010-9013).
                  </p>
                </div>
              ) : (
                /* Running Details & Addresses */
                <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 block">
                      Connectable Addresses for other devices:
                    </span>
                    <div className="space-y-1.5">
                      {relayStatus?.addresses && relayStatus.addresses.length > 0 ? (
                        relayStatus.addresses.map((addr) => (
                          <div
                            key={addr}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs text-xs font-mono"
                          >
                            <span className="text-slate-800">{addr}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(addr)}
                              aria-label={`Copy ${addr}`}
                              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-sans font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
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
                  </div>

                  {/* Quick self-connect button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] text-slate-500">
                      Use this relay for transfers from this computer:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const localAddr = `127.0.0.1:${hostPort || '9009'}`;
                        setUseCustomRelay(true);
                        handleRelayChange(localAddr, hostPassword);
                      }}
                      className="rounded-xl border border-violet-200 bg-violet-50/60 px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100 active:scale-95 transition"
                    >
                      Use as Active Relay
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
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
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

