import UsuariosView from "../UsuariosView.js"
class UsuarioListar{
    constructor(){
        this.view = new UsuariosView();
    }
    renderizarLista(){
       return this.view.renderizarLista()
    }
}
export default UsuarioListar;