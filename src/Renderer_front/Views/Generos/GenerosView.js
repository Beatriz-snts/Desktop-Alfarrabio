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
                    <div class="card-body">
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Categoria</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-generos">
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
        if (this.generos.length === 0) {
            return '<tr><td colspan="4" class="text-center text-muted">Nenhum gênero cadastrado</td></tr>';
        }

        return this.generos.map(gen => {
            const cat = this.categorias.find(c => c.id === gen.categoria_id);
            return `
                <tr>
                    <td>${gen.id}</td>
                    <td><strong>${gen.nome}</strong></td>
                    <td><span class="badge badge-info">${cat ? cat.nome : '-'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-editar" data-id="${gen.id}">✏️</button>
                        <button class="btn btn-sm btn-danger btn-excluir" data-id="${gen.id}">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    setupEvents() {
        document.getElementById('btn-novo-genero').addEventListener('click', () => this.abrirFormulario());

        document.getElementById('tabela-generos').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-editar')) {
                await this.abrirFormulario(e.target.dataset.id);
            } else if (e.target.classList.contains('btn-excluir')) {
                await this.excluir(e.target.dataset.id);
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
            document.getElementById('tabela-generos').innerHTML = this.renderTabela();
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
