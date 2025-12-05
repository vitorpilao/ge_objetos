// storage-manager-xano.js - Gerenciador de Objetos com API Xano

const StorageManager = {
    // Configuração da API Xano
    API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:GFL6p7bC',
    
    // Headers com autenticação
    getHeaders() {
        const token = AuthManager.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },
    
    // Obter todos os objetos (GET /objeto_interativo)
    async getAllObjects() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/objeto_interativo`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar objetos');
            }
            
            // Filtrar apenas objetos não-demo
            return data.filter(obj => !obj.is_demo);
        } catch (error) {
            console.error('Erro ao buscar objetos:', error);
            return [];
        }
    },
    
    // Obter apenas objetos demo
    async getDemoObjects() {
        try {
            console.log('🔍 Buscando demos do Xano...');
            const response = await fetch(`${this.API_BASE_URL}/objeto_interativo`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await response.json();
            console.log('🔍 Todos os objetos da API:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar demos');
            }
            
            // Filtrar apenas objetos demo
            const demos = data.filter(obj => obj.is_demo === true);
            console.log('🔍 Objetos com is_demo=true:', demos);
            return demos;
        } catch (error) {
            console.error('❌ Erro ao buscar demos:', error);
            return [];
        }
    },
    
    // Obter objetos (mantém compatibilidade, mas retorna todos não-demo)
    async getObjects(userId) {
        return this.getAllObjects();
    },
    
    // Salvar objeto (POST ou PATCH)
    async saveObject(objectData) {
        try {
            const user = AuthManager.getCurrentUser();
            
            if (objectData.id) {
                // Atualizar existente (PATCH)
                const response = await fetch(`${this.API_BASE_URL}/objeto_interativo/${objectData.id}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        nome: objectData.nome,
                        tipo: objectData.tipo,
                        dados_formulario: objectData.dados_formulario,
                        codigo_html: objectData.codigo_html,
                        updated_by: objectData.updated_by || user.name
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao atualizar objeto');
                }
                
                return data;
            } else {
                // Criar novo (POST)
                const response = await fetch(`${this.API_BASE_URL}/objeto_interativo`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        user_id: objectData.user_id,
                        nome: objectData.nome,
                        tipo: objectData.tipo,
                        dados_formulario: objectData.dados_formulario,
                        codigo_html: objectData.codigo_html,
                        created_by: objectData.created_by || user.name,
                        updated_by: objectData.updated_by || user.name
                    })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao criar objeto');
                }
                
                return data;
            }
        } catch (error) {
            console.error('Erro ao salvar objeto:', error);
            throw error;
        }
    },
    
    // Obter um objeto específico (GET /objeto_interativo/{id})
    async getObject(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/objeto_interativo/${id}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar objeto');
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao buscar objeto:', error);
            return null;
        }
    },
    
    // Deletar objeto (DELETE /objeto_interativo/{id})
    async deleteObject(id, userId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/objeto_interativo/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Erro ao deletar objeto');
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao deletar objeto:', error);
            throw error;
        }
    },
    
    // Exportar objetos para JSON
    async exportToJSON(userId) {
        const objects = await this.getAllObjects();
        const dataStr = JSON.stringify(objects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `objetos_interativos_${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Importar objetos de JSON (criará novos objetos no Xano)
    async importFromJSON(file, userId, callback) {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const objects = JSON.parse(e.target.result);
                let successCount = 0;
                
                // Importar cada objeto
                for (const obj of objects) {
                    try {
                        delete obj.id; // Remove ID antigo
                        delete obj.created_at;
                        delete obj.updated_at;
                        
                        await this.saveObject(obj);
                        successCount++;
                    } catch (error) {
                        console.error('Erro ao importar objeto:', error);
                    }
                }
                
                callback(true, successCount);
            } catch (error) {
                callback(false, error.message);
            }
        };
        
        reader.readAsText(file);
    }
};

// Gerenciador de Interface de Objetos
const ObjectManager = {
    currentObjectId: null,
    currentObjectType: null,
    
    // Inicializar
    init() {
        if (this.initialized) {
            console.log('⚠️ ObjectManager já foi inicializado');
            return;
        }
        
        console.log('🚀 ObjectManager.init() chamado');
        this.initialized = true;
        this.setupEventListeners();
        this.updateUserDisplay();
    },
    
    // Configurar event listeners
    setupEventListeners() {
        console.log('🔧 setupEventListeners() iniciado');
        
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            // Botões principais
            const btnSave = document.getElementById('btn-save-object');
            const btnMyObjects = document.getElementById('btn-my-objects');
            const btnNew = document.getElementById('btn-new-object');
            const btnLogout = document.getElementById('btn-logout');
            const btnExport = document.getElementById('btn-export');
            const btnImport = document.getElementById('btn-import');
            
            console.log('🔍 Elementos encontrados:', {
                btnSave: btnSave ? 'SIM' : 'NÃO',
                btnMyObjects: btnMyObjects ? 'SIM' : 'NÃO',
                btnNew: btnNew ? 'SIM' : 'NÃO',
                btnLogout: btnLogout ? 'SIM' : 'NÃO',
                btnExport: btnExport ? 'SIM' : 'NÃO',
                btnImport: btnImport ? 'SIM' : 'NÃO'
            });
            
            // Novo Objeto
            if (btnNew) {
                btnNew.onclick = () => {
                    console.log('🆕 Botão Novo clicado');
                    this.newObject();
                };
                console.log('✅ Listener adicionado: Novo');
            }
            
            // Salvar Objeto
            if (btnSave) {
                btnSave.onclick = async () => {
                    console.log('💾 Botão Salvar clicado');
                    await this.showSaveModal();
                };
                console.log('✅ Listener adicionado: Salvar');
            }
            
            // Meus Objetos
            if (btnMyObjects) {
                btnMyObjects.onclick = async () => {
                    console.log('📚 Botão Meus Objetos clicado');
                    await this.showObjectsList();
                };
                console.log('✅ Listener adicionado: Meus Objetos');
            }
            
            // Exportar
            if (btnExport) {
                btnExport.onclick = async () => {
                    console.log('📥 Botão Exportar clicado');
                    await this.exportObjects();
                };
                console.log('✅ Listener adicionado: Exportar');
            }
            
            // Importar
            if (btnImport) {
                btnImport.onclick = () => {
                    console.log('📤 Botão Importar clicado');
                    this.importObjects();
                };
                console.log('✅ Listener adicionado: Importar');
            }
            
            // Logout
            if (btnLogout) {
                btnLogout.onclick = () => {
                    console.log('🚪 Botão Logout clicado');
                    this.logout();
                };
                console.log('✅ Listener adicionado: Logout');
            }
            
            // Editar nome do usuário - clicar no próprio nome
            const userNameSidebar = document.getElementById('user-name-sidebar');
            if (userNameSidebar) {
                userNameSidebar.onclick = () => {
                    console.log('✏️ Nome clicado para edição');
                    this.showEditUsernamePrompt();
                };
                console.log('✅ Listener adicionado: Editar Nome (click no nome)');
            }
            
            // Modal de salvar
            const btnConfirmSave = document.getElementById('btn-confirm-save');
            const btnCancelSave = document.getElementById('btn-cancel-save');
            
            if (btnConfirmSave) {
                btnConfirmSave.onclick = () => this.confirmSave();
            }
            if (btnCancelSave) {
                btnCancelSave.onclick = () => this.closeSaveModal();
            }
            
            // Modal de lista
            const btnCloseList = document.getElementById('btn-close-list');
            if (btnCloseList) {
                btnCloseList.onclick = () => this.closeObjectsList();
            }
            
            // Fechar modais ao clicar fora
            document.querySelectorAll('.modal-overlay').forEach(overlay => {
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        this.closeAllModals();
                    }
                };
            });
            
            console.log('✅ Todos os listeners configurados!');
        }, 100);
    },
    
    // Atualizar display do usuário
    async updateUserDisplay() {
        let user = AuthManager.getCurrentUser();
        console.log('🔍 updateUserDisplay - Usuário:', user);
        
        // Se o nome estiver vazio, buscar dados atualizados do servidor
        if (user && !user.name) {
            console.log('⚠️ Nome vazio, buscando dados do servidor...');
            const result = await AuthManager.fetchUserData();
            if (result.success) {
                // Atualizar sessão com dados completos
                const profilePictureUrl = result.user.profile_picture?.url || 
                                          result.user.profile_picture?.path ||
                                          (typeof result.user.profile_picture === 'string' ? result.user.profile_picture : null);
                
                AuthManager.updateCurrentUser({
                    name: result.user.name,
                    email: result.user.email,
                    profile_picture: profilePictureUrl
                });
                
                user = AuthManager.getCurrentUser();
                console.log('✅ Dados atualizados:', user);
            }
        }
        
        if (user) {
            // Sidebar
            const userNameSidebar = document.getElementById('user-name-sidebar');
            const userEmail = document.getElementById('user-email');
            const userAvatar = document.getElementById('user-avatar');
            
            console.log('📍 Elementos:', {
                userNameSidebar: !!userNameSidebar,
                userEmail: !!userEmail,
                userAvatar: !!userAvatar,
                userName: user.name,
                userEmailValue: user.email,
                profilePicture: user.profile_picture
            });
            
            if (userNameSidebar) {
                userNameSidebar.textContent = user.name || 'Nome não disponível';
            }
            if (userEmail) {
                userEmail.textContent = user.email || 'Email não disponível';
            }
            if (userAvatar) {
                // Verificar se há foto de perfil
                if (user.profile_picture) {
                    userAvatar.style.backgroundImage = `url(${user.profile_picture})`;
                    userAvatar.textContent = '';
                } else {
                    // Usar primeira letra do nome como avatar
                    const inicial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                    userAvatar.style.backgroundImage = '';
                    userAvatar.textContent = inicial;
                }
            }
            
            // Atualizar contador de objetos
            this.updateObjectsCount();
        } else {
            console.warn('⚠️ Nenhum usuário encontrado na sessão!');
        }
        
        // Configurar menu mobile
        this.setupMobileMenu();
    },
    
    // Atualizar contador de objetos (todos os objetos do sistema)
    async updateObjectsCount() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            const objects = await StorageManager.getAllObjects();
            const counter = document.getElementById('objects-count');
            if (counter) {
                counter.textContent = objects.length;
            }
        }
    },
    
    // Configurar menu mobile
    setupMobileMenu() {
        const toggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (toggle && sidebar && overlay) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
            
            // Fechar menu ao clicar em um item
            sidebar.querySelectorAll('.menu-item').forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    }
                });
            });
        }
    },
    
    // Capturar dados do formulário atual
    captureFormData() {
        const selector = document.getElementById('object-selector');
        const type = selector.value;
        
        if (!type) {
            showToast('Selecione um tipo de objeto primeiro!', 'error');
            return null;
        }
        
        const module = GeneratorCore.modules[type];
        if (!module) {
            showToast('Módulo não encontrado!', 'error');
            return null;
        }
        
        try {
            const formData = module.getFormData(GeneratorCore);
            const htmlCode = module.createTemplate(formData);
            
            return {
                tipo: type,
                dados_formulario: formData,
                codigo_html: htmlCode
            };
        } catch (error) {
            showToast('Erro ao capturar dados: ' + error.message, 'error');
            return null;
        }
    },
    
    // Mostrar modal de salvar
    async showSaveModal() {
        const data = this.captureFormData();
        if (!data) return;
        
        this.currentObjectType = data.tipo;
        
        const modal = document.getElementById('modal-save-object');
        const input = document.getElementById('input-object-name');
        
        if (!modal) {
            console.error('❌ Modal de salvar não encontrado!');
            showToast('Erro: Modal não encontrado', 'error');
            return;
        }
        
        if (!input) {
            console.error('❌ Input de nome não encontrado!');
            showToast('Erro: Campo de nome não encontrado', 'error');
            return;
        }
        
        // Se está editando, preencher com nome atual
        if (this.currentObjectId) {
            // Buscar nome atual do objeto
            const objects = await StorageManager.getAllObjects();
            const currentObj = objects.find(o => o.id === this.currentObjectId);
            if (currentObj) {
                input.value = currentObj.nome;
            }
        } else {
            input.value = '';
        }
        
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    },
    
    // Confirmar salvamento
    async confirmSave() {
        const name = document.getElementById('input-object-name').value.trim();
        
        if (!name) {
            showToast('Digite um nome para o objeto!', 'error');
            return;
        }
        
        const data = this.captureFormData();
        if (!data) return;
        
        const user = AuthManager.getCurrentUser();
        console.log('💾 Salvando objeto com usuário:', user);
        
        if (!user || !user.name) {
            showToast('Erro: Usuário não identificado. Faça login novamente.', 'error');
            return;
        }
        
        const objectData = {
            id: this.currentObjectId,
            user_id: user.id,
            nome: name,
            created_by: user.name,
            updated_by: user.name,
            tipo: data.tipo,
            dados_formulario: data.dados_formulario,
            codigo_html: data.codigo_html
        };
        
        console.log('📦 Dados do objeto:', objectData);
        
        try {
            const saved = await StorageManager.saveObject(objectData);
            console.log('✅ Objeto salvo:', saved);
            this.currentObjectId = saved.id;
            
            showToast('Objeto salvo com sucesso!', 'success');
            
            this.closeSaveModal();
            this.updateObjectIndicator(name);
            this.updateObjectsCount();
        } catch (error) {
            console.error('❌ Erro ao salvar:', error);
            showToast('Erro ao salvar: ' + error.message, 'error');
        }
    },
    
    // Atualizar indicador de objeto carregado
    updateObjectIndicator(name) {
        const indicator = document.getElementById('sidebar-object-name');
        if (indicator) {
            indicator.textContent = name;
        }
    },
    
    // Fechar modal de salvar
    closeSaveModal() {
        document.getElementById('modal-save-object').style.display = 'none';
    },
    
    // Variáveis de controle de paginação e filtros
    currentPage: 1,
    itemsPerPage: 6,
    currentFilter: {
        type: '',
        creator: '',
        sort: 'newest'
    },
    allObjects: [],
    
    // Mostrar lista de objetos
    async showObjectsList() {
        const user = AuthManager.getCurrentUser();
        // Busca TODOS os objetos do sistema (compartilhados entre usuários)
        this.allObjects = await StorageManager.getAllObjects();
        
        console.log('📚 Objetos carregados:', this.allObjects);
        console.log('📊 Total de objetos:', this.allObjects.length);
        
        if (this.allObjects.length > 0) {
            console.log('🔍 Primeiro objeto (exemplo):', this.allObjects[0]);
        }
        
        // Resetar página ao abrir modal
        this.currentPage = 1;
        this.currentFilter = { type: '', creator: '', sort: 'newest' };
        
        // Popular filtro de criadores
        this.populateCreatorFilter();
        
        // Renderizar lista
        this.renderObjectsList();
        
        // Configurar eventos dos filtros
        this.setupFilters();
        
        document.getElementById('modal-objects-list').style.display = 'flex';
    },
    
    // Popular select de criadores
    populateCreatorFilter() {
        const creators = [...new Set(this.allObjects
            .map(obj => obj.created_by)
            .filter(creator => creator))];
        
        const select = document.getElementById('filter-creator');
        select.innerHTML = '<option value="">Todos os criadores</option>' +
            creators.map(creator => `<option value="${creator}">${creator}</option>`).join('');
    },
    
    // Configurar eventos dos filtros
    setupFilters() {
        const typeFilter = document.getElementById('filter-type');
        const creatorFilter = document.getElementById('filter-creator');
        const sortFilter = document.getElementById('filter-sort');
        const clearBtn = document.getElementById('btn-clear-filters');
        const prevBtn = document.getElementById('btn-prev-page');
        const nextBtn = document.getElementById('btn-next-page');
        
        // Remover eventos anteriores
        typeFilter.replaceWith(typeFilter.cloneNode(true));
        creatorFilter.replaceWith(creatorFilter.cloneNode(true));
        sortFilter.replaceWith(sortFilter.cloneNode(true));
        clearBtn.replaceWith(clearBtn.cloneNode(true));
        prevBtn.replaceWith(prevBtn.cloneNode(true));
        nextBtn.replaceWith(nextBtn.cloneNode(true));
        
        // Obter referências atualizadas
        const newTypeFilter = document.getElementById('filter-type');
        const newCreatorFilter = document.getElementById('filter-creator');
        const newSortFilter = document.getElementById('filter-sort');
        const newClearBtn = document.getElementById('btn-clear-filters');
        const newPrevBtn = document.getElementById('btn-prev-page');
        const newNextBtn = document.getElementById('btn-next-page');
        
        // Adicionar eventos
        newTypeFilter.addEventListener('change', () => {
            this.currentFilter.type = newTypeFilter.value;
            this.currentPage = 1;
            this.renderObjectsList();
        });
        
        newCreatorFilter.addEventListener('change', () => {
            this.currentFilter.creator = newCreatorFilter.value;
            this.currentPage = 1;
            this.renderObjectsList();
        });
        
        newSortFilter.addEventListener('change', () => {
            this.currentFilter.sort = newSortFilter.value;
            this.currentPage = 1;
            this.renderObjectsList();
        });
        
        newClearBtn.addEventListener('click', () => {
            this.currentFilter = { type: '', creator: '', sort: 'newest' };
            this.currentPage = 1;
            newTypeFilter.value = '';
            newCreatorFilter.value = '';
            newSortFilter.value = 'newest';
            this.renderObjectsList();
        });
        
        newPrevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderObjectsList();
            }
        });
        
        newNextBtn.addEventListener('click', () => {
            const filtered = this.getFilteredObjects();
            const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderObjectsList();
            }
        });
    },
    
    // Obter objetos filtrados e ordenados
    getFilteredObjects() {
        let filtered = this.allObjects.filter(obj => {
            const matchType = !this.currentFilter.type || obj.tipo === this.currentFilter.type;
            const matchCreator = !this.currentFilter.creator || obj.created_by === this.currentFilter.creator;
            return matchType && matchCreator;
        });
        
        // Ordenar por data
        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            if (this.currentFilter.sort === 'oldest') {
                return dateA - dateB; // Mais antigo primeiro
            } else {
                return dateB - dateA; // Mais recente primeiro (padrão)
            }
        });
        
        return filtered;
    },
    
    // Renderizar lista com paginação
    renderObjectsList() {
        const container = document.getElementById('objects-list');
        const filtered = this.getFilteredObjects();
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Nenhum objeto encontrado</h3>
                    <p>Tente ajustar os filtros ou crie um novo objeto!</p>
                </div>
            `;
            document.getElementById('pagination-controls').style.display = 'none';
            return;
        }
        
        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedObjects = filtered.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        
        // Renderizar cards
        container.innerHTML = paginatedObjects.map(obj => this.renderObjectCard(obj)).join('');
        
        // Atualizar controles de paginação
        document.getElementById('page-info').textContent = `Página ${this.currentPage} de ${totalPages} (${filtered.length} objetos)`;
        document.getElementById('btn-prev-page').disabled = this.currentPage === 1;
        document.getElementById('btn-next-page').disabled = this.currentPage === totalPages;
        document.getElementById('pagination-controls').style.display = totalPages > 1 ? 'flex' : 'none';
        
        // Estilo para botões desabilitados
        if (this.currentPage === 1) {
            document.getElementById('btn-prev-page').style.opacity = '0.5';
            document.getElementById('btn-prev-page').style.cursor = 'not-allowed';
        } else {
            document.getElementById('btn-prev-page').style.opacity = '1';
            document.getElementById('btn-prev-page').style.cursor = 'pointer';
        }
        
        if (this.currentPage === totalPages) {
            document.getElementById('btn-next-page').style.opacity = '0.5';
            document.getElementById('btn-next-page').style.cursor = 'not-allowed';
        } else {
            document.getElementById('btn-next-page').style.opacity = '1';
            document.getElementById('btn-next-page').style.cursor = 'pointer';
        }
    },
    
    // Renderizar card de objeto
    renderObjectCard(obj) {
        console.log('🎴 Renderizando card para:', obj);
        
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
        
        const date = new Date(obj.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        console.log('📅 Data formatada:', date);
        console.log('👤 Created by:', obj.created_by);
        console.log('✏️ Updated by:', obj.updated_by);
        
        const creatorInfo = obj.created_by ? `<span>👤 ${obj.created_by}</span>` : '<span style="opacity:0.5">👤 Criador não identificado</span>';
        const updatedInfo = obj.updated_by && obj.updated_by !== obj.created_by ? 
            `<span style="font-size: 0.85em; opacity: 0.7;">✏️ Modificado por ${obj.updated_by}</span>` : '';
        
        return `
            <div class="object-card" data-id="${obj.id}">
                <div class="object-card-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <h4 id="object-name-${obj.id}" style="margin: 0;">${obj.nome}</h4>
                        <button onclick="ObjectManager.showRenamePrompt(${obj.id}, '${obj.nome.replace(/'/g, "\\'")}', '${obj.tipo}')" 
                                class="btn-rename-inline" 
                                title="Renomear objeto"
                                style="background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px; opacity: 0.6; transition: all 0.2s;">
                            ✏️
                        </button>
                    </div>
                    <span class="object-type-badge">${typeLabels[obj.tipo] || obj.tipo}</span>
                </div>
                <div class="object-card-meta">
                    <span>📅 ${date}</span>
                    ${creatorInfo}
                    ${updatedInfo}
                </div>
                <div class="object-card-actions">
                    <button onclick="ObjectManager.loadForEdit(${obj.id})" class="btn-action btn-edit">
                        ✏️ Editar
                    </button>
                    <button onclick="ObjectManager.duplicateObject(${obj.id})" class="btn-action btn-duplicate">
                        📋 Duplicar
                    </button>
                    <button onclick="ObjectManager.deleteObject(${obj.id})" class="btn-action btn-delete">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `;
    },
    
    // Carregar objeto para edição
    async loadForEdit(id) {
        try {
            console.log('📝 Carregando objeto para edição, ID:', id);
            
            const obj = await StorageManager.getObject(id);
            console.log('📦 Objeto recuperado:', obj);
            
            if (!obj) {
                showToast('Objeto não encontrado!', 'error');
                return;
            }
            
            // Fechar modal de lista
            this.closeObjectsList();
            
            // Obter título do objeto
            const objectTitles = {
                'accordion': 'Acordeão',
                'destaque': 'Destaque',
                'dragdrop': 'Drag & Drop',
                'encontreerro': 'Encontre o Erro',
                'flashcard': 'Flashcard',
                'flipcard': 'Flip Cards',
                'guia': 'Guia Sequencial',
                'modal': 'Modal de Imagem',
                'multiplechoice': 'Múltipla Escolha',
                'timeline': 'Linha do Tempo'
            };
            
            // Navegar para página de configuração
            AppPages.goToConfig(obj.tipo, objectTitles[obj.tipo] || obj.tipo);
            
            // Aguardar a página carregar
            setTimeout(() => {
                const module = GeneratorCore.modules[obj.tipo];
                console.log('🧩 Módulo encontrado:', module ? 'SIM' : 'NÃO');
                console.log('🔍 setFormData existe?', module && module.setFormData ? 'SIM' : 'NÃO');
                console.log('📋 Dados a serem restaurados:', obj.dados_formulario);
                
                if (module && module.setFormData) {
                    // Aguardar mais um pouco para garantir que os campos foram renderizados
                    setTimeout(() => {
                        module.setFormData(obj.dados_formulario);
                        console.log('✅ Dados restaurados no formulário');
                    }, 100);
                } else {
                    console.warn('⚠️ Método setFormData não encontrado para o tipo:', obj.tipo);
                }
                
                // Marcar como editando este objeto
                this.currentObjectId = obj.id;
                this.currentObjectType = obj.tipo;
                this.updateObjectIndicator(obj.nome);
                
                showToast('Objeto carregado para edição!', 'success');
            }, 300);
        } catch (error) {
            console.error('❌ Erro ao carregar objeto:', error);
            showToast('Erro ao carregar objeto: ' + error.message, 'error');
        }
    },
    
    // Duplicar objeto (mantém criador original, atualiza modificador)
    async duplicateObject(id) {
        try {
            const obj = await StorageManager.getObject(id);
            if (!obj) return;
            
            const user = AuthManager.getCurrentUser();
            
            const newObj = {
                ...obj,
                id: null,
                nome: obj.nome + ' (cópia)',
                user_id: user.id,
                updated_by: user.name
            };
            
            delete newObj.id;
            
            await StorageManager.saveObject(newObj);
            showToast('Objeto duplicado com sucesso!', 'success');
            this.showObjectsList();
            this.updateObjectsCount();
        } catch (error) {
            showToast('Erro ao duplicar: ' + error.message, 'error');
        }
    },
    
    // Mostrar prompt de renomeação inline
    async showRenamePrompt(id, currentName, tipo) {
        const nameElement = document.getElementById(`object-name-${id}`);
        if (!nameElement) return;
        
        // Salvar HTML original
        const originalHTML = nameElement.innerHTML;
        
        // Criar input inline
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'rename-input-inline';
        input.style.cssText = `
            width: 100%;
            padding: 4px 8px;
            border: 2px solid var(--color-azul-moderno);
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            font-family: var(--font-primary);
            outline: none;
        `;
        
        // Substituir h4 pelo input
        nameElement.innerHTML = '';
        nameElement.appendChild(input);
        input.focus();
        input.select();
        
        // Função para salvar
        const saveRename = async () => {
            const newName = input.value.trim();
            
            if (!newName) {
                nameElement.innerHTML = originalHTML;
                showToast('Nome não pode estar vazio!', 'error');
                return;
            }
            
            if (newName === currentName) {
                nameElement.innerHTML = originalHTML;
                return; // Mesmo nome, só restaura
            }
            
            try {
                const user = AuthManager.getCurrentUser();
                
                // Buscar objeto atual
                const objects = await StorageManager.getAllObjects();
                const obj = objects.find(o => o.id === id);
                
                if (!obj) {
                    nameElement.innerHTML = originalHTML;
                    showToast('Objeto não encontrado!', 'error');
                    return;
                }
                
                // Atualizar apenas o nome
                const updatedData = {
                    id: obj.id,
                    user_id: obj.user_id,
                    nome: newName,
                    created_by: obj.created_by,
                    updated_by: user.name,
                    tipo: obj.tipo,
                    dados_formulario: obj.dados_formulario,
                    codigo_html: obj.codigo_html
                };
                
                await StorageManager.saveObject(updatedData);
                
                // Atualizar visualmente
                nameElement.textContent = newName;
                
                showToast('Nome atualizado!', 'success');
                
                // Se estava editando este objeto, atualizar indicador
                if (this.currentObjectId === id) {
                    this.updateObjectIndicator(newName);
                }
            } catch (error) {
                nameElement.innerHTML = originalHTML;
                showToast('Erro ao renomear: ' + error.message, 'error');
                console.error('Erro ao renomear:', error);
            }
        };
        
        // Função para cancelar
        const cancelRename = () => {
            nameElement.innerHTML = originalHTML;
        };
        
        // Enter para salvar
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRename();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelRename();
            }
        });
        
        // Blur para salvar
        input.addEventListener('blur', () => {
            setTimeout(() => saveRename(), 100);
        });
    },
    
    // Deletar objeto
    async deleteObject(id) {
        if (!confirm('Tem certeza que deseja excluir este objeto?')) return;
        
        const user = AuthManager.getCurrentUser();
        
        try {
            await StorageManager.deleteObject(id, user.id);
            showToast('Objeto excluído!', 'success');
            
            // Se estava editando este objeto, limpar
            if (this.currentObjectId === id) {
                this.currentObjectId = null;
            }
            
            this.showObjectsList();
            this.updateObjectsCount();
        } catch (error) {
            showToast('Erro ao excluir: ' + error.message, 'error');
        }
    },
    
    // Criar novo objeto (limpar formulário)
    newObject() {
        if (this.currentObjectId && !confirm('Descartar alterações atuais?')) return;
        
        this.currentObjectId = null;
        this.currentObjectType = null;
        
        // Remover indicador
        const indicator = document.getElementById('sidebar-object-name');
        if (indicator) indicator.textContent = 'Nenhum objeto carregado';
        
        // Recarregar página para limpar tudo
        window.location.reload();
    },
    
    // Exportar objetos
    async exportObjects() {
        const user = AuthManager.getCurrentUser();
        await StorageManager.exportToJSON(user.id);
        showToast('Objetos exportados!', 'success');
    },
    
    // Importar objetos
    importObjects() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const user = AuthManager.getCurrentUser();
            
            await StorageManager.importFromJSON(file, user.id, (success, result) => {
                if (success) {
                    showToast(`${result} objetos importados!`, 'success');
                    this.updateObjectsCount();
                } else {
                    showToast('Erro ao importar: ' + result, 'error');
                }
            });
        };
        
        input.click();
    },
    
    // Logout
    logout() {
        if (!confirm('Deseja realmente sair?')) return;
        
        AuthManager.logout();
        window.location.href = 'login.html';
    },
    
    // Fechar lista de objetos
    closeObjectsList() {
        document.getElementById('modal-objects-list').style.display = 'none';
    },
    
    // Fechar todos os modais
    closeAllModals() {
        this.closeSaveModal();
        this.closeObjectsList();
    }
};

// Inicializar quando o DOM estiver pronto
console.log('📄 storage-manager-xano.js carregado');

// Função para inicializar
function initObjectManager() {
    console.log('🎯 Tentando inicializar ObjectManager...');
    if (typeof ObjectManager !== 'undefined') {
        ObjectManager.init();
    } else {
        console.error('❌ ObjectManager não definido!');
    }
}

// Tentar várias formas de inicialização
if (document.readyState === 'loading') {
    console.log('⏳ DOM ainda carregando, aguardando DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initObjectManager);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('✅ DOM já pronto, inicializando imediatamente...');
    initObjectManager();
}

// Garantir inicialização após load completo
window.addEventListener('load', () => {
    console.log('🔄 Window load event - reinicializando se necessário...');
    if (!ObjectManager.initialized) {
        initObjectManager();
    }
});

// Expor para teste global
window.ObjectManager = ObjectManager;
window.testObjectManager = () => {
    console.log('🧪 Teste do ObjectManager:', {
        initialized: ObjectManager.initialized,
        currentObjectId: ObjectManager.currentObjectId,
        buttons: {
            'btn-save-object': !!document.getElementById('btn-save-object'),
            'btn-my-objects': !!document.getElementById('btn-my-objects'),
            'btn-new-object': !!document.getElementById('btn-new-object'),
            'btn-logout': !!document.getElementById('btn-logout'),
            'btn-export': !!document.getElementById('btn-export'),
            'btn-import': !!document.getElementById('btn-import')
        }
    });
};

// Sistema de Upload de Foto de Perfil
const ProfilePictureManager = {
    init() {
        const userAvatar = document.getElementById('user-avatar');
        const avatarUpload = document.getElementById('avatar-upload');
        
        if (userAvatar && avatarUpload) {
            // Clicar no avatar abre o seletor de arquivo
            userAvatar.addEventListener('click', () => {
                avatarUpload.click();
            });
            
            // Quando selecionar arquivo, fazer upload
            avatarUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await this.uploadProfilePicture(file);
                }
            });
            
            console.log('✅ ProfilePictureManager inicializado');
        }
    },
    
    async uploadProfilePicture(file) {
        try {
            // Validar tipo de arquivo
            if (!file.type.startsWith('image/')) {
                alert('Por favor, selecione uma imagem válida.');
                return;
            }
            
            // Validar tamanho (máx 500KB)
            if (file.size > 500 * 1024) {
                alert('A imagem deve ter no máximo 500KB.');
                return;
            }
            
            console.log('📤 Fazendo upload da foto de perfil...');
            const userAvatar = document.getElementById('user-avatar');
            
            // Mostrar loading
            if (userAvatar) {
                userAvatar.style.opacity = '0.5';
                userAvatar.textContent = '⏳';
            }
            
            // Converter imagem para base64
            const base64 = await this.fileToBase64(file);
            
            console.log('📦 Imagem convertida para base64');
            
            // Enviar para Xano como JSON
            const authToken = AuthManager.getAuthToken();
            
            const response = await fetch(`${AuthManager.API_BASE_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile_picture: base64
                })
            });
            
            console.log('📡 Status da resposta:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ Erro da API:', errorData);
                throw new Error(errorData.message || 'Erro ao atualizar foto de perfil');
            }
            
            const updatedUser = await response.json();
            console.log('✅ Foto de perfil atualizada');
            console.log('📦 Resposta do servidor:', updatedUser);
            console.log('🖼️ Profile picture recebido:', updatedUser.profile_picture);
            
            // A imagem agora é base64, usar diretamente
            const imageUrl = updatedUser.profile_picture || base64;
            console.log('🔗 URL final da imagem:', imageUrl);
            
            // Atualizar usuário no localStorage
            AuthManager.updateCurrentUser({
                name: updatedUser.name,
                email: updatedUser.email,
                profile_picture: imageUrl
            });
            
            console.log('💾 Dados salvos no localStorage:', AuthManager.getCurrentUser());
            
            // Atualizar display
            if (userAvatar) {
                userAvatar.style.opacity = '1';
                userAvatar.style.backgroundImage = `url(${imageUrl})`;
                userAvatar.textContent = '';
            }
            
            alert('Foto de perfil atualizada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao fazer upload da foto:', error);
            alert('Erro ao atualizar foto de perfil. Tente novamente.');
            
            // Restaurar avatar
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                userAvatar.style.opacity = '1';
                ObjectManager.updateUserDisplay();
            }
        }
    },
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};

// Inicializar ProfilePictureManager quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProfilePictureManager.init());
} else {
    ProfilePictureManager.init();
}

// Adicionar métodos de edição de nome ao ObjectManager
ObjectManager.showEditUsernamePrompt = function() {
    const user = AuthManager.getCurrentUser();
    const currentName = user.name || '';
    const nameElement = document.getElementById('user-name-sidebar');
    
    if (!nameElement) return;
    
    // Verificar se já está editando (se já tem um input)
    if (nameElement.querySelector('input')) {
        return; // Já está editando, não fazer nada
    }
    
    // Salvar HTML original
    const originalHTML = nameElement.innerHTML;
    
    // Remover temporariamente o evento de click do elemento pai
    const originalOnClick = nameElement.onclick;
    nameElement.onclick = null;
    
    // Criar input inline
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'rename-input-inline';
    input.style.cssText = `
        width: 100%;
        padding: 6px 10px;
        border: 2px solid var(--color-azul-moderno);
        border-radius: 6px;
        font-size: 1.05rem;
        font-weight: 600;
        font-family: var(--font-primary);
        background: rgba(10, 136, 244, 0.1);
        color: white;
        outline: none;
    `;
    
    // Prevenir propagação de eventos do input
    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    input.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    // Substituir nome pelo input
    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    input.focus();
    input.select();
    
    // Flag para evitar salvamentos duplicados
    let isSaving = false;
    
    // Função para salvar
    const saveRename = async () => {
        // Prevenir múltiplos salvamentos
        if (isSaving) return;
        isSaving = true;
        
        const newName = input.value.trim();
        
        if (!newName) {
            alert('O nome não pode estar vazio');
            isSaving = false;
            input.focus();
            return;
        }
        
        if (newName === currentName) {
            // Sem mudanças, só restaurar
            nameElement.innerHTML = originalHTML;
            return;
        }
        
        // Salvar novo nome
        await this.updateUsername(newName);
    };
    
    // Função para cancelar
    const cancelRename = () => {
        if (isSaving) return;
        nameElement.innerHTML = originalHTML;
        nameElement.onclick = originalOnClick;
    };
    
    // Enter para salvar
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelRename();
        }
    });
    
    // Perder foco salva
    input.addEventListener('blur', () => {
        setTimeout(saveRename, 100);
    });
};

ObjectManager.updateUsername = async function(newName) {
    const nameElement = document.getElementById('user-name-sidebar');
    
    try {
        // Mostrar loading
        if (nameElement) {
            nameElement.innerHTML = '⏳ Salvando...';
        }
        
        const authToken = AuthManager.getAuthToken();
        
        const response = await fetch(`${AuthManager.API_BASE_URL}/auth/me`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newName
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erro ao atualizar nome');
        }
        
        const updatedUser = await response.json();
        console.log('✅ Resposta do servidor:', updatedUser);
        
        // Se retornou apenas uma string (nome), usar com dados atuais
        let userData;
        if (typeof updatedUser === 'string') {
            const currentUser = AuthManager.getCurrentUser();
            userData = {
                name: updatedUser,
                email: currentUser.email,
                profile_picture: currentUser.profile_picture
            };
        } else if (updatedUser && updatedUser.name) {
            userData = {
                name: updatedUser.name,
                email: updatedUser.email,
                profile_picture: updatedUser.profile_picture
            };
        } else {
            throw new Error('Resposta inválida do servidor');
        }
        
        // Atualizar localStorage
        AuthManager.updateCurrentUser(userData);
        
        // Restaurar display com novo nome
        if (nameElement) {
            // Limpar conteúdo (remover input se existir)
            nameElement.innerHTML = '';
            nameElement.textContent = userData.name;
            
            // Restaurar atributos
            nameElement.title = 'Clique para editar seu nome';
            nameElement.onclick = () => {
                ObjectManager.showEditUsernamePrompt();
            };
            
            // Feedback visual de sucesso
            nameElement.style.color = '#c3eb1e';
            setTimeout(() => {
                nameElement.style.color = '';
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar nome:', error);
        alert('Erro ao atualizar nome. Tente novamente.');
        
        // Restaurar nome original
        const user = AuthManager.getCurrentUser();
        if (nameElement && user) {
            // Limpar conteúdo (remover input se existir)
            nameElement.innerHTML = '';
            nameElement.textContent = user.name;
            
            // Restaurar atributos
            nameElement.title = 'Clique para editar seu nome';
            nameElement.onclick = () => {
                ObjectManager.showEditUsernamePrompt();
            };
        }
    }
};
