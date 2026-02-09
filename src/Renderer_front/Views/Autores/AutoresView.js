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
                <tr>
                    <td>${autor.nome}</td>
                    <td><div class="text-truncate" style="max-width: 300px;">${autor.biografia || '---'}</div></td>
                    <td>${autor.remote_id ? `<span class="badge badge-success">Sincronizado (#${autor.remote_id})</span>` : '<span class="badge">Local</span>'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-icon" onclick="alert('Funcionalidade em desenvolvimento')">✏️</button>
                            ${!autor.remote_id ? `<button class="btn-icon text-danger" onclick="alert('Funcionalidade em desenvolvimento')">🗑️</button>` : ''}
                        </div>
                    </td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="text-center">Nenhum autor encontrado</td></tr>';

        return `
            <div class="autores-page">
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3>✍️ Gerenciar Autores</h3>
                        <button class="btn btn-primary" id="btn-novo-autor">+ Novo Autor</button>
                    </div>
                    <div class="card-body">
                        <div class="filters" style="margin-bottom: 1rem;">
                            <input type="text" class="form-control" id="buscar-autores" placeholder="Buscar autores...">
                        </div>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Biografia</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="lista-autores">
                                    ${htmlAutores}
                                </tbody>
                            </table>
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
            const linhas = document.querySelectorAll('#lista-autores tr');
            linhas.forEach(linha => {
                const texto = linha.textContent.toLowerCase();
                linha.style.display = texto.includes(termo) ? '' : 'none';
            });
        });
    }
}

export default AutoresView;
