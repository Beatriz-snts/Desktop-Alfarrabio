class UsuariosView{
    constructor(){
    }
    renderizarMenu(){
        return `<div class="container">
                    <ul>
                        <li><a href="#usuario_criar">Criar Usuário</a></li>
                        <li><a href="#usuario_listar">Listar Usuários</a></li>
                    </ul>
                </div>`;
    }



    renderizarLista(Usuarios){
        let container = `<div style="overflow-x:auto;">
                            <table>
                            <tr>
                              <th>Nome</th><th>Idade</th><th>ações</th>
                            </tr>`;
        Usuarios.forEach(usuario => { // data = atributto
            container += `<tr><td> ${usuario.nome} </td><td> ${usuario.idade} </td><td> 
            <button id="editar-user" data-id="${usuario.id}">Editar</button>
            <button id="excluir-user" data-id="${usuario.id}">Excluir</button> </td><tr>`
        });
        container += '</table></div>';
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