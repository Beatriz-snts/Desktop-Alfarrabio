import { contextBridge, ipcRenderer } from 'electron/renderer';

// API de tema
contextBridge.exposeInMainWorld('darkMode', {
    toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
    get: () => ipcRenderer.invoke('dark-mode:get')
});

// API de autenticação
contextBridge.exposeInMainWorld('auth', {
    login: (email, senha) => ipcRenderer.invoke('auth:login', email, senha),
    logout: () => ipcRenderer.invoke('auth:logout'),
    verificar: () => ipcRenderer.invoke('auth:verificar'),
    isAdmin: () => ipcRenderer.invoke('auth:isAdmin')
});

// API de usuários
contextBridge.exposeInMainWorld('usuarios', {
    listar: () => ipcRenderer.invoke('usuarios:listar'),
    buscarPorId: (uuid) => ipcRenderer.invoke('usuarios:buscarPorId', uuid),
    cadastrar: (usuario) => ipcRenderer.invoke('usuarios:cadastrar', usuario),
    atualizar: (usuario) => ipcRenderer.invoke('usuarios:editar', usuario),
    remover: (uuid) => ipcRenderer.invoke('usuarios:remover', uuid)
});

// API de itens
contextBridge.exposeInMainWorld('itens', {
    listar: () => ipcRenderer.invoke('itens:listar'),
    listarDisponiveis: () => ipcRenderer.invoke('itens:listarDisponiveis'),
    buscarPorId: (uuid) => ipcRenderer.invoke('itens:buscarPorId', uuid),
    buscar: (termo) => ipcRenderer.invoke('itens:buscar', termo),
    filtrarPorCategoria: (catId) => ipcRenderer.invoke('itens:filtrarPorCategoria', catId),
    filtrarPorGenero: (genId) => ipcRenderer.invoke('itens:filtrarPorGenero', genId),
    cadastrar: (item) => ipcRenderer.invoke('itens:cadastrar', item),
    atualizar: (item) => ipcRenderer.invoke('itens:atualizar', item),
    remover: (uuid) => ipcRenderer.invoke('itens:remover', uuid),
    estoqueBaixo: () => ipcRenderer.invoke('itens:estoqueBaixo')
});

// API de categorias
contextBridge.exposeInMainWorld('categorias', {
    listar: () => ipcRenderer.invoke('categorias:listar'),
    buscarPorId: (id) => ipcRenderer.invoke('categorias:buscarPorId', id),
    cadastrar: (cat) => ipcRenderer.invoke('categorias:cadastrar', cat),
    atualizar: (cat) => ipcRenderer.invoke('categorias:atualizar', cat),
    remover: (id) => ipcRenderer.invoke('categorias:remover', id)
});

// API de gêneros
contextBridge.exposeInMainWorld('generos', {
    listar: () => ipcRenderer.invoke('generos:listar'),
    listarPorCategoria: (catId) => ipcRenderer.invoke('generos:listarPorCategoria', catId),
    cadastrar: (gen) => ipcRenderer.invoke('generos:cadastrar', gen),
    atualizar: (gen) => ipcRenderer.invoke('generos:atualizar', gen),
    remover: (id) => ipcRenderer.invoke('generos:remover', id)
});

// API de vendas
contextBridge.exposeInMainWorld('vendas', {
    criar: (usuarioId) => ipcRenderer.invoke('vendas:criar', usuarioId),
    adicionarItem: (vendaId, itemUuid, qtd) => ipcRenderer.invoke('vendas:adicionarItem', vendaId, itemUuid, qtd),
    removerItem: (itemVendaId) => ipcRenderer.invoke('vendas:removerItem', itemVendaId),
    atualizarQuantidade: (itemVendaId, qtd, vendaId) => ipcRenderer.invoke('vendas:atualizarQuantidade', itemVendaId, qtd, vendaId),
    listarItens: (vendaId) => ipcRenderer.invoke('vendas:listarItens', vendaId),
    finalizar: (vendaUuid, formaPag, desconto) => ipcRenderer.invoke('vendas:finalizar', vendaUuid, formaPag, desconto),
    cancelar: (vendaUuid) => ipcRenderer.invoke('vendas:cancelar', vendaUuid),
    listar: () => ipcRenderer.invoke('vendas:listar'),
    listarPorPeriodo: (inicio, fim) => ipcRenderer.invoke('vendas:listarPorPeriodo', inicio, fim),
    buscarPorId: (uuid) => ipcRenderer.invoke('vendas:buscarPorId', uuid),
    estatisticasHoje: () => ipcRenderer.invoke('vendas:estatisticasHoje'),
    maisVendidos: (limite) => ipcRenderer.invoke('vendas:maisVendidos', limite)
});
