// js/admin-panel.js
// Painel Administrativo

const AdminPanel = {
    API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn',
    currentSection: 'dashboard',
    
    async init() {
        console.log('🔐 Inicializando Painel Admin...');
        
        // Verificar se usuário é admin
        if (!this.checkAdminPermission()) {
            alert('Acesso negado! Você não tem permissão de administrador.');
            window.location.href = 'index.html';
            return;
        }
        
        // Carregar informações do usuário
        this.loadUserInfo();
        
        // Configurar navegação
        this.setupNavigation();
        
        // Carregar dados do dashboard
        await this.loadDashboardData();
        
        console.log('✅ Painel Admin iniciado com sucesso');
    },
    
    // Obter headers de autenticação
    getAuthHeaders() {
        const authToken = AuthManager.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    },
    
    // Verificar permissão de admin
    checkAdminPermission() {
        const user = AuthManager.getCurrentUser();
        if (!user) return false;
        
        // Lista de emails admin (fallback)
        const adminEmails = [
            'admin@impacta.com',
            'vitor@impacta.com',
            'vitor.pilao@faculdadeimpacta.com.br'
        ];
        
        // Verificar se é admin por role OU por e-mail
        return user.role === 'admin' || adminEmails.includes(user.email.toLowerCase());
    },
    
    // Carregar informações do usuário
    loadUserInfo() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            document.getElementById('admin-username').textContent = user.name || user.email;
        }
    },
    
    // Configurar navegação do menu
    setupNavigation() {
        const menuLinks = document.querySelectorAll('.admin-menu-link');
        
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const section = link.getAttribute('data-section');
                if (!section) return;
                
                e.preventDefault();
                
                // Atualizar menu ativo
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Mostrar seção correspondente
                this.showSection(section);
            });
        });
    },
    
    // Mostrar seção específica
    async showSection(section) {
        this.currentSection = section;
        
        // Ocultar todas as seções
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        
        // Mostrar seção selecionada
        const sectionElement = document.getElementById(`section-${section}`);
        if (sectionElement) {
            sectionElement.classList.add('active');
        }
        
        // Atualizar título
        const titles = {
            'dashboard': 'Dashboard',
            'users': 'Gerenciamento de Usuários',
            'objects': 'Gerenciamento de Objetos',
            'activity': 'Log de Atividades',
            'settings': 'Configurações do Sistema'
        };
        document.getElementById('section-title').textContent = titles[section] || section;
        
        // Carregar dados da seção
        switch(section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'objects':
                await this.loadObjectsData();
                break;
        }
    },
    
    // Carregar dados do dashboard
    async loadDashboardData() {
        try {
            console.log('📊 Carregando dados do dashboard...');
            
            // Buscar estatísticas do endpoint /admin/stats
            const response = await fetch(`${this.API_BASE_URL}/admin/stats`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                console.warn('⚠️ Endpoint /admin/stats não disponível, usando dados locais');
                // Fallback: buscar dados localmente
                const objects = await this.fetchAllObjects();
                const users = await this.fetchAllUsers();
                
                const stats = {
                    total_users: users.length,
                    total_objects: objects.length,
                    active_users: users.filter(u => u.is_active !== false).length,
                    object_types: {}
                };
                
                // Contar tipos de objetos
                objects.forEach(obj => {
                    stats.object_types[obj.tipo] = (stats.object_types[obj.tipo] || 0) + 1;
                });
                
                this.updateDashboardStats(stats);
                
                // Mostrar objetos recentes
                const recentObjects = objects
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);
                this.renderRecentObjects(recentObjects);
                
                return;
            }
            
            const stats = await response.json();
            console.log('📊 Estatísticas recebidas:', stats);
            
            // Atualizar cards de estatísticas
            this.updateDashboardStats(stats);
            
            // Mostrar objetos recentes se disponível
            if (stats.recent_objects && stats.recent_objects.length > 0) {
                this.renderRecentObjects(stats.recent_objects);
            } else {
                // Buscar objetos recentes manualmente
                const objects = await this.fetchAllObjects();
                const recentObjects = objects
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);
                this.renderRecentObjects(recentObjects);
            }
            
            console.log('✅ Dashboard carregado:', stats);
        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
        }
    },
    
    // Atualizar cards de estatísticas
    updateDashboardStats(stats) {
        document.getElementById('stat-users').textContent = stats.total_users || 0;
        document.getElementById('stat-objects').textContent = stats.total_objects || 0;
        document.getElementById('stat-active-users').textContent = stats.active_users || 0;
        
        // Calcular total de tipos de objetos
        const objectTypesCount = stats.object_types ? 
            Object.keys(stats.object_types).length : 0;
        document.getElementById('stat-object-types').textContent = objectTypesCount;
    },
    
    // Renderizar objetos recentes
    renderRecentObjects(objects) {
        const tbody = document.getElementById('recent-objects');
        
        if (objects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-icon">📦</div>
                        <div>Nenhum objeto encontrado</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const typeLabels = {
            accordion: 'Acordeão',
            destaque: 'Destaque',
            dragdrop: 'Drag & Drop',
            encontreerro: 'Encontre o Erro',
            flashcard: 'Flashcard',
            flipcard: 'Flip Card',
            guia: 'Guia Sequencial',
            modal: 'Modal de Imagem',
            multiplechoice: 'Múltipla Escolha',
            timeline: 'Timeline'
        };
        
        tbody.innerHTML = objects.map(obj => {
            const date = new Date(obj.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            
            return `
                <tr>
                    <td>${obj.nome}</td>
                    <td>${typeLabels[obj.tipo] || obj.tipo}</td>
                    <td>${obj.created_by || 'N/A'}</td>
                    <td>${date}</td>
                </tr>
            `;
        }).join('');
    },
    
    // Carregar dados de usuários
    async loadUsersData() {
        try {
            console.log('👥 Carregando usuários...');
            
            const users = await this.fetchAllUsers();
            const objects = await this.fetchAllObjects();
            
            console.log('📊 Usuários encontrados:', users.length);
            console.log('📦 Objetos encontrados:', objects.length);
            
            // Contar objetos por usuário
            const objectsByUser = {};
            objects.forEach(obj => {
                const creator = obj.created_by || 'N/A';
                objectsByUser[creator] = (objectsByUser[creator] || 0) + 1;
            });
            
            console.log('📈 Objetos por usuário:', objectsByUser);
            
            this.renderUsersList(users, objectsByUser);
            
            // Configurar busca
            this.setupUserSearch(users, objectsByUser);
            
            // Configurar ordenação
            this.setupUserSorting(users, objectsByUser);
            
            console.log('✅ Usuários carregados:', users.length);
        } catch (error) {
            console.error('❌ Erro ao carregar usuários:', error);
        }
    },
    
    // Renderizar lista de usuários
    renderUsersList(users, objectsByUser) {
        const tbody = document.getElementById('users-list');
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">👥</div>
                        <div>Nenhum usuário encontrado</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const roleLabels = {
            'admin': '👑 Admin',
            'member': '👤 Membro',
            'editor': '✏️ Editor',
            'user': '👤 Membro',
            'usuario': '👤 Membro'
        };
        
        tbody.innerHTML = users.map(user => {
            const objectCount = objectsByUser[user.name || user.email] || 0;
            const role = user.role || 'user';
            const roleLabel = roleLabels[role] || role;
            const status = user.is_active !== false ? 'Ativo' : 'Inativo';
            const statusClass = user.is_active !== false ? 'badge-success' : 'badge-danger';
            const lastAccess = user.last_login ? 
                new Date(user.last_login).toLocaleDateString('pt-BR') : 'N/A';
            
            return `
                <tr>
                    <td><strong>${user.name || 'N/A'}</strong></td>
                    <td>${user.email}</td>
                    <td><span class="badge badge-warning">${roleLabel}</span></td>
                    <td>${objectCount}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>${lastAccess}</td>
                    <td>
                        <button class="btn-icon" onclick="AdminPanel.viewUserDetails(${user.id})" title="Ver detalhes">👁️</button>
                        <button class="btn-icon" onclick="AdminPanel.toggleUserStatus(${user.id}, ${user.is_active})" title="Ativar/Desativar">🔄</button>
                        <button class="btn-icon" onclick="AdminPanel.editUserModal(${user.id})" title="Editar usuário">✏️</button>
                        <button class="btn-icon" onclick="AdminPanel.openDeleteModal(${user.id}, '${user.name || 'N/A'}')" title="Excluir usuário">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    // Configurar busca de usuários
    setupUserSearch(users, objectsByUser) {
        const searchInput = document.getElementById('user-search');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            const filtered = users.filter(user => {
                return (user.name || '').toLowerCase().includes(query) ||
                       user.email.toLowerCase().includes(query);
            });
            
            this.renderUsersList(filtered, objectsByUser);
        });
    },
    
    // Configurar ordenação de usuários
    setupUserSorting(users, objectsByUser) {
        const sortableHeaders = document.querySelectorAll('#section-users th.sortable');
        let currentSort = { field: null, order: 'asc' };
        
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                
                // Alternar ordem se clicar no mesmo campo
                if (currentSort.field === field) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.order = 'asc';
                }
                
                // Remover classes de todos os headers
                sortableHeaders.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Adicionar classe ao header atual
                header.classList.add(`sort-${currentSort.order}`);
                
                // Ordenar e renderizar
                const sorted = this.sortUsers(users, field, currentSort.order, objectsByUser);
                this.renderUsersList(sorted, objectsByUser);
            });
        });
    },
    
    // Ordenar usuários
    sortUsers(users, field, order, objectsByUser) {
        return [...users].sort((a, b) => {
            let aVal, bVal;
            
            // Tratamento especial para campo "objects"
            if (field === 'objects') {
                aVal = objectsByUser[a.name || a.email] || 0;
                bVal = objectsByUser[b.name || b.email] || 0;
            } else {
                aVal = a[field];
                bVal = b[field];
            }
            
            // Tratar valores nulos
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Conversão para comparação
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // Carregar dados de objetos
    async loadObjectsData() {
        try {
            console.log('📦 Carregando objetos...');
            
            const objects = await this.fetchAllObjects();
            
            this.renderObjectsList(objects);
            
            // Configurar busca
            this.setupObjectSearch(objects);
            
            // Configurar ordenação
            this.setupObjectSorting(objects);
            
            console.log('✅ Objetos carregados:', objects.length);
        } catch (error) {
            console.error('❌ Erro ao carregar objetos:', error);
        }
    },
    
    // Renderizar lista de objetos
    renderObjectsList(objects) {
        const tbody = document.getElementById('objects-list');
        
        if (objects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <div class="empty-icon">📦</div>
                        <div>Nenhum objeto encontrado</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const typeLabels = {
            accordion: 'Acordeão',
            destaque: 'Destaque',
            dragdrop: 'Drag & Drop',
            encontreerro: 'Encontre o Erro',
            flashcard: 'Flashcard',
            flipcard: 'Flip Card',
            guia: 'Guia Sequencial',
            modal: 'Modal de Imagem',
            multiplechoice: 'Múltipla Escolha',
            timeline: 'Timeline'
        };
        
        tbody.innerHTML = objects.map(obj => {
            const created = new Date(obj.created_at).toLocaleDateString('pt-BR');
            const updated = new Date(obj.updated_at).toLocaleDateString('pt-BR');
            
            return `
                <tr>
                    <td><strong>${obj.nome}</strong></td>
                    <td><span class="badge badge-warning">${typeLabels[obj.tipo] || obj.tipo}</span></td>
                    <td>${obj.created_by || 'N/A'}</td>
                    <td>${created}</td>
                    <td>${updated}</td>
                    <td>
                        <button class="btn-icon" onclick="AdminPanel.viewObject(${obj.id})" title="Visualizar">👁️</button>
                        <button class="btn-icon" onclick="AdminPanel.editObject(${obj.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="AdminPanel.deleteObject(${obj.id})" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    // Configurar busca de objetos
    setupObjectSearch(objects) {
        const searchInput = document.getElementById('object-search');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            const filtered = objects.filter(obj => {
                return obj.nome.toLowerCase().includes(query) ||
                       obj.tipo.toLowerCase().includes(query) ||
                       (obj.created_by || '').toLowerCase().includes(query);
            });
            
            this.renderObjectsList(filtered);
        });
    },
    
    // Configurar ordenação de objetos
    setupObjectSorting(objects) {
        const sortableHeaders = document.querySelectorAll('#section-objects th.sortable');
        let currentSort = { field: null, order: 'asc' };
        
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                
                // Alternar ordem se clicar no mesmo campo
                if (currentSort.field === field) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.order = 'asc';
                }
                
                // Remover classes de todos os headers
                sortableHeaders.forEach(h => {
                    h.classList.remove('sort-asc', 'sort-desc');
                });
                
                // Adicionar classe ao header atual
                header.classList.add(`sort-${currentSort.order}`);
                
                // Ordenar e renderizar
                const sorted = this.sortObjects(objects, field, currentSort.order);
                this.renderObjectsList(sorted);
            });
        });
    },
    
    // Ordenar objetos
    sortObjects(objects, field, order) {
        return [...objects].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Tratar valores nulos
            if (!aVal) aVal = '';
            if (!bVal) bVal = '';
            
            // Conversão para comparação
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // Buscar todos os objetos
    async fetchAllObjects() {
        try {
            // Verificar se StorageManager está disponível
            if (typeof StorageManager === 'undefined') {
                console.error('❌ StorageManager não está disponível');
                return [];
            }
            
            console.log('🔍 Buscando objetos em:', `${StorageManager.API_BASE_URL}/objeto_interativo`);
            
            const response = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo`, {
                headers: StorageManager.getHeaders()
            });
            
            if (!response.ok) {
                console.error('❌ Erro na resposta:', response.status, response.statusText);
                throw new Error('Erro ao buscar objetos');
            }
            
            const data = await response.json();
            console.log('📦 Objetos recebidos:', data);
            
            return data.content || data || [];
        } catch (error) {
            console.error('❌ Erro ao buscar objetos:', error);
            return [];
        }
    },
    
    // Buscar todos os usuários
    async fetchAllUsers() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                console.warn('⚠️ Endpoint /admin/users não disponível, usando fallback');
                // Fallback: extrair usuários únicos dos objetos
                const objects = await this.fetchAllObjects();
                const usersMap = new Map();
                
                objects.forEach(obj => {
                    const creator = obj.created_by;
                    if (creator && !usersMap.has(creator)) {
                        usersMap.set(creator, {
                            id: usersMap.size + 1,
                            name: creator,
                            email: creator.toLowerCase().replace(/\s+/g, '.') + '@impacta.com',
                            role: 'member',
                            is_active: true,
                            created_at: obj.created_at,
                            last_login: obj.created_at
                        });
                    }
                });
                
                return Array.from(usersMap.values());
            }
            
            const data = await response.json();
            // A API pode retornar um array direto ou um objeto com propriedade users
            if (Array.isArray(data)) {
                return data;
            }
            return data.users || data.content || [];
        } catch (error) {
            console.error('❌ Erro ao buscar usuários:', error);
            return [];
        }
    },
    
    // Buscar usuário específico
    async fetchUser(userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}`, {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Usuário não encontrado');
            
            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao buscar usuário:', error);
            throw error;
        }
    },
    
    // Criar novo usuário
    async createUser(userData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar usuário');
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
            throw error;
        }
    },
    
    // Atualizar usuário
    async updateUser(userId, userData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar usuário');
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            throw error;
        }
    },
    
    // Deletar usuário
    async deleteUser(userId, softDelete = true) {
        try {
            // API exige o parâmetro soft_delete sempre (true ou false)
            const url = `${this.API_BASE_URL}/admin/users/${userId}?soft_delete=${softDelete}`;
            console.log('🔍 DELETE URL:', url);
            console.log('🔍 Soft Delete:', softDelete);
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);
            
            const responseText = await response.text();
            console.log('📥 Response text:', responseText);
            
            if (!response.ok) {
                let errorMessage = 'Erro ao deletar usuário';
                try {
                    const error = JSON.parse(responseText);
                    errorMessage = error.error || error.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // Se a resposta estiver vazia, retornar sucesso
            if (!responseText) {
                return { success: true };
            }
            
            return JSON.parse(responseText);
        } catch (error) {
            console.error('❌ Erro ao deletar usuário:', error);
            throw error;
        }
    },
    
    // Ações de usuário
    async viewUserDetails(userId) {
        try {
            const user = await this.fetchUser(userId);
            
            const roleLabels = {
                'admin': 'Administrador',
                'member': 'Membro',
                'editor': 'Editor',
                'user': 'Membro',
                'usuario': 'Membro'
            };
            
            const details = `
📋 Detalhes do Usuário

ID: ${user.id}
Nome: ${user.name}
E-mail: ${user.email}
Função: ${roleLabels[user.role] || user.role}
Status: ${user.is_active ? 'Ativo' : 'Inativo'}
Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}
Último acesso: ${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}
            `.trim();
            
            alert(details);
        } catch (error) {
            alert('Erro ao carregar detalhes do usuário: ' + error.message);
        }
    },
    
    async toggleUserStatus(userId, currentStatus) {
        const action = currentStatus ? 'desativar' : 'ativar';
        
        if (!confirm(`Deseja ${action} este usuário?`)) return;
        
        try {
            await this.updateUser(userId, { is_active: !currentStatus });
            alert(`Usuário ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso!`);
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            alert('Erro ao alterar status do usuário: ' + error.message);
        }
    },
    
    async editUserModal(userId) {
        try {
            const user = await this.fetchUser(userId);
            
            const newName = prompt('Nome:', user.name);
            if (!newName || newName === user.name) return;
            
            const newEmail = prompt('E-mail:', user.email);
            if (!newEmail) return;
            
            const newRoleInput = prompt('Função (member/admin):', user.role || 'member');
            if (!newRoleInput) return;
            
            // Mapear para valores aceitos pela API
            const roleMap = {
                'member': 'member',
                'membro': 'member',
                'usuario': 'member',
                'user': 'member',
                'editor': 'member',
                'admin': 'admin'
            };
            
            const newRole = roleMap[newRoleInput.toLowerCase()] || user.role || 'member';
            
            await this.updateUser(userId, {
                name: newName,
                email: newEmail,
                role: newRole
            });
            
            alert('Usuário atualizado com sucesso!');
            await this.loadUsersData();
        } catch (error) {
            alert('Erro ao atualizar usuário: ' + error.message);
        }
    },
    
    async deleteUserConfirm(userId) {
        // Método legado mantido como fallback
        // Agora usa openDeleteModal() por padrão
        const softDelete = confirm('Deseja DESATIVAR (OK) ou DELETAR PERMANENTEMENTE (Cancelar)?\n\nOK = Desativar\nCancelar = Deletar permanentemente');
        
        const action = softDelete ? 'desativar' : 'deletar permanentemente';
        
        if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
        
        try {
            await this.deleteUser(userId, softDelete);
            alert(`Usuário ${softDelete ? 'desativado' : 'deletado'} com sucesso!`);
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            alert('Erro ao deletar usuário: ' + error.message);
        }
    },
    
    async createUserModal() {
        const name = prompt('Nome do usuário:');
        if (!name) return;
        
        const email = prompt('E-mail:');
        if (!email) return;
        
        const password = prompt('Senha:');
        if (!password) return;
        
        const roleInput = prompt('Função (member/admin):', 'member');
        if (!roleInput) return;
        
        // Mapear para valores aceitos pela API
        const roleMap = {
            'member': 'member',
            'membro': 'member',
            'usuario': 'member',
            'user': 'member',
            'editor': 'member',
            'admin': 'admin'
        };
        
        const role = roleMap[roleInput.toLowerCase()] || 'member';
        
        try {
            await this.createUser({
                name,
                email,
                password,
                role,
                is_active: true
            });
            
            alert('Usuário criado com sucesso!');
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            alert('Erro ao criar usuário: ' + error.message);
        }
    },
    
    // Ações de objeto
    viewObject(id) {
        window.open(`preview.html?id=${id}`, '_blank');
    },
    
    async editObject(id) {
        window.location.href = `index.html?edit=${id}`;
    },
    
    async deleteObject(id) {
        if (!confirm('Tem certeza que deseja excluir este objeto?')) return;
        
        try {
            const response = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo/${id}`, {
                method: 'DELETE',
                headers: StorageManager.getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Erro ao excluir objeto');
            
            alert('Objeto excluído com sucesso!');
            await this.loadObjectsData();
            await this.loadDashboardData();
        } catch (error) {
            console.error('❌ Erro ao excluir objeto:', error);
            alert('Erro ao excluir objeto: ' + error.message);
        }
    },

    // Métodos para modal de deletar usuário
    currentDeleteUserId: null,
    
    openDeleteModal(userId, userName) {
        this.currentDeleteUserId = userId;
        this.currentDeleteUserName = userName;
        const modal = document.getElementById('delete-user-modal');
        const userInfoElement = document.getElementById('delete-user-info');
        
        // Atualizar nome do usuário no aviso
        if (userInfoElement) {
            userInfoElement.textContent = `Você está prestes a deletar o usuário: ${userName}`;
        }
        
        // Marcar opção de soft delete como padrão
        const softDeleteRadio = document.querySelector('input[name="delete-type"][value="soft"]');
        if (softDeleteRadio) {
            softDeleteRadio.checked = true;
        }
        
        // Resetar e ocultar campo de confirmação
        const confirmSection = document.getElementById('confirm-delete-section');
        const confirmInput = document.getElementById('confirm-delete-input');
        const confirmError = document.getElementById('confirm-error');
        if (confirmSection) confirmSection.style.display = 'none';
        if (confirmInput) confirmInput.value = '';
        if (confirmError) confirmError.style.display = 'none';
        
        // Atualizar texto do botão para desativação (padrão)
        const confirmBtn = document.getElementById('confirm-delete-btn');
        if (confirmBtn) {
            confirmBtn.textContent = 'Confirmar Desativação';
        }
        
        // Adicionar listeners para mudança de opção
        const radioButtons = document.querySelectorAll('input[name="delete-type"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => this.updateDeleteModalUI());
        });
        
        // Adicionar evento para fechar ao clicar fora do modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeDeleteModal();
            }
        };
        
        // Adicionar evento para fechar com ESC
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteModal();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
        
        // Mostrar modal
        modal.style.display = 'flex';
    },
    
    updateDeleteModalUI() {
        const deleteTypeRadio = document.querySelector('input[name="delete-type"]:checked');
        const isSoftDelete = deleteTypeRadio && deleteTypeRadio.value === 'soft';
        
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const confirmSection = document.getElementById('confirm-delete-section');
        const confirmInput = document.getElementById('confirm-delete-input');
        const confirmError = document.getElementById('confirm-error');
        
        if (isSoftDelete) {
            // Modo desativação
            if (confirmBtn) confirmBtn.textContent = 'Confirmar Desativação';
            if (confirmSection) confirmSection.style.display = 'none';
            if (confirmInput) confirmInput.value = '';
            if (confirmError) confirmError.style.display = 'none';
        } else {
            // Modo exclusão permanente
            if (confirmBtn) confirmBtn.textContent = 'Confirmar Exclusão';
            if (confirmSection) confirmSection.style.display = 'block';
            if (confirmInput) confirmInput.value = '';
            if (confirmError) confirmError.style.display = 'none';
        }
    },
    
    closeDeleteModal() {
        const modal = document.getElementById('delete-user-modal');
        modal.style.display = 'none';
        this.currentDeleteUserId = null;
        
        // Remover listener da tecla ESC
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    },
    
    async confirmDeleteUser() {
        if (!this.currentDeleteUserId) return;
        
        // Verificar qual opção foi selecionada
        const deleteTypeRadio = document.querySelector('input[name="delete-type"]:checked');
        const isSoftDelete = deleteTypeRadio && deleteTypeRadio.value === 'soft';
        
        // Se for exclusão permanente, validar o nome digitado
        if (!isSoftDelete) {
            const confirmInput = document.getElementById('confirm-delete-input');
            const confirmError = document.getElementById('confirm-error');
            const typedName = confirmInput ? confirmInput.value.trim() : '';
            
            if (typedName !== this.currentDeleteUserName) {
                if (confirmError) {
                    confirmError.textContent = `O nome digitado não corresponde a "${this.currentDeleteUserName}"`;
                    confirmError.style.display = 'block';
                }
                if (confirmInput) {
                    confirmInput.style.borderColor = '#dc3545';
                    confirmInput.focus();
                }
                return;
            }
        }
        
        try {
            await this.deleteUser(this.currentDeleteUserId, isSoftDelete);
            
            const message = isSoftDelete 
                ? 'Usuário desativado com sucesso!' 
                : 'Usuário deletado permanentemente!';
            alert(message);
            
            this.closeDeleteModal();
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            alert('Erro ao deletar usuário: ' + error.message);
        }
    },
    
    // Logout
    logout() {
        if (confirm('Deseja sair do painel admin?')) {
            AuthManager.logout();
            window.location.href = 'login.html';
        }
    }
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (!AuthManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    AdminPanel.init();
});
