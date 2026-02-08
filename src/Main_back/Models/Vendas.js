import db from '../Database/db.js';
import crypto from 'node:crypto';

class Vendas {
    constructor() { }

    listar() {
        const stmt = db.prepare(`
      SELECT v.*, u.nome as vendedor_nome
      FROM vendas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.excluido_em IS NULL
      ORDER BY v.data_venda DESC`);
        return stmt.all();
    }

    listarPorPeriodo(dataInicio, dataFim) {
        const stmt = db.prepare(`
      SELECT v.*, u.nome as vendedor_nome
      FROM vendas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.excluido_em IS NULL 
        AND DATE(v.data_venda) BETWEEN DATE(?) AND DATE(?)
      ORDER BY v.data_venda DESC`);
        return stmt.all(dataInicio, dataFim);
    }

    buscarPorId(uuid) {
        const stmt = db.prepare(`
      SELECT v.*, u.nome as vendedor_nome
      FROM vendas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.uuid = ? AND v.excluido_em IS NULL`);
        return stmt.get(uuid);
    }

    buscarPorIdInterno(id) {
        const stmt = db.prepare(`SELECT * FROM vendas WHERE id = ?`);
        return stmt.get(id);
    }

    criar(usuarioId) {
        const uuid = crypto.randomUUID();
        const stmt = db.prepare(`
      INSERT INTO vendas (uuid, usuario_id, status) VALUES (?, ?, 'aberta')`);
        const info = stmt.run(uuid, usuarioId);
        return { id: info.lastInsertRowid, uuid };
    }

    atualizarTotais(vendaId) {
        // Calcula subtotal dos itens
        const total = db.prepare(`
      SELECT COALESCE(SUM(quantidade * preco_unitario - desconto_item), 0) as subtotal
      FROM itens_venda WHERE venda_id = ?`).get(vendaId);

        const venda = this.buscarPorIdInterno(vendaId);
        const subtotal = total.subtotal;
        const totalFinal = subtotal - (venda.desconto || 0);

        const stmt = db.prepare(`UPDATE vendas SET subtotal = ?, total = ? WHERE id = ?`);
        stmt.run(subtotal, totalFinal, vendaId);

        return { subtotal, total: totalFinal };
    }

    finalizar(uuid, formaPagamento, desconto = 0) {
        const venda = this.buscarPorId(uuid);
        if (!venda) throw new Error('Venda não encontrada');
        if (venda.status !== 'aberta') throw new Error('Venda já finalizada ou cancelada');

        const totalFinal = venda.subtotal - desconto;

        const stmt = db.prepare(`UPDATE vendas SET 
      forma_pagamento = ?, desconto = ?, total = ?, status = 'concluida',
      atualizado_em = CURRENT_TIMESTAMP, sync_status = 0
      WHERE uuid = ?`);
        const info = stmt.run(formaPagamento, desconto, totalFinal, uuid);
        return info.changes > 0;
    }

    cancelar(uuid) {
        const stmt = db.prepare(`UPDATE vendas SET 
      status = 'cancelada', atualizado_em = CURRENT_TIMESTAMP, sync_status = 0
      WHERE uuid = ?`);
        const info = stmt.run(uuid);
        return info.changes > 0;
    }

    estatisticasHoje() {
        const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_vendas,
        COALESCE(SUM(total), 0) as valor_total
      FROM vendas 
      WHERE DATE(data_venda) = DATE('now') 
        AND status = 'concluida' 
        AND excluido_em IS NULL`);
        const resultado = stmt.get();
        resultado.ticket_medio = resultado.total_vendas > 0 ? resultado.valor_total / resultado.total_vendas : 0;
        return resultado;
    }
}

export default Vendas;
