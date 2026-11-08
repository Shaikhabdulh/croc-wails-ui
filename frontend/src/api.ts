import { Call, Events } from '@wailsio/runtime';

export interface BackendService {
  PickFile: () => Promise<string>;
  PickFolder: () => Promise<string>;
  SendFile: (path: string, isLocalOnly?: boolean) => Promise<string>;
  ReceiveFile: (code: string, isLocalOnly?: boolean) => Promise<void>;
  CancelTransfer: () => Promise<void>;
  OpenDownloadsFolder: (filename?: string) => Promise<void>;
  GenerateQRCode: (code: string) => Promise<string>;
  GetDownloadDir: () => Promise<string>;
  SetDownloadDir: (path: string) => Promise<void>;
  PickDownloadDir: () => Promise<string>;
  ResetDownloadDir: () => Promise<string>;
}

const SERVICE_FQN = 'croc-interface/backend/service.AppService';

export const api: BackendService = {
  PickFile: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.PickFile`)) as string;
  },

  PickFolder: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.PickFolder`)) as string;
  },

  SendFile: async (path: string, isLocalOnly: boolean = false): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.SendFile`, path, isLocalOnly)) as string;
  },

  ReceiveFile: async (code: string, isLocalOnly: boolean = false): Promise<void> => {
    await Call.ByName(`${SERVICE_FQN}.ReceiveFile`, code, isLocalOnly);
  },

  CancelTransfer: async (): Promise<void> => {
    await Call.ByName(`${SERVICE_FQN}.CancelTransfer`);
  },

  OpenDownloadsFolder: async (filename: string = ''): Promise<void> => {
    await Call.ByName(`${SERVICE_FQN}.OpenDownloadsFolder`, filename);
  },

  GenerateQRCode: async (code: string): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.GenerateQRCode`, code)) as string;
  },

  GetDownloadDir: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.GetDownloadDir`)) as string;
  },

  SetDownloadDir: async (path: string): Promise<void> => {
    await Call.ByName(`${SERVICE_FQN}.SetDownloadDir`, path);
  },

  PickDownloadDir: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.PickDownloadDir`)) as string;
  },

  ResetDownloadDir: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.ResetDownloadDir`)) as string;
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
