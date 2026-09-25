
import { app, BrowserWindow, ipcMain, Menu, Notification } from "electron";
import { globalShortcut } from "electron";
import { join } from "node:path";
import Store from "electron-store";

let store: Store<any>;
let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  const { default: Store } = await import("electron-store");
  store = new Store();
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    title: "Timerstamp",
    backgroundColor: "#111318",
    icon: join(
      app.getAppPath(),
      app.isPackaged ? "dist/icon.ico" : "public/icon.ico"
    ),
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
  });

  Menu.setApplicationMenu(null);

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("CommandOrControl+Alt+T", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("settings:get", () => store.get("settings", {}));

ipcMain.handle("settings:set", (_event, settings) => {
  const currentSettings = store.get("settings", {});
  
  store.set("settings", {
    ...currentSettings,
    ...settings
  });
});

ipcMain.handle("settings:reset", () => {
  store.delete("settings");
});

ipcMain.handle("notification:show", (_event, title: string, body: string) => {
  new Notification({ title, body }).show();
});

ipcMain.on("timer-completed", (_event, alwaysOnTop: boolean) => {
  if (!mainWindow) return;

  if (!alwaysOnTop) {
    mainWindow.setAlwaysOnTop(false, "normal");
    return;
  }

  // 최소화되어 있다면 복원
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  // 항상 위 옵션을 잠깐 활성화해서 확실하게 앞으로 가져오기
  mainWindow.setAlwaysOnTop(true, "screen-saver");

  // 다른 창 뒤에 있다면 앞으로 가져오기
  mainWindow.show();

  // 포커스
  // mainWindow.focus();

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(false, "normal");
    }
  }, 1000);
});
