import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld(
    'darkMode', {
        toggle: () => ipcRenderer.invoke('dark-mode:toggle')
    }
)

contextBridge.exposeInMainWorld(
    // window.api.listar()
    'api',{
        listar: () => ipcRenderer.invoke('usuarios:listar'),
        cadastrar: (usuario) => ipcRenderer.invoke('usuarios:cadastrar', usuario)

    }
)