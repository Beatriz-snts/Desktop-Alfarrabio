// View de Sincronização - Sebo Alfarrabio PDV
class SyncView {
    constructor() {
        this.statusSync = null;
    }

    async render() {
        // Buscar status atual
        try {
            this.statusSync = await window.sync.status();
        } catch (error) {
            console.error('Erro ao obter status:', error);
        }

        const ultimoSync = this.statusSync?.ultimoSync
            ? new Date(this.statusSync.ultimoSync).toLocaleString('pt-BR')
            : 'Nunca sincronizado';

        return `
            <div class="sync-page">
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div class="card-header">
                        <h3>🔄 Sincronização com Servidor</h3>
                    </div>
                    <div class="card-body">
                        <div class="sync-status-panel" style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <strong>Status:</strong>
                                    <span id="sync-status" class="badge ${this.statusSync?.emAndamento ? 'badge-warning' : 'badge-success'}">
                                        ${this.statusSync?.emAndamento ? '⏳ Em andamento' : '✅ Pronto'}
                                    </span>
                                </div>
                                <div>
                                    <strong>Última Sincronização:</strong>
                                    <span id="ultimo-sync">${ultimoSync}</span>
                                </div>
                            </div>
                        </div>

                        <div class="sync-config" style="margin-bottom: 1.5rem;">
                            <h4 style="margin-bottom: 1rem;">⚙️ Configuração da API</h4>
                            <div class="form-group">
                                <label>URL Base da API:</label>
                                <input type="text" class="form-control" id="api-url" 
                                       value="https://seboalfarrabio.com.br/backend/api" 
                                       placeholder="https://seboalfarrabio.com.br/backend/api">
                            </div>
                        </div>

                        <div class="sync-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <button class="btn btn-outline" id="btn-testar">🔌 Testar Conexão</button>
                            <button class="btn btn-primary" id="btn-importar">📥 Importar Dados</button>
                            <button class="btn btn-outline" id="btn-exportar-itens">📤 Exportar Itens</button>
                            <button class="btn btn-secondary" id="btn-exportar">📤 Exportar Vendas</button>
                            <button class="btn btn-success" id="btn-sync-completo">🔄 Sync Completo</button>
                        </div>

                        <div id="sync-log" style="margin-top: 1.5rem; display: none;">
                            <h4 style="margin-bottom: 0.75rem;">📋 Log de Sincronização</h4>
                            <div id="log-content" style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.875rem; max-height: 300px; overflow-y: auto;">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>📊 Estatísticas de Dados</h3>
                    </div>
                    <div class="card-body">
                        <div id="sync-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                            <div class="stat-card">
                                <div class="stat-value" id="stat-categorias">-</div>
                                <div class="stat-label">Categorias</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-generos">-</div>
                                <div class="stat-label">Gêneros</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-autores">-</div>
                                <div class="stat-label">Autores</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-itens">-</div>
                                <div class="stat-label">Itens</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value" id="stat-vendas-pendentes">-</div>
                                <div class="stat-label">Vendas Pendentes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEvents() {
        this.carregarEstatisticas();

        // Testar conexão
        document.getElementById('btn-testar').addEventListener('click', async () => {
            this.log('Testando conexão...');
            const result = await window.sync.testar();
            if (result.success) {
                this.log('✅ ' + result.message, 'success');
            } else {
                this.log('❌ ' + result.message, 'error');
            }
        });

        // Importar dados
        document.getElementById('btn-importar').addEventListener('click', async () => {
            this.log('Iniciando importação...');
            this.setLoading(true);

            try {
                this.log('📥 Importando categorias...');
                const cat = await window.sync.importarCategorias();
                this.log(`  → ${cat.importados || 0} categorias`, cat.success ? 'success' : 'error');

                this.log('📥 Importando gêneros...');
                const gen = await window.sync.importarGeneros();
                this.log(`  → ${gen.importados || 0} gêneros`, gen.success ? 'success' : 'error');

                this.log('📥 Importando autores...');
                const aut = await window.sync.importarAutores();
                this.log(`  → ${aut.importados || 0} autores`, aut.success ? 'success' : 'error');

                this.log('📥 Importando itens...');
                const itens = await window.sync.importarItens();
                this.log(`  → ${itens.importados || 0} itens`, itens.success ? 'success' : 'error');

                this.log('✅ Importação concluída!', 'success');
                this.carregarEstatisticas();
            } catch (error) {
                this.log('❌ Erro: ' + error.message, 'error');
            }

            this.setLoading(false);
        });

        // Exportar itens
        document.getElementById('btn-exportar-itens').addEventListener('click', async () => {
            this.log('Exportando itens pendentes...');
            this.setLoading(true);

            try {
                const result = await window.sync.exportarItens();
                if (result.success) {
                    this.log(`✅ ${result.exportados} itens sincronizados`, 'success');
                    if (result.falhas > 0) {
                        this.log(`⚠️ ${result.falhas} itens falharam (verifique o console)`, 'warning');
                    }
                } else {
                    this.log('❌ ' + result.error, 'error');
                }
            } catch (error) {
                this.log('❌ Erro: ' + error.message, 'error');
            }

            this.setLoading(false);
            this.carregarEstatisticas();
        });

        // Exportar vendas
        document.getElementById('btn-exportar').addEventListener('click', async () => {
            this.log('Exportando vendas pendentes...');
            this.setLoading(true);

            try {
                const result = await window.sync.exportarVendas();
                if (result.success) {
                    this.log(`✅ ${result.exportados} vendas exportadas`, 'success');
                } else {
                    this.log('❌ ' + result.error, 'error');
                }
            } catch (error) {
                this.log('❌ Erro: ' + error.message, 'error');
            }

            this.setLoading(false);
        });

        // Sync completo
        document.getElementById('btn-sync-completo').addEventListener('click', async () => {
            if (!confirm('Executar sincronização completa? Isso pode demorar alguns minutos.')) return;

            this.log('🔄 Iniciando sincronização completa...');
            this.setLoading(true);

            try {
                const result = await window.sync.sincronizarTudo();

                if (result.success) {
                    this.log('📊 Resultados:', 'info');
                    if (result.resultados.categorias) {
                        this.log(`  Categorias: ${result.resultados.categorias.importados || 0}`);
                    }
                    if (result.resultados.generos) {
                        this.log(`  Gêneros: ${result.resultados.generos.importados || 0}`);
                    }
                    if (result.resultados.autores) {
                        this.log(`  Autores: ${result.resultados.autores.importados || 0}`);
                    }
                    if (result.resultados.itens) {
                        this.log(`  Itens: ${result.resultados.itens.importados || 0}`);
                    }
                    if (result.resultados.vendas) {
                        this.log(`  Vendas exportadas: ${result.resultados.vendas.exportados || 0}`);
                    }
                    this.log('✅ Sincronização concluída!', 'success');

                    // Atualizar último sync
                    document.getElementById('ultimo-sync').textContent =
                        new Date(result.ultimoSync).toLocaleString('pt-BR');
                } else {
                    this.log('❌ ' + (result.message || result.error), 'error');
                }

                this.carregarEstatisticas();
            } catch (error) {
                this.log('❌ Erro: ' + error.message, 'error');
            }

            this.setLoading(false);
        });
    }

    log(message, type = 'info') {
        const logContainer = document.getElementById('sync-log');
        const logContent = document.getElementById('log-content');

        logContainer.style.display = 'block';

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const colorMap = {
            'success': 'var(--success)',
            'error': 'var(--danger)',
            'info': 'var(--text-secondary)'
        };

        logContent.innerHTML += `<div style="color: ${colorMap[type] || 'inherit'}">[${timestamp}] ${message}</div>`;
        logContent.scrollTop = logContent.scrollHeight;
    }

    setLoading(loading) {
        const buttons = document.querySelectorAll('.sync-actions button');
        buttons.forEach(btn => {
            btn.disabled = loading;
        });

        document.getElementById('sync-status').innerHTML = loading
            ? '⏳ Em andamento'
            : '✅ Pronto';
        document.getElementById('sync-status').className = `badge ${loading ? 'badge-warning' : 'badge-success'}`;
    }

    async carregarEstatisticas() {
        try {
            const stats = await window.sync.estatisticas();

            document.getElementById('stat-categorias').textContent = stats.categorias || 0;
            document.getElementById('stat-generos').textContent = stats.generos || 0;
            document.getElementById('stat-autores').textContent = stats.autores || 0;
            document.getElementById('stat-itens').textContent = stats.itens || 0;
            document.getElementById('stat-vendas-pendentes').textContent = stats.vendasPendentes || 0;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }
}

export default SyncView;
