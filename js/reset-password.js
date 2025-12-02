// reset-password.js - Script para redefinição de senha

const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn';

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

// Obter parâmetros da URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        token: params.get('token'),
        email: params.get('email')
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-reset-password');
    const messageDiv = document.getElementById('reset-message');
    const { token, email } = getUrlParams();
    
    console.log('🔑 Token da URL:', token);
    console.log('📧 Email da URL:', email);
    
    // Verificar se tem token na URL
    if (!token) {
        messageDiv.textContent = '❌ Link inválido ou expirado. Solicite um novo link de recuperação.';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        form.querySelector('button[type="submit"]').disabled = true;
        return;
    }
    
    // Processar formulário de redefinição
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        // Validar senhas
        if (newPassword.length < 8) {
            messageDiv.textContent = 'A senha deve ter no mínimo 8 caracteres.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'As senhas não coincidem. Tente novamente.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }
        
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        messageDiv.style.display = 'none';
        
        try {
            console.log('🔄 Enviando requisição para atualizar senha');
            console.log('🌐 URL:', `${API_BASE_URL}/reset/update_password`);
            
            // Preparar corpo da requisição
            const requestBody = {
                password: newPassword
            };
            
            // Adicionar email se estiver disponível na URL
            if (email) {
                requestBody.email = email;
            }
            
            console.log('📦 Dados enviados:', requestBody);
            
            const response = await fetch(`${API_BASE_URL}/reset/update_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📡 Status da resposta:', response.status);
            
            const data = await response.json();
            console.log('📦 Dados da resposta:', data);
            
            if (response.ok) {
                messageDiv.textContent = '✅ Senha redefinida com sucesso! Redirecionando para o login...';
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                
                showToast('Senha redefinida com sucesso!', 'success');
                
                // Redirecionar para login após 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                let errorMessage = data.message || 'Erro ao redefinir senha. Tente novamente.';
                
                // Traduzir mensagens comuns
                if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
                    errorMessage = 'Link expirado ou inválido. Solicite um novo link de recuperação.';
                }
                
                messageDiv.textContent = errorMessage;
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Erro ao redefinir senha:', error);
            messageDiv.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
});
