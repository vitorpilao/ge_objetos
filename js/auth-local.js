// auth.js - Sistema de Autenticação com Xano

const AuthManager = {
    // Configuração da API Xano
    API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn',
    
    // Storage keys (apenas para sessão local)
    SESSION_KEY: 'ge_session',
    
    // Token de autenticação
    getAuthToken() {
        const session = this.getSession();
        return session ? session.authToken : null;
    },
    
    // Obter todos os usuários
    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
    },
    
    // Salvar usuários
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    },
    
    // Criar novo usuário
    createUser(userData) {
        const users = this.getUsers();
        
        // Verificar se email já existe
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Este e-mail já está cadastrado');
        }
        
        const newUser = {
            id: Date.now(),
            name: userData.name,
            email: userData.email,
            password: this.hashPassword(userData.password),
            created_at: new Date().toISOString()
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        return newUser;
    },
    
    // Hash simples de senha (em produção usar bcrypt no backend)
    hashPassword(password) {
        // Simples hash para demo - NUNCA usar em produção!
        return btoa(password + 'salt_secret_key');
    },
    
    // Verificar senha
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    },
    
    // Registrar novo usuário
    async signup(name, email, password) {
        try {
            const user = this.createUser({ name, email, password });
            
            // Criar sessão automaticamente
            const session = this.createSession(user);
            
            return { success: true, user, session };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Login
    async login(email, password) {
        try {
            const users = this.getUsers();
            const user = users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('E-mail não encontrado');
            }
            
            if (!this.verifyPassword(password, user.password)) {
                throw new Error('Senha incorreta');
            }
            
            // Atualizar last_login
            user.last_login = new Date().toISOString();
            this.saveUsers(users);
            
            // Criar sessão
            const session = this.createSession(user);
            
            return { success: true, user, session };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Criar sessão
    createSession(user) {
        const session = {
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            token: this.generateToken(),
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    },
    
    // Gerar token simples
    generateToken() {
        return btoa(Date.now() + Math.random().toString(36));
    },
    
    // Obter sessão atual
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },
    
    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.getSession();
    },
    
    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },
    
    // Obter dados do usuário logado
    getCurrentUser() {
        const session = this.getSession();
        if (!session) return null;
        
        return {
            id: session.userId,
            name: session.userName,
            email: session.userEmail
        };
    },
    
    // Inicializar usuário demo para testes
    initDemo() {
        const users = this.getUsers();
        
        // Verificar se usuário demo já existe
        const demoUser = users.find(u => u.email === 'demo@example.com');
        
        if (!demoUser) {
            // Criar usuário demo
            const demoUserData = {
                id: Date.now(),
                name: 'Usuário Demo',
                email: 'demo@example.com',
                password: this.hashPassword('demo123'),
                role: 'member',
                created_at: new Date().toISOString()
            };
            
            users.push(demoUserData);
            this.saveUsers(users);
            
            console.log('👤 Usuário demo criado:', demoUserData);
        }
    }
};

// Utilitário para mostrar notificações toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event Listeners para a página de login
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de login
    const isLoginPage = window.location.pathname.includes('login.html') || 
                        window.location.pathname.endsWith('/') ||
                        !window.location.pathname.includes('index.html');
    
    // Inicializar usuário demo
    AuthManager.initDemo();
    
    // Se já está logado e está na página de login, redireciona
    if (AuthManager.isAuthenticated() && isLoginPage) {
        window.location.href = 'index.html';
        return;
    }
    
    // Se não está na página de login, não executar o resto
    if (!isLoginPage) return;
    
    const formLogin = document.getElementById('form-login');
    const formSignup = document.getElementById('form-signup');
    const toggleAuth = document.getElementById('toggle-auth');
    
    // Login
    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const btn = formLogin.querySelector('.btn-primary');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        // Mostrar loading
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await AuthManager.login(email, password);
        
        if (result.success) {
            showToast('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast(result.error, 'error');
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
    
    // Registro
    formSignup?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const btn = formSignup.querySelector('.btn-primary');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        // Mostrar loading
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await AuthManager.signup(name, email, password);
        
        if (result.success) {
            showToast('Conta criada com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast(result.error, 'error');
            btn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
    
    // Toggle entre Login e Registro
    toggleAuth?.addEventListener('click', () => {
        const isLoginVisible = formLogin.style.display !== 'none';
        
        if (isLoginVisible) {
            formLogin.style.display = 'none';
            formSignup.style.display = 'block';
            toggleAuth.innerHTML = 'Já tem conta? <strong>Faça Login</strong>';
        } else {
            formLogin.style.display = 'block';
            formSignup.style.display = 'none';
            toggleAuth.innerHTML = 'Não tem conta? <strong>Registre-se</strong>';
        }
    });
    
    // Mostrar dica do usuário demo
    setTimeout(() => {
        showToast('💡 Dica: Use demo@example.com / demo123 para testar', 'success');
    }, 1000);
});
