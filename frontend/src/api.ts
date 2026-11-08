import { Call, Events } from '@wailsio/runtime';

export interface UserConfig {
  download_dir: string;
  relay_address: string;
  relay_password: string;
  only_local: boolean;
  overwrite: boolean;
  auto_copy_code: boolean;
}

export interface RelayStatus {
  is_running: boolean;
  control_port: string;
  data_ports: string[];
  addresses: string[];
  password: string;
  uptime_seconds: number;
  error_message?: string;
}

export interface BackendService {
  PickFile: () => Promise<string>;
  PickFiles: () => Promise<string[]>;
  PickFolder: () => Promise<string>;
  SendFile: (path: string, isLocalOnly?: boolean) => Promise<string>;
  SendFiles: (paths: string[], isLocalOnly?: boolean) => Promise<string>;
  SavePastedImage: (filename: string, base64Data: string) => Promise<string>;
  ReceiveFile: (code: string, isLocalOnly?: boolean) => Promise<void>;
  CancelTransfer: () => Promise<void>;
  OpenDownloadsFolder: (filename?: string) => Promise<void>;
  GenerateQRCode: (code: string) => Promise<string>;
  GetDownloadDir: () => Promise<string>;
  SetDownloadDir: (path: string) => Promise<void>;
  PickDownloadDir: () => Promise<string>;
  ResetDownloadDir: () => Promise<string>;
  GetConfig: () => Promise<UserConfig>;
  UpdateConfig: (cfg: UserConfig) => Promise<void>;
  ResetConfig: () => Promise<UserConfig>;
  StartEmbeddedRelay: (port: string, password: string) => Promise<RelayStatus>;
  StopEmbeddedRelay: () => Promise<RelayStatus>;
  GetEmbeddedRelayStatus: () => Promise<RelayStatus>;
}

const SERVICE_FQN = 'croc-interface/backend/service.AppService';

export const api: BackendService = {
  PickFile: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.PickFile`)) as string;
  },

  PickFiles: async (): Promise<string[]> => {
    const res = (await Call.ByName(`${SERVICE_FQN}.PickFiles`)) as string[];
    return res || [];
  },

  PickFolder: async (): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.PickFolder`)) as string;
  },

  SendFile: async (path: string, isLocalOnly: boolean = false): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.SendFile`, path, isLocalOnly)) as string;
  },

  SendFiles: async (paths: string[], isLocalOnly: boolean = false): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.SendFiles`, paths, isLocalOnly)) as string;
  },

  SavePastedImage: async (filename: string, base64Data: string): Promise<string> => {
    return (await Call.ByName(`${SERVICE_FQN}.SavePastedImage`, filename, base64Data)) as string;
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

  GetConfig: async (): Promise<UserConfig> => {
    return (await Call.ByName(`${SERVICE_FQN}.GetConfig`)) as UserConfig;
  },

  UpdateConfig: async (cfg: UserConfig): Promise<void> => {
    await Call.ByName(`${SERVICE_FQN}.UpdateConfig`, cfg);
  },

  ResetConfig: async (): Promise<UserConfig> => {
    return (await Call.ByName(`${SERVICE_FQN}.ResetConfig`)) as UserConfig;
  },

  StartEmbeddedRelay: async (port: string, password: string): Promise<RelayStatus> => {
    return (await Call.ByName(`${SERVICE_FQN}.StartEmbeddedRelay`, port, password)) as RelayStatus;
  },

  StopEmbeddedRelay: async (): Promise<RelayStatus> => {
    return (await Call.ByName(`${SERVICE_FQN}.StopEmbeddedRelay`)) as RelayStatus;
  },

  GetEmbeddedRelayStatus: async (): Promise<RelayStatus> => {
    return (await Call.ByName(`${SERVICE_FQN}.GetEmbeddedRelayStatus`)) as RelayStatus;
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
