import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

describe('App Shell', () => {
  it('switches between Send and Receive tabs', async () => {
    render(<App />);
    expect(await screen.findByText(/drag and drop a file/i)).toBeInTheDocument();

    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);
    expect(screen.getByPlaceholderText(/paste code phrase/i)).toBeInTheDocument();

    const sendTab = screen.getByRole('tab', { name: /send/i });
    fireEvent.click(sendTab);
    expect(screen.getByText(/drag and drop a file/i)).toBeInTheDocument();
  });

  it('renders and toggles options inside settings modal', async () => {
    render(<App />);

    // Wait for initial render to settle
    await screen.findByText(/drag and drop a file/i);

    // Open settings modal
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await act(async () => {
      fireEvent.click(settingsButton);
    });

    expect(screen.getByText(/preferences & options/i)).toBeInTheDocument();

    // Local LAN toggle
    const lanToggle = screen.getByRole('switch', { name: /local lan only/i });
    expect(lanToggle).toBeInTheDocument();
    expect(lanToggle).toHaveAttribute('aria-checked', 'false');
    await act(async () => {
      fireEvent.click(lanToggle);
    });
    expect(lanToggle).toHaveAttribute('aria-checked', 'true');

    // Overwrite files toggle
    const overwriteToggle = screen.getByRole('switch', { name: /overwrite existing files/i });
    expect(overwriteToggle).toBeInTheDocument();
    expect(overwriteToggle).toHaveAttribute('aria-checked', 'false');
    await act(async () => {
      fireEvent.click(overwriteToggle);
    });
    expect(overwriteToggle).toHaveAttribute('aria-checked', 'true');

    // Custom relay toggle
    const relayToggle = screen.getByRole('switch', { name: /custom relay server/i });
    expect(relayToggle).toBeInTheDocument();
    expect(relayToggle).toHaveAttribute('aria-checked', 'false');
    await act(async () => {
      fireEvent.click(relayToggle);
    });
    expect(relayToggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByPlaceholderText(/relay\.example\.com/i)).toBeInTheDocument();
  });

  it('displays and allows changing download directory in settings', async () => {
    render(<App />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    await act(async () => {
      fireEvent.click(settingsButton);
    });

    expect(screen.getByText(/default download folder/i)).toBeInTheDocument();
    const browseButton = screen.getByRole('button', { name: /browse/i });
    expect(browseButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(browseButton);
    });
    expect(await screen.findByText('/home/user/CustomFolder')).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /reset to defaults/i });
    await act(async () => {
      fireEvent.click(resetButton);
    });
    expect(await screen.findByText('/home/user/Downloads')).toBeInTheDocument();
  });
});
