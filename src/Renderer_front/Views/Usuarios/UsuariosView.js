// View de Usuários - Sebo Alfarrabio PDV
class UsuariosView {
    constructor() {
        this.usuarios = [];
    }

    async render() {
        try {
            const result = await window.usuarios.listar();
            this.usuarios = result.data || [];
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }

        return `
            <div class="usuarios-page">
                <div class="card">
                    <div class="card-header">
                        <h3>👥 Gerenciar Usuários</h3>
                        <button class="btn btn-primary" id="btn-novo-usuario">+ Novo Usuário</button>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Função</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-usuarios">
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
        if (this.usuarios.length === 0) {
            return '<tr><td colspan="5" class="text-center text-muted">Nenhum usuário cadastrado</td></tr>';
        }

        return this.usuarios.map(user => `
            <tr>
                <td><strong>${user.nome}</strong></td>
                <td>${user.email}</td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'badge-warning' : 'badge-info'}">
                        ${user.role === 'admin' ? '👑 Admin' : '🛒 Vendedor'}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.status === 'ativo' ? 'badge-success' : 'badge-danger'}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline btn-editar" data-uuid="${user.uuid}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-excluir" data-uuid="${user.uuid}">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    setupEvents() {
        document.getElementById('btn-novo-usuario').addEventListener('click', () => this.abrirFormulario());

        document.getElementById('tabela-usuarios').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-editar')) {
                await this.abrirFormulario(e.target.dataset.uuid);
            } else if (e.target.classList.contains('btn-excluir')) {
                await this.excluir(e.target.dataset.uuid);
            }
        });
    }

    async abrirFormulario(uuid = null) {
        let usuario = { nome: '', email: '', role: 'vendedor', status: 'ativo' };

        if (uuid) {
            const result = await window.usuarios.buscarPorId(uuid);
            if (result.data) usuario = result.data;
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${uuid ? '✏️ Editar Usuário' : '➕ Novo Usuário'}</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-usuario">
                        <input type="hidden" id="user-uuid" value="${uuid || ''}">
                        
                        <div class="form-group">
                            <label>Nome *</label>
                            <input type="text" class="form-control" id="user-nome" value="${usuario.nome}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" class="form-control" id="user-email" value="${usuario.email}" required>
                        </div>
                        
                        ${!uuid ? `
                            <div class="form-group">
                                <label>Senha *</label>
                                <input type="password" class="form-control" id="user-senha" required>
                            </div>
                        ` : ''}
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Função</label>
                                <select class="form-control" id="user-role">
                                    <option value="vendedor" ${usuario.role === 'vendedor' ? 'selected' : ''}>🛒 Vendedor</option>
                                    <option value="admin" ${usuario.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select class="form-control" id="user-status">
                                    <option value="ativo" ${usuario.status === 'ativo' ? 'selected' : ''}>Ativo</option>
                                    <option value="inativo" ${usuario.status === 'inativo' ? 'selected' : ''}>Inativo</option>
                                </select>
                            </div>
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
        const uuid = document.getElementById('user-uuid').value;

        const dados = {
            uuid: uuid || undefined,
            nome: document.getElementById('user-nome').value,
            email: document.getElementById('user-email').value,
            role: document.getElementById('user-role').value,
            status: document.getElementById('user-status').value
        };

        if (!uuid) {
            dados.senha = document.getElementById('user-senha').value;
            if (!dados.senha) {
                alert('Informe a senha');
                return;
            }
        }

        if (!dados.nome || !dados.email) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        try {
            if (uuid) {
                await window.usuarios.atualizar(dados);
            } else {
                await window.usuarios.cadastrar(dados);
            }

            document.getElementById('modal-container').classList.add('hidden');
            const usersRes = await window.usuarios.listar();
            this.usuarios = usersRes.data || [];
            document.getElementById('tabela-usuarios').innerHTML = this.renderTabela();
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    async excluir(uuid) {
        if (!confirm('Deseja excluir este usuário?')) return;

        try {
            await window.usuarios.remover(uuid);
            const usersRes = await window.usuarios.listar();
            this.usuarios = usersRes.data || [];
            document.getElementById('tabela-usuarios').innerHTML = this.renderTabela();
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

export default UsuariosView;
