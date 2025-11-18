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
        this.usuarioModel.adicionar(usuario);
        return true;
    }

}
export default UsuarioController;