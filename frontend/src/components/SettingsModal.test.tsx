import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { api, UserConfig } from '../api';

const mockConfig: UserConfig = {
  download_dir: '/home/user/Downloads',
  relay_address: '',
  relay_password: '',
  only_local: false,
  overwrite: false,
  auto_copy_code: true,
};

describe('SettingsModal - Embedded Relay Hosting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders embedded relay hosting controls and handles starting and stopping', async () => {
    const handleUpdateConfig = vi.fn().mockResolvedValue(undefined);
    const handlePickFolder = vi.fn().mockResolvedValue('/custom/folder');
    const handleResetConfig = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        config={mockConfig}
        onUpdateConfig={handleUpdateConfig}
        onPickFolder={handlePickFolder}
        onResetConfig={handleResetConfig}
      />
    );

    // Verify section heading is present
    expect(screen.getByText(/host private relay/i)).toBeInTheDocument();

    // Look for the toggle to start embedded relay
    const hostToggle = screen.getByRole('switch', { name: /host relay server/i });
    expect(hostToggle).toBeInTheDocument();
    expect(hostToggle).toHaveAttribute('aria-checked', 'false');

    // Toggle on to start the relay
    await act(async () => {
      fireEvent.click(hostToggle);
    });

    // Expect StartEmbeddedRelay was called
    await waitFor(() => {
      expect(screen.getByText(/relay active/i)).toBeInTheDocument();
    });

    // Check that listening addresses are displayed
    expect(screen.getByText('192.168.1.50:9009')).toBeInTheDocument();

    // Toggle off to stop the relay
    await act(async () => {
      fireEvent.click(hostToggle);
    });

    await waitFor(() => {
      expect(screen.queryByText(/relay active/i)).not.toBeInTheDocument();
    });
  });

  it('allows copying listening address to clipboard', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        config={mockConfig}
        onUpdateConfig={vi.fn()}
        onPickFolder={vi.fn()}
        onResetConfig={vi.fn()}
      />
    );

    // Start relay
    const hostToggle = screen.getByRole('switch', { name: /host relay server/i });
    await act(async () => {
      fireEvent.click(hostToggle);
    });

    await waitFor(() => {
      expect(screen.getByText('192.168.1.50:9009')).toBeInTheDocument();
    });

    // Find and click copy button
    const copyButton = screen.getByRole('button', { name: /copy 192.168.1.50:9009/i });
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(writeTextMock).toHaveBeenCalledWith('192.168.1.50:9009');
  });

  it('renders creator credits tab with Zack Scholl info and external links', async () => {
    const openURLSpy = vi.spyOn(api, 'OpenURL').mockResolvedValue(undefined);

    render(
      <SettingsModal
        isOpen={true}
        onClose={vi.fn()}
        config={mockConfig}
        onUpdateConfig={vi.fn()}
        onPickFolder={vi.fn()}
        onResetConfig={vi.fn()}
      />
    );

    // Click on Credits tab
    const creditsTabButton = screen.getByRole('button', { name: /credits & attribution/i });
    expect(creditsTabButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(creditsTabButton);
    });

    // Check Zack Scholl info is displayed
    expect(screen.getByText(/zack scholl, phd/i)).toBeInTheDocument();
    expect(screen.getByText(/@schollz/i)).toBeInTheDocument();
    expect(screen.getByText(/author & creator of croc/i)).toBeInTheDocument();

    // Check LinkedIn button and click
    const linkedinBtn = screen.getByRole('button', { name: /linkedin/i });
    expect(linkedinBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(linkedinBtn);
    });

    expect(openURLSpy).toHaveBeenCalledWith('https://www.linkedin.com/in/zack-scholl-phd-51856889');
  });
});
