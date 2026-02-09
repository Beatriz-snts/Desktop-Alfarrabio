import db from '../Database/db.js';

class Autores {
    listar() {
        return db.prepare('SELECT * FROM autores WHERE excluido_em IS NULL ORDER BY nome ASC').all();
    }

    buscarPorId(id) {
        return db.prepare('SELECT * FROM autores WHERE id = ?').get(id);
    }

    buscarPorRemoteId(remoteId) {
        return db.prepare('SELECT * FROM autores WHERE remote_id = ?').get(remoteId);
    }

    adicionar(autor) {
        const stmt = db.prepare(`
            INSERT INTO autores (remote_id, nome, biografia, sync_status)
            VALUES (?, ?, ?, ?)
        `);
        const info = stmt.run(autor.remote_id || null, autor.nome, autor.biografia || null, autor.sync_status || 0);
        return { id: info.lastInsertRowid };
    }

    atualizar(autor) {
        const stmt = db.prepare(`
            UPDATE autores 
            SET nome = ?, biografia = ?, sync_status = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        return stmt.run(autor.nome, autor.biografia || null, autor.sync_status || 0, autor.id).changes > 0;
    }

    remover(id) {
        const stmt = db.prepare('UPDATE autores SET excluido_em = CURRENT_TIMESTAMP WHERE id = ?');
        return stmt.run(id).changes > 0;
    }
}

export default Autores;
