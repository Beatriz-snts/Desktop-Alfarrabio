import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import UsuarioController from './Main_back/Controllers/UsuarioController.js';
import ServicoController from './Main_back/Controllers/ServicoController.js';
import { initDatabase } from './Main_back/Database/db.js';
if (started) {
  app.quit();
}
const controlerUsuario = new UsuarioController();
const controlerServico = new ServicoController();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    transparent: false,
    alwaysOnTop: false,
    resizable: true,
    fullscreen: false,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  initDatabase();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle("usuarios:buscarPorId", async (event, uuid) => {
  return await controlerUsuario.buscarUsuarioPorId(uuid);
})

ipcMain.handle("usuarios:removerusuario", async (event, uuid) => {
  return await controlerUsuario.removerUsuario(uuid);
})

ipcMain.handle("usuarios:listar", async () => {
  return await controlerUsuario.listar();
})

ipcMain.handle("usuarios:cadastrar", async (event, usuario) => {
   const resultado = await controlerUsuario.cadastrar(usuario);
   return resultado;
})

ipcMain.handle("usuarios:editar", async (event, usuario) => {
   const resultado = await controlerUsuario.atualizarUsuario(usuario);
   return resultado;
})

});


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
