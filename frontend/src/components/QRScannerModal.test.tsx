import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QRScannerModal } from './QRScannerModal';

describe('QRScannerModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <QRScannerModal isOpen={false} onClose={vi.fn()} onScan={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, flip camera button, and upload image button when open', () => {
    render(
      <QRScannerModal isOpen={true} onClose={vi.fn()} onScan={vi.fn()} />
    );

    expect(screen.getByText(/scan croc qr code/i)).toBeInTheDocument();
    expect(screen.getByText(/flip camera/i)).toBeInTheDocument();
    expect(screen.getByText(/upload image/i)).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <QRScannerModal isOpen={true} onClose={handleClose} onScan={vi.fn()} />
    );

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
