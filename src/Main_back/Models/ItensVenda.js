import db from '../Database/db.js';

class ItensVenda {
    constructor() { }

    listarPorVenda(vendaId) {
        const stmt = db.prepare(`
      SELECT iv.*, i.nome as item_nome, i.uuid as item_uuid
      FROM itens_venda iv
      JOIN itens i ON iv.item_id = i.id
      WHERE iv.venda_id = ?
      ORDER BY iv.criado_em`);
        return stmt.all(vendaId);
    }

    buscarItem(vendaId, itemId) {
        const stmt = db.prepare(`SELECT * FROM itens_venda WHERE venda_id = ? AND item_id = ?`);
        return stmt.get(vendaId, itemId);
    }

    buscarPorId(id) {
        const stmt = db.prepare(`SELECT * FROM itens_venda WHERE id = ?`);
        return stmt.get(id);
    }

    adicionar(vendaId, itemId, quantidade, precoUnitario) {
        // Verifica se já existe, se sim, incrementa
        const existente = this.buscarItem(vendaId, itemId);
        if (existente) {
            return this.atualizarQuantidade(existente.id, existente.quantidade + quantidade);
        }

        const stmt = db.prepare(`
      INSERT INTO itens_venda (venda_id, item_id, quantidade, preco_unitario) 
      VALUES (?, ?, ?, ?)`);
        const info = stmt.run(vendaId, itemId, quantidade, precoUnitario);
        return { id: info.lastInsertRowid };
    }

    atualizarQuantidade(id, novaQuantidade) {
        if (novaQuantidade <= 0) {
            return this.remover(id);
        }
        const stmt = db.prepare(`UPDATE itens_venda SET quantidade = ? WHERE id = ?`);
        const info = stmt.run(novaQuantidade, id);
        return info.changes > 0;
    }

    remover(id) {
        const stmt = db.prepare(`DELETE FROM itens_venda WHERE id = ?`);
        const info = stmt.run(id);
        return info.changes > 0;
    }

    calcularTotal(vendaId) {
        const stmt = db.prepare(`
      SELECT COALESCE(SUM(quantidade * preco_unitario), 0) as total
      FROM itens_venda WHERE venda_id = ?`);
        return stmt.get(vendaId).total;
    }

    maisVendidos(limite = 10) {
        const stmt = db.prepare(`
      SELECT i.id, i.nome, i.autor, SUM(iv.quantidade) as total_vendido,
             SUM(iv.quantidade * iv.preco_unitario) as valor_total
      FROM itens_venda iv
      JOIN itens i ON iv.item_id = i.id
      JOIN vendas v ON iv.venda_id = v.id
      WHERE v.status = 'concluida'
      GROUP BY i.id
      ORDER BY total_vendido DESC
      LIMIT ?`);
        return stmt.all(limite);
    }
}

export default ItensVenda;
