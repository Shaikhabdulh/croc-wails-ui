import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SendView } from './components/SendView';
import { ReceiveView } from './components/ReceiveView';
import { useTransfer } from './hooks/useTransfer';
import { subscribeToEvent } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [isLocalOnly, setIsLocalOnly] = useState<boolean>(false);

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

  return (
    <div className="flex h-screen w-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-800 antialiased overflow-hidden">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLocalOnly={isLocalOnly}
        onLocalOnlyChange={setIsLocalOnly}
        isTransferActive={isTransferActive}
      />

      <main className="flex-1 overflow-y-auto">
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
