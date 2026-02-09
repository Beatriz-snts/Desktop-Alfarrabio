// View de Dashboard - Sebo Alfarrabio PDV
class DashboardView {
    constructor() { }

    async render() {
        // Buscar estatísticas
        let stats = { total_vendas: 0, valor_total: 0, ticket_medio: 0 };
        let estoqueBaixo = [];
        let maisVendidos = [];

        try {
            stats = await window.vendas.estatisticasHoje();
            const estoqueBaixoResult = await window.itens.estoqueBaixo();
            estoqueBaixo = estoqueBaixoResult.data || [];
            const maisVendidosResult = await window.vendas.maisVendidos(5);
            maisVendidos = maisVendidosResult.data || [];
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }

        return `
            <div class="dashboard">
                <!-- Stats Cards -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon vendas">💰</div>
                        <div class="stat-content">
                            <h4>Vendas Hoje</h4>
                            <div class="stat-value">${stats.total_vendas || 0}</div>
                            <div class="stat-change positive">vendas realizadas</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon receita">💵</div>
                        <div class="stat-content">
                            <h4>Receita do Dia</h4>
                            <div class="stat-value">R$ ${(stats.valor_total || 0).toFixed(2)}</div>
                            <div class="stat-change">faturamento total</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon ticket">🎫</div>
                        <div class="stat-content">
                            <h4>Ticket Médio</h4>
                            <div class="stat-value">R$ ${(stats.ticket_medio || 0).toFixed(2)}</div>
                            <div class="stat-change">por venda</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon estoque">📦</div>
                        <div class="stat-content">
                            <h4>Estoque Baixo</h4>
                            <div class="stat-value">${estoqueBaixo.length}</div>
                            <div class="stat-change ${estoqueBaixo.length > 0 ? 'negative' : ''}">itens para repor</div>
                        </div>
                    </div>
                </div>
                
                <!-- Ações Rápidas -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div class="card-header">
                        <h3>⚡ Ações Rápidas</h3>
                    </div>
                    <div class="card-body" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <a href="#pdv" class="btn btn-primary btn-lg">🛒 Abrir Caixa (PDV)</a>
                        <a href="#itens" class="btn btn-secondary">📖 Cadastrar Item</a>
                        <a href="#vendas" class="btn btn-outline">📋 Ver Vendas</a>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <!-- Mais Vendidos -->
                    <div class="card">
                        <div class="card-header">
                            <h3>🏆 Mais Vendidos</h3>
                        </div>
                        <div class="card-body">
                            ${maisVendidos.length > 0 ? `
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${maisVendidos.map(item => `
                                            <tr>
                                                <td>${item.nome}</td>
                                                <td><span class="badge badge-success">${item.total_vendido}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : `
                                <div class="empty-state">
                                    <div class="empty-state-icon">📊</div>
                                    <p>Nenhuma venda ainda hoje</p>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Estoque Baixo -->
                    <div class="card">
                        <div class="card-header">
                            <h3>⚠️ Estoque Baixo</h3>
                        </div>
                        <div class="card-body">
                            ${estoqueBaixo.length > 0 ? `
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Estoque</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${estoqueBaixo.slice(0, 5).map(item => `
                                            <tr>
                                                <td>${item.nome}</td>
                                                <td><span class="badge badge-danger">${item.estoque}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : `
                                <div class="empty-state">
                                    <div class="empty-state-icon">✅</div>
                                    <p>Estoque em dia!</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents() {
        // Eventos do dashboard se necessário
    }
}

export default DashboardView;
