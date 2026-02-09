// View de Vendas - Sebo Alfarrabio PDV
class VendasView {
    constructor() {
        this.vendas = [];
    }

    async render() {
        try {
            const result = await window.vendas.listar();
            this.vendas = result.data || [];
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
        }

        return `
            <div class="vendas-page">
                <div class="card">
                    <div class="card-header">
                        <h3>💰 Histórico de Vendas</h3>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="date" class="form-control" id="data-inicio" style="width: auto;">
                            <input type="date" class="form-control" id="data-fim" style="width: auto;">
                            <button class="btn btn-primary" id="btn-filtrar">Filtrar</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Data</th>
                                        <th>Vendedor</th>
                                        <th>Total</th>
                                        <th>Pagamento</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-vendas">
                                    ${this.renderTabela()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTabela() {
        if (this.vendas.length === 0) {
            return '<tr><td colspan="7" class="text-center text-muted">Nenhuma venda encontrada</td></tr>';
        }

        return this.vendas.map(venda => {
            const data = new Date(venda.data_venda).toLocaleString('pt-BR');
            const statusClass = {
                'aberta': 'badge-warning',
                'concluida': 'badge-success',
                'cancelada': 'badge-danger'
            }[venda.status] || 'badge-info';

            const pagamentoIcon = {
                'dinheiro': '💵',
                'pix': '📱',
                'cartao_debito': '💳',
                'cartao_credito': '💳'
            }[venda.forma_pagamento] || '💰';

            return `
                <tr>
                    <td><code>${venda.uuid.substring(0, 8)}...</code></td>
                    <td>${data}</td>
                    <td>${venda.vendedor_nome || '-'}</td>
                    <td><strong>R$ ${(venda.total || 0).toFixed(2)}</strong></td>
                    <td>${pagamentoIcon} ${venda.forma_pagamento || '-'}</td>
                    <td><span class="badge ${statusClass}">${venda.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-detalhes" data-uuid="${venda.uuid}">👁️</button>
                        ${venda.status === 'concluida' ? `
                            <button class="btn btn-sm btn-danger btn-cancelar" data-uuid="${venda.uuid}">✕</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupEvents() {
        // Filtro por período
        document.getElementById('btn-filtrar').addEventListener('click', async () => {
            const inicio = document.getElementById('data-inicio').value;
            const fim = document.getElementById('data-fim').value;

            if (inicio && fim) {
                const result = await window.vendas.listarPorPeriodo(inicio, fim);
                this.vendas = result.data || [];
            } else {
                const result = await window.vendas.listar();
                this.vendas = result.data || [];
            }

            document.getElementById('tabela-vendas').innerHTML = this.renderTabela();
        });

        // Ações na tabela
        document.getElementById('tabela-vendas').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-detalhes')) {
                await this.verDetalhes(e.target.dataset.uuid);
            } else if (e.target.classList.contains('btn-cancelar')) {
                await this.cancelarVenda(e.target.dataset.uuid);
            }
        });
    }

    async verDetalhes(uuid) {
        const result = await window.vendas.buscarPorId(uuid);
        if (!result.success || !result.data) {
            alert('Erro ao carregar detalhes');
            return;
        }

        const venda = result.data;
        const itens = venda.itens || [];

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>📋 Detalhes da Venda</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <strong>ID:</strong> ${venda.uuid.substring(0, 8)}...
                        </div>
                        <div>
                            <strong>Data:</strong> ${new Date(venda.data_venda).toLocaleString('pt-BR')}
                        </div>
                        <div>
                            <strong>Vendedor:</strong> ${venda.vendedor_nome || '-'}
                        </div>
                        <div>
                            <strong>Status:</strong> ${venda.status}
                        </div>
                    </div>
                    
                    <h4 style="margin-bottom: 0.75rem;">Itens:</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd</th>
                                <th>Preço Un.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itens.map(item => `
                                <tr>
                                    <td>${item.nome}</td>
                                    <td>${item.quantidade}</td>
                                    <td>R$ ${item.preco_unitario.toFixed(2)}</td>
                                    <td>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <hr style="margin: 1rem 0;">
                    
                    <div style="text-align: right;">
                        <div>Subtotal: R$ ${(venda.subtotal || 0).toFixed(2)}</div>
                        <div>Desconto: R$ ${(venda.desconto || 0).toFixed(2)}</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--primary);">
                            Total: R$ ${(venda.total || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="btn-fechar">Fechar</button>
                </div>
            </div>
        `;

        document.getElementById('modal-close').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('btn-fechar').addEventListener('click', () => modal.classList.add('hidden'));
    }

    async cancelarVenda(uuid) {
        if (!confirm('Deseja cancelar esta venda? O estoque será restaurado.')) return;

        try {
            const result = await window.vendas.cancelar(uuid);
            if (result.success) {
                const vendasRes = await window.vendas.listar();
                this.vendas = vendasRes.data || [];
                document.getElementById('tabela-vendas').innerHTML = this.renderTabela();
            } else {
                alert('Erro: ' + result.error);
            }
        } catch (error) {
            alert('Erro ao cancelar: ' + error.message);
        }
    }
}

export default VendasView;
