import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@wailsio/runtime', () => ({
  Call: {
    ByName: vi.fn((methodName: string) => {
      if (methodName.endsWith('.SendFile')) {
        return Promise.resolve('7777-mock-code-phrase');
      }
      if (methodName.endsWith('.PickFile')) {
        return Promise.resolve('/mock/path/file.txt');
      }
      if (methodName.endsWith('.GenerateQRCode')) {
        return Promise.resolve('data:image/png;base64,mockqr');
      }
      return Promise.resolve(undefined);
    }),
    ByID: vi.fn(),
  },
  Events: {
    On: vi.fn(() => () => {}),
    Off: vi.fn(),
    Emit: vi.fn(),
  },
}));
