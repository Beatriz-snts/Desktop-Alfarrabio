import Itens from '../Models/Itens.js';

class ItemController {
    constructor() {
        this.itens = new Itens();
    }

    listar() {
        try {
            const data = this.itens.listar();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    listarDisponiveis() {
        try {
            const data = this.itens.listarDisponiveis();
            return { success: true, data };
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
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscar(termo) {
        try {
            const data = this.itens.buscar(termo);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    filtrarPorCategoria(categoriaId) {
        try {
            const data = this.itens.filtrarPorCategoria(categoriaId);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    filtrarPorGenero(generoId) {
        try {
            const data = this.itens.filtrarPorGenero(generoId);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarEstoqueBaixo() {
        try {
            const data = this.itens.buscarEstoqueBaixo();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cadastrar(item) {
        try {
            if (!item.nome || !item.preco) {
                return { success: false, error: 'Nome e preço são obrigatórios' };
            }
            const resultado = this.itens.adicionar(item);
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
            const resultado = this.itens.atualizar(item);
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
