import Swal from 'sweetalert2'
class MensagemDeAlerta{
    constructor(){
        this.alerta = Swal
    }
    sucesso(mensagem="Cadastrado com sucesso!"){
        this.alerta.fire({
            position: "top-end",
            icon: "success",
            title: mensagem,
            showConfirmButton: false,
            timer: 1500
        });
    }
    erro(mensagem="Preencha todos os campos!"){
        this.alerta.fire({
            position: "top-end",
            icon: "error",
            title: mensagem,
            showConfirmButton: false,
            timer: 1500
        });
    }
}
export default MensagemDeAlerta;