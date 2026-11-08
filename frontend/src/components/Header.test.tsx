import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  it('renders default Public Relay badge when not local-only and no custom relay', () => {
    render(
      <Header
        activeTab="send"
        onTabChange={vi.fn()}
        onOpenSettings={vi.fn()}
        isLocalOnly={false}
        isTransferActive={false}
      />
    );

    expect(screen.getByText('Public Relay')).toBeInTheDocument();
  });

  it('renders Private Relay badge when relayAddress is provided', () => {
    render(
      <Header
        activeTab="send"
        onTabChange={vi.fn()}
        onOpenSettings={vi.fn()}
        isLocalOnly={false}
        isTransferActive={false}
        relayAddress="private-relay.company.com:9009"
      />
    );

    expect(screen.getByText('Private Relay')).toBeInTheDocument();
  });

  it('renders LAN Only badge when isLocalOnly is true', () => {
    render(
      <Header
        activeTab="send"
        onTabChange={vi.fn()}
        onOpenSettings={vi.fn()}
        isLocalOnly={true}
        isTransferActive={false}
      />
    );

    expect(screen.getByText('LAN Only')).toBeInTheDocument();
  });

  it('invokes tab change and settings callbacks', () => {
    const onTabChange = vi.fn();
    const onOpenSettings = vi.fn();

    render(
      <Header
        activeTab="send"
        onTabChange={onTabChange}
        onOpenSettings={onOpenSettings}
        isLocalOnly={false}
        isTransferActive={false}
      />
    );

    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);
    expect(onTabChange).toHaveBeenCalledWith('receive');

    const settingsBtn = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsBtn);
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
