import UsuariosView from "../UsuariosView.js";
import MensagemDeAlerta from "../../../Services/MensagemDeAlerta.js";
class UsuarioForm{
    constructor(){
        this.view = new UsuariosView();
        this.mensagem = new MensagemDeAlerta();
    }
    renderizarFormulario(){
        setTimeout(() => {
            this.adicionarEventos();
            console.log("evento criado")
        }, 0);
        return this.view.renderizarFomulario();
    }
    adicionarEventos(){
        const formulario = document.getElementById('form-usuario');
        formulario.addEventListener('submit', async (event) =>{
            event.preventDefault();
            console.log(event)
            const nome = document.getElementById('nome');
            const idade = document.getElementById('idade');
            const usuario = {
                nome: nome.value,
                idade: idade.value
            }
            const resultado = await window.api.cadastrar(usuario);
           if(resultado){
             nome.value = '';
             idade.value = '';
             this.mensagem.sucesso();
           }else{
             this.mensagem.erro();
           }
            
        })
    }
}
export default UsuarioForm;