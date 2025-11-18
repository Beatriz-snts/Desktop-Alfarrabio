import Usuarios from '../Models/Usuarios.js';
class UsuarioController{
    constructor(){
        this.usuarioModel = new Usuarios();
    }
    async listar(){
        return this.usuarioModel.listar();
    }
    async cadastrar(usuario){
        this.usuarioModel.adicionar(usuario);
        return true;
    }

}
export default UsuarioController;