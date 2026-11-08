import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Shell', () => {
  it('switches between Send and Receive tabs', () => {
    render(<App />);
    expect(screen.getByText(/drag and drop a file/i)).toBeInTheDocument();

    const receiveTab = screen.getByRole('tab', { name: /receive/i });
    fireEvent.click(receiveTab);
    expect(screen.getByPlaceholderText(/paste code phrase/i)).toBeInTheDocument();

    const sendTab = screen.getByRole('tab', { name: /send/i });
    fireEvent.click(sendTab);
    expect(screen.getByText(/drag and drop a file/i)).toBeInTheDocument();
  });

  it('renders and toggles Local LAN switch', () => {
    render(<App />);
    const lanToggle = screen.getByRole('switch', { name: /local lan only/i });
    expect(lanToggle).toBeInTheDocument();
    expect(lanToggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(lanToggle);
    expect(lanToggle).toHaveAttribute('aria-checked', 'true');
  });
});
