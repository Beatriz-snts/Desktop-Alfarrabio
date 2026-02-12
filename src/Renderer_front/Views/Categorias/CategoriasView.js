// View de Categorias - Sebo Alfarrabio PDV
class CategoriasView {
    constructor() {
        this.categorias = [];
    }

    async render() {
        try {
            const result = await window.categorias.listar();
            this.categorias = result.data || [];
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }

        return `
            <div class="categorias-page">
                <div class="card">
                    <div class="card-header">
                        <h3>🏷️ Gerenciar Categorias</h3>
                        <button class="btn btn-primary" id="btn-nova-categoria">+ Nova Categoria</button>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="categorias-grid" id="lista-categorias">
                            ${this.renderGrid()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEmoji(nome) {
        const n = nome.toLowerCase();
        if (n.includes('livro')) return '📚';
        if (n.includes('revista')) return '📰';
        if (n.includes('papelaria')) return '✏️';
        if (n.includes('quadrinho') || n.includes('hq') || n.includes('manga')) return '💥';
        if (n.includes('disco') || n.includes('vinil') || n.includes('cd')) return '💿';
        if (n.includes('jogo') || n.includes('game')) return '🎮';
        if (n.includes('acessório')) return '🎒';
        if (n.includes('colecionável')) return '💎';
        if (n.includes('didático')) return '🎓';
        if (n.includes('rara') || n.includes('antigo')) return '🏺';
        return '🏷️';
    }

    renderGrid() {
        if (this.categorias.length === 0) {
            return '<div class="empty-state"><h3>🚫 Nenhuma categoria encontrada</h3><p>Cadastre novas categorias para organizar seus itens.</p></div>';
        }

        return this.categorias.map(cat => {
            const emoji = this.getEmoji(cat.nome);
            return `
                <div class="categoria-card">
                    <div class="categoria-actions">
                        <button class="btn-icon-sm btn-editar" title="Editar" data-id="${cat.id}">✏️</button>
                        <button class="btn-icon-sm btn-danger btn-excluir" title="Excluir" data-id="${cat.id}">🗑️</button>
                    </div>
                    <div class="categoria-emoji">${emoji}</div>
                    <div class="categoria-name">${cat.nome}</div>
                    <div class="categoria-desc">${cat.descricao || '-'}</div>
                </div>
            `;
        }).join('');
    }

    setupEvents() {
        document.getElementById('btn-nova-categoria').addEventListener('click', () => this.abrirFormulario());

        document.getElementById('lista-categorias').addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('.btn-editar');
            const btnExcluir = e.target.closest('.btn-excluir');

            if (btnEditar) {
                await this.abrirFormulario(btnEditar.dataset.id);
            } else if (btnExcluir) {
                await this.excluir(btnExcluir.dataset.id);
            }
        });
    }

    async abrirFormulario(id = null) {
        let categoria = { nome: '', descricao: '' };

        if (id) {
            const result = await window.categorias.buscarPorId(parseInt(id));
            if (result.data) categoria = result.data;
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${id ? '✏️ Editar Categoria' : '➕ Nova Categoria'}</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-categoria">
                        <input type="hidden" id="cat-id" value="${id || ''}">
                        
                        <div class="form-group">
                            <label>Nome *</label>
                            <input type="text" class="form-control" id="cat-nome" value="${categoria.nome}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea class="form-control" id="cat-descricao">${categoria.descricao || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="btn-cancelar">Cancelar</button>
                    <button class="btn btn-primary" id="btn-salvar">💾 Salvar</button>
                </div>
            </div>
        `;

        document.getElementById('modal-close').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('btn-cancelar').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('btn-salvar').addEventListener('click', () => this.salvar());
    }

    async salvar() {
        const id = document.getElementById('cat-id').value;

        const dados = {
            id: id ? parseInt(id) : undefined,
            nome: document.getElementById('cat-nome').value,
            descricao: document.getElementById('cat-descricao').value
        };

        if (!dados.nome) {
            alert('Preencha o nome');
            return;
        }

        try {
            let result;
            if (id) {
                result = await window.categorias.atualizar(dados);
            } else {
                result = await window.categorias.cadastrar(dados);
            }

            document.getElementById('modal-container').classList.add('hidden');
            const catRes = await window.categorias.listar();
            this.categorias = catRes.data || [];
            document.getElementById('lista-categorias').innerHTML = this.renderGrid();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    async excluir(id) {
        if (!confirm('Deseja excluir esta categoria?')) return;

        try {
            await window.categorias.remover(parseInt(id));
            const catRes = await window.categorias.listar();
            this.categorias = catRes.data || [];
            document.getElementById('tabela-categorias').innerHTML = this.renderTabela();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

export default CategoriasView;
