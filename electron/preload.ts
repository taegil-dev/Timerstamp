
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  getSettings: () => ipcRenderer.invoke("settings:get"),

  saveSettings: (settings: unknown) =>
    ipcRenderer.invoke("settings:set", settings),

  notify: (title: string, body: string) =>
    ipcRenderer.invoke("notification:show", title, body),

  timerCompleted: (alwaysOnTop: boolean) => {
    ipcRenderer.send("timer-completed", alwaysOnTop);
  },
});