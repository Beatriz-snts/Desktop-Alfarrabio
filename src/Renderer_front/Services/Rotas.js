import UsuarioListar from "../Views/Usuario/listar/UsuarioListar.js"
import UsuarioForm from "../Views/Usuario/form/UsuarioForm.js"
import UsuariosView from "../Views/Usuario/UsuariosView.js";
class Rotas {
    constructor(){
        this.rotas = {
            // chave         : valor
            "/usuario_listar": async () =>{
                return new UsuarioListar().renderizarLista();
            },
            "/usuario_criar": () =>{
                return new UsuarioForm().renderizarFormulario();
            },
            "/usuario_menu": () =>{
                return new UsuariosView().renderizarMenu();
            }
        }
    }
    async getPage(rota){
        // /usuario_listar
            // UsuarioListar()
        return await this.rotas[rota]();
    }
}
export default Rotas;