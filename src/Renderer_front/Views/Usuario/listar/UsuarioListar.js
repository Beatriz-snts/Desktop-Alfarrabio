import UsuariosView from "../UsuariosView.js"
class UsuarioListar{
    constructor(){
        this.view = new UsuariosView();
    }
   async renderizarLista(){
        const dados = await window.api.listar();
        console.log('dados na usuario lista', dados);
       return this.view.renderizarLista(dados)
    }
}
export default UsuarioListar;