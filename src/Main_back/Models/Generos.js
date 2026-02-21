import db from '../Database/db.js';

class Generos {
    constructor() { }

    listar() {
        const stmt = db.prepare(`
      SELECT g.*, c.nome as categoria_nome 
      FROM generos g
      LEFT JOIN categorias c ON g.categoria_id = c.id
      WHERE g.excluido_em IS NULL 
      ORDER BY g.nome`);
        return stmt.all();
    }

    listarPorCategoria(categoriaId) {
        const stmt = db.prepare(`
      SELECT * FROM generos 
      WHERE categoria_id = ? AND excluido_em IS NULL 
      ORDER BY nome`);
        return stmt.all(categoriaId);
    }

    buscarPorId(id) {
        const stmt = db.prepare(`SELECT * FROM generos WHERE id = ? AND excluido_em IS NULL`);
        return stmt.get(id);
    }

    adicionar(genero) {
        const stmt = db.prepare(`INSERT INTO generos (nome, categoria_id, sync_status) VALUES (?, ?, 0)`);
        const info = stmt.run(genero.nome, genero.categoria_id || null);
        return { id: info.lastInsertRowid };
    }

    atualizar(genero) {
        const stmt = db.prepare(`UPDATE generos SET 
      nome = ?, categoria_id = ?, atualizado_em = CURRENT_TIMESTAMP, sync_status = 0 
      WHERE id = ?`);
        const info = stmt.run(genero.nome, genero.categoria_id || null, genero.id);
        return info.changes > 0;
    }

    remover(id) {
        const stmt = db.prepare(`UPDATE generos SET excluido_em = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?`);
        const info = stmt.run(id);
        return info.changes > 0;
    }
}

export default Generos;
