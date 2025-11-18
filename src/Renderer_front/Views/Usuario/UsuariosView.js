class UsuariosView{
    constructor(){
    }
    renderizarLista(Usuarios){
        let container ='<div class="container">';
        Usuarios.forEach(usuario => {
            container += `<div> ${usuario.nome} - ${usuario.idade} </div><br/>`
        });
        container += '</div>';
        return container;
    }
    renderizarFomulario(){
        return `<form id="form-usuario">
                    <label>Nome:</label>
                    <input type="text" id="nome"/>
                    <label>Idade:</label>
                    <input type="number" id="idade"/>
                    <button>Salvar</button>
                </form>`

    }
}
export default UsuariosView;