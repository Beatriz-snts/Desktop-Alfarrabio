// Renderer Principal - Sebo Alfarrabio PDV
import './index.css';
import Rotas from './Renderer_front/Services/Rotas.js';
import LoginView from './Renderer_front/Views/Login/LoginView.js';

// Inicialização
const rotas = new Rotas();
let usuarioLogado = null;

// Elementos do DOM
const loginScreen = document.getElementById('login-screen');
const mainLayout = document.getElementById('main-layout');
const appContainer = document.getElementById('app');
const pageTitle = document.getElementById('page-title');
const userInfo = document.getElementById('user-info');
const currentDate = document.getElementById('current-date');

// Atualizar data atual
function atualizarData() {
  if (currentDate) {
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
atualizarData();
setInterval(atualizarData, 60000);

// Verificar tema salvo
async function carregarTema() {
  const isDark = await window.darkMode.get();
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    const themeBtn = document.getElementById('toggle-theme');
    if (themeBtn) themeBtn.innerHTML = '☀️ Tema Claro';
  }
}

// Toggle tema
document.getElementById('toggle-theme')?.addEventListener('click', async () => {
  const isDark = await window.darkMode.toggle();
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const themeBtn = document.getElementById('toggle-theme');
  if (themeBtn) themeBtn.innerHTML = isDark ? '☀️ Tema Claro' : '🌙 Tema Escuro';
});

// Logout
document.getElementById('btn-logout')?.addEventListener('click', async () => {
  if (confirm('Deseja sair do sistema?')) {
    await window.auth.logout();
    usuarioLogado = null;
    mostrarLogin();
  }
});

// Mostrar tela de login
function mostrarLogin() {
  loginScreen.classList.remove('hidden');
  mainLayout.classList.add('hidden');

  const loginView = new LoginView();
  loginScreen.innerHTML = loginView.render();
  loginView.setupEvents();
}

// Mostrar layout principal
async function mostrarLayoutPrincipal(usuario, rotaInicial = '/dashboard') {
  usuarioLogado = usuario;

  loginScreen.classList.add('hidden');
  mainLayout.classList.remove('hidden');

  // Atualizar info do usuário
  if (userInfo && usuario) {
    userInfo.innerHTML = `
            <div class="user-info-name">${usuario.nome}</div>
            <div class="user-info-role">${usuario.role === 'admin' ? '👑 Administrador' : '🛒 Vendedor'}</div>
        `;
  }

  // Mostrar/ocultar seção admin
  const isAdmin = await window.auth.isAdmin();
  const adminSection = document.querySelector('.admin-only');
  if (adminSection) {
    adminSection.style.display = isAdmin ? 'block' : 'none';
  }

  // Carregar página inicial ou dashboard
  await navegarPara(rotaInicial);
}

// Navegar para rota
async function navegarPara(rota) {
  try {
    appContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const html = await rotas.getPage(rota);
    appContainer.innerHTML = html;
  } catch (error) {
    console.error('Erro ao navegar:', error);
    appContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h3>Erro ao carregar página</h3>
                <p>${error.message}</p>
            </div>
        `;
  }
}

// Eventos de navegação
window.addEventListener('hashchange', async () => {
  const rota = window.location.hash.replace('#', '/');
  if (rota && rota !== '/login') {
    await navegarPara(rota);
  }
});

// Evento de login bem sucedido
window.addEventListener('login-success', (e) => {
  mostrarLayoutPrincipal(e.detail);
});

// Modo offline
window.addEventListener('offline-mode', () => {
  mostrarLayoutPrincipal({ nome: 'Modo Offline', role: 'vendedor' });
});

// Inicialização
async function init() {
  await carregarTema();

  // Verificar se já está logado
  try {
    const sessao = await window.auth.verificar();
    if (sessao.logado && sessao.usuario) {
      // Se tem hash na URL, navegar para lá, senão ir para dashboard
      let rotaInicial = '/dashboard';
      if (window.location.hash && window.location.hash !== '#login') {
        rotaInicial = window.location.hash.replace('#', '/');
      }

      await mostrarLayoutPrincipal(sessao.usuario, rotaInicial);
    } else {
      mostrarLogin();
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    mostrarLogin();
  }
}

init();
