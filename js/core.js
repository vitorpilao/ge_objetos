// js/core.js
// Núcleo da Central de Componentes (v6.1.4 - Correção do Botão Copiar)

const GeneratorCore = {
    modules: {},
    utils: {
        colorContrastMap: {
            '#FFFFFF': '#030200', '#F8F9FA': '#030200',
            '#030200': '#FFFFFF', '#00011E': '#FFFFFF',
            '#0A88F4': '#FFFFFF', '#FF7A00': '#FFFFFF',
            '#9D4DFF': '#FFFFFF', '#C3EB1E': '#030200',
            '#FF8C00': '#FFFFFF', '#28a745': '#FFFFFF'
        },
        getContrastColor(hex) {
            return this.colorContrastMap[hex] || '#FFFFFF';
        },
        setupCopyButton(btnId, textareaId) {
            const btn = document.getElementById(btnId);
            const textarea = document.getElementById(textareaId);
            if (!btn || !textarea) return;
            btn.addEventListener('click', () => {
                if (!textarea.value) {
                    console.warn("Nada para copiar, textarea está vazia.");
                    return;
                }
                navigator.clipboard.writeText(textarea.value)
                    .then(() => {
                        const originalText = btn.textContent;
                        btn.textContent = 'Copiado com Sucesso!';
                        btn.style.backgroundColor = '#28a745';
                        btn.style.color = '#FFFFFF';
                        setTimeout(() => {
                            btn.textContent = originalText;
                            btn.style.backgroundColor = '';
                            btn.style.color = '';
                        }, 2500);
                    })
                    .catch(err => console.error('Erro ao copiar: ', err));
            });
        },
        setupPreviewBg(selectId, containerId) {
            const selector = document.getElementById(selectId);
            const container = document.getElementById(containerId);
            if (selector && container) {
                container.style.backgroundColor = selector.value;
                selector.addEventListener('change', () => {
                    container.style.backgroundColor = selector.value;
                });
            }
        },

        // --- EDITOR VISUAL (WYSIWYG) ---
        enableRichText(originalInput) {
            const isSingleLine = originalInput.tagName === 'INPUT';
            const wrapper = document.createElement('div');
            wrapper.className = 'rich-text-wrapper' + (isSingleLine ? ' single-line' : '');
            const editor = document.createElement('div');
            editor.className = 'wysiwyg-editor';
            editor.contentEditable = true;
            editor.setAttribute('data-placeholder', originalInput.getAttribute('placeholder') || 'Digite aqui...');
            // Protege contra 'undefined' sendo escrito no editor quando o input não tem value
            const initialValue = (typeof originalInput.value === 'string') ? originalInput.value : '';
            editor.innerHTML = initialValue || '';
            const toolbar = document.createElement('div');
            toolbar.className = 'rich-text-toolbar';

            const tools = [
                { icon: '<b>B</b>', command: 'bold', title: 'Negrito' },
                { icon: '<i>I</i>', command: 'italic', title: 'Itálico' },
                { icon: '<u>U</u>', command: 'underline', title: 'Sublinhado' }
            ];
            if (!isSingleLine) {
                tools.push({ icon: '↵', command: 'insertHTML', value: '<br>', title: 'Inserir Quebra de Linha' });
            }

            tools.forEach(tool => {
                const btn = document.createElement('button');
                btn.innerHTML = tool.icon;
                btn.title = tool.title;
                btn.type = 'button';
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    document.execCommand(tool.command, false, tool.value || null);
                    syncData();
                });
                toolbar.appendChild(btn);
            });

            const colorWrapper = document.createElement('div');
            colorWrapper.style.display = 'flex';
            colorWrapper.style.alignItems = 'center';
            colorWrapper.style.marginLeft = '8px';
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'rich-text-color-picker';
            colorPicker.value = '#000000';
            colorPicker.title = 'Escolher Cor do Texto';
            colorPicker.addEventListener('change', () => {
                editor.focus();
                document.execCommand('foreColor', false, colorPicker.value);
                syncData();
            });
            const colorLabel = document.createElement('span');
            colorLabel.innerText = 'Cor: ';
            colorLabel.style.fontSize = '0.8rem';
            colorLabel.style.marginRight = '4px';
            colorLabel.style.opacity = '0.8';
            toolbar.appendChild(colorWrapper);
            colorWrapper.appendChild(colorLabel);
            colorWrapper.appendChild(colorPicker);

            const syncData = () => {
                originalInput.value = editor.innerHTML;
            };
            editor.addEventListener('input', syncData);
            editor.addEventListener('blur', syncData);
            editor.addEventListener('paste', (e) => {
                setTimeout(syncData, 0);
            });
            if (isSingleLine) {
                editor.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') e.preventDefault();
                });
            }

            originalInput.parentNode.insertBefore(wrapper, originalInput);
            wrapper.appendChild(originalInput);
            wrapper.appendChild(toolbar);
            wrapper.appendChild(editor);
            originalInput.style.display = 'none';
            
            // Remove 'required' para evitar erro "invalid form control"
            if (originalInput.hasAttribute('required')) {
                originalInput.removeAttribute('required');
                // Marca o editor como obrigatório visualmente
                editor.setAttribute('data-required', 'true');
            }

            return { editor: editor, wrapper: wrapper };
        },
    },

    // --- REGISTRADOR DE MÓDULOS ---
    registerModule(type, moduleDef) {
        try {
            this.modules[type] = moduleDef;
            const form = document.getElementById(`generator-form-${type}`);
            if (!form) {
                console.warn(`[GeneratorCore] Formulário não encontrado: ${type}`);
                return;
            }
            const elements = {
                outputSection: document.getElementById(`output-section-${type}`),
                codeTextarea: document.getElementById(`output-code-${type}`),
                previewIframe: document.getElementById(`preview-iframe-${type}`),
            };
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Sincroniza todos os editores WYSIWYG antes de coletar dados
                const editors = form.querySelectorAll('.wysiwyg-editor');
                editors.forEach((editor, idx) => {
                    editor.blur();
                    // Força sincronização do conteúdo do editor para o input original
                    const syncEvent = new Event('input', { bubbles: true });
                    editor.dispatchEvent(syncEvent);
                });
                try {
                    const formData = moduleDef.getFormData(this);
                    // Log rápido dos hotspots coletados para facilitar debug ao clicar em Visualizar
                    try {
                        if (type === 'modal' && formData && formData.hotspots) {
                            console.info('[GeneratorCore] Hotspots coletados:', formData.hotspots);
                        }
                    } catch (err) {
                        console.warn('[GeneratorCore] Erro ao logar hotspots:', err);
                    }
                    const finalCode = moduleDef.createTemplate(formData);

                    // ==========================================================
                    // =================== CORREÇÃO PRINCIPAL ===================
                    // ==========================================================
                    // 'srcdoc' é substituído por 'src' com Data URI.
                    // Isso força o 'Standards Mode' e corrige o layout do CSS (Grid/Flex).
                    if (elements.previewIframe) {
                        elements.previewIframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(finalCode);
                    } else {
                    // ==========================================================
                        console.error(`[GeneratorCore] Iframe de preview não encontrado para: ${type}`);
                        return;
                    }

                    // --- ESTA É A LINHA QUE FALTAVA ---
                    elements.codeTextarea.value = finalCode; 
                    // --- FIM DA CORREÇÃO ---

                    elements.outputSection.style.display = 'block';
                    elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (err) {
                    console.error(`[GeneratorCore] Erro ao GERAR componente ${type}:`, err);
                    alert(`Ocorreu um erro ao gerar o componente ${type}. Verifique o console.`);
                }
            });
            this.utils.setupCopyButton(`copy-button-${type}`, `output-code-${type}`);
            this.utils.setupPreviewBg(`preview-bg-${type}`, `preview-container-${type}`);
            if (moduleDef.setup) {
                moduleDef.setup(this);
            }
        } catch (err) {
            console.error(`[GeneratorCore] Erro fatal ao REGISTRAR módulo ${type}:`, err);
        }
    },

    // --- MODAL DE DEMO INTERATIVO ---
    showDemoModal(demo, title) {
        // Criar modal
        const modal = document.createElement('div');
        modal.className = 'demo-modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px;';
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = 'background: white; border-radius: 12px; max-width: 1000px; width: 100%; max-height: 90vh; overflow: auto; padding: 30px; position: relative;';
        
        // Header do modal
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #0A88F4; padding-bottom: 16px;';
        header.innerHTML = `
            <h2 style="margin: 0; color: #0A88F4;">🎮 ${title} - Modo Interativo</h2>
            <button onclick="this.closest('.demo-modal-overlay').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 8px; opacity: 0.6; transition: opacity 0.2s; color: #333;">✕</button>
        `;
        
        // Conteúdo do demo (interativo)
        const demoContainer = document.createElement('div');
        demoContainer.style.cssText = 'background: #f5f5f5; padding: 30px; border-radius: 8px; min-height: 400px;';
        
        // Processar HTML para remover estilos problemáticos
        let isolatedHTML = demo.codigo_html;
        isolatedHTML = isolatedHTML.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
            let isolatedCSS = css.replace(/html\s*,?\s*body\s*{[^}]*}/gi, '');
            isolatedCSS = isolatedCSS.replace(/body\s*{[^}]*}/gi, '');
            return `<style>${isolatedCSS}</style>`;
        });
        
        demoContainer.innerHTML = isolatedHTML;
        
        // Reexecutar scripts
        const scripts = demoContainer.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        // Footer com botão de fechar
        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top: 24px; text-align: center;';
        footer.innerHTML = `
            <button onclick="this.closest('.demo-modal-overlay').remove()" style="background: #0A88F4; color: white; border: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 1rem;">
                Fechar
            </button>
        `;
        
        modalContent.appendChild(header);
        modalContent.appendChild(demoContainer);
        modalContent.appendChild(footer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Fechar ao clicar no fundo
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },

    // --- GALERIA DE OBJETOS ---
    async initObjectGallery() {
        const objectTypes = [
            {
                id: 'accordion',
                icon: '📋',
                title: 'Acordeão',
                description: 'Organize conteúdo em seções expansíveis e recolhíveis'
            },
            {
                id: 'destaque',
                icon: '⭐',
                title: 'Destaque',
                description: 'Destaque informações importantes com visual atrativo'
            },
            {
                id: 'dragdrop',
                icon: '🎯',
                title: 'Drag & Drop',
                description: 'Arraste e solte itens em categorias corretas'
            },
            {
                id: 'encontreerro',
                icon: '🔍',
                title: 'Encontre o Erro',
                description: 'Identifique e corrija erros em um texto'
            },
            {
                id: 'flashcard',
                icon: '🃏',
                title: 'Flashcard',
                description: 'Cartões interativos para memorização de conceitos'
            },
            {
                id: 'flipcard',
                icon: '🔄',
                title: 'Flip Cards',
                description: 'Cartões com frente e verso que giram ao clicar'
            },
            {
                id: 'guia',
                icon: '📍',
                title: 'Guia Sequencial',
                description: 'Passo a passo interativo com navegação'
            },
            {
                id: 'modal',
                icon: '🖼️',
                title: 'Modal de Imagem',
                description: 'Imagem com pontos clicáveis que abrem informações'
            },
            {
                id: 'multiplechoice',
                icon: '✅',
                title: 'Múltipla Escolha',
                description: 'Quiz com perguntas e alternativas'
            },
            {
                id: 'timeline',
                icon: '📅',
                title: 'Linha do Tempo',
                description: 'Visualize eventos cronológicos de forma interativa'
            }
        ];

        const gallery = document.getElementById('object-type-gallery');
        if (!gallery) return;

        // Carregar demos do Xano
        let demosMap = {};
        try {
            const allDemos = await StorageManager.getDemoObjects();
            console.log('📦 Todos os demos retornados:', allDemos);
            allDemos.forEach(demo => {
                const tipo = demo.tipo.toLowerCase();
                demosMap[tipo] = demo;
                console.log(`✅ Demo mapeado: ${tipo} =>`, demo);
            });
            console.log('📦 Mapa final de demos:', demosMap);
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar demos:', error);
        }

        objectTypes.forEach(obj => {
            const card = document.createElement('div');
            card.className = 'object-card';
            card.setAttribute('data-type', obj.id);
            
            // Verificar se existe demo para este tipo
            const demo = demosMap[obj.id];
            console.log(`🔍 Procurando demo para tipo "${obj.id}":`, demo ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
            
            if (demo && demo.codigo_html) {
                console.log(`✅ Renderizando preview para ${obj.id}`);
                console.log('HTML do demo:', demo.codigo_html.substring(0, 100) + '...');
                // Card com preview do demo
                const previewDiv = document.createElement('div');
                previewDiv.className = 'object-card-preview';
                
                // Inserir HTML e isolar estilos dentro do preview
                let isolatedHTML = demo.codigo_html;
                // Adicionar prefixo .object-card-preview nos seletores CSS para isolar
                isolatedHTML = isolatedHTML.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
                    // Remover estilos globais problemáticos
                    let isolatedCSS = css.replace(/html\s*,?\s*body\s*{[^}]*}/gi, '');
                    isolatedCSS = isolatedCSS.replace(/body\s*{[^}]*}/gi, '');
                    return `<style>${isolatedCSS}</style>`;
                });
                
                previewDiv.innerHTML = isolatedHTML;
                
                console.log('Preview div criada:', previewDiv);
                console.log('Conteúdo do preview:', previewDiv.innerHTML.substring(0, 200));
                
                // Adicionar ao DOM primeiro para que os scripts possam encontrar os elementos
                card.appendChild(previewDiv);
                
                // Reexecutar scripts do demo após adicionar ao DOM
                const scripts = previewDiv.querySelectorAll('script');
                scripts.forEach((oldScript, idx) => {
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    try {
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    } catch (err) {
                        console.error(`Erro ao executar script do demo:`, err);
                    }
                });
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'object-card-title-wrapper';
                titleDiv.innerHTML = `<h3 class="object-card-title">${obj.title}</h3>`;
                
                const descDiv = document.createElement('div');
                descDiv.className = 'object-card-description-wrapper';
                descDiv.innerHTML = `<p class="object-card-description">${obj.description}</p>`;
                
                // Tornar preview interativo
                previewDiv.style.pointerEvents = 'auto';
                previewDiv.onclick = (e) => {
                    e.stopPropagation(); // Não acionar o click do card
                };
                
                // Remover preview que foi adicionado antes e reordenar: título → preview → descrição
                previewDiv.remove();
                card.appendChild(titleDiv);
                card.appendChild(previewDiv);
                card.appendChild(descDiv);
                console.log('Card montado com título, preview e descrição');
            } else {
                // Card sem preview (fallback com ícone)
                card.innerHTML = `
                    <span class="object-card-icon">${obj.icon}</span>
                    <h3 class="object-card-title">${obj.title}</h3>
                    <p class="object-card-description">${obj.description}</p>
                `;
            }

            card.addEventListener('click', () => {
                // Navegar para página de configuração
                AppPages.goToConfig(obj.id, obj.title);
            });

            gallery.appendChild(card);
        });
    },

    // --- INICIALIZAÇÃO ---
    init() {
        const selector = document.getElementById('object-selector');
        const panels = document.querySelectorAll('.generator-panel');
        
        // Inicializar galeria de cards
        this.initObjectGallery();
        
        if (selector) {
            selector.addEventListener('change', () => {
                panels.forEach(p => p.style.display = 'none');
                const target = document.getElementById(`panel-${selector.value}`);
                if (target) target.style.display = 'block';
            });
        }
        document.querySelectorAll('.rich-text-enabled').forEach(el => {
            this.utils.enableRichText(el);
        });
        console.log("[GeneratorCore] v6.1.4 inicializado com sucesso.");
    }
};

