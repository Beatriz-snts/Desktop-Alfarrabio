import Usuarios from '../Models/Usuarios.js';
class UsuarioController{
    constructor(){
        this.usuarioModel = new Usuarios();
    }
    async listar(){
        const dados = await this.usuarioModel.listar();
        console.log('dados no controller', dados);
        return dados
    }
    async cadastrar(usuario){
        if(!usuario.nome || !usuario.idade){
            return false;
        }
        this.usuarioModel.adicionar(usuario);
        return true;
    }
    async atualizarUsuario(usuario){
        if(!usuario.nome || !usuario.idade){
            return false;
        }
        console.log('chegou no controller',usuario)
        const usuarioExistente = await this.usuarioModel.buscarPorId(usuario.uuid);
        console.log('usuario retornado da model',usuarioExistente)
        if(!usuarioExistente){
            return false;
        }
        const resultado = await this.usuarioModel.atualizar(usuario);
        return resultado;
    }

    async buscarUsuarioPorId(id){
        console.log(id)
        if(!id){
            return false
        }
       return this.usuarioModel.buscarPorId(id)
    }


    async removerUsuario(uuid){
        const usuarioExistente = await this.usuarioModel.buscarPorId(uuid);
        if(!usuarioExistente){
            return false
        }
        console.log("usuario a ser removido",usuarioExistente)
        debugger
        const resultado = await this.usuarioModel.remover(usuarioExistente)
        return resultado
    }

}
export default UsuarioController;