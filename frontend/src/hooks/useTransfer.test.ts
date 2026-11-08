import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransfer } from './useTransfer';

describe('useTransfer hook', () => {
  it('initializes with idle state and default values', () => {
    const { result } = renderHook(() => useTransfer());
    expect(result.current.state).toBe('idle');
    expect(result.current.codePhrase).toBe('');
    expect(result.current.progress.percentage).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('provides send, receive, cancel, and openFolder actions', () => {
    const { result } = renderHook(() => useTransfer());
    expect(typeof result.current.send).toBe('function');
    expect(typeof result.current.receive).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
    expect(typeof result.current.openFolder).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('handles reset correctly', () => {
    const { result } = renderHook(() => useTransfer());
    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toBe('idle');
    expect(result.current.codePhrase).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('handles cancel transition correctly', async () => {
    const { result } = renderHook(() => useTransfer());
    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current.state).toBe('cancelled');
  });

  it('handles send transition correctly', async () => {
    const { result } = renderHook(() => useTransfer());
    let code = '';
    await act(async () => {
      code = await result.current.send('/dummy/path');
    });
    expect(code).toBe('7777-mock-code-phrase');
    expect(result.current.state).toBe('waiting');
  });
});
