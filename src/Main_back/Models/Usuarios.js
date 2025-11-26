import db from '../Database/db.js';
import crypto from 'node:crypto';
class Usuarios {
  constructor() {}
  adicionar(usuario) {
    const uuid = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO usuarios (uuid, nome, idade, sync_status)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(
      uuid,
      usuario.nome,
      usuario.idade,
      0
    );
    return info.lastInsertRowid;
  }
  async listar() {
    const stmt = db.prepare(`SELECT * FROM usuarios WHERE excluido_em IS NULL`);
    return stmt.all();
  }
  async buscarPorId(uuid){
    console.log(uuid);
    const stmt = db.prepare(`SELECT * FROM usuarios WHERE uuid = ? AND excluido_em IS NULL`);
    return stmt.get(uuid);
  }
  async atualizar(usuarioAtualizado){
    console.log('atualizar no model', usuarioAtualizado);
    const stmt = db.prepare(`UPDATE usuarios 
       SET nome = ?,
       idade = ?,
       atualizado_em = CURRENT_TIMESTAMP,
       sync_status = 0 
       WHERE uuid = ?`
      );
    const info = stmt.run(
      usuarioAtualizado.nome,
      usuarioAtualizado.idade,
      usuarioAtualizado.uuid
    );
    return info.changes;
   
  }

 async remover(usuario) {
    const stmt = db.prepare(`UPDATE usuarios SET excluido_em = CURRENT_TIMESTAMP, sync_status = 0
      WHERE uuid = ?`);
    const info = stmt.run(usuario.uuid);
    //ternario
    return info.changes > 0 ? true : false;
  }
}
export default Usuarios;