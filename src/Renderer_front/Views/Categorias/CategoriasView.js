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
                    <div class="card-body">
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Descrição</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-categorias">
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
        if (this.categorias.length === 0) {
            return '<tr><td colspan="4" class="text-center text-muted">Nenhuma categoria cadastrada</td></tr>';
        }

        return this.categorias.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td><strong>${cat.nome}</strong></td>
                <td>${cat.descricao || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline btn-editar" data-id="${cat.id}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-excluir" data-id="${cat.id}">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    setupEvents() {
        document.getElementById('btn-nova-categoria').addEventListener('click', () => this.abrirFormulario());

        document.getElementById('tabela-categorias').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const id = e.target.dataset.id;
                await this.abrirFormulario(id);
            } else if (e.target.classList.contains('btn-excluir')) {
                const id = e.target.dataset.id;
                await this.excluir(id);
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
            document.getElementById('tabela-categorias').innerHTML = this.renderTabela();
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
