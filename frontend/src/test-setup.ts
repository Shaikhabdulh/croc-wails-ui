import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@wailsio/runtime', () => ({
  Call: {
    ByName: vi.fn(),
    ByID: vi.fn(),
  },
  Events: {
    On: vi.fn(() => () => {}),
    Off: vi.fn(),
    Emit: vi.fn(),
  },
}));
