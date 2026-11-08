import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SendView } from './components/SendView';
import { ReceiveView } from './components/ReceiveView';
import { SettingsModal } from './components/SettingsModal';
import { useTransfer } from './hooks/useTransfer';
import { api, subscribeToEvent, UserConfig } from './api';

const DEFAULT_CONFIG: UserConfig = {
  download_dir: '',
  relay_address: '',
  relay_password: '',
  only_local: false,
  overwrite: false,
  auto_copy_code: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [config, setConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const {
    state,
    progress,
    codePhrase,
    qrCodeUrl,
    error,
    send,
    receive,
    cancel,
    openFolder,
    reset,
  } = useTransfer();

  const isTransferActive =
    state === 'preparing' ||
    state === 'waiting' ||
    state === 'connecting' ||
    state === 'transferring';

  useEffect(() => {
    // Load full user preferences on startup
    api.GetConfig()
      .then((cfg) => setConfig(cfg))
      .catch(() => {});
  }, []);

  // Auto-copy code phrase to clipboard if enabled in settings
  useEffect(() => {
    if (codePhrase && state === 'waiting' && config.auto_copy_code) {
      navigator.clipboard?.writeText(codePhrase).catch(() => {});
    }
  }, [codePhrase, state, config.auto_copy_code]);

  useEffect(() => {
    // Listen for native OS file drops onto the window
    const unsub = subscribeToEvent<string[]>('files:dropped', (paths) => {
      if (paths && paths.length > 0 && !isTransferActive) {
        setActiveTab('send');
        send(paths, config.only_local).catch(() => {});
      }
    });

    return () => unsub();
  }, [isTransferActive, config.only_local, send]);

  const handleSend = async (pathOrPaths: string | string[]): Promise<string> => {
    return await send(pathOrPaths, config.only_local);
  };

  const handleReceive = async (code: string): Promise<void> => {
    await receive(code, config.only_local);
  };

  const handleUpdateConfig = async (newCfg: UserConfig): Promise<void> => {
    try {
      await api.UpdateConfig(newCfg);
      setConfig(newCfg);
    } catch {
      // update failed
    }
  };

  const handlePickDownloadDir = async (): Promise<string> => {
    try {
      const selected = await api.PickDownloadDir();
      if (selected) {
        setConfig((prev) => ({ ...prev, download_dir: selected }));
        return selected;
      }
    } catch {
      // dialog cancelled or error
    }
    return '';
  };

  const handleResetConfig = async (): Promise<void> => {
    try {
      const reset = await api.ResetConfig();
      setConfig(reset);
    } catch {
      // reset failed
    }
  };

  return (
    <div
      data-file-drop-target="true"
      className="flex h-screen w-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 antialiased overflow-hidden"
    >
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLocalOnly={config.only_local}
        isTransferActive={isTransferActive}
      />

      <main className="flex-1 overflow-y-auto" data-file-drop-target="true">
        {activeTab === 'send' ? (
          <SendView
            state={state}
            progress={progress}
            codePhrase={codePhrase}
            qrCodeUrl={qrCodeUrl}
            error={error}
            onSend={handleSend}
            onCancel={cancel}
            onReset={reset}
          />
        ) : (
          <ReceiveView
            state={state}
            progress={progress}
            codePhrase={codePhrase}
            downloadDir={config.download_dir}
            onChangeDownloadDir={async () => {
              await handlePickDownloadDir();
            }}
            error={error}
            onReceive={handleReceive}
            onCancel={cancel}
            onOpenFolder={openFolder}
            onReset={reset}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
        onPickFolder={handlePickDownloadDir}
        onResetConfig={handleResetConfig}
      />
    </div>
  );
}
