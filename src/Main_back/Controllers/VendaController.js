import Vendas from '../Models/Vendas.js';
import ItensVenda from '../Models/ItensVenda.js';
import Itens from '../Models/Itens.js';

class VendaController {
    constructor() {
        this.vendas = new Vendas();
        this.itensVenda = new ItensVenda();
        this.itens = new Itens();
    }

    listar() {
        try {
            const data = this.vendas.listar();
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    listarPorPeriodo(dataInicio, dataFim) {
        try {
            const data = this.vendas.listarPorPeriodo(dataInicio, dataFim);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    buscarPorId(uuid) {
        try {
            const venda = this.vendas.buscarPorId(uuid);
            if (!venda) {
                return { success: false, error: 'Venda não encontrada' };
            }
            // Busca itens da venda
            venda.itens = this.itensVenda.listarPorVenda(venda.id);
            return { success: true, data: venda };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    criar(usuarioId) {
        try {
            const resultado = this.vendas.criar(usuarioId);
            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    adicionarItem(vendaId, itemUuid, quantidade = 1) {
        try {
            const item = this.itens.buscarPorId(itemUuid);
            if (!item) {
                return { success: false, error: 'Item não encontrado' };
            }
            if (item.estoque < quantidade) {
                return { success: false, error: 'Estoque insuficiente' };
            }

            const preco = item.preco_promocional || item.preco;
            const resultado = this.itensVenda.adicionar(vendaId, item.id, quantidade, preco);

            // Atualiza totais da venda
            this.vendas.atualizarTotais(vendaId);

            return { success: true, ...resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    removerItem(itemVendaId) {
        try {
            const resultado = this.itensVenda.remover(itemVendaId);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    atualizarQuantidadeItem(itemVendaId, novaQuantidade, vendaId) {
        try {
            const resultado = this.itensVenda.atualizarQuantidade(itemVendaId, novaQuantidade);
            // Atualiza totais
            this.vendas.atualizarTotais(vendaId);
            return { success: resultado !== false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    listarItens(vendaId) {
        try {
            const data = this.itensVenda.listarPorVenda(vendaId);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    finalizar(vendaUuid, formaPagamento, desconto = 0) {
        try {
            const venda = this.vendas.buscarPorId(vendaUuid);
            if (!venda) {
                return { success: false, error: 'Venda não encontrada' };
            }

            // Atualiza estoque
            const itensCarrinho = this.itensVenda.listarPorVenda(venda.id);
            for (const iv of itensCarrinho) {
                this.itens.decrementarEstoque(iv.item_uuid, iv.quantidade);
            }

            // Finaliza venda
            const resultado = this.vendas.finalizar(vendaUuid, formaPagamento, desconto);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    cancelar(vendaUuid) {
        try {
            const venda = this.vendas.buscarPorId(vendaUuid);
            if (!venda) {
                return { success: false, error: 'Venda não encontrada' };
            }

            // Se venda estava concluída, restaura estoque
            if (venda.status === 'concluida') {
                const itensCarrinho = this.itensVenda.listarPorVenda(venda.id);
                for (const iv of itensCarrinho) {
                    this.itens.incrementarEstoque(iv.item_uuid, iv.quantidade);
                }
            }

            const resultado = this.vendas.cancelar(vendaUuid);
            return { success: resultado };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    estatisticasHoje() {
        try {
            return this.vendas.estatisticasHoje();
        } catch (error) {
            return { total_vendas: 0, valor_total: 0, ticket_medio: 0, error: error.message };
        }
    }

    maisVendidos(limite = 10) {
        try {
            const data = this.itensVenda.maisVendidos(limite);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default VendaController;
