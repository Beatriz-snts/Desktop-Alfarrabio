// Sistema de Rotas - Sebo Alfarrabio PDV
import LoginView from "../Views/Login/LoginView.js";
import DashboardView from "../Views/Dashboard/DashboardView.js";
import PDVView from "../Views/PDV/PDVView.js";
import ItensView from "../Views/Itens/ItensView.js";
import CategoriasView from "../Views/Categorias/CategoriasView.js";
import GenerosView from "../Views/Generos/GenerosView.js";
import VendasView from "../Views/Vendas/VendasView.js";
import UsuariosView from "../Views/Usuarios/UsuariosView.js";
import SyncView from "../Views/Sync/SyncView.js";
import AutoresView from "../Views/Autores/AutoresView.js";

class Rotas {
    constructor() {
        this.rotaAtual = null;
        this.viewAtual = null;

        this.rotas = {
            "/login": {
                view: LoginView,
                titulo: "Login",
                requireAuth: false
            },
            "/dashboard": {
                view: DashboardView,
                titulo: "Dashboard",
                requireAuth: true
            },
            "/pdv": {
                view: PDVView,
                titulo: "PDV - Caixa",
                requireAuth: true
            },
            "/itens": {
                view: ItensView,
                titulo: "Itens / Livros",
                requireAuth: true
            },
            "/categorias": {
                view: CategoriasView,
                titulo: "Categorias",
                requireAuth: true
            },
            "/generos": {
                view: GenerosView,
                titulo: "Gêneros",
                requireAuth: true
            },
            "/vendas": {
                view: VendasView,
                titulo: "Vendas",
                requireAuth: true
            },
            "/usuarios": {
                view: UsuariosView,
                titulo: "Usuários",
                requireAuth: true,
                requireAdmin: true
            },
            "/autores": {
                view: AutoresView,
                titulo: "Autores",
                requireAuth: true
            },
            "/sync": {
                view: SyncView,
                titulo: "Sincronização",
                requireAuth: true,
                requireAdmin: true
            }
        };
    }

    async getPage(rota) {
        const rotaConfig = this.rotas[rota];

        if (!rotaConfig) {
            return `<div class="empty-state">
                <div class="empty-state-icon">🚧</div>
                <h3>Página não encontrada</h3>
                <p>A rota "${rota}" não existe</p>
                <a href="#dashboard" class="btn btn-primary">Voltar ao Dashboard</a>
            </div>`;
        }

        // Verificar autenticação
        if (rotaConfig.requireAuth) {
            const sessao = await window.auth.verificar();
            if (!sessao.logado) {
                window.location.hash = 'login';
                return '';
            }

            // Verificar se é admin
            if (rotaConfig.requireAdmin) {
                const isAdmin = await window.auth.isAdmin();
                if (!isAdmin) {
                    return `<div class="empty-state">
                        <div class="empty-state-icon">🔒</div>
                        <h3>Acesso Negado</h3>
                        <p>Você não tem permissão para acessar esta página</p>
                        <a href="#dashboard" class="btn btn-primary">Voltar ao Dashboard</a>
                    </div>`;
                }
            }
        }

        // Atualizar título da página
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = rotaConfig.titulo;
        }

        // Atualizar item ativo no menu
        this.atualizarMenuAtivo(rota);

        // Criar instância da view
        this.viewAtual = new rotaConfig.view();
        this.rotaAtual = rota;

        // Renderizar
        const html = await this.viewAtual.render();

        // Setup de eventos após render (timeout para garantir DOM pronto)
        setTimeout(() => {
            if (this.viewAtual && this.viewAtual.setupEvents) {
                this.viewAtual.setupEvents();
            }
        }, 50);

        return html;
    }

    atualizarMenuAtivo(rota) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === '#' + rota.replace('/', '')) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    getTitulo(rota) {
        const rotaConfig = this.rotas[rota];
        return rotaConfig ? rotaConfig.titulo : '';
    }
}

export default Rotas;