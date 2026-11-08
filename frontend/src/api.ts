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
  GetClipboardImage: () => Promise<string>;
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
  OpenURL: (url: string) => Promise<void>;
  StartEmbeddedRelay: (port: string, password: string) => Promise<RelayStatus>;
  StopEmbeddedRelay: () => Promise<RelayStatus>;
  GetEmbeddedRelayStatus: () => Promise<RelayStatus>;
}

const SERVICE_FQN = 'croc-interface/backend/service.AppService';

async function callWailsOr<T>(
  wailsFn: () => Promise<T>,
  fallbackFn: () => Promise<T>
): Promise<T> {
  try {
    return await wailsFn();
  } catch {
    return await fallbackFn();
  }
}

export const api: BackendService = {
  PickFile: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.PickFile`)) as string,
      async () => ''
    );
  },

  PickFiles: async (): Promise<string[]> => {
    return callWailsOr(
      async () => {
        const res = (await Call.ByName(`${SERVICE_FQN}.PickFiles`)) as string[];
        return res || [];
      },
      async () => []
    );
  },

  PickFolder: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.PickFolder`)) as string,
      async () => ''
    );
  },

  SendFile: async (path: string, isLocalOnly: boolean = false): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.SendFile`, path, isLocalOnly)) as string,
      async () => {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [path], local_only: isLocalOnly }),
        });
        const data = await res.json();
        return data.code;
      }
    );
  },

  SendFiles: async (paths: string[], isLocalOnly: boolean = false): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.SendFiles`, paths, isLocalOnly)) as string,
      async () => {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths, local_only: isLocalOnly }),
        });
        const data = await res.json();
        return data.code;
      }
    );
  },

  SavePastedImage: async (filename: string, base64Data: string): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.SavePastedImage`, filename, base64Data)) as string,
      async () => filename
    );
  },

  GetClipboardImage: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.GetClipboardImage`)) as string,
      async () => ''
    );
  },

  ReceiveFile: async (code: string, isLocalOnly: boolean = false): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.ReceiveFile`, code, isLocalOnly);
      },
      async () => {
        await fetch('/api/receive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, local_only: isLocalOnly }),
        });
      }
    );
  },

  CancelTransfer: async (): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.CancelTransfer`);
      },
      async () => {
        await fetch('/api/cancel', { method: 'POST' });
      }
    );
  },

  OpenDownloadsFolder: async (filename: string = ''): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.OpenDownloadsFolder`, filename);
      },
      async () => {}
    );
  },

  GenerateQRCode: async (code: string): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.GenerateQRCode`, code)) as string,
      async () => {
        const res = await fetch(`/api/qr?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        return data.qr;
      }
    );
  },

  GetDownloadDir: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.GetDownloadDir`)) as string,
      async () => {
        const cfg = await api.GetConfig();
        return cfg.download_dir;
      }
    );
  },

  SetDownloadDir: async (path: string): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.SetDownloadDir`, path);
      },
      async () => {
        const cfg = await api.GetConfig();
        await api.UpdateConfig({ ...cfg, download_dir: path });
      }
    );
  },

  PickDownloadDir: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.PickDownloadDir`)) as string,
      async () => ''
    );
  },

  ResetDownloadDir: async (): Promise<string> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.ResetDownloadDir`)) as string,
      async () => ''
    );
  },

  GetConfig: async (): Promise<UserConfig> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.GetConfig`)) as UserConfig,
      async () => {
        const res = await fetch('/api/config');
        return await res.json();
      }
    );
  },

  UpdateConfig: async (cfg: UserConfig): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.UpdateConfig`, cfg);
      },
      async () => {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfg),
        });
      }
    );
  },

  ResetConfig: async (): Promise<UserConfig> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.ResetConfig`)) as UserConfig,
      async () => {
        const res = await fetch('/api/config');
        return await res.json();
      }
    );
  },

  OpenURL: async (url: string): Promise<void> => {
    return callWailsOr(
      async () => {
        await Call.ByName(`${SERVICE_FQN}.OpenURL`, url);
      },
      async () => {
        try {
          await fetch('/api/open-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
        } catch {
          window.open(url, '_blank');
        }
      }
    );
  },

  StartEmbeddedRelay: async (port: string, password: string): Promise<RelayStatus> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.StartEmbeddedRelay`, port, password)) as RelayStatus,
      async () => {
        const res = await fetch('/api/relay/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ port, password }),
        });
        return await res.json();
      }
    );
  },

  StopEmbeddedRelay: async (): Promise<RelayStatus> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.StopEmbeddedRelay`)) as RelayStatus,
      async () => {
        const res = await fetch('/api/relay/stop', { method: 'POST' });
        return await res.json();
      }
    );
  },

  GetEmbeddedRelayStatus: async (): Promise<RelayStatus> => {
    return callWailsOr(
      async () => (await Call.ByName(`${SERVICE_FQN}.GetEmbeddedRelayStatus`)) as RelayStatus,
      async () => {
        const res = await fetch('/api/relay/status');
        return await res.json();
      }
    );
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
    if (typeof unsub === 'function') {
      return unsub;
    }
  } catch {
    // wails events not available, fallback to SSE
  }

  // Fallback for Mobile / Browser via SSE
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      const source = new EventSource('/api/events');
      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === eventName) {
            callback(parsed.data as T);
          }
        } catch {
          // ignore parse errors
        }
      };
      return () => source.close();
    } catch {
      return () => {};
    }
  }

  return () => {};
};
