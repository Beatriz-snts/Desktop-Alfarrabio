class Usuarios {
  constructor() {
    this.Usuarios = [
      {"nome": "jose", "idade": 26},
      {"nome": "maria", "idade": 35},
    ];
  }
  adicionar(usuario) {
    this.Usuarios.push(usuario);
  }
  listar() {
    return this.Usuarios;
  }
  remover(usuario) {
    const index = this.Usuarios.indexOf(usuario);
    if (index !== -1) {
      this.Usuarios.splice(index, 1);
    }
  }
}
export default Usuarios;