// --- GERENCIADOR DE PÁGINAS ---
const AppPages = {
    currentPage: 'home',
    currentObjectType: null,
    
    goToHome() {
        document.getElementById('page-home').classList.add('active');
        document.getElementById('page-config').classList.remove('active');
        this.currentPage = 'home';
        this.currentObjectType = null;
        
        // Limpar seleção dos cards
        document.querySelectorAll('.object-card').forEach(c => c.classList.remove('selected'));
        
        // Ocultar todos os painéis
        document.querySelectorAll('.generator-panel').forEach(p => p.style.display = 'none');
        
        // Limpar selector
        document.getElementById('object-selector').value = '';
    },
    
    goToConfig(objectType, objectTitle) {
        document.getElementById('page-home').classList.remove('active');
        document.getElementById('page-config').classList.add('active');
        this.currentPage = 'config';
        this.currentObjectType = objectType;
        
        // Atualizar título da página
        document.getElementById('config-page-title').textContent = `Configurar ${objectTitle}`;
        document.getElementById('config-page-subtitle').textContent = 'Preencha os campos abaixo para criar seu objeto';
        
        // Atualizar selector hidden
        document.getElementById('object-selector').value = objectType;
        
        // Mostrar painel correspondente
        document.querySelectorAll('.generator-panel').forEach(p => p.style.display = 'none');
        const panel = document.getElementById(`panel-${objectType}`);
        if (panel) {
            panel.style.display = 'block';
        }
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};