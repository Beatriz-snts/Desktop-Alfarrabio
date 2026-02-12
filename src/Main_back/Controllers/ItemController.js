import Itens from '../Models/Itens.js';

class ItemController {
    constructor() {
        this.itens = new Itens();
    }

    listar() {
        try {
            const data = this.itens.listar();
            // Normalizar caminhos de imagem
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    normalizarItem(item) {
        if (item.imagem_path) {
            // Se já tem o protocolo, não adiciona de novo
            if (item.imagem_path.startsWith('media://')) {
                return item;
            }
            // Converter backslashes para slashes
            let cleanPath = item.imagem_path.replace(/\\/g, '/');
            // Garantir que começa com media:/// (3 barras para caminhos absolutos)
            item.imagem_path = `media:///${cleanPath}`;
        }
        return item;
    }

    sanitizarItem(item) {
        if (item.imagem_path) {
            // Remove o protocolo media:/// ou media:// se existir
            item.imagem_path = item.imagem_path.replace(/^media:\/\/+/i, '');
        }
        return item;
    }

    listarDisponiveis() {
        try {
            const data = this.itens.listarDisponiveis();
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarPorId(uuid) {
        try {
            const data = this.itens.buscarPorId(uuid);
            if (!data) {
                return { success: false, error: 'Item não encontrado' };
            }
            return { success: true, data: this.normalizarItem(data) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscar(termo) {
        try {
            const data = this.itens.buscar(termo);
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    filtrarPorCategoria(categoriaId) {
        try {
            const data = this.itens.filtrarPorCategoria(categoriaId);
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    filtrarPorGenero(generoId) {
        try {
            const data = this.itens.filtrarPorGenero(generoId);
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarEstoqueBaixo() {
        try {
            const data = this.itens.buscarEstoqueBaixo();
            const dataNormalizada = data.map(item => this.normalizarItem(item));
            return { success: true, data: dataNormalizada };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cadastrar(item) {
        try {
            if (!item.nome || !item.preco) {
                return { success: false, error: 'Nome e preço são obrigatórios' };
            }
            const itemSanitizado = this.sanitizarItem({ ...item });
            const resultado = this.itens.adicionar(itemSanitizado);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    atualizar(item) {
        try {
            if (!item.uuid) {
                return { success: false, error: 'UUID é obrigatório' };
            }
            const itemSanitizado = this.sanitizarItem({ ...item });
            const resultado = this.itens.atualizar(itemSanitizado);
            return { success: resultado, message: resultado ? 'Atualizado' : 'Nenhuma alteração' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    remover(uuid) {
        try {
            const resultado = this.itens.remover(uuid);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default ItemController;
