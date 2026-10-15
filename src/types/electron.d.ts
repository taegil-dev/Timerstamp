
export {};

declare global {
  interface Window {
    desktop: {
      getSettings: () => Promise<unknown>;
      saveSettings: (settings: unknown) => Promise<void>;
      notify: (title: string, body: string) => Promise<void>;
      onNotificationClicked: (callback: () => void) => () => void;
      timerCompleted: (alwaysOnTop: boolean) => void;
      checkForUpdates: () => Promise<unknown>;
      downloadUpdate: () => Promise<unknown>;
      installUpdate: () => Promise<unknown>;

      onUpdateStatus: (
        callback: (data: {
          status: string;
          version?: string;
          percent?: number;
          message?: string;
        }) => void
      ) => () => void;
    };
  }
}