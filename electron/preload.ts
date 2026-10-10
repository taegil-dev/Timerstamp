
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  getSettings: () => ipcRenderer.invoke("settings:get"),

  saveSettings: (settings: unknown) =>
    ipcRenderer.invoke("settings:set", settings),

  notify: (title: string, body: string) =>
    ipcRenderer.invoke("notification:show", title, body),

  onNotificationClicked: (callback: () => void) => {
    ipcRenderer.on("notification:clicked", callback);
  },

  timerCompleted: (alwaysOnTop: boolean) => {
    ipcRenderer.send("timer-completed", alwaysOnTop);
  },

  checkForUpdates: () =>
    ipcRenderer.invoke("update:check"),

  downloadUpdate: () =>
    ipcRenderer.invoke("update:download"),

  installUpdate: () =>
    ipcRenderer.invoke("update:install"),

  onUpdateStatus: (
    callback: (data: {
      status: string;
      version?: string;
      percent?: number;
      message?: string;
    }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: {
        status: string;
        version?: string;
        percent?: number;
        message?: string;
      }
    ) => callback(data);

    ipcRenderer.on("update:status", listener);

    return () => {
      ipcRenderer.removeListener("update:status", listener);
    };
  },
});