import Servicos from '../Models/Servicos.js';
class ServicoController{
    constructor(){
        this.ServicoModel = new Servicos();
    }
    listar(){
        return this.ServicoModel.listar();
    }

}
export default ServicoController;