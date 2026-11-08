import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReceiveView } from './ReceiveView';

describe('ReceiveView Component', () => {
  it('renders code input box and download button when idle', () => {
    render(
      <ReceiveView
        state="idle"
        progress={{ percentage: 0, speedMBs: 0, etaSeconds: 0, fileName: '', bytesDone: 0, bytesTotal: 0 }}
        codePhrase=""
        onReceive={vi.fn()}
        onCancel={vi.fn()}
        onOpenFolder={vi.fn()}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText(/paste code phrase/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /receive/i })).toBeInTheDocument();
  });

  it('triggers onReceive with entered code phrase', () => {
    const onReceive = vi.fn();
    render(
      <ReceiveView
        state="idle"
        progress={{ percentage: 0, speedMBs: 0, etaSeconds: 0, fileName: '', bytesDone: 0, bytesTotal: 0 }}
        codePhrase=""
        onReceive={onReceive}
        onCancel={vi.fn()}
        onOpenFolder={vi.fn()}
        onReset={vi.fn()}
      />
    );
    const input = screen.getByPlaceholderText(/paste code phrase/i);
    fireEvent.change(input, { target: { value: '7777-receive-code' } });
    const receiveButton = screen.getByRole('button', { name: /receive/i });
    fireEvent.click(receiveButton);
    expect(onReceive).toHaveBeenCalledWith('7777-receive-code');
  });

  it('renders Open Folder button when completed', () => {
    const onOpenFolder = vi.fn();
    render(
      <ReceiveView
        state="completed"
        progress={{ percentage: 100, speedMBs: 0, etaSeconds: 0, fileName: 'downloaded.zip', bytesDone: 1000, bytesTotal: 1000 }}
        codePhrase="7777-receive-code"
        onReceive={vi.fn()}
        onCancel={vi.fn()}
        onOpenFolder={onOpenFolder}
        onReset={vi.fn()}
      />
    );
    const openBtn = screen.getByRole('button', { name: /open folder/i });
    expect(openBtn).toBeInTheDocument();
    fireEvent.click(openBtn);
    expect(onOpenFolder).toHaveBeenCalled();
  });
});
