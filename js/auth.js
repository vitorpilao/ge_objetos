// auth.js - Sistema de Autenticação com Xano API

const AuthManager = {
    // Configuração da API Xano
    API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn',
    
    // Storage key para sessão local
    SESSION_KEY: 'ge_session',
    
    // Obter token de autenticação
    getAuthToken() {
        const session = this.getSession();
        return session ? session.authToken : null;
    },
    
    // Registrar novo usuário via API Xano
    async signup(name, email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            console.log('📝 Resposta do signup:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar conta');
            }
            
            // Xano retorna apenas authToken e user_id, precisamos buscar dados completos
            const userDataResult = await this.fetchUserDataAfterLogin(data.authToken);
            
            if (!userDataResult.success) {
                throw new Error('Erro ao buscar dados do usuário');
            }
            
            // Combinar token com dados do usuário
            // Extrair URL da imagem - pode vir como objeto {path: '...'} ou string  
            let profilePictureUrl = null;
            if (userDataResult.user.profile_picture) {
                if (typeof userDataResult.user.profile_picture === 'string') {
                    profilePictureUrl = userDataResult.user.profile_picture;
                } else if (userDataResult.user.profile_picture.path) {
                    profilePictureUrl = userDataResult.user.profile_picture.path;
                } else if (userDataResult.user.profile_picture.url) {
                    profilePictureUrl = userDataResult.user.profile_picture.url;
                }
            }
            
            console.log('🔗 URL da foto extraída (signup):', profilePictureUrl);
            
            const completeUserData = {
                id: userDataResult.user.id,
                name: userDataResult.user.name,
                email: userDataResult.user.email,
                profile_picture: profilePictureUrl,
                authToken: data.authToken
            };
            
            console.log('✅ Dados completos do usuário:', completeUserData);
            
            // Salvar sessão com dados completos
            this.createSession(completeUserData);
            
            return { success: true, user: completeUserData };
        } catch (error) {
            console.error('Erro no signup:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Login via API Xano
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();
            
            console.log('🔐 Resposta do login:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'E-mail ou senha incorretos');
            }
            
            // Xano retorna apenas authToken e user_id, precisamos buscar dados completos
            const userDataResult = await this.fetchUserDataAfterLogin(data.authToken);
            
            if (!userDataResult.success) {
                throw new Error('Erro ao buscar dados do usuário');
            }
            
            // Combinar token com dados do usuário
            // A foto pode vir como string (base64) ou objeto {url/path}
            let profilePictureUrl = null;
            if (userDataResult.user.profile_picture) {
                if (typeof userDataResult.user.profile_picture === 'string') {
                    profilePictureUrl = userDataResult.user.profile_picture;
                } else {
                    profilePictureUrl = userDataResult.user.profile_picture?.url || 
                                       userDataResult.user.profile_picture?.path || 
                                       null;
                }
            }
            
            const completeUserData = {
                id: userDataResult.user.id,
                name: userDataResult.user.name,
                email: userDataResult.user.email,
                profile_picture: profilePictureUrl,
                authToken: data.authToken
            };
            
            console.log('✅ Dados completos do usuário:', completeUserData);
            
            // Salvar sessão com dados completos
            this.createSession(completeUserData);
            
            return { success: true, user: completeUserData };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Buscar dados do usuário com token específico (usado após login/signup)
    async fetchUserDataAfterLogin(token) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            // A foto pode estar em data.profile_picture ou data._user.profile_picture
            const profilePicData = data.profile_picture || data._user?.profile_picture;
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar dados do usuário');
            }
            
            // Retornar com profile_picture no lugar correto
            return { 
                success: true, 
                user: {
                    ...data,
                    profile_picture: profilePicData
                }
            };
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Buscar dados do usuário autenticado via API
    async fetchUserData() {
        try {
            const token = this.getAuthToken();
            
            if (!token) {
                throw new Error('Não autenticado');
            }
            
            return await this.fetchUserDataAfterLogin(token);
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Criar sessão local (salva token e dados do usuário)
    createSession(userData) {
        const session = {
            userId: userData.id,
            userName: userData.name,
            userEmail: userData.email,
            userProfilePicture: userData.profile_picture || null,
            authToken: userData.authToken, // Token JWT do Xano
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    },
    
    // Obter sessão atual
    getSession() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },
    
    // Obter usuário atual da sessão
    getCurrentUser() {
        const session = this.getSession();
        
        if (!session) {
            return null;
        }
        
        const user = {
            id: session.userId,
            name: session.userName,
            email: session.userEmail,
            profile_picture: session.userProfilePicture || null
        };
        
        return user;
    },
    
    // Atualizar dados do usuário atual
    updateCurrentUser(updatedUser) {
        const session = this.getSession();
        if (!session) {
            console.warn('⚠️ Nenhuma sessão para atualizar!');
            return;
        }
        
        // Atualizar campos do usuário na sessão
        if (updatedUser.name) session.userName = updatedUser.name;
        if (updatedUser.email) session.userEmail = updatedUser.email;
        if (updatedUser.profile_picture !== undefined) {
            session.userProfilePicture = updatedUser.profile_picture;
        }
        
        // Salvar sessão atualizada
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    },
    
    // Verificar se está autenticado
    isAuthenticated() {
        const session = this.getSession();
        return session && session.authToken;
    },
    
    // Logout
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }
};

// Função auxiliar para mostrar notificações
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
    
    if (!isLoginPage) return;
    
    const toggleButton = document.getElementById('toggle-auth');
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    
    // Configurar estado inicial dos formulários
    if (loginForm && signupForm) {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
    }
    
    // Toggle entre login e registro
    if (toggleButton && loginForm && signupForm) {
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Alternar visibilidade dos formulários
            if (loginForm.style.display === 'none') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                toggleButton.innerHTML = 'Não tem conta? <strong>Registre-se</strong>';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
                toggleButton.innerHTML = 'Já tem conta? <strong>Faça login</strong>';
            }
        });
    }
    
    // Processar Login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';
        
        const result = await AuthManager.login(email, password);
        
        if (result.success) {
            showToast('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            showToast(result.error, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
    
    // Processar Registro
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        
        if (password.length < 6) {
            showToast('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Criando conta...';
        
        const result = await AuthManager.signup(name, email, password);
        
        if (result.success) {
            showToast('Conta criada com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            showToast(result.error, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar Conta';
        }
    });
    
    // Funcionalidade de "Esqueceu a senha"
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeForgotModal = document.getElementById('close-forgot-modal');
    const formForgotPassword = document.getElementById('form-forgot-password');
    
    // Só adicionar eventos se os elementos existirem (estamos na página de login)
    if (forgotPasswordLink && forgotPasswordModal && closeForgotModal && formForgotPassword) {
        // Abrir modal
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
            document.getElementById('forgot-email').value = '';
            document.getElementById('forgot-message').style.display = 'none';
        });
        
        // Fechar modal
        closeForgotModal.addEventListener('click', () => {
            forgotPasswordModal.style.display = 'none';
        });
        
        // Fechar ao clicar fora do modal
        forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) {
                forgotPasswordModal.style.display = 'none';
            }
        });
        
        // Enviar link de recuperação
        formForgotPassword.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('forgot-email').value;
        const submitBtn = formForgotPassword.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const messageDiv = document.getElementById('forgot-message');
        
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        messageDiv.style.display = 'none';
        
        try {
            console.log('🔄 Solicitando envio de link de recuperação:', email);
            console.log('🌐 URL:', `${AuthManager.API_BASE_URL}/reset/request-reset-link?email=${encodeURIComponent(email)}`);
            
            // Usar GET /reset/request-reset-link para solicitar envio do e-mail
            const response = await fetch(`${AuthManager.API_BASE_URL}/reset/request-reset-link?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('📡 Status da resposta:', response.status);
            
            const data = await response.json();
            console.log('📦 Dados da resposta completa:', JSON.stringify(data, null, 2));
            
            if (response.ok) {
                messageDiv.textContent = '✅ Solicitação enviada! Se o e-mail estiver cadastrado e o servidor de e-mail configurado no Xano, você receberá o link de recuperação.';
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                
                // Limpar formulário e fechar modal após 5 segundos
                setTimeout(() => {
                    forgotPasswordModal.style.display = 'none';
                    document.getElementById('forgot-email').value = '';
                    showToast('Solicitação enviada!', 'success');
                }, 5000);
            } else {
                // Traduzir mensagem específica do Xano
                let errorMessage = data.message || 'Erro ao enviar e-mail. Verifique se o e-mail está correto.';
                if (errorMessage === 'Unable to locate request.') {
                    errorMessage = 'E-mail não localizado.';
                }
                messageDiv.textContent = errorMessage;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro ao solicitar recuperação:', error);
            messageDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
        });
    }
});
