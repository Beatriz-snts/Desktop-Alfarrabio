import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Controllers
import AuthController from './Main_back/Controllers/AuthController.js';
import UsuarioController from './Main_back/Controllers/UsuarioController.js';
import ItemController from './Main_back/Controllers/ItemController.js';
import CategoriaController from './Main_back/Controllers/CategoriaController.js';
import GeneroController from './Main_back/Controllers/GeneroController.js';
import AutorController from './Main_back/Controllers/AutorController.js';
import VendaController from './Main_back/Controllers/VendaController.js';
import { initDatabase } from './Main_back/Database/db.js';

if (started) {
  app.quit();
}

// Instâncias dos controllers
const authController = new AuthController();
const usuarioController = new UsuarioController();
const itemController = new ItemController();
const categoriaController = new CategoriaController();
const generoController = new GeneroController();
const autorController = new AutorController();
const vendaController = new VendaController();

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
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

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // DevTools em desenvolvimento
  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
  initDatabase();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // =========================================
  // IPC - Tema
  // =========================================
  ipcMain.handle('dark-mode:toggle', () => {
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light';
    } else {
      nativeTheme.themeSource = 'dark';
    }
    return nativeTheme.shouldUseDarkColors;
  });

  ipcMain.handle('dark-mode:get', () => {
    return nativeTheme.shouldUseDarkColors;
  });

  // =========================================
  // IPC - Autenticação
  // =========================================
  ipcMain.handle('auth:login', async (event, email, senha) => {
    return await authController.login(email, senha);
  });

  ipcMain.handle('auth:logout', () => {
    return authController.logout();
  });

  ipcMain.handle('auth:verificar', () => {
    return authController.verificarSessao();
  });

  ipcMain.handle('auth:isAdmin', () => {
    return authController.isAdmin();
  });

  // =========================================
  // IPC - Usuários
  // =========================================
  ipcMain.handle('usuarios:listar', () => {
    return usuarioController.listar();
  });

  ipcMain.handle('usuarios:buscarPorId', (event, uuid) => {
    return usuarioController.buscarPorId(uuid);
  });

  ipcMain.handle('usuarios:cadastrar', async (event, usuario) => {
    return await usuarioController.cadastrar(usuario);
  });

  ipcMain.handle('usuarios:editar', async (event, usuario) => {
    return await usuarioController.atualizar(usuario);
  });

  ipcMain.handle('usuarios:remover', (event, uuid) => {
    return usuarioController.remover(uuid);
  });

  // =========================================
  // IPC - Itens
  // =========================================
  ipcMain.handle('itens:listar', () => {
    return itemController.listar();
  });

  ipcMain.handle('itens:listarDisponiveis', () => {
    return itemController.listarDisponiveis();
  });

  ipcMain.handle('itens:buscarPorId', (event, uuid) => {
    return itemController.buscarPorId(uuid);
  });

  ipcMain.handle('itens:buscar', (event, termo) => {
    return itemController.buscar(termo);
  });

  ipcMain.handle('itens:filtrarPorCategoria', (event, categoriaId) => {
    return itemController.filtrarPorCategoria(categoriaId);
  });

  ipcMain.handle('itens:filtrarPorGenero', (event, generoId) => {
    return itemController.filtrarPorGenero(generoId);
  });

  ipcMain.handle('itens:cadastrar', (event, item) => {
    return itemController.cadastrar(item);
  });

  ipcMain.handle('itens:atualizar', (event, item) => {
    return itemController.atualizar(item);
  });

  ipcMain.handle('itens:remover', (event, uuid) => {
    return itemController.remover(uuid);
  });

  ipcMain.handle('itens:estoqueBaixo', () => {
    return itemController.buscarEstoqueBaixo();
  });

  // =========================================
  // IPC - Categorias
  // =========================================
  ipcMain.handle('categorias:listar', () => {
    return categoriaController.listar();
  });

  ipcMain.handle('categorias:buscarPorId', (event, id) => {
    return categoriaController.buscarPorId(id);
  });

  ipcMain.handle('categorias:cadastrar', (event, categoria) => {
    return categoriaController.cadastrar(categoria);
  });

  ipcMain.handle('categorias:atualizar', (event, categoria) => {
    return categoriaController.atualizar(categoria);
  });

  ipcMain.handle('categorias:remover', (event, id) => {
    return categoriaController.remover(id);
  });

  // =========================================
  // IPC - Gêneros
  // =========================================
  ipcMain.handle('generos:listar', () => {
    return generoController.listar();
  });

  ipcMain.handle('generos:listarPorCategoria', (event, categoriaId) => {
    return generoController.listarPorCategoria(categoriaId);
  });

  ipcMain.handle('generos:cadastrar', (event, genero) => {
    return generoController.cadastrar(genero);
  });

  ipcMain.handle('generos:atualizar', (event, genero) => {
    return generoController.atualizar(genero);
  });

  ipcMain.handle('generos:remover', (event, id) => {
    return generoController.remover(id);
  });

  // =========================================
  // IPC - Autores
  // =========================================
  ipcMain.handle('autores:listar', () => {
    return autorController.listar();
  });

  ipcMain.handle('autores:cadastrar', (event, autor) => {
    return autorController.cadastrar(autor);
  });

  // =========================================
  // IPC - Vendas
  // =========================================
  ipcMain.handle('vendas:criar', (event, usuarioId) => {
    return vendaController.criar(usuarioId);
  });

  ipcMain.handle('vendas:adicionarItem', (event, vendaId, itemUuid, quantidade) => {
    return vendaController.adicionarItem(vendaId, itemUuid, quantidade);
  });

  ipcMain.handle('vendas:removerItem', (event, itemVendaId) => {
    return vendaController.removerItem(itemVendaId);
  });

  ipcMain.handle('vendas:atualizarQuantidade', (event, itemVendaId, quantidade, vendaId) => {
    return vendaController.atualizarQuantidadeItem(itemVendaId, quantidade, vendaId);
  });

  ipcMain.handle('vendas:listarItens', (event, vendaId) => {
    return vendaController.listarItens(vendaId);
  });

  ipcMain.handle('vendas:finalizar', (event, vendaUuid, formaPagamento, desconto) => {
    return vendaController.finalizar(vendaUuid, formaPagamento, desconto);
  });

  ipcMain.handle('vendas:cancelar', (event, vendaUuid) => {
    return vendaController.cancelar(vendaUuid);
  });

  ipcMain.handle('vendas:listar', () => {
    return vendaController.listar();
  });

  ipcMain.handle('vendas:listarPorPeriodo', (event, dataInicio, dataFim) => {
    return vendaController.listarPorPeriodo(dataInicio, dataFim);
  });

  ipcMain.handle('vendas:buscarPorId', (event, uuid) => {
    return vendaController.buscarPorId(uuid);
  });

  ipcMain.handle('vendas:estatisticasHoje', () => {
    return vendaController.estatisticasHoje();
  });

  ipcMain.handle('vendas:maisVendidos', (event, limite) => {
    return vendaController.maisVendidos(limite);
  });

  // =========================================
  // IPC - Sincronização
  // =========================================
  ipcMain.handle('sync:testar', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.testarConexao();
  });

  ipcMain.handle('sync:importarCategorias', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.importarCategorias();
  });

  ipcMain.handle('sync:importarGeneros', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.importarGeneros();
  });

  ipcMain.handle('sync:importarAutores', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.importarAutores();
  });

  ipcMain.handle('sync:importarItens', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.importarItens();
  });

  ipcMain.handle('sync:exportarVendas', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.exportarVendas();
  });

  ipcMain.handle('sync:sincronizarTudo', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.sincronizarTudo();
  });

  ipcMain.handle('sync:status', async () => {
    const SyncService = (await import('./Main_back/Services/SyncService.js')).default;
    return SyncService.getStatusSync();
  });

  ipcMain.handle('sync:estatisticas', () => {
    const db = require('./Main_back/Database/db.js').default;

    const categorias = db.prepare('SELECT COUNT(*) as count FROM categorias WHERE excluido_em IS NULL').get();
    const generos = db.prepare('SELECT COUNT(*) as count FROM generos WHERE excluido_em IS NULL').get();
    const autores = db.prepare('SELECT COUNT(*) as count FROM autores WHERE excluido_em IS NULL').get();
    const itens = db.prepare('SELECT COUNT(*) as count FROM itens WHERE excluido_em IS NULL').get();
    const vendasPendentes = db.prepare("SELECT COUNT(*) as count FROM vendas WHERE sync_status = 0 AND status = 'concluida'").get();

    return {
      categorias: categorias?.count || 0,
      generos: generos?.count || 0,
      autores: autores?.count || 0,
      itens: itens?.count || 0,
      vendasPendentes: vendasPendentes?.count || 0
    };
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

