// View de Login - Sebo Alfarrabio PDV
class LoginView {
    constructor() { }

    render() {
        return `
            <div class="login-card">
                <div class="login-logo">
                    <div class="login-logo-icon">📚</div>
                    <h1>Sebo Alfarrabio</h1>
                    <p>Onde cada livro tem uma nova chance de ser descoberto</p>
                </div>
                
                <div class="login-error" id="login-error"></div>
                
                <form class="login-form" id="login-form">
                    <div class="form-group">
                        <label><span class="icon">✉️</span> Email</label>
                        <input type="email" id="login-email" placeholder="seu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label><span class="icon">🔒</span> Senha</label>
                        <input type="password" id="login-senha" placeholder="••••••••" required>
                    </div>
                    
                    <div class="login-remember">
                        <input type="checkbox" id="login-remember">
                        <label for="login-remember">Lembrar-me</label>
                    </div>
                    
                    <button type="submit" class="btn-login">
                        <span>➡️</span> Entrar no Sistema
                    </button>
                </form>
                
                <div class="login-footer">
                    <a href="#" id="btn-offline-mode">🏠 Continuar sem entrar</a>
                    <p>Não tem conta? <a href="#" id="btn-register">Crie aqui.</a></p>
                    <p class="copyright">© 2026 Sebo Alfarrabio - Todos os direitos reservados</p>
                </div>
            </div>
        `;
    }

    async setupEvents() {
        const form = document.getElementById('login-form');
        const errorDiv = document.getElementById('login-error');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            // Mostrar loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span> Entrando...';
            submitBtn.disabled = true;

            try {
                const result = await window.auth.login(email, senha);

                if (result.success) {
                    // Login bem sucedido - mostrar layout principal
                    window.dispatchEvent(new CustomEvent('login-success', { detail: result.user }));
                } else {
                    errorDiv.textContent = result.error || 'Credenciais inválidas';
                    errorDiv.classList.add('show');
                }
            } catch (error) {
                errorDiv.textContent = 'Erro ao conectar. Verifique sua conexão.';
                errorDiv.classList.add('show');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Modo offline
        const offlineBtn = document.getElementById('btn-offline-mode');
        if (offlineBtn) {
            offlineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('offline-mode'));
            });
        }
    }
}

export default LoginView;
