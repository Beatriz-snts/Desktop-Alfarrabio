import UsuariosView from "../UsuariosView.js"
import MensagemDeAlerta from "../../../Services/MensagemDeAlerta.js" 
class UsuarioListar{
    constructor(){
        this.view = new UsuariosView();
        this.mensagem = new MensagemDeAlerta();

        
    }
   async renderizarLista(){
        const dados = await window.api.listar();
        console.log('dados na usuario lista', dados);
        setTimeout(()=>{
            this.adicionarEventos();
        },0)
       return this.view.renderizarLista(dados)
    }
    adicionarEventos(){
        const btnfechar = document.getElementById("fechar");
        btnfechar.addEventListener("click",()=>{
            this.view.fecharModal();
        })
        const container = document.getElementById("container");
        container.addEventListener("click", async (e)=>{
            const idUsuario = e.target.getAttribute("data-id");
            if(e.target.classList.contains("editar-user")){
                console.log("editar usuario id:", idUsuario);
                const usuario = await window.api.buscarporid(idUsuario)
                 const id = document.getElementById("id")
                const nome = document.getElementById("nome")
                const idade = document.getElementById("idade")
                id.value = usuario.uuid
                nome.value = usuario.nome
                idade.value = usuario.idade
                this.view.abrirModal();
            }
             if(e.target.classList.contains("excluir-user")){
               const resultado = await window.api.removerUsuario(idUsuario);
               console.log(resultado)
               if(resultado){
                    this.mensagem.sucesso("Excluído com sucesso!");
                    setTimeout(async ()=>{
                      document.getElementById("app").innerHTML = await this.renderizarLista();
                    },1500)
                    return true
               }else{
                    this.mensagem.erro("Erro ao tentar excluir!")
               }
            }
            if(e.target.classList.contains("close")){
                this.view.fecharModal();
            }
        })
        const formulario = document.getElementById('form-usuario');
        formulario.addEventListener('submit', async (event) =>{
            event.preventDefault();
            console.log(event)
            const id = document.getElementById('id');
            const nome = document.getElementById('nome');
            const idade = document.getElementById('idade');
            const usuario = {
                uuid: id.value,
                nome: nome.value,
                idade: idade.value
            }
            console.log(usuario)
            const resultado = await window.api.editarUsuario(usuario);
           if(resultado){
             nome.value = '';
             idade.value = '';
             this.mensagem.sucesso("Atualizado com sucesso!");
           }else{
             this.mensagem.erro("Erro ao atualizar!");
           }
            
        })


    }

}
export default UsuarioListar;