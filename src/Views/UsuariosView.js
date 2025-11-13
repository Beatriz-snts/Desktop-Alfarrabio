import Usuarios from '../Controllers/Usuarios.js';
class UsuariosView{
    constructor(){
        this.Usuarios = new Usuarios();
    }
    renderizar(){
        const Usuarios = this.Usuarios.listar();
        const container = document.createElement('div');
        container.classList.add('Usuarios-container');
        Usuarios.forEach(usuario => {
            container.innerHTML += `<div> ${usuario.nome} - ${usuario.idade} </div><br/>`
        });
        return container.innerHTML;
    }
}
export default UsuariosView;