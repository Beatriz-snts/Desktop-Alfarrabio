import UsuarioListar from "../Views/Usuario/listar/UsuarioListar.js"
import UsuarioForm from "../Views/Usuario/form/UsuarioForm.js"
class Rotas {
    constructor(){
        this.rotas={
            "/usuario_listar": () =>{
                return new UsuarioListar().renderizarLista();
            },
            "/usuario_form": () =>{
                return new UsuarioForm().renderizarFormulario();
            }
        }
    }
     getPage(rota){
        // /usuario_listar
            // UsuarioListar()
        return this.rotas[rota]();
    }
}
export default Rotas;