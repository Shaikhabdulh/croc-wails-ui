import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('@wailsio/runtime', () => ({
  Call: {
    ByName: vi.fn((methodName: string) => {
      if (methodName.endsWith('.SendFile')) {
        return Promise.resolve('7777-mock-code-phrase');
      }
      if (methodName.endsWith('.SendFiles')) {
        return Promise.resolve('7777-mock-code-phrase');
      }
      if (methodName.endsWith('.PickFile')) {
        return Promise.resolve('/mock/path/file.txt');
      }
      if (methodName.endsWith('.PickFiles')) {
        return Promise.resolve(['/mock/path/file1.txt', '/mock/path/file2.txt']);
      }
      if (methodName.endsWith('.SavePastedImage')) {
        return Promise.resolve('/tmp/croc-pasted-files/pasted_image.png');
      }
      if (methodName.endsWith('.PickFolder')) {
        return Promise.resolve('/mock/path/folder');
      }
      if (methodName.endsWith('.GenerateQRCode')) {
        return Promise.resolve('data:image/png;base64,mockqr');
      }
      if (methodName.endsWith('.GetDownloadDir')) {
        return Promise.resolve('/home/user/Downloads');
      }
      if (methodName.endsWith('.PickDownloadDir')) {
        return Promise.resolve('/home/user/CustomFolder');
      }
      if (methodName.endsWith('.ResetDownloadDir')) {
        return Promise.resolve('/home/user/Downloads');
      }
      if (methodName.endsWith('.GetConfig')) {
        return Promise.resolve({
          download_dir: '/home/user/Downloads',
          relay_address: '',
          relay_password: '',
          only_local: false,
          overwrite: false,
          auto_copy_code: true,
        });
      }
      if (methodName.endsWith('.ResetConfig')) {
        return Promise.resolve({
          download_dir: '/home/user/Downloads',
          relay_address: '',
          relay_password: '',
          only_local: false,
          overwrite: false,
          auto_copy_code: true,
        });
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
