import { Call, Events } from '@wailsio/runtime';

export interface BackendService {
  SendFile: (path: string, isLocalOnly?: boolean) => Promise<string>;
  ReceiveFile: (code: string, isLocalOnly?: boolean) => Promise<void>;
  CancelTransfer: () => Promise<void>;
  OpenDownloadsFolder: (filename?: string) => Promise<void>;
  GenerateQRCode: (code: string) => Promise<string>;
}

export const api: BackendService = {
  SendFile: async (path: string, isLocalOnly: boolean = false): Promise<string> => {
    try {
      const res = await Call.ByName('main.AppService.SendFile', path, isLocalOnly);
      return (res as string) || '7777-mock-code-phrase';
    } catch {
      return '7777-mock-code-phrase';
    }
  },

  ReceiveFile: async (code: string, isLocalOnly: boolean = false): Promise<void> => {
    try {
      await Call.ByName('main.AppService.ReceiveFile', code, isLocalOnly);
    } catch {
      // Fallback for browser preview / test environment
    }
  },

  CancelTransfer: async (): Promise<void> => {
    try {
      await Call.ByName('main.AppService.CancelTransfer');
    } catch {
      // Fallback for browser preview / test environment
    }
  },

  OpenDownloadsFolder: async (filename: string = ''): Promise<void> => {
    try {
      await Call.ByName('main.AppService.OpenDownloadsFolder', filename);
    } catch {
      // Fallback for browser preview / test environment
    }
  },

  GenerateQRCode: async (code: string): Promise<string> => {
    try {
      const res = await Call.ByName('main.AppService.GenerateQRCode', code);
      return (res as string) || '';
    } catch {
      return '';
    }
  },
};

export const subscribeToEvent = <T>(
  eventName: string,
  callback: (data: T) => void
): (() => void) => {
  try {
    const unsub = Events.On(eventName, (event: { data?: T }) => {
      if (event && 'data' in event) {
        callback(event.data as T);
      }
    });
    return unsub;
  } catch {
    return () => {};
  }
};
