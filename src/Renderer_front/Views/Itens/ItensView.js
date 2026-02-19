// View de Itens/Livros - Sebo Alfarrabio PDV
class ItensView {
    constructor() {
        this.itens = [];
        this.categorias = [];
        this.generos = [];
    }

    async render() {
        // Carregar dados
        try {
            const [itensRes, catRes, genRes] = await Promise.all([
                window.itens.listar(),
                window.categorias.listar(),
                window.generos.listar()
            ]);
            this.itens = itensRes.data || [];
            this.categorias = catRes.data || [];
            this.generos = genRes.data || [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }

        return `
            <div class="itens-page">
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div class="card-header">
                        <h3>📖 Gerenciar Itens / Livros</h3>
                        <button class="btn btn-primary" id="btn-novo-item">+ Novo Item</button>
                    </div>
                    <div class="card-body">
                        <div class="form-row" style="margin-bottom: 1rem;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <input type="text" class="form-control" id="busca-itens" placeholder="🔍 Buscar itens...">
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <select class="form-control" id="filtro-categoria">
                                    <option value="">Todas categorias</option>
                                    ${this.categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Capa</th>
                                        <th>Nome</th>
                                        <th>Autor</th>
                                        <th>Categoria</th>
                                        <th>Preço</th>
                                        <th>Estoque</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-itens">
                                    ${this.renderTabela()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderTabela(filtro = null) {
        let itens = this.itens;

        if (filtro) {
            itens = itens.filter(i =>
                i.nome.toLowerCase().includes(filtro.toLowerCase()) ||
                (i.autor && i.autor.toLowerCase().includes(filtro.toLowerCase()))
            );
        }

        if (itens.length === 0) {
            return '<tr><td colspan="7" class="text-center text-muted">Nenhum item encontrado</td></tr>';
        }

        return itens.map(item => `
            <tr>
                <td>
                    <div class="item-thumb-container">
                        ${item.imagem_path
                ? `<img src="${item.imagem_path}" class="item-thumb" alt="${item.nome}">`
                : '<div class="item-thumb-placeholder">📖</div>'}
                    </div>
                </td>
                <td><strong>${item.nome}</strong></td>
                <td>${item.autor || '-'}</td>
                <td><span class="badge badge-info">${item.categoria_nome || '-'}</span></td>
                <td>R$ ${item.preco.toFixed(2)}</td>
                <td>
                    <span class="badge ${item.estoque <= item.estoque_minimo ? 'badge-danger' : 'badge-success'}">
                        ${item.estoque}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline btn-editar" data-uuid="${item.uuid}">✏️</button>
                    <button class="btn btn-sm btn-danger btn-excluir" data-uuid="${item.uuid}">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    setupEvents() {
        // Busca
        const buscaInput = document.getElementById('busca-itens');
        buscaInput.addEventListener('input', (e) => {
            document.getElementById('tabela-itens').innerHTML = this.renderTabela(e.target.value);
        });

        // Filtro categoria
        const filtroCategoria = document.getElementById('filtro-categoria');
        filtroCategoria.addEventListener('change', async (e) => {
            const catId = e.target.value;
            if (catId) {
                const result = await window.itens.filtrarPorCategoria(parseInt(catId));
                this.itens = result.data || [];
            } else {
                const result = await window.itens.listar();
                this.itens = result.data || [];
            }
            document.getElementById('tabela-itens').innerHTML = this.renderTabela();
        });

        // Novo item
        document.getElementById('btn-novo-item').addEventListener('click', () => this.abrirFormulario());

        // Editar/Excluir
        document.getElementById('tabela-itens').addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-editar')) {
                const uuid = e.target.dataset.uuid;
                await this.abrirFormulario(uuid);
            } else if (e.target.classList.contains('btn-excluir')) {
                const uuid = e.target.dataset.uuid;
                await this.excluirItem(uuid);
            }
        });
    }

    async abrirFormulario(uuid = null) {
        let item = { nome: '', autor: '', editora: '', isbn: '', descricao: '', preco: '', categoria_id: '', genero_id: '', estoque: 0 };

        if (uuid) {
            const result = await window.itens.buscarPorId(uuid);
            if (result.data) item = result.data;
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>${uuid ? '✏️ Editar Item' : '➕ Novo Item'}</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <form id="form-item">
                        <input type="hidden" id="item-uuid" value="${uuid || ''}">
                        <input type="hidden" id="item-imagem-path" value="${item.imagem_path || ''}">
                        <input type="hidden" id="item-preco-promocional" value="${item.preco_promocional || ''}">
                        <input type="hidden" id="item-estoque-minimo" value="${item.estoque_minimo || ''}">
                        
                        <!-- Preview da Capa -->
                        <div class="form-row" style="margin-bottom: 1.5rem; display: flex; justify-content: center;">
                            <div class="item-form-preview" style="text-align: center;">
                                <div class="item-thumb-container" style="width: 120px; height: 160px; margin: 0 auto 0.5rem;">
                                    ${item.imagem_path
                ? `<img src="${item.imagem_path}" class="item-thumb" id="preview-img">`
                : '<div class="item-thumb-placeholder" style="font-size: 3rem;" id="preview-placeholder">📖</div>'}
                                </div>
                                <button type="button" class="btn btn-sm btn-outline" id="btn-alterar-foto" style="margin-bottom: 0.5rem;">📷 Alterar Foto</button>
                                <br>
                                <small class="text-muted">Capa do Livro</small>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Nome *</label>
                                <input type="text" class="form-control" id="item-nome" value="${item.nome}" required>
                            </div>
                            <div class="form-group">
                                <label>Autor</label>
                                <input type="text" class="form-control" id="item-autor" value="${item.autor || ''}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Editora</label>
                                <input type="text" class="form-control" id="item-editora" value="${item.editora || ''}">
                            </div>
                            <div class="form-group">
                                <label>ISBN</label>
                                <input type="text" class="form-control" id="item-isbn" value="${item.isbn || ''}">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea class="form-control" id="item-descricao" rows="3">${item.descricao || ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Categoria</label>
                                <select class="form-control" id="item-categoria">
                                    <option value="">Selecione</option>
                                    ${this.categorias.map(c =>
                    `<option value="${c.id}" ${item.categoria_id == c.id ? 'selected' : ''}>${c.nome}</option>`
                ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gênero</label>
                                <select class="form-control" id="item-genero">
                                    <option value="">Selecione</option>
                                    ${this.generos.map(g =>
                    `<option value="${g.id}" ${item.genero_id == g.id ? 'selected' : ''}>${g.nome}</option>`
                ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Preço (R$) *</label>
                                <input type="number" class="form-control" id="item-preco" value="${item.preco}" step="0.01" min="0" required>
                            </div>
                            <div class="form-group">
                                <label>Estoque *</label>
                                <input type="number" class="form-control" id="item-estoque" value="${item.estoque || 0}" min="0" required>
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
        document.getElementById('btn-salvar').addEventListener('click', () => this.salvarItem());

        // Alterar Foto
        document.getElementById('btn-alterar-foto').addEventListener('click', async () => {
            console.log('Botão Alterar Foto clicado');
            try {
                const base64Image = await window.itens.selecionarImagem();
                console.log('Imagem base64 retornada:', base64Image ? `${base64Image.substring(0, 50)}...` : null);
                if (base64Image) {
                    // Atualizar hidden input com a string base64
                    document.getElementById('item-imagem-path').value = base64Image;

                    // Atualizar preview usando a data URI diretamente
                    const container = document.querySelector('.item-thumb-container');
                    container.innerHTML = `<img src="${base64Image}" class="item-thumb" id="preview-img">`;
                }
            } catch (error) {
                console.error('Erro ao selecionar imagem:', error);
                alert('Erro ao selecionar imagem: ' + error.message);
            }
        });
    }

    async salvarItem() {
        const uuid = document.getElementById('item-uuid').value;

        const dados = {
            uuid: uuid || undefined,
            nome: document.getElementById('item-nome').value,
            autor: document.getElementById('item-autor').value,
            editora: document.getElementById('item-editora').value,
            isbn: document.getElementById('item-isbn').value,
            descricao: document.getElementById('item-descricao').value,
            categoria_id: document.getElementById('item-categoria').value || null,
            genero_id: document.getElementById('item-genero').value || null,
            preco: parseFloat(document.getElementById('item-preco').value),
            estoque: parseInt(document.getElementById('item-estoque').value),
            imagem_path: document.getElementById('item-imagem-path').value || null,
            preco_promocional: document.getElementById('item-preco-promocional').value ? parseFloat(document.getElementById('item-preco-promocional').value) : null,
            estoque_minimo: document.getElementById('item-estoque-minimo').value ? parseInt(document.getElementById('item-estoque-minimo').value) : null
        };

        if (!dados.nome || !dados.preco) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        try {
            let result;
            if (uuid) {
                result = await window.itens.atualizar(dados);
            } else {
                result = await window.itens.cadastrar(dados);
            }

            if (result.success !== false) {
                document.getElementById('modal-container').classList.add('hidden');
                // Recarregar lista
                const itensRes = await window.itens.listar();
                this.itens = itensRes.data || [];
                document.getElementById('tabela-itens').innerHTML = this.renderTabela();
            } else {
                alert('Erro: ' + result.error);
            }
        } catch (error) {
            alert('Erro ao salvar: ' + error.message);
        }
    }

    async excluirItem(uuid) {
        if (!confirm('Deseja realmente excluir este item?')) return;

        try {
            const result = await window.itens.remover(uuid);
            if (result) {
                const itensRes = await window.itens.listar();
                this.itens = itensRes.data || [];
                document.getElementById('tabela-itens').innerHTML = this.renderTabela();
            }
        } catch (error) {
            alert('Erro ao excluir: ' + error.message);
        }
    }
}

export default ItensView;
