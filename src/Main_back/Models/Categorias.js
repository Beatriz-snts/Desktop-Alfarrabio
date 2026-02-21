import db from '../Database/db.js';

class Categorias {
    constructor() { }

    listar() {
        const stmt = db.prepare(`SELECT * FROM categorias WHERE excluido_em IS NULL ORDER BY nome`);
        return stmt.all();
    }

    buscarPorId(id) {
        const stmt = db.prepare(`SELECT * FROM categorias WHERE id = ? AND excluido_em IS NULL`);
        return stmt.get(id);
    }

    adicionar(categoria) {
        const stmt = db.prepare(`INSERT INTO categorias (nome, descricao, sync_status) VALUES (?, ?, 0)`);
        const info = stmt.run(categoria.nome, categoria.descricao || null);
        return { id: info.lastInsertRowid };
    }

    atualizar(categoria) {
        const stmt = db.prepare(`UPDATE categorias SET 
      nome = ?, descricao = ?, atualizado_em = CURRENT_TIMESTAMP, sync_status = 0 
      WHERE id = ?`);
        const info = stmt.run(categoria.nome, categoria.descricao || null, categoria.id);
        return info.changes > 0;
    }

    remover(id) {
        // Verifica se há itens vinculados
        const itens = db.prepare(`SELECT COUNT(*) as count FROM itens WHERE categoria_id = ? AND excluido_em IS NULL`).get(id);
        if (itens.count > 0) {
            throw new Error('Categoria possui itens vinculados');
        }

        const stmt = db.prepare(`UPDATE categorias SET excluido_em = CURRENT_TIMESTAMP, sync_status = 0 WHERE id = ?`);
        const info = stmt.run(id);
        return info.changes > 0;
    }
}

export default Categorias;
