import Autores from '../Models/Autores.js';

class AutorController {
    constructor() {
        this.autorModel = new Autores();
    }

    listar() {
        try {
            const dados = this.autorModel.listar();
            return { success: true, data: dados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cadastrar(autor) {
        try {
            if (!autor.nome) {
                return { success: false, error: 'Nome do autor é obrigatório' };
            }
            const resultado = this.autorModel.adicionar(autor);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    remover(id) {
        try {
            const resultado = this.autorModel.remover(id);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default AutorController;
