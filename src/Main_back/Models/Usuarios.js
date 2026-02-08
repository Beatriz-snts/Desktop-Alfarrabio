import db from '../Database/db.js';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

class Usuarios {
  constructor() { }

  async adicionar(usuario) {
    const uuid = crypto.randomUUID();
    const senhaHash = await bcrypt.hash(usuario.senha, 10);
    const stmt = db.prepare(`
      INSERT INTO usuarios (uuid, nome, email, senha, role, status, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      uuid,
      usuario.nome,
      usuario.email,
      senhaHash,
      usuario.role || 'vendedor',
      usuario.status || 'ativo',
      0
    );
    return { id: info.lastInsertRowid, uuid };
  }

  listar() {
    const stmt = db.prepare(`SELECT id, uuid, nome, email, role, status, criado_em, atualizado_em 
      FROM usuarios WHERE excluido_em IS NULL`);
    return stmt.all();
  }

  buscarPorId(uuid) {
    const stmt = db.prepare(`SELECT id, uuid, nome, email, role, status, criado_em 
      FROM usuarios WHERE uuid = ? AND excluido_em IS NULL`);
    return stmt.get(uuid);
  }

  buscarPorEmail(email) {
    const stmt = db.prepare(`SELECT * FROM usuarios WHERE email = ? AND excluido_em IS NULL`);
    return stmt.get(email);
  }

  async validarLogin(email, senha) {
    const usuario = this.buscarPorEmail(email);
    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    if (usuario.status !== 'ativo') {
      return { success: false, error: 'Usuário inativo' };
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return { success: false, error: 'Senha incorreta' };
    }
    // Retorna sem a senha
    const { senha: _, ...usuarioSemSenha } = usuario;
    return { success: true, usuario: usuarioSemSenha };
  }

  async atualizar(usuarioAtualizado) {
    let sql = `UPDATE usuarios SET 
       nome = ?,
       email = ?,
       role = ?,
       status = ?,
       atualizado_em = CURRENT_TIMESTAMP,
       sync_status = 0 
       WHERE uuid = ?`;
    let params = [
      usuarioAtualizado.nome,
      usuarioAtualizado.email,
      usuarioAtualizado.role,
      usuarioAtualizado.status,
      usuarioAtualizado.uuid
    ];

    // Se senha foi informada, atualiza também
    if (usuarioAtualizado.senha && usuarioAtualizado.senha.length >= 6) {
      const senhaHash = await bcrypt.hash(usuarioAtualizado.senha, 10);
      sql = `UPDATE usuarios SET 
        nome = ?, email = ?, senha = ?, role = ?, status = ?,
        atualizado_em = CURRENT_TIMESTAMP, sync_status = 0 
        WHERE uuid = ?`;
      params = [
        usuarioAtualizado.nome,
        usuarioAtualizado.email,
        senhaHash,
        usuarioAtualizado.role,
        usuarioAtualizado.status,
        usuarioAtualizado.uuid
      ];
    }

    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return info.changes > 0;
  }

  remover(uuid) {
    const stmt = db.prepare(`UPDATE usuarios SET excluido_em = CURRENT_TIMESTAMP, sync_status = 0
      WHERE uuid = ?`);
    const info = stmt.run(uuid);
    return info.changes > 0;
  }
}

export default Usuarios;