import Usuarios from '../Models/Usuarios.js';

class AuthController {
    constructor() {
        this.usuarios = new Usuarios();
        this.usuarioLogado = null;
    }

    async login(email, senha) {
        try {
            const resultado = await this.usuarios.validarLogin(email, senha);
            if (resultado.success) {
                this.usuarioLogado = resultado.usuario;
            }
            return resultado;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    logout() {
        this.usuarioLogado = null;
        return { success: true };
    }

    verificarSessao() {
        if (this.usuarioLogado) {
            return { logado: true, usuario: this.usuarioLogado };
        }
        return { logado: false };
    }

    getUsuarioLogado() {
        return this.usuarioLogado;
    }

    isAdmin() {
        return this.usuarioLogado?.role === 'admin';
    }
}

export default AuthController;
