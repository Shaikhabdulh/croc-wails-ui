import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SendView } from './components/SendView';
import { ReceiveView } from './components/ReceiveView';
import { useTransfer } from './hooks/useTransfer';
import { api, subscribeToEvent } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [isLocalOnly, setIsLocalOnly] = useState<boolean>(false);
  const [downloadDir, setDownloadDir] = useState<string>('');

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
    // Load default or configured download directory
    api.GetDownloadDir()
      .then((dir) => setDownloadDir(dir))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Listen for native OS file drops onto the window
    const unsub = subscribeToEvent<string[]>('files:dropped', (paths) => {
      if (paths && paths.length > 0 && !isTransferActive) {
        setActiveTab('send');
        send(paths[0], isLocalOnly).catch(() => {});
      }
    });

    return () => unsub();
  }, [isTransferActive, isLocalOnly, send]);

  const handleSend = async (path: string): Promise<string> => {
    return await send(path, isLocalOnly);
  };

  const handleReceive = async (code: string): Promise<void> => {
    await receive(code, isLocalOnly);
  };

  const handlePickDownloadDir = async (): Promise<void> => {
    try {
      const selected = await api.PickDownloadDir();
      if (selected) {
        setDownloadDir(selected);
      }
    } catch {
      // dialog cancelled or error
    }
  };

  const handleResetDownloadDir = async (): Promise<void> => {
    try {
      const defaultDir = await api.ResetDownloadDir();
      setDownloadDir(defaultDir);
    } catch {
      // error
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
        isLocalOnly={isLocalOnly}
        onLocalOnlyChange={setIsLocalOnly}
        downloadDir={downloadDir}
        onPickDownloadDir={handlePickDownloadDir}
        onResetDownloadDir={handleResetDownloadDir}
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
            downloadDir={downloadDir}
            onChangeDownloadDir={handlePickDownloadDir}
            error={error}
            onReceive={handleReceive}
            onCancel={cancel}
            onOpenFolder={openFolder}
            onReset={reset}
          />
        )}
      </main>
    </div>
  );
}
