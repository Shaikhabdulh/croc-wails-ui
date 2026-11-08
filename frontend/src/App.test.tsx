import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders and toggles Local LAN switch inside settings', async () => {
    render(<App />);

    // Wait for initial render to settle
    await screen.findByText(/drag and drop a file/i);

    // Open settings popover
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    const lanToggle = screen.getByRole('switch', { name: /local lan only/i });
    expect(lanToggle).toBeInTheDocument();
    expect(lanToggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(lanToggle);
    expect(lanToggle).toHaveAttribute('aria-checked', 'true');
  });

  it('displays and allows changing download directory in settings', async () => {
    render(<App />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    expect(screen.getByText(/save location/i)).toBeInTheDocument();
    const changeButton = screen.getByRole('button', { name: /change/i });
    expect(changeButton).toBeInTheDocument();

    fireEvent.click(changeButton);
    expect(await screen.findByText('/home/user/CustomFolder')).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);
    expect(await screen.findByText('/home/user/Downloads')).toBeInTheDocument();
  });
});
