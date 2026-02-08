import db from '../Database/db.js';
import crypto from 'node:crypto';

class Itens {
    constructor() { }

    listar() {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome, g.nome as genero_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      LEFT JOIN generos g ON i.genero_id = g.id
      WHERE i.excluido_em IS NULL
      ORDER BY i.nome`);
        return stmt.all();
    }

    listarDisponiveis() {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome, g.nome as genero_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      LEFT JOIN generos g ON i.genero_id = g.id
      WHERE i.excluido_em IS NULL AND i.estoque > 0
      ORDER BY i.nome`);
        return stmt.all();
    }

    buscarPorId(uuid) {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome, g.nome as genero_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      LEFT JOIN generos g ON i.genero_id = g.id
      WHERE i.uuid = ? AND i.excluido_em IS NULL`);
        return stmt.get(uuid);
    }

    buscar(termo) {
        const likeTermo = `%${termo}%`;
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      WHERE i.excluido_em IS NULL
        AND (i.nome LIKE ? OR i.autor LIKE ? OR i.isbn LIKE ?)
      ORDER BY i.nome`);
        return stmt.all(likeTermo, likeTermo, likeTermo);
    }

    filtrarPorCategoria(categoriaId) {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      WHERE i.excluido_em IS NULL AND i.categoria_id = ?
      ORDER BY i.nome`);
        return stmt.all(categoriaId);
    }

    filtrarPorGenero(generoId) {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome, g.nome as genero_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      LEFT JOIN generos g ON i.genero_id = g.id
      WHERE i.excluido_em IS NULL AND i.genero_id = ?
      ORDER BY i.nome`);
        return stmt.all(generoId);
    }

    buscarEstoqueBaixo() {
        const stmt = db.prepare(`
      SELECT i.*, c.nome as categoria_nome
      FROM itens i
      LEFT JOIN categorias c ON i.categoria_id = c.id
      WHERE i.excluido_em IS NULL AND i.estoque <= i.estoque_minimo
      ORDER BY i.estoque ASC`);
        return stmt.all();
    }

    adicionar(item) {
        const uuid = crypto.randomUUID();
        const stmt = db.prepare(`
      INSERT INTO itens (uuid, nome, autor, editora, isbn, descricao, preco, preco_promocional, 
        categoria_id, genero_id, imagem_path, estoque, estoque_minimo, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`);
        const info = stmt.run(
            uuid,
            item.nome,
            item.autor || null,
            item.editora || null,
            item.isbn || null,
            item.descricao || null,
            item.preco,
            item.preco_promocional || null,
            item.categoria_id || null,
            item.genero_id || null,
            item.imagem_path || null,
            item.estoque || 0,
            item.estoque_minimo || 5
        );
        return { id: info.lastInsertRowid, uuid };
    }

    atualizar(item) {
        const stmt = db.prepare(`UPDATE itens SET 
      nome = ?, autor = ?, editora = ?, isbn = ?, descricao = ?, preco = ?, preco_promocional = ?,
      categoria_id = ?, genero_id = ?, imagem_path = ?, estoque = ?, estoque_minimo = ?,
      atualizado_em = CURRENT_TIMESTAMP, sync_status = 0 
      WHERE uuid = ?`);
        const info = stmt.run(
            item.nome,
            item.autor || null,
            item.editora || null,
            item.isbn || null,
            item.descricao || null,
            item.preco,
            item.preco_promocional || null,
            item.categoria_id || null,
            item.genero_id || null,
            item.imagem_path || null,
            item.estoque,
            item.estoque_minimo || 5,
            item.uuid
        );
        return info.changes > 0;
    }

    atualizarEstoque(uuid, quantidade) {
        const item = this.buscarPorId(uuid);
        if (!item) return false;

        const novoEstoque = item.estoque + quantidade;
        if (novoEstoque < 0) {
            throw new Error('Estoque insuficiente');
        }

        const stmt = db.prepare(`UPDATE itens SET 
      estoque = ?, atualizado_em = CURRENT_TIMESTAMP, sync_status = 0 
      WHERE uuid = ?`);
        const info = stmt.run(novoEstoque, uuid);
        return info.changes > 0;
    }

    decrementarEstoque(uuid, quantidade) {
        return this.atualizarEstoque(uuid, -quantidade);
    }

    incrementarEstoque(uuid, quantidade) {
        return this.atualizarEstoque(uuid, quantidade);
    }

    remover(uuid) {
        const stmt = db.prepare(`UPDATE itens SET excluido_em = CURRENT_TIMESTAMP, sync_status = 0 WHERE uuid = ?`);
        const info = stmt.run(uuid);
        return info.changes > 0;
    }
}

export default Itens;
