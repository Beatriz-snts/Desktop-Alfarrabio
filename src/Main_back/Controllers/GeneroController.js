import Generos from '../Models/Generos.js';

class GeneroController {
    constructor() {
        this.generos = new Generos();
    }

    listar() {
        try {
            const data = this.generos.listar();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    listarPorCategoria(categoriaId) {
        try {
            const data = this.generos.listarPorCategoria(categoriaId);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cadastrar(genero) {
        try {
            if (!genero.nome) {
                return { success: false, error: 'Nome é obrigatório' };
            }
            const resultado = this.generos.adicionar(genero);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    atualizar(genero) {
        try {
            const resultado = this.generos.atualizar(genero);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    remover(id) {
        try {
            const resultado = this.generos.remover(id);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default GeneroController;
