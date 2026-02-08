import Usuarios from '../Models/Usuarios.js';

class UsuarioController {
    constructor() {
        this.usuarioModel = new Usuarios();
    }

    listar() {
        try {
            const dados = this.usuarioModel.listar();
            return { success: true, data: dados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarPorId(uuid) {
        try {
            if (!uuid) {
                return { success: false, error: 'UUID é obrigatório' };
            }
            const data = this.usuarioModel.buscarPorId(uuid);
            return { success: !!data, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async cadastrar(usuario) {
        try {
            if (!usuario.nome || !usuario.email || !usuario.senha) {
                return { success: false, error: 'Nome, email e senha são obrigatórios' };
            }
            if (usuario.senha.length < 6) {
                return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
            }

            // Verifica se email já existe
            const existente = this.usuarioModel.buscarPorEmail(usuario.email);
            if (existente) {
                return { success: false, error: 'Email já cadastrado' };
            }

            const resultado = await this.usuarioModel.adicionar(usuario);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async atualizar(usuario) {
        try {
            if (!usuario.uuid) {
                return { success: false, error: 'UUID é obrigatório' };
            }
            if (!usuario.nome || !usuario.email) {
                return { success: false, error: 'Nome e email são obrigatórios' };
            }

            const usuarioExistente = this.usuarioModel.buscarPorId(usuario.uuid);
            if (!usuarioExistente) {
                return { success: false, error: 'Usuário não encontrado' };
            }

            const resultado = await this.usuarioModel.atualizar(usuario);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    remover(uuid) {
        try {
            if (!uuid) {
                return { success: false, error: 'UUID é obrigatório' };
            }

            const usuarioExistente = this.usuarioModel.buscarPorId(uuid);
            if (!usuarioExistente) {
                return { success: false, error: 'Usuário não encontrado' };
            }

            const resultado = this.usuarioModel.remover(uuid);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default UsuarioController;