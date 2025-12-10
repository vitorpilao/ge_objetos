// storage-manager.js - Gerenciador de Objetos Salvos (LocalStorage - depois migrar para Xano)

const StorageManager = {
    OBJECTS_KEY: 'ge_objetos',
    
    // Obter todos os objetos (acessíveis por qualquer usuário)
    getObjects(userId) {
        // Retorna todos os objetos do sistema, não filtrados por usuário
        return this.getAllObjects();
    },
    
    // Obter todos os objetos (admin)
    getAllObjects() {
        const objects = localStorage.getItem(this.OBJECTS_KEY);
        return objects ? JSON.parse(objects) : [];
    },
    
    // Salvar todos os objetos
    saveAllObjects(objects) {
        localStorage.setItem(this.OBJECTS_KEY, JSON.stringify(objects));
    },
    
    // Adicionar ou atualizar objeto
    saveObject(objectData) {
        const objects = this.getAllObjects();
        
        if (objectData.id) {
            // Atualizar existente
            const index = objects.findIndex(obj => obj.id === objectData.id);
            if (index !== -1) {
                objects[index] = {
                    ...objects[index],
                    ...objectData,
                    updated_at: new Date().toISOString(),
                    updated_by: objectData.updated_by || objects[index].updated_by
                };
            }
        } else {
            // Criar novo
            const newObject = {
                ...objectData,
                id: Date.now(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: objectData.created_by,
                updated_by: objectData.created_by
            };
            objects.push(newObject);
            objectData.id = newObject.id;
        }
        
        this.saveAllObjects(objects);
        return objectData;
    },
    
    // Obter um objeto específico
    getObject(id) {
        const objects = this.getAllObjects();
        return objects.find(obj => obj.id === id);
    },
    
    // Deletar objeto (qualquer usuário pode deletar)
    deleteObject(id, userId) {
        let objects = this.getAllObjects();
        const obj = objects.find(o => o.id === id);
        
        if (!obj) {
            throw new Error('Objeto não encontrado');
        }
        
        // Qualquer usuário pode deletar qualquer objeto
        objects = objects.filter(obj => obj.id !== id);
        this.saveAllObjects(objects);
        return true;
    },
    
    // Exportar objetos para JSON (todos os objetos do sistema)
    exportToJSON(userId) {
        const objects = this.getAllObjects();
        const dataStr = JSON.stringify(objects, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `objetos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },
    
    // Importar objetos de JSON
    importFromJSON(file, userId, callback) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const objects = JSON.parse(e.target.result);
                
                // Adicionar user_id aos objetos importados
                objects.forEach(obj => {
                    delete obj.id; // Remover ID antigo
                    obj.user_id = userId;
                    this.saveObject(obj);
                });
                
                callback(true, objects.length);
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
                btnSave.onclick = () => {
                    console.log('💾 Botão Salvar clicado');
                    this.showSaveModal();
                };
                console.log('✅ Listener adicionado: Salvar');
            }
            
            // Meus Objetos
            if (btnMyObjects) {
                btnMyObjects.onclick = () => {
                    console.log('📚 Botão Meus Objetos clicado');
                    this.showObjectsList();
                };
                console.log('✅ Listener adicionado: Meus Objetos');
            }
            
            // Exportar
            if (btnExport) {
                btnExport.onclick = () => {
                    console.log('📥 Botão Exportar clicado');
                    this.exportObjects();
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
    updateUserDisplay() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            // Sidebar
            const userNameSidebar = document.getElementById('user-name-sidebar');
            const userEmail = document.getElementById('user-email');
            const userAvatar = document.getElementById('user-avatar');
            
            if (userNameSidebar) {
                userNameSidebar.textContent = user.name;
            }
            if (userEmail) {
                userEmail.textContent = user.email;
            }
            if (userAvatar) {
                // Usar primeira letra do nome como avatar
                userAvatar.textContent = user.name.charAt(0).toUpperCase();
            }
            
            // Atualizar contador de objetos
            this.updateObjectsCount();
        }
        
        // Configurar menu mobile
        this.setupMobileMenu();
    },
    
    // Atualizar contador de objetos (todos os objetos do sistema)
    updateObjectsCount() {
        const user = AuthManager.getCurrentUser();
        if (user) {
            const objects = StorageManager.getAllObjects();
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
    showSaveModal() {
        const data = this.captureFormData();
        if (!data) return;
        
        this.currentObjectType = data.tipo;
        
        const modal = document.getElementById('modal-save');
        const input = document.getElementById('input-object-name');
        
        // Se está editando, preencher com nome atual
        if (this.currentObjectId) {
            const obj = StorageManager.getObject(this.currentObjectId);
            if (obj) {
                input.value = obj.nome;
            }
        } else {
            input.value = '';
        }
        
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    },
    
    // Confirmar salvamento
    confirmSave() {
        const name = document.getElementById('input-object-name').value.trim();
        
        if (!name) {
            showToast('Digite um nome para o objeto!', 'error');
            return;
        }
        
        const data = this.captureFormData();
        if (!data) return;
        
        const user = AuthManager.getCurrentUser();
        
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
        
        try {
            const saved = StorageManager.saveObject(objectData);
            this.currentObjectId = saved.id;
            
            showToast('Objeto salvo com sucesso!', 'success');
            
            this.closeSaveModal();
            this.updateObjectIndicator(name);
            this.updateObjectsCount();
        } catch (error) {
            showToast('❌ Erro ao salvar: ' + error.message, 'error');
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
        document.getElementById('modal-save').style.display = 'none';
    },
    
    // Mostrar lista de objetos
    showObjectsList() {
        const user = AuthManager.getCurrentUser();
        // Busca TODOS os objetos do sistema (compartilhados entre usuários)
        const objects = StorageManager.getAllObjects();
        
        const container = document.getElementById('objects-list');
        
        if (objects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Nenhum objeto salvo</h3>
                    <p>Crie e salve o primeiro objeto interativo!</p>
                </div>
            `;
        } else {
            container.innerHTML = objects.map(obj => this.renderObjectCard(obj)).join('');
        }
        
        document.getElementById('modal-objects-list').style.display = 'flex';
    },
    
    // Renderizar card de objeto
    renderObjectCard(obj) {
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
        const date = safeDate(obj.created_at);
            minute: '2-digit'
        });
        
        const creatorInfo = obj.created_by ? `<span>👤 ${obj.created_by}</span>` : '';
        const updatedInfo = obj.updated_by && obj.updated_by !== obj.created_by ? 
            `<span style="font-size: 0.85em; opacity: 0.7;">✏️ Modificado por ${obj.updated_by}</span>` : '';
        
        return `
            <div class="object-card" data-id="${obj.id}">
                <div class="object-card-header">
                    <h4>${obj.nome}</h4>
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
    loadForEdit(id) {
        const obj = StorageManager.getObject(id);
        if (!obj) {
            showToast('Objeto não encontrado!', 'error');
            return;
        }
        
        this.currentObjectId = id;
        this.currentObjectType = obj.tipo;
        
        // Fechar modal
        this.closeObjectsList();
        
        // Selecionar tipo
        const selector = document.getElementById('object-selector');
        selector.value = obj.tipo;
        selector.dispatchEvent(new Event('change'));
        
        // Aguardar painel abrir e preencher
        setTimeout(() => {
            this.populateForm(obj.tipo, obj.dados_formulario);
            this.updateObjectIndicator(obj.nome);
            showToast('Objeto carregado para edição!', 'success');
        }, 300);
    },
    
    // Preencher formulário com dados
    populateForm(type, data) {
        // Percorrer dados e preencher campos
        for (const [key, value] of Object.entries(data)) {
            // Tentar diferentes estratégias de localização
            let input = document.getElementById(`input-${type}-${key}`);
            
            if (!input) {
                // Tentar sem prefixo
                input = document.getElementById(key);
            }
            
            if (input) {
                if (input.tagName === 'SELECT') {
                    input.value = value;
                } else if (input.classList.contains('wysiwyg-editor')) {
                    input.innerHTML = value;
                    // Disparar evento para atualizar o input oculto
                    input.dispatchEvent(new Event('input'));
                } else {
                    input.value = value;
                }
            }
        }
    },
    
    // Duplicar objeto (mantém criador original, atualiza modificador)
    duplicateObject(id) {
        const obj = StorageManager.getObject(id);
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
        
        StorageManager.saveObject(newObj);
        showToast('Objeto duplicado com sucesso!', 'success');
        this.showObjectsList();
        this.updateObjectsCount();
    },
    
    // Deletar objeto
    async deleteObject(id) {
        const confirmed = await GeneratorCore.showAppConfirm('Tem certeza que deseja excluir este objeto?');
        if (!confirmed) return;
        
        const user = AuthManager.getCurrentUser();
        
        try {
            StorageManager.deleteObject(id, user.id);
            showToast('Objeto excluído!', 'success');
            
            // Se estava editando este objeto, limpar
            if (this.currentObjectId === id) {
                this.currentObjectId = null;
            }
            
            this.showObjectsList();
            this.updateObjectsCount();
        } catch (error) {
            showToast('❌ ' + error.message, 'error');
        }
    },
    
    // Criar novo objeto (limpar formulário)
    async newObject() {
        if (this.currentObjectId) {
            const confirmed = await GeneratorCore.showAppConfirm('Descartar alterações atuais?');
            if (!confirmed) return;
        }
        
        this.currentObjectId = null;
        this.currentObjectType = null;
        
        // Remover indicador
        const indicator = document.getElementById('sidebar-object-name');
        if (indicator) indicator.textContent = 'Nenhum objeto carregado';
        
        // Recarregar página para limpar tudo
        window.location.reload();
    },
    
    // Exportar objetos
    exportObjects() {
        const user = AuthManager.getCurrentUser();
        StorageManager.exportToJSON(user.id);
        showToast('Objetos exportados!', 'success');
    },
    
    // Importar objetos
    importObjects() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const user = AuthManager.getCurrentUser();
            
            StorageManager.importFromJSON(file, user.id, (success, result) => {
                if (success) {
                    showToast(`${result} objetos importados!`, 'success');
                } else {
                    showToast('❌ Erro ao importar: ' + result, 'error');
                }
            });
        };
        
        input.click();
    },
    
    // Logout
    async logout() {
        const confirmed = await GeneratorCore.showAppConfirm('Deseja realmente sair?');
        if (!confirmed) return;
        
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
console.log('📄 storage-manager.js carregado');

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
