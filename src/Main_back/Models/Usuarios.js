class Usuarios {
  constructor() {
    this.Usuarios = [
      {"id": 1,"nome": "jose", "idade": 26},
      {"id": 2,"nome": "maria", "idade": 35},
      {"id": 3,"nome": "xssss", "idade": 15},
    ];
  }
  adicionar(usuario) {
    this.Usuarios.push(usuario);
  }
  async listar() {
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