class Servicos {
  constructor() {
    this.servicos = [
      {"nome": "pintura", "preço": 1500},
      {"nome": "reforma de banheiro", "preço": 5000},
    ];
  }
  adicionar(servico) {
    this.servicos.push(servico);
  }
  listar() {
    return this.servicos;
  }
  remover(servico) {
    const index = this.servicos.indexOf(servico);
    if (index !== -1) {
      this.servicos.splice(index, 1);
    }
  }
}
export default Servicos;