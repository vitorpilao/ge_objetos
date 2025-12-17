// js/admin-panel.js
// Painel Administrativo

const AdminPanel = {
    API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn',
    currentSection: 'dashboard',
    
    async init() {
        console.log('🔐 Inicializando Painel Admin...');
        
        // Verificar se usuário é admin
        if (!this.checkAdminPermission()) {
            // substituir alert por toast
            try { window.AdminPanel.showToast('Acesso negado! Você não tem permissão de administrador.', 'error'); } catch(e) { console.warn('Toast indisponível'); }
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

    // Exibir um toast na tela (sucesso/erro/info)
    showToast(message, type = 'info', duration = 3500) {
        try {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);

            // Forçar uma reflow para animar
            window.getComputedStyle(toast).opacity;
            toast.classList.add('show');

            // Remover após tempo
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        } catch (e) {
            console.error('Erro ao mostrar toast:', e);
        }
    },
    
    // Obter headers de autenticação
    getAuthHeaders() {
        const authToken = AuthManager.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    },

    // Helper para escapar texto para evitar XSS quando injetamos HTML manualmente
    escapeHtml(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
            case 'settings':
                this.initSettings();
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
                
                // Excluir objetos marcados como demo ao computar estatísticas / ranking
                const nonDemoObjects = objects.filter(o => !o.demo);
                const stats = {
                    total_users: users.length,
                    total_objects: nonDemoObjects.length,
                    active_users: users.filter(u => u.is_active !== false).length,
                    object_types: {}
                };
                
                // Contar tipos de objetos (apenas não-demo)
                nonDemoObjects.forEach(obj => {
                    stats.object_types[obj.tipo] = (stats.object_types[obj.tipo] || 0) + 1;
                });
                
                this.updateDashboardStats(stats);
                
                // Mostrar objetos recentes (mantemos a lista completa, incluindo demos)
                const recentObjects = objects
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);
                this.renderRecentObjects(recentObjects);

                // Renderizar ranking dos 3 objetos mais criados (excluindo demos)
                this.renderTopObjectsRanking(nonDemoObjects);
                
                // Adicionar ranking
                this.renderTopObjectsRanking(objects);
                return;
            }
            
            const stats = await response.json();
            console.log('📊 Estatísticas recebidas:', stats);
            
            // Atualizar cards de estatísticas
            this.updateDashboardStats(stats);
            
            // Mostrar objetos recentes se disponível
                if (stats.recent_objects && stats.recent_objects.length > 0) {
                this.renderRecentObjects(stats.recent_objects);
                // Supondo que `stats` já retorna um objeto com `object_types` e `recent_objects`; preferimos usar `objects` do Xano para ranking
                const objectsForRanking = stats.recent_objects && stats.recent_objects.length > 0 ? stats.recent_objects : objects;
                this.renderTopObjectsRanking(
                    // Garantir que filtramos demo
                    (objectsForRanking || []).filter(o => !o.demo)
                );
            } else {
                // Buscar objetos recentes manualmente
                const objects = await this.fetchAllObjects();
                const nonDemoObjects = objects.filter(o => !o.demo);
                const recentObjects = objects
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);
                this.renderRecentObjects(recentObjects);
                this.renderTopObjectsRanking(nonDemoObjects);
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
        
        const safeDate = (d) => { try { const t = d ? new Date(d) : null; return (t && !isNaN(t.getTime())) ? t.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'; } catch(e) { return 'N/A'; } };
        tbody.innerHTML = objects.map(obj => {
            const date = safeDate(obj.created_at);
            
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
    
    // Renderizar ranking dos 3 objetos mais criados
    renderTopObjectsRanking(objects) {
        const container = document.getElementById('top-objects-list');
        if (!container) return;
        if (!objects || objects.length === 0) {
            container.innerHTML = '<div class="empty-state">Nenhum objeto encontrado</div>';
            return;
        }
        // Contar tipos de objetos
        const typeCount = {};
        objects.forEach(obj => {
            typeCount[obj.tipo] = (typeCount[obj.tipo] || 0) + 1;
        });
        // Ordenar tipos por quantidade
        const sortedTypes = Object.entries(typeCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
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
        container.innerHTML = sortedTypes.map(([tipo, count], idx) => {
            return `<div class="top-object-item">
                <span class="top-object-rank">${idx + 1}º</span>
                <span class="top-object-type">${typeLabels[tipo] || tipo}</span>
                <span class="top-object-count">${count} criados</span>
            </div>`;
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
                        <button class="btn-icon" onclick="AdminPanel.toggleUserStatus(${user.id}, ${user.is_active}, this)" title="Ativar/Desativar">🔄</button>
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
            // guardar cache dos objetos para filtros/ordenacao/busca
            this.objectsList = objects || [];
            
            // Render objects filtered by demo status
            // Recuperar estado do toggle de demo (persistido no localStorage)
            const persisted = localStorage.getItem('showDemoObjects');
            this.showDemoObjects = (persisted === null) ? true : (persisted === 'true');
            // Atualizar UI do switch (se presente)
            const toggle = document.getElementById('show-demo-toggle');
            if (toggle) toggle.checked = this.showDemoObjects;
            this.renderObjectsList(this.applyDemoFilter(objects));
            
            // Configurar busca
            this.setupObjectSearch(objects);
            this.setupObjectFilter();
            
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
                    <td colspan="7" class="empty-state">
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
        
        // Aplicar filtro demo antes de renderizar
        const visibleObjects = this.applyDemoFilter(objects);

        const safeDate = (d) => { try { const t = d ? new Date(d) : null; return (t && !isNaN(t.getTime())) ? t.toLocaleDateString('pt-BR') : 'N/A'; } catch(e) { return 'N/A'; } };
        tbody.innerHTML = (visibleObjects).map(obj => {
            const created = safeDate(obj.created_at);
            const updated = safeDate(obj.updated_at);
            return `
                <tr>
                    <td><strong>${obj.nome}</strong></td>
                    <td><span class="badge badge-warning">${typeLabels[obj.tipo] || obj.tipo}</span></td>
                    <td>${obj.created_by || 'N/A'}</td>
                    <td>${created}</td>
                    <td>${updated}</td>
                    <td class="demo-cell">
                        <input type="checkbox" ${obj.demo ? 'checked' : ''} onchange="AdminPanel.toggleDemoStatus(${obj.id}, this.checked, this)" title="Marcar como Demo">
                        <span class="checkbox-spinner" style="display:none;"></span>
                    </td>
                    <td>
                        <button class="btn-icon" onclick="AdminPanel.viewObject(${obj.id})" title="Visualizar">👁️</button>
                        <button class="btn-icon" onclick="AdminPanel.editObject(${obj.id})" title="Editar">✏️</button>
                        <button class="btn-icon" onclick="AdminPanel.deleteObject(${obj.id}, this)" title="Excluir">🗑️</button>
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
            this.renderObjectsList(this.applyDemoFilter(filtered));
        });
    },

    // Configurar filtro de demo (switch)
    setupObjectFilter() {
        const toggle = document.getElementById('show-demo-toggle');
        if (!toggle) return;

        // Atualizar estado inicial
        this.showDemoObjects = toggle.checked;

        toggle.onchange = (e) => {
            this.showDemoObjects = e.target.checked;
            try { localStorage.setItem('showDemoObjects', String(this.showDemoObjects)); } catch (err) { console.warn('Não foi possível salvar preferência de demo no localStorage:', err); }
            // Renderizar com novo filtro usando cache de objetos
            const objects = this.objectsList || [];
            this.renderObjectsList(this.applyDemoFilter(objects));
        };
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
                
                // Ordenar e renderizar com filtro demo aplicado
                const sorted = this.sortObjects(objects, field, currentSort.order);
                this.renderObjectsList(this.applyDemoFilter(sorted));
            });
        });
    },
    
    // Ordenar objetos
    sortObjects(objects, field, order) {
        return [...objects].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Tratar valores nulos (preservar booleans)
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Tratamento especial para valores booleanos (ex: demo)
            if (field === 'demo' || typeof aVal === 'boolean' || typeof bVal === 'boolean') {
                aVal = aVal ? 1 : 0;
                bVal = bVal ? 1 : 0;
            }

            // Conversão para comparação (strings)
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    // Aplicar filtro para mostrar/ocultar objetos demo
    applyDemoFilter(objects) {
        if (!objects || !Array.isArray(objects)) return [];
        const show = this.showDemoObjects !== false; // default true
        if (show) return objects;
        return objects.filter(o => !o.demo);
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
            console.log('📦 Objetos recebidos (raw):', data);

            // Normalizar a lista de objetos e garantir que o campo `demo` exista e seja boolean
            const rawList = data.content || data || [];
            const normalized = (Array.isArray(rawList) ? rawList : []).map(item => ({
                // preservar todas as propriedades originais
                ...item,
                // garantir que `demo` seja boolean (fallback false)
                // Tentar detectar campos possíveis com status demo (demo, is_demo, isDemo)
                demo: !!(item.demo || item.is_demo || item.isDemo || item.isDemoFlag || item.is_demo_flag || item.demo_flag),
                // garantir campos de data para evitar erros de parsing
                created_at: item.created_at || item.createdAt || item.created || null,
                updated_at: item.updated_at || item.updatedAt || item.updated || null
            }));

            console.log('📦 Objetos normalizados:', normalized.map(o => ({ id: o.id, demo: o.demo })));

            return normalized;
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
            console.log('🔄 Atualizando usuário:', userId, userData);
            const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });
            
            console.log('📡 Resposta da API:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', errorText);
                const error = await response.json().catch(() => ({ error: errorText }));
                throw new Error(error.error || 'Erro ao atualizar usuário');
            }
            
            const result = await response.json();
            console.log('✅ Usuário atualizado:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao atualizar usuário:', error);
            throw error;
        }
    },
    
    // Deletar usuário
    async deleteUser(userId, softDelete = true, triggerEl = null) {
        if (triggerEl) try { GeneratorCore._setButtonSpinner(triggerEl, true); } catch(e) { console.warn(e); }
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
        } finally {
            if (triggerEl) try { GeneratorCore.clearButtonSpinner(triggerEl); } catch(e) { console.warn(e); }
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
            
            const safeDate = (d) => { try { const t = d ? new Date(d) : null; return (t && !isNaN(t.getTime())) ? t.toLocaleString('pt-BR') : 'N/A'; } catch(e) { return 'N/A'; } };

            // Pequeno helper para escapar texto antes de inserir no modal
            const escapeHtml = (str) => {
                if (!str && str !== 0) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            };

            // Detectar possível URL de avatar/foto (raw) - priorizar profile_picture
            let avatarUrlRaw = null;
            if (user.profile_picture) {
                if (typeof user.profile_picture === 'string') avatarUrlRaw = user.profile_picture;
                else if (user.profile_picture.path) avatarUrlRaw = user.profile_picture.path;
                else if (user.profile_picture.url) avatarUrlRaw = user.profile_picture.url;
            }
            avatarUrlRaw = avatarUrlRaw || user.avatar || user.avatar_url || user.photo || user.photo_url || user.profile_image || user.picture || user.image || null;
            const initials = (name) => {
                if (!name) return '';
                return name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();
            };

            // Normalizar a URL do avatar (se for relative, prefixar com origin)
            const normalizeAvatar = (raw) => {
                if (!raw) return null;
                if (String(raw).startsWith('data:')) return raw;
                if (/^https?:\/\//i.test(raw)) return raw;
                try { return window.location.origin + (raw.startsWith('/') ? raw : ('/' + raw)); } catch(e) { return raw; }
            };

            let avatarCandidate = normalizeAvatar(avatarUrlRaw);
            // fallback para ui-avatars se não houver imagem
            if (!avatarCandidate && (user.name || user.email)) {
                const nameParam = encodeURIComponent((user.name || user.email).trim());
                avatarCandidate = `https://ui-avatars.com/api/?name=${nameParam}&size=200&background=0A88F4&color=ffffff&rounded=true`;
            }

            // Preload the avatar to detect load/error and choose fallback proactively
            const preloadAvatar = (url, fallback) => new Promise((resolve) => {
                if (!url) return resolve(fallback);
                try {
                    const img = new Image();
                    img.onload = () => resolve(url);
                    img.onerror = () => resolve(fallback);
                    img.src = url;
                } catch (e) {
                    resolve(fallback);
                }
            });

            // Try to make the background transparent for non-transparent images using canvas
            const makeBackgroundTransparent = (src, tolerance = 40) => new Promise((resolve) => {
                if (!src) return resolve(src);
                // If already a PNG data URL or has transparency, we cannot know without processing;
                // We'll attempt only for images that can be drawn to canvas with crossOrigin.
                try {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        try {
                            // Avoid huge canvases; scale down if necessary
                            const maxSize = 400;
                            let w = img.naturalWidth;
                            let h = img.naturalHeight;
                            let scale = 1;
                            if (w > maxSize) { scale = maxSize / w; w = Math.round(w * scale); h = Math.round(h * scale); }
                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            let imageData;
                            try { imageData = ctx.getImageData(0, 0, w, h); } catch (err) { return resolve(src); }
                            const data = imageData.data;
                            // Sample four corners and compute average background color
                            const sample = (x, y) => {
                                const i = (y * w + x) * 4;
                                return { r: data[i], g: data[i+1], b: data[i+2] };
                            };
                            const corners = [sample(0,0), sample(w-1,0), sample(0,h-1), sample(w-1,h-1)];
                            const avg = corners.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
                            avg.r = Math.round(avg.r / corners.length);
                            avg.g = Math.round(avg.g / corners.length);
                            avg.b = Math.round(avg.b / corners.length);
                            // Change alpha for pixels close to avg color
                            let changed = 0;
                            const tol = tolerance;
                            for (let p = 0; p < data.length; p += 4) {
                                const dr = Math.abs(data[p] - avg.r);
                                const dg = Math.abs(data[p+1] - avg.g);
                                const db = Math.abs(data[p+2] - avg.b);
                                const distance = Math.sqrt(dr * dr + dg * dg + db * db);
                                if (distance <= tol) {
                                    // Make pixel transparent
                                    data[p+3] = 0;
                                    changed++;
                                }
                            }
                            if (changed === 0) return resolve(src);
                            ctx.putImageData(imageData, 0, 0);
                            const transparentDataUrl = canvas.toDataURL('image/png');
                            return resolve(transparentDataUrl);
                        } catch (err) {
                            return resolve(src);
                        }
                    };
                    img.onerror = () => resolve(src);
                    img.src = src;
                } catch (err) { return resolve(src); }
            });

            const finalAvatarUrl = await preloadAvatar(avatarCandidate, `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name||user.email||'U').trim())}&size=200&background=0A88F4&color=ffffff&rounded=true`);
            console.log('🔍 finalAvatarUrl resolved:', finalAvatarUrl);

            // Try to convert background to transparent (best-effort). If it fails, fallback to finalAvatarUrl.
            let processedAvatarUrl = finalAvatarUrl;
            try {
                processedAvatarUrl = await makeBackgroundTransparent(finalAvatarUrl, 44);
                if (processedAvatarUrl && processedAvatarUrl !== finalAvatarUrl) {
                    console.log('🔍 Avatar processed with transparent background');
                } else {
                    console.log('🔍 Avatar unchanged by transparency processing');
                }
            } catch (err) { console.warn('🔍 Avatar transparency processing failed', err); processedAvatarUrl = finalAvatarUrl; }

            console.log('🔍 viewUserDetails user payload:', user);
            console.log('🔍 avatarCandidate for user', user.id, avatarCandidate);

            // Use background-image on wrapper to mimic sidebar avatar behavior and avoid square overlay
            const bgUrl = escapeHtml(processedAvatarUrl);
            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent((user.name||user.email||'U').trim())}&size=200&background=0A88F4&color=ffffff&rounded=true`;
            const avatarImgHtml = `
                <div class="avatar-wrapper" style="width:110px;height:110px;background-image: url('${bgUrl}'); background-size: cover; background-position: center;">
                    <img class="avatar-img" style="width:110px;height:110px;object-fit:cover;display:block;" src="${escapeHtml(bgUrl)}" alt="${escapeHtml(user.name || user.email || '')}" onerror="this.style.display='none'; this.parentElement.style.backgroundImage='url(${escapeHtml(fallbackUrl)})'" onload="this.style.display='block'" />
                </div>`;

            const contentHtml = `
                <div style="display:flex;gap:16px;align-items:flex-start;">
                    <div class="avatar-col">
                        ${avatarImgHtml}
                    </div>
                    <div style="flex:1;min-width:200px;">
                        <p><strong>ID:</strong> ${escapeHtml(user.id)}</p>
                        <p><strong>Nome:</strong> ${escapeHtml(user.name || 'N/A')}</p>
                        <p><strong>E-mail:</strong> ${escapeHtml(user.email || 'N/A')}</p>
                        <p><strong>Função:</strong> ${escapeHtml(roleLabels[user.role] || user.role || 'N/A')}</p>
                        <p><strong>Status:</strong> ${user.is_active ? 'Ativo' : 'Inativo'}</p>
                        <p><strong>Criado em:</strong> ${escapeHtml(safeDate(user.created_at))}</p>
                        <p><strong>Último acesso:</strong> ${user.last_login ? escapeHtml(safeDate(user.last_login)) : 'Nunca'}</p>
                    </div>
                </div>
            `;

            // Mostrar modal com conteúdo rico (imagem + texto)
            try {
                GeneratorCore.showAppModal('📋 Detalhes do Usuário', contentHtml);
                // Small debug to ensure the wrapper/img sizes are as expected
                setTimeout(() => {
                    try {
                        const modal = document.getElementById('app-modal');
                        if (!modal) return;
                        const wrapper = modal.querySelector('.avatar-wrapper');
                        const imgEl = modal.querySelector('.avatar-img');
                        if (wrapper) console.log('🔍 avatar wrapper offset', wrapper.offsetWidth, wrapper.offsetHeight, wrapper.style.width, wrapper.style.height);
                        if (imgEl) console.log('🔍 avatar img offset', imgEl.offsetWidth, imgEl.offsetHeight, imgEl.style.width, imgEl.style.height);
                    } catch (err) { console.warn('Avatar debug error:', err); }
                }, 50);
            } catch (e) {
                // Fallback para toast (pre-wrap já permite quebras)
                const details = `\n📋 Detalhes do Usuário\n\nID: ${user.id}\nNome: ${user.name}\nE-mail: ${user.email}\nFunção: ${roleLabels[user.role] || user.role}\nStatus: ${user.is_active ? 'Ativo' : 'Inativo'}\nCriado em: ${safeDate(user.created_at)}\nÚltimo acesso: ${user.last_login ? safeDate(user.last_login) : 'Nunca'}`;
                this.showToast(details, 'info', 8000);
            }
        } catch (error) {
            this.showToast('Erro ao carregar detalhes do usuário: ' + error.message, 'error');
        }
    },
    
    async toggleUserStatus(userId, currentStatus, triggerEl = null) {
        const action = currentStatus ? 'desativar' : 'ativar';
        const msg = `Deseja ${action} este usuário?`;
        try {
            console.log('🔄 Iniciando toggle status:', userId, 'de', currentStatus, 'para', !currentStatus);
            const confirmed = await GeneratorCore.showAppConfirm(msg, { triggerEl });
            if (!confirmed) {
                console.log('❌ Usuário cancelou a operação');
                return;
            }

            // Ensure the triggering button displays spinner while updating
            if (triggerEl) try { GeneratorCore._setButtonSpinner(triggerEl, true); } catch(e) { console.warn('Erro ao setar spinner no botão:', e); }

            await this.updateUser(userId, { is_active: !currentStatus });
            console.log('✅ Status atualizado no banco');
            this.showToast(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            
            console.log('🔄 Recarregando dados...');
            await this.loadUsersData();
            await this.loadDashboardData();
            console.log('✅ Dados recarregados');
        } catch (error) {
            console.error('❌ Erro no toggleUserStatus:', error);
            this.showToast('Erro ao atualizar status do usuário: ' + (error.message || error), 'error');
        } finally {
            if (triggerEl) try { GeneratorCore.clearButtonSpinner(triggerEl); } catch(e) { console.warn('Erro ao limpar spinner do botão:', e); }
        }
    },
    
    async editUserModal(userId) {
        try {
            const user = await this.fetchUser(userId);

            const roleMap = {
                'member': 'member',
                'membro': 'member',
                'usuario': 'member',
                'user': 'member',
                'editor': 'member',
                'admin': 'admin'
            };

            const roleOptions = ['member', 'admin'].map(r => `<option value="${r}" ${user.role === r ? 'selected' : ''}>${r}</option>`).join('');

            const content = `
                <form id="edit-user-form" style="display:flex;flex-direction:column;gap:12px;">
                    <div class="form-group">
                        <label for="edit-user-name">Nome</label>
                        <input id="edit-user-name" name="name" type="text" class="form-control" value="${this.escapeHtml(user.name || '')}" required />
                    </div>
                    <div class="form-group">
                        <label for="edit-user-email">E-mail</label>
                        <input id="edit-user-email" name="email" type="email" class="form-control" value="${this.escapeHtml(user.email || '')}" required />
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role">Função</label>
                        <select id="edit-user-role" name="role" class="form-control">
                            ${roleOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input id="edit-user-active" name="is_active" type="checkbox" ${user.is_active !== false ? 'checked' : ''} /> Ativo
                        </label>
                    </div>
                    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
                        <button type="button" id="edit-user-cancel" class="btn-secondary">Cancelar</button>
                        <button type="submit" id="edit-user-save" class="btn-primary">Salvar</button>
                    </div>
                </form>
            `;

            GeneratorCore.showAppModal('✏️ Editar Usuário', content);

            // Attach event listeners after modal is displayed
            const form = document.getElementById('edit-user-form');
            const cancelBtn = document.getElementById('edit-user-cancel');
            const saveBtn = document.getElementById('edit-user-save');
            if (cancelBtn) cancelBtn.onclick = () => { document.getElementById('app-modal').style.display = 'none'; };
            if (form) form.onsubmit = (e) => this.submitEditUserForm(e, userId, saveBtn);
            // Focus the first input
            setTimeout(() => {
                const nameEl = document.getElementById('edit-user-name');
                if (nameEl) nameEl.focus();
            }, 50);

        } catch (error) {
            this.showToast('Erro ao abrir modal de edição: ' + (error.message || error), 'error');
        }
    },

    async submitEditUserForm(e, userId, saveBtn) {
        try {
            e.preventDefault();
            if (saveBtn) try { GeneratorCore._setButtonSpinner(saveBtn, true); } catch (err) { console.warn(err); }

            const nameEl = document.getElementById('edit-user-name');
            const emailEl = document.getElementById('edit-user-email');
            const roleEl = document.getElementById('edit-user-role');
            const activeEl = document.getElementById('edit-user-active');

            const name = (nameEl && nameEl.value) ? nameEl.value.trim() : '';
            const email = (emailEl && emailEl.value) ? emailEl.value.trim() : '';
            const role = (roleEl && roleEl.value) ? roleEl.value : 'member';
            const is_active = !!(activeEl && activeEl.checked);

            if (!name) { this.showToast('Nome é obrigatório.', 'error'); return; }
            if (!email) { this.showToast('E-mail é obrigatório.', 'error'); return; }
            // Basic email validation
            const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!emailValid) { this.showToast('E-mail inválido.', 'error'); return; }

            await this.updateUser(userId, { name, email, role, is_active });
            this.showToast('Usuário atualizado com sucesso!', 'success');
            // Close modal
            const modal = document.getElementById('app-modal');
            if (modal) modal.style.display = 'none';

            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            this.showToast('Erro ao atualizar usuário: ' + (error.message || error), 'error');
        } finally {
            if (saveBtn) try { GeneratorCore.clearButtonSpinner(saveBtn); } catch (err) { console.warn(err); }
        }
    },
    
    async deleteUserConfirm(userId) {
        // Método legado mantido como fallback
        // Agora usa openDeleteModal() por padrão
        const softDelete = await GeneratorCore.showAppConfirm('Deseja DESATIVAR (OK) ou DELETAR PERMANENTEMENTE (Cancelar)?\n\nOK = Desativar\nCancelar = Deletar permanentemente');
        
        const action = softDelete ? 'desativar' : 'deletar permanentemente';
        
        const confirmed = await GeneratorCore.showAppConfirm(`Tem certeza que deseja ${action} este usuário?`);
        if (!confirmed) return;
        
        try {
            await this.deleteUser(userId, softDelete);
            this.showToast(`Usuário ${softDelete ? 'desativado' : 'deletado'} com sucesso!`, 'success');
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            this.showToast('Erro ao deletar usuário: ' + error.message, 'error');
        }
    },
    
    async createUserModal() {
        const modal = document.getElementById('create-user-modal');
        const form = document.getElementById('create-user-form');
        const closeBtn = document.getElementById('create-user-modal-close');
        const cancelBtn = document.getElementById('create-user-modal-cancel');
        const submitBtn = document.getElementById('create-user-modal-submit');

        // Reset form
        form.reset();

        // Show modal
        modal.style.display = 'flex';

        // Close modal function
        const closeModal = () => {
            modal.style.display = 'none';
        };

        // Event listeners
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Submit handler
        const handleSubmit = async (e) => {
            e.preventDefault();

            const name = document.getElementById('user-name').value.trim();
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value.trim();
            const role = document.getElementById('user-role').value;

            if (!name || !email || !password) {
                this.showToast('Todos os campos são obrigatórios!', 'error');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Criando...';

                await this.createUser({
                    name,
                    email,
                    password,
                    role,
                    is_active: true
                });

                this.showToast('Usuário criado com sucesso!', 'success');
                await this.loadUsersData();
                await this.loadDashboardData();
                closeModal();
            } catch (error) {
                this.showToast('Erro ao criar usuário: ' + error.message, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Criar Usuário';
            }
        };

        // Remove previous listeners to avoid duplicates
        submitBtn.removeEventListener('click', handleSubmit);
        submitBtn.addEventListener('click', handleSubmit);

        form.removeEventListener('submit', handleSubmit);
        form.addEventListener('submit', handleSubmit);
    },
    
    // Ações de objeto
    async viewObject(id) {
        try {
            console.log('🔍 Buscando objeto para visualização:', id);
            const response = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo/${id}`, {
                headers: StorageManager.getHeaders()
            });

            if (!response.ok) {
                console.error('❌ Resposta da API falhou:', response.status, response.statusText);
                throw new Error('Objeto não encontrado');
            }

            const obj = await response.json();
            console.log('📦 Objeto recebido:', obj);
            const htmlContent = obj.código_html || obj.codigo_html || '<p>HTML não disponível</p>';
            console.log('📄 HTML do objeto:', htmlContent);

            // Adicionar estrutura HTML básica com charset UTF-8 para corrigir acentos
            const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Visualização do Objeto</title>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

            // Criar um blob com o HTML e abrir em nova aba
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('❌ Erro ao visualizar objeto:', error);
            this.showToast('Erro ao visualizar objeto: ' + error.message, 'error');
        }
    },
    
    async editObject(id) {
        window.location.href = `index.html?edit=${id}`;
    },
    
    async deleteObject(id, triggerEl = null) {
        try {
            // Buscar o objeto para obter o nome
            const response = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo/${id}`, {
                headers: StorageManager.getHeaders()
            });
            
            if (!response.ok) throw new Error('Objeto não encontrado');
            
            const obj = await response.json();
            const objectName = obj.nome || 'Objeto sem nome';
            
            return new Promise((resolve) => {
                const content = `
                    <div style="text-align: center; padding: 20px;">
                        <p style="margin-bottom: 20px; font-size: 1.1rem;">Tem certeza que deseja excluir o objeto <strong>"${this.escapeHtml(objectName)}"</strong>?</p>
                        <p style="margin-bottom: 20px; color: #666; font-size: 0.9rem;">Esta ação não pode ser desfeita.</p>
                        <div style="margin-bottom: 20px;">
                            <label for="delete-name" style="display: block; margin-bottom: 8px; font-weight: 600;">Digite o nome do objeto para confirmar:</label>
                            <input id="delete-name" type="text" class="form-control" placeholder="Nome do objeto" style="width: 100%; text-align: center;" />
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="delete-confirm" class="btn-primary" style="background: #dc3545; border-color: #dc3545;" disabled>Excluir</button>
                            <button id="delete-cancel" class="btn-secondary">Cancelar</button>
                        </div>
                    </div>
                `;

                GeneratorCore.showAppModal('🗑️ Excluir Objeto', content);

                // Attach event listeners
                const confirmBtn = document.getElementById('delete-confirm');
                const cancelBtn = document.getElementById('delete-cancel');
                const nameInput = document.getElementById('delete-name');

                const closeModal = () => {
                    document.getElementById('app-modal').style.display = 'none';
                    resolve(false);
                };

                if (cancelBtn) cancelBtn.onclick = closeModal;

                // Enable/disable confirm button based on input
                if (nameInput) {
                    nameInput.oninput = () => {
                        confirmBtn.disabled = nameInput.value.trim() !== objectName;
                    };
                }

                if (confirmBtn) confirmBtn.onclick = async () => {
                    if (nameInput.value.trim() !== objectName) {
                        this.showToast('Nome do objeto incorreto. Exclusão cancelada.', 'error');
                        return;
                    }
                    
                    document.getElementById('app-modal').style.display = 'none';
                    
                    // Add spinner to triggerEl if provided
                    if (triggerEl) GeneratorCore._setButtonSpinner(triggerEl);
                    
                    try {
                        const delResponse = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo/${id}`, {
                            method: 'DELETE',
                            headers: StorageManager.getHeaders()
                        });
                        
                        if (!delResponse.ok) throw new Error('Erro ao excluir objeto');
                        
                        this.showToast('Objeto excluído com sucesso!', 'success');
                        await this.loadObjectsData();
                        await this.loadDashboardData();
                    } catch (error) {
                        console.error('❌ Erro ao excluir objeto:', error);
                        this.showToast('Erro ao excluir objeto: ' + error.message, 'error');
                    } finally {
                        if (triggerEl) GeneratorCore.clearButtonSpinner(triggerEl);
                    }
                    
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('❌ Erro ao buscar objeto para exclusão:', error);
            this.showToast('Erro ao preparar exclusão: ' + error.message, 'error');
        }
    },

    // Alternar status 'demo' de um objeto
    async toggleDemoStatus(objectId, isDemo, el = null) {
        try {
            if (el) el.disabled = true;
            // mostrar spinner ao lado do checkbox
            let spinner = null;
            try { spinner = el.nextElementSibling; } catch(e) { spinner = null; }
            if (spinner) { spinner.style.display = 'inline-block'; el.style.display = 'none'; }
            console.log(`🔁 Atualizando demo=${isDemo} para objeto ${objectId}...`);
            // Desabilitar o checkbox visualmente enquanto atualiza (se possível)
            // Usamos o payload de patch para atualizar apenas campo demo
            const response = await fetch(`${StorageManager.API_BASE_URL}/objeto_interativo/${objectId}`, {
                method: 'PATCH',
                headers: StorageManager.getHeaders(),
                body: JSON.stringify({ is_demo: isDemo })
            });

            if (!response.ok) {
                const text = await response.text();
                let errorMessage = 'Erro ao atualizar status Demo';
                try {
                    const json = JSON.parse(text);
                    errorMessage = json.error || json.message || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            console.log(`✅ Demo atualizado para objeto ${objectId}: demo=${isDemo}`);
            // Atualizar lista de objetos e dashboard
            await this.loadObjectsData();
            await this.loadDashboardData();
            if (spinner) { spinner.style.display = 'none'; el.style.display = 'inline-block'; }
            if (el) el.disabled = false;
            this.showToast('Demo atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao atualizar demo:', error);
            this.showToast('Erro ao atualizar ' + (isDemo ? 'marcação de Demo' : 'desmarcar Demo') + ': ' + error.message, 'error', 6000);
            // Recarregar a lista para garantir estado consistente
            await this.loadObjectsData();
        } finally {
            if (spinner) { spinner.style.display = 'none'; el.style.display = 'inline-block'; }
            if (el) el.disabled = false;
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
            const confirmBtn = document.getElementById('confirm-delete-btn');
            await this.deleteUser(this.currentDeleteUserId, isSoftDelete, confirmBtn);
            
            const message = isSoftDelete 
                ? 'Usuário desativado com sucesso!' 
                : 'Usuário deletado permanentemente!';
            this.showToast(message, 'success');
            
            this.closeDeleteModal();
            await this.loadUsersData();
            await this.loadDashboardData();
        } catch (error) {
            this.showToast('Erro ao deletar usuário: ' + error.message, 'error');
        }
    },
    
    // Logout
    async logout(triggerEl = null) {
        const confirmed = await GeneratorCore.showAppConfirm('Deseja sair do painel admin?', { triggerEl });
        if (!confirmed) return;
        try {
            AuthManager.logout();
            window.location.href = 'login.html';
        } finally {
            if (triggerEl) GeneratorCore.clearButtonSpinner(triggerEl);
        }
    }
};

// ========== CONFIGURAÇÕES DO SISTEMA ==========

AdminPanel.loadSettings = async function() {
    try {
        console.log('🔧 Carregando configurações do sistema...');

        // Carregar configurações salvas ou usar padrões
        const savedSettings = localStorage.getItem('systemSettings');
        const settings = savedSettings ? JSON.parse(savedSettings) : this.getDefaultSettings();

        // Aplicar configurações aos campos do formulário
        this.applySettingsToForm(settings);

        // Aplicar configurações ao CSS
        this.applySettingsToCSS(settings);

        console.log('✅ Configurações carregadas com sucesso');
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        this.showToast('Erro ao carregar configurações', 'error');
    }
};

AdminPanel.getDefaultSettings = function() {
    return {
        colors: {
            'color-cinza-tech': '#030200',
            'color-branco-puro': '#FFFFFF',
            'color-azul-moderno': '#0A88F4',
            'color-azul-profundo': '#00011E',
            'color-verde-tech': '#C3EB1E',
            'color-laranja-quente': '#FF7A00'
        },
        fonts: {
            'font-primary': "'Montserrat', 'Arial', sans-serif",
            'font-secondary': "'Arial', 'Montserrat', sans-serif"
        }
    };
};

AdminPanel.applySettingsToForm = function(settings) {
    // Aplicar cores
    Object.keys(settings.colors).forEach(colorKey => {
        const colorInput = document.getElementById(colorKey);
        if (colorInput) {
            colorInput.value = settings.colors[colorKey];
            
            // Atualizar campo hex correspondente
            const colorGroup = colorInput.closest('.color-input-group');
            if (colorGroup) {
                const hexField = colorGroup.querySelector('.color-hex');
                if (hexField) {
                    hexField.value = settings.colors[colorKey];
                }
            }
        }
    });

    // Aplicar fontes
    Object.keys(settings.fonts).forEach(fontKey => {
        const fontSelect = document.getElementById(fontKey);
        if (fontSelect) {
            fontSelect.value = settings.fonts[fontKey];
        }
    });
};

AdminPanel.applySettingsToCSS = function(settings) {
    const root = document.documentElement;

    // Aplicar variáveis CSS de cores
    Object.keys(settings.colors).forEach(colorKey => {
        root.style.setProperty(`--${colorKey}`, settings.colors[colorKey]);
    });

    // Aplicar variáveis CSS de fontes
    Object.keys(settings.fonts).forEach(fontKey => {
        root.style.setProperty(`--${fontKey}`, settings.fonts[fontKey]);
    });
};

AdminPanel.saveSettings = async function() {
    try {
        console.log('💾 Salvando configurações...');

        const settings = this.collectSettingsFromForm();

        // Salvar no localStorage
        localStorage.setItem('systemSettings', JSON.stringify(settings));

        // Aplicar configurações imediatamente
        this.applySettingsToCSS(settings);

        // Mostrar status de sucesso
        this.showSettingsStatus('Configurações salvas com sucesso!', 'success');

        console.log('✅ Configurações salvas com sucesso');
    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        this.showSettingsStatus('Erro ao salvar configurações', 'error');
    }
};

AdminPanel.collectSettingsFromForm = function() {
    const settings = {
        colors: {},
        fonts: {}
    };

    // Coletar cores
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        settings.colors[input.id] = input.value;
    });

    // Coletar fontes
    const fontSelects = document.querySelectorAll('select[id^="font-"]');
    fontSelects.forEach(select => {
        settings.fonts[select.id] = select.value;
    });

    return settings;
};

AdminPanel.resetSettings = function() {
    try {
        console.log('🔄 Restaurando configurações padrão...');

        const defaultSettings = this.getDefaultSettings();

        // Aplicar configurações padrão ao formulário
        this.applySettingsToForm(defaultSettings);

        // Aplicar configurações padrão ao CSS
        this.applySettingsToCSS(defaultSettings);

        // Remover do localStorage
        localStorage.removeItem('systemSettings');

        // Mostrar status
        this.showSettingsStatus('Configurações restauradas para o padrão!', 'info');

        console.log('✅ Configurações restauradas');
    } catch (error) {
        console.error('❌ Erro ao restaurar configurações:', error);
        this.showSettingsStatus('Erro ao restaurar configurações', 'error');
    }
};

AdminPanel.previewSettings = function() {
    try {
        console.log('👁️ Aplicando preview das configurações...');

        const settings = this.collectSettingsFromForm();
        this.applySettingsToCSS(settings);

        this.showSettingsStatus('Preview aplicado! Clique em "Salvar" para manter as alterações.', 'info');
    } catch (error) {
        console.error('❌ Erro ao aplicar preview:', error);
        this.showSettingsStatus('Erro ao aplicar preview', 'error');
    }
};

AdminPanel.showSettingsStatus = function(message, type) {
    const statusDiv = document.getElementById('settings-status');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `settings-status ${type}`;
    statusDiv.style.display = 'block';

    // Esconder automaticamente após 5 segundos
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
};

AdminPanel.initSettings = function() {
    // Adicionar event listeners aos campos de cor
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const colorGroup = e.target.closest('.color-input-group');
            if (colorGroup) {
                const hexField = colorGroup.querySelector('.color-hex');
                if (hexField) {
                    hexField.value = e.target.value;
                }
            }
        });
    });

    // Adicionar event listeners aos botões
    const saveBtn = document.getElementById('save-settings');
    const resetBtn = document.getElementById('reset-settings');
    const previewBtn = document.getElementById('preview-settings');

    if (saveBtn) saveBtn.addEventListener('click', () => this.saveSettings());
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings());
    if (previewBtn) previewBtn.addEventListener('click', () => this.previewSettings());

    // Carregar configurações
    this.loadSettings();
};

// Tornar global para permitir chamadas via inline event handlers (ex: onclick="AdminPanel.*")
window.AdminPanel = AdminPanel;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticação
    if (!AuthManager.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    AdminPanel.init();
});
