
export {};

declare global {
  interface Window {
    desktop: {
      getSettings: () => Promise<unknown>;
      saveSettings: (settings: unknown) => Promise<void>;
      notify: (title: string, body: string) => Promise<void>;
      timerCompleted: (alwaysOnTop: boolean) => void;
    };
  }
}