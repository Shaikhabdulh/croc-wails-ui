import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar Component', () => {
  it('renders public relay mode by default', () => {
    render(
      <ProgressBar
        percentage={50}
        speedMBs={12.5}
        etaSeconds={5}
        fileName="document.pdf"
        bytesDone={5000}
        bytesTotal={10000}
      />
    );

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Public Relay')).toBeInTheDocument();
    expect(screen.getByText('Sender')).toBeInTheDocument();
    expect(screen.getByText('Receiver')).toBeInTheDocument();

    // Toggle Technical Details Inspector
    const technicalBtn = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(technicalBtn);

    expect(screen.getAllByText(/public relay/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/getcroc\.com:9009/i)).toBeInTheDocument();
    expect(screen.getByText(/zack scholl/i)).toBeInTheDocument();
    expect(screen.getByText(/chacha20-poly1305/i)).toBeInTheDocument();
  });

  it('renders private relay mode when relayAddress is configured', () => {
    render(
      <ProgressBar
        percentage={25}
        speedMBs={5.0}
        etaSeconds={15}
        fileName="secret.zip"
        bytesDone={2500}
        bytesTotal={10000}
        relayAddress="myrelay.corp.internal:9009"
      />
    );

    expect(screen.getByText('Private Relay')).toBeInTheDocument();

    const technicalBtn = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(technicalBtn);

    expect(screen.getByText('myrelay.corp.internal:9009')).toBeInTheDocument();
    expect(screen.getAllByText(/private relay/i).length).toBeGreaterThanOrEqual(2);
  });

  it('renders direct LAN air-gapped mode when isLocalOnly is true', () => {
    render(
      <ProgressBar
        percentage={75}
        speedMBs={45.0}
        etaSeconds={2}
        fileName="large_iso.iso"
        bytesDone={7500}
        bytesTotal={10000}
        isLocalOnly={true}
      />
    );

    expect(screen.getByText('Direct LAN')).toBeInTheDocument();
    // Flow streams show p2p-direct
    const directTags = screen.getAllByText('p2p-direct');
    expect(directTags.length).toBeGreaterThan(0);

    const technicalBtn = screen.getByRole('button', { name: /technical details/i });
    fireEvent.click(technicalBtn);

    expect(screen.getByText(/direct lan \(air-gapped\)/i)).toBeInTheDocument();
    expect(screen.getByText(/local multicast/i)).toBeInTheDocument();
    expect(screen.getByText(/air-gapped \(no relay\)/i)).toBeInTheDocument();
  });
});
