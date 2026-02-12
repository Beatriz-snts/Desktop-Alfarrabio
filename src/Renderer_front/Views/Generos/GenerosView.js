// View de Gêneros - Sebo Alfarrabio PDV
class GenerosView {
    constructor() {
        this.generos = [];
        this.categorias = [];
    }

    async render() {
        try {
            const [genRes, catRes] = await Promise.all([
                window.generos.listar(),
                window.categorias.listar()
            ]);
            this.generos = genRes.data || [];
            this.categorias = catRes.data || [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }

        return `
            <div class="generos-page">
                <div class="card">
                    <div class="card-header">
                        <h3>📑 Gerenciar Gêneros</h3>
                        <button class="btn btn-primary" id="btn-novo-genero">+ Novo Gênero</button>
                    </div>
                    <div class="card-body" style="padding: 0;">
                        <div class="generos-grid" id="lista-generos">
                            ${this.renderGrid()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getEmoji(nome) {
        const n = nome.toLowerCase();
        if (n.includes('fantasia')) return '🧙‍♂️';
        if (n.includes('romance')) return '💖';
        if (n.includes('terror') || n.includes('horror')) return '👻';
        if (n.includes('ficsão') || n.includes('scifi')) return '🚀';
        if (n.includes('policial') || n.includes('crime')) return '🚓';
        if (n.includes('biografia')) return '📖';
        if (n.includes('história')) return '🏰';
        if (n.includes('acadêmico') || n.includes('didático')) return '🎓';
        if (n.includes('autoajuda')) return '🧘';
        if (n.includes('infantil') || n.includes('crianças')) return '🧸';
        if (n.includes('poesia')) return '📜';
        if (n.includes('drama')) return '🎭';
        if (n.includes('comédia') || n.includes('humor')) return '😂';
        if (n.includes('mistério')) return '🔍';
        if (n.includes('ação') || n.includes('aventura')) return '🤺';
        if (n.includes('religião') || n.includes('espiritual')) return '🙏';
        if (n.includes('culinária')) return '🍳';
        if (n.includes('esportes')) return '⚽';
        if (n.includes('tecnologia')) return '💻';
        if (n.includes('clássico')) return '🏛️';
        if (n.includes('documentário')) return '📽️';
        return '📚';
    }

    renderGrid() {
        if (this.generos.length === 0) {
            return '<div class="empty-state"><h3>🚫 Nenhum gênero encontrado</h3><p>Cadastre novos gêneros para organizar seu acervo.</p></div>';
        }

        return this.generos.map(gen => {
            const cat = this.categorias.find(c => c.id === gen.categoria_id);
            const emoji = this.getEmoji(gen.nome);
            return `
                <div class="genero-card">
                    <div class="genero-actions">
                        <button class="btn-icon-sm btn-editar" title="Editar" data-id="${gen.id}">✏️</button>
                        <button class="btn-icon-sm btn-danger btn-excluir" title="Excluir" data-id="${gen.id}">🗑️</button>
                    </div>
                    <div class="genero-emoji">${emoji}</div>
                    <div class="genero-name">${gen.nome}</div>
                    <div class="genero-category">${cat ? cat.nome : 'Sem Categoria'}</div>
                </div>
            `;
        }).join('');
    }

    setupEvents() {
        document.getElementById('btn-novo-genero').addEventListener('click', () => this.abrirFormulario());

        document.getElementById('lista-generos').addEventListener('click', async (e) => {
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
        let genero = { nome: '', categoria_id: '' };

        if (id) {
            genero = this.generos.find(g => g.id == id) || genero;
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${id ? '✏️ Editar Gênero' : '➕ Novo Gênero'}</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-genero">
                        <input type="hidden" id="gen-id" value="${id || ''}">
                        
                        <div class="form-group">
                            <label>Nome *</label>
                            <input type="text" class="form-control" id="gen-nome" value="${genero.nome}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Categoria</label>
                            <select class="form-control" id="gen-categoria">
                                <option value="">Selecione</option>
                                ${this.categorias.map(c =>
            `<option value="${c.id}" ${genero.categoria_id == c.id ? 'selected' : ''}>${c.nome}</option>`
        ).join('')}
                            </select>
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
        const id = document.getElementById('gen-id').value;

        const dados = {
            id: id ? parseInt(id) : undefined,
            nome: document.getElementById('gen-nome').value,
            categoria_id: document.getElementById('gen-categoria').value || null
        };

        if (!dados.nome) {
            alert('Preencha o nome');
            return;
        }

        try {
            if (id) {
                await window.generos.atualizar(dados);
            } else {
                await window.generos.cadastrar(dados);
            }

            document.getElementById('modal-container').classList.add('hidden');
            const genRes = await window.generos.listar();
            this.generos = genRes.data || [];
            document.getElementById('lista-generos').innerHTML = this.renderGrid();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    async excluir(id) {
        if (!confirm('Deseja excluir este gênero?')) return;

        try {
            await window.generos.remover(parseInt(id));
            const genRes = await window.generos.listar();
            this.generos = genRes.data || [];
            document.getElementById('tabela-generos').innerHTML = this.renderTabela();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

export default GenerosView;
