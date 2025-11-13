import Servicos from '../Controllers/Servicos.js';
class ServicosView{
    constructor(){
        this.servicos = new Servicos();
    }
    renderizar(){
        const servicos = this.servicos.listar();
        const container = document.createElement('div');
        container.classList.add('servicos-container');
        servicos.forEach(servico => {
            container.innerHTML += `<div> ${servico.nome} - ${servico.preço} </div><br/>`
        });
        return container.innerHTML;
    }
}
export default ServicosView;