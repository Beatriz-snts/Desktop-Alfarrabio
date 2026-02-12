// View do PDV (Caixa) - Sebo Alfarrabio
class PDVView {
    constructor() {
        this.carrinho = [];
        this.vendaAtual = null;
        this.categorias = [];
        this.categoriaAtiva = null;
    }

    async render() {
        // Carregar categorias
        try {
            const catResult = await window.categorias.listar();
            this.categorias = catResult.data || [];
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }

        return `
            <div class="pdv-container">
                <!-- Área de Produtos -->
                <div class="pdv-products">
                    <div class="pdv-search">
                        <input type="text" class="search-input" id="pdv-search" 
                               placeholder="🔍 Buscar por nome, autor ou ISBN...">
                        <button class="btn btn-primary" id="btn-buscar">Buscar</button>
                    </div>
                    
                    <div class="pdv-filters" id="pdv-filters">
                        <button class="filter-btn active" data-cat="all">Todos</button>
                        ${this.categorias.map(cat => `
                            <button class="filter-btn" data-cat="${cat.id}">${cat.nome}</button>
                        `).join('')}
                    </div>
                    
                    <div class="products-grid" id="products-grid">
                        <div class="loading">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Carrinho -->
                <div class="pdv-cart">
                    <div class="cart-header">
                        <h3>🛒 Carrinho de Compras</h3>
                    </div>
                    
                    <div class="cart-items" id="cart-items">
                        <div class="cart-empty">
                            <div class="cart-empty-icon">🛒</div>
                            <p>Carrinho vazio</p>
                            <p>Clique nos produtos para adicionar</p>
                        </div>
                    </div>
                    
                    <div class="cart-summary" id="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span id="subtotal">R$ 0,00</span>
                        </div>
                        <div class="summary-row">
                            <span>Desconto:</span>
                            <span id="desconto">R$ 0,00</span>
                        </div>
                        <div class="summary-row total">
                            <span>TOTAL:</span>
                            <span id="total">R$ 0,00</span>
                        </div>
                    </div>
                    
                    <div class="cart-actions">
                        <button class="btn btn-outline" id="btn-limpar">🗑️ Limpar</button>
                        <button class="btn btn-success" id="btn-finalizar">💳 Finalizar</button>
                    </div>
                </div>
            </div>
        `;
    }

    async setupEvents() {
        if (this.eventsSetup) return;
        this.eventsSetup = true;

        await this.carregarProdutos();

        // Busca
        const searchInput = document.getElementById('pdv-search');
        const btnBuscar = document.getElementById('btn-buscar');

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarProdutos(searchInput.value);
        });

        btnBuscar.addEventListener('click', () => {
            this.buscarProdutos(searchInput.value);
        });

        // Filtros de categoria
        const filters = document.getElementById('pdv-filters');
        filters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const catId = e.target.dataset.cat;
                this.filtrarPorCategoria(catId);
            }
        });

        // Grid de produtos
        const grid = document.getElementById('products-grid');
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.pdv-card');
            if (card) {
                const uuid = card.dataset.uuid;
                this.adicionarAoCarrinho(uuid);
            }
        });

        // Carrinho
        document.getElementById('btn-limpar').addEventListener('click', () => this.limparCarrinho());
        document.getElementById('btn-finalizar').addEventListener('click', () => this.finalizarVenda());

        // Eventos do carrinho (delegação)
        document.getElementById('cart-items').addEventListener('click', (e) => {
            const item = e.target.closest('.cart-item');
            if (!item) return;

            const index = parseInt(item.dataset.index);

            if (e.target.classList.contains('qty-minus')) {
                this.alterarQuantidade(index, -1);
            } else if (e.target.classList.contains('qty-plus')) {
                this.alterarQuantidade(index, 1);
            } else if (e.target.classList.contains('cart-item-remove')) {
                this.removerDoCarrinho(index);
            }
        });
    }

    async carregarProdutos() {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const result = await window.itens.listarDisponiveis();
            const produtos = result.data || [];
            this.renderizarProdutos(produtos);
        } catch (error) {
            grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar produtos</p></div>';
        }
    }

    async buscarProdutos(termo) {
        if (!termo.trim()) {
            return this.carregarProdutos();
        }

        const grid = document.getElementById('products-grid');
        grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            const result = await window.itens.buscar(termo);
            const produtos = result.data || [];
            this.renderizarProdutos(produtos);
        } catch (error) {
            grid.innerHTML = '<div class="empty-state"><p>Erro na busca</p></div>';
        }
    }

    async filtrarPorCategoria(catId) {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        try {
            let result;
            if (catId === 'all') {
                result = await window.itens.listarDisponiveis();
            } else {
                result = await window.itens.filtrarPorCategoria(parseInt(catId));
            }
            const produtos = result.data || [];
            this.renderizarProdutos(produtos);
        } catch (error) {
            grid.innerHTML = '<div class="empty-state"><p>Erro ao filtrar</p></div>';
        }
    }

    renderizarProdutos(produtos) {
        const grid = document.getElementById('products-grid');

        if (produtos.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente outra busca ou categoria</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = produtos.map(p => {
            const titulo = p.titulo || p.nome || 'Sem título';
            const preco = parseFloat(p.preco) || 0;
            const imagemPath = p.imagem_path;

            return `
                <div class="pdv-card" data-uuid="${p.uuid}">
                    <div class="pdv-card-image-container">
                        ${imagemPath
                    ? `<img src="${imagemPath}" alt="${titulo}" class="pdv-card-img">`
                    : `<div class="pdv-card-placeholder">📖</div>`
                }
                    </div>
                    <div class="pdv-card-info">
                        <h3>${titulo}</h3>
                        <p class="pdv-card-price">R$ ${preco.toFixed(2)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    async adicionarAoCarrinho(uuid) {
        try {
            const result = await window.itens.buscarPorId(uuid);
            if (!result.success) {
                this.showToast('Produto não encontrado', 'error');
                return;
            }

            const produto = result.data;

            // Verificar se já está no carrinho
            const itemExistente = this.carrinho.find(i => i.uuid === uuid);
            if (itemExistente) {
                itemExistente.quantidade++;
            } else {
                this.carrinho.push({
                    uuid: produto.uuid,
                    nome: produto.titulo || produto.nome,
                    preco: parseFloat(produto.preco),
                    quantidade: 1
                });
            }

            this.atualizarCarrinho();
            this.showToast('Item adicionado ao carrinho', 'success');
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            this.showToast('Erro ao adicionar item', 'error');
        }
    }

    alterarQuantidade(index, delta) {
        this.carrinho[index].quantidade += delta;

        if (this.carrinho[index].quantidade <= 0) {
            this.carrinho.splice(index, 1);
        }

        this.atualizarCarrinho();
    }

    removerDoCarrinho(index) {
        this.carrinho.splice(index, 1);
        this.atualizarCarrinho();
    }

    limparCarrinho() {
        if (this.carrinho.length === 0) return;

        if (confirm('Limpar todo o carrinho?')) {
            this.carrinho = [];
            this.atualizarCarrinho();
            this.showToast('Carrinho limpo', 'info');
        }
    }

    atualizarCarrinho() {
        const cartItems = document.getElementById('cart-items');
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');

        if (this.carrinho.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <p>Carrinho vazio</p>
                    <p>Clique nos produtos para adicionar</p>
                </div>
            `;
            subtotalEl.textContent = 'R$ 0,00';
            totalEl.textContent = 'R$ 0,00';
            return;
        }

        const subtotal = this.carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

        cartItems.innerHTML = this.carrinho.map((item, index) => {
            const itemTotal = item.preco * item.quantidade;

            return `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">📖</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.nome}</div>
                        <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn qty-minus">−</button>
                        <span>${item.quantidade}</span>
                        <button class="qty-btn qty-plus">+</button>
                    </div>
                    <div class="cart-item-total">R$ ${itemTotal.toFixed(2)}</div>
                    <span class="cart-item-remove">✕</span>
                </div>
            `;
        }).join('');

        subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    }

    async finalizarVenda() {
        if (this.carrinho.length === 0) {
            this.showToast('Carrinho vazio!', 'warning');
            return;
        }

        // Criar modal de finalização
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        const subtotal = this.carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>💳 Finalizar Venda</h3>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Forma de Pagamento</label>
                        <select class="form-control" id="forma-pagamento">
                            <option value="dinheiro">💵 Dinheiro</option>
                            <option value="pix">📱 PIX</option>
                            <option value="cartao_debito">💳 Cartão de Débito</option>
                            <option value="cartao_credito">💳 Cartão de Crédito</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Desconto (R$)</label>
                        <input type="number" class="form-control" id="desconto-valor" value="0" min="0" step="0.01">
                    </div>
                    
                    <div class="form-group" id="troco-group" style="display: none;">
                        <label>Valor Recebido (R$)</label>
                        <input type="number" class="form-control" id="valor-recebido" step="0.01">
                        <p style="margin-top: 0.5rem; color: var(--primary); font-weight: bold;">
                            Troco: <span id="troco-valor">R$ 0,00</span>
                        </p>
                    </div>
                    
                    <hr style="margin: 1rem 0;">
                    
                    <div class="summary-row total">
                        <span>TOTAL A PAGAR:</span>
                        <span id="modal-total">R$ ${subtotal.toFixed(2)}</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="btn-cancelar-venda">Cancelar</button>
                    <button class="btn btn-success" id="btn-confirmar-venda">✓ Confirmar Venda</button>
                </div>
            </div>
        `;

        // Eventos do modal
        document.getElementById('modal-close').addEventListener('click', () => modal.classList.add('hidden'));
        document.getElementById('btn-cancelar-venda').addEventListener('click', () => modal.classList.add('hidden'));

        // Mostrar troco se dinheiro
        const formaPag = document.getElementById('forma-pagamento');
        const trocoGroup = document.getElementById('troco-group');
        formaPag.addEventListener('change', () => {
            trocoGroup.style.display = formaPag.value === 'dinheiro' ? 'block' : 'none';
        });

        // Calcular troco
        const valorRecebido = document.getElementById('valor-recebido');
        const trocoValor = document.getElementById('troco-valor');
        const descontoInput = document.getElementById('desconto-valor');
        const modalTotal = document.getElementById('modal-total');

        const calcularTotal = () => {
            const desconto = parseFloat(descontoInput.value) || 0;
            const total = subtotal - desconto;
            modalTotal.textContent = `R$ ${total.toFixed(2)}`;

            if (formaPag.value === 'dinheiro') {
                const recebido = parseFloat(valorRecebido.value) || 0;
                const troco = recebido - total;
                trocoValor.textContent = `R$ ${Math.max(0, troco).toFixed(2)}`;
            }
        };

        descontoInput.addEventListener('input', calcularTotal);
        valorRecebido.addEventListener('input', calcularTotal);

        // Confirmar venda
        document.getElementById('btn-confirmar-venda').addEventListener('click', async () => {
            await this.processarVenda(formaPag.value, parseFloat(descontoInput.value) || 0);
            modal.classList.add('hidden');
        });
    }

    async processarVenda(formaPagamento, desconto) {
        try {
            // Verificar sessão
            const sessao = await window.auth.verificar();
            if (!sessao.logado) {
                this.showToast('Sessão expirada. Faça login novamente.', 'error');
                return;
            }

            // Criar venda
            const vendaCriada = await window.vendas.criar(sessao.usuario.id);
            if (!vendaCriada.success) {
                this.showToast('Erro ao criar venda', 'error');
                return;
            }

            const vendaId = vendaCriada.id;

            // Adicionar itens
            for (const item of this.carrinho) {
                const result = await window.vendas.adicionarItem(vendaId, item.uuid, item.quantidade);
                if (!result.success) {
                    this.showToast(`Erro ao adicionar ${item.nome}: ${result.error}`, 'error');
                    return;
                }
            }

            // Finalizar venda
            const finalizado = await window.vendas.finalizar(vendaCriada.uuid, formaPagamento, desconto);

            if (finalizado.success) {
                this.showToast('Venda finalizada com sucesso!', 'success');
                this.carrinho = [];
                this.atualizarCarrinho();
                await this.carregarProdutos(); // Atualizar estoque
            } else {
                this.showToast(`Erro: ${finalizado.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao processar venda:', error);
            this.showToast('Erro ao processar venda', 'error');
        }
    }

    showToast(message, type = 'info') {
        // Criar container de toasts se não existir
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <span class="toast-close">✕</span>
        `;

        container.appendChild(toast);

        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

        setTimeout(() => toast.remove(), 3000);
    }
}

export default PDVView;