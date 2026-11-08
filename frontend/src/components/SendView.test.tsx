import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SendView } from './SendView';

describe('SendView Component', () => {
  it('renders dropzone when idle', () => {
    render(
      <SendView
        state="idle"
        progress={{ percentage: 0, speedMBs: 0, etaSeconds: 0, fileName: '', bytesDone: 0, bytesTotal: 0 }}
        codePhrase=""
        qrCodeUrl=""
        onSend={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText(/drag and drop a file/i)).toBeInTheDocument();
  });

  it('renders Choose File and Choose Folder buttons when idle', () => {
    const onBrowse = vi.fn();
    const onBrowseFolder = vi.fn();
    render(
      <SendView
        state="idle"
        progress={{ percentage: 0, speedMBs: 0, etaSeconds: 0, fileName: '', bytesDone: 0, bytesTotal: 0 }}
        codePhrase=""
        qrCodeUrl=""
        onSend={vi.fn()}
        onBrowse={onBrowse}
        onBrowseFolder={onBrowseFolder}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />
    );
    const fileBtn = screen.getByRole('button', { name: /choose file/i });
    const folderBtn = screen.getByRole('button', { name: /choose folder/i });
    expect(fileBtn).toBeInTheDocument();
    expect(folderBtn).toBeInTheDocument();

    fireEvent.click(fileBtn);
    expect(onBrowse).toHaveBeenCalled();

    fireEvent.click(folderBtn);
    expect(onBrowseFolder).toHaveBeenCalled();
  });

  it('renders code phrase and copy button when waiting', () => {
    render(
      <SendView
        state="waiting"
        progress={{ percentage: 0, speedMBs: 0, etaSeconds: 0, fileName: 'report.pdf', bytesDone: 0, bytesTotal: 1024 }}
        codePhrase="7777-test-code"
        qrCodeUrl="data:image/png;base64,fake"
        onSend={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText('7777-test-code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /qr/i })).toBeInTheDocument();
  });

  it('renders progress bar and metrics when transferring', () => {
    render(
      <SendView
        state="transferring"
        progress={{ percentage: 65, speedMBs: 14.2, etaSeconds: 8, fileName: 'archive.tar.gz', bytesDone: 6500, bytesTotal: 10000 }}
        codePhrase="7777-test-code"
        qrCodeUrl=""
        onSend={vi.fn()}
        onCancel={vi.fn()}
        onReset={vi.fn()}
      />
    );
    expect(screen.getByText(/archive\.tar\.gz/i)).toBeInTheDocument();
    expect(screen.getByText(/65%/i)).toBeInTheDocument();
    expect(screen.getByText(/14\.2 MB\/s/i)).toBeInTheDocument();
  });
});
