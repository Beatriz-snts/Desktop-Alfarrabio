// View de Autores - Sebo Alfarrabio PDV
class AutoresView {
    constructor() {
        this.autores = [];
    }

    async render() {
        try {
            // Corrigido: Usando a ponte window.autores.listar() que está no preload.js
            const res = await window.autores.listar();
            this.autores = res.data || [];
        } catch (error) {
            console.error('Erro ao buscar autores:', error);
            this.autores = [];
        }

        const htmlAutores = this.autores.length > 0
            ? this.autores.map(autor => `
                <div class="autor-card ${autor.remote_id ? 'sync' : 'local'}" title="${autor.biografia || 'Sem biografia disponível'}">
                    <div class="autor-actions">
                        <button class="btn-icon-sm" title="Editar" onclick="alert('Editar: ${autor.nome}')">✏️</button>
                        ${!autor.remote_id ? `<button class="btn-icon-sm" title="Excluir" onclick="alert('Excluir: ${autor.nome}')">🗑️</button>` : ''}
                    </div>
                    <div class="autor-name">${autor.nome}</div>
                    <div class="text-muted" style="font-size: 0.75rem;">
                        ${autor.remote_id ? '🌟 Sincronizado' : '📝 Local'}
                    </div>
                </div>
            `).join('')
            : '<div class="empty-state"><h3>🚫 Nenhum autor encontrado</h3><p>Tente buscar por outro nome ou importe via sincronização.</p></div>';

        return `
            <div class="autores-page">
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>✍️ Gerenciar Autores</h3>
                        <div style="display: flex; gap: 1rem;">
                            <input type="text" class="form-control" id="buscar-autores" placeholder="🔍 Buscar autores..." style="width: 250px;">
                            <button class="btn btn-primary" id="btn-novo-autor">+ Novo Autor</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="autores-grid" id="lista-autores">
                            ${htmlAutores}
                        </div>
                    </div>
                </div>
            </div>
        `;

    }

    setupEvents() {
        document.getElementById('btn-novo-autor')?.addEventListener('click', () => {
            alert('Funcionalidade de cadastro manual de autores será implementada na próxima versão. Use a Sincronização para importar autores do site.');
        });

        document.getElementById('buscar-autores')?.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.autor-card');
            cards.forEach(card => {
                const texto = card.textContent.toLowerCase();
                card.style.display = texto.includes(termo) ? 'flex' : 'none';
            });
        });
    }
}

export default AutoresView;
