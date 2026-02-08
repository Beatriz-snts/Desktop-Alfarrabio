import Categorias from '../Models/Categorias.js';

class CategoriaController {
    constructor() {
        this.categorias = new Categorias();
    }

    listar() {
        try {
            const data = this.categorias.listar();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarPorId(id) {
        try {
            const data = this.categorias.buscarPorId(id);
            return { success: !!data, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cadastrar(categoria) {
        try {
            if (!categoria.nome) {
                return { success: false, error: 'Nome é obrigatório' };
            }
            const resultado = this.categorias.adicionar(categoria);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    atualizar(categoria) {
        try {
            const resultado = this.categorias.atualizar(categoria);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    remover(id) {
        try {
            const resultado = this.categorias.remover(id);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default CategoriaController;
