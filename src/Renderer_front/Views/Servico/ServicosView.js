class ServicosView{
    constructor(servicos){
        this.servicos = servicos;
    }
    renderizar(){
        const servicos = this.servicos.listar();
        let container ='<div class="container">';
        servicos.forEach(servico => {
            container += `<div> ${servico.nome} - ${servico.preço} </div><br/>`
        });
        container += '</div>';
        return container;
    }
}
export default ServicosView;