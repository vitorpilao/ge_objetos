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
                    // Usar toast global quando disponível
                    try { GeneratorCore.showAppToast(`Ocorreu um erro ao gerar o componente ${type}. Verifique o console.`, 'error'); } catch(e) { alert(`Ocorreu um erro ao gerar o componente ${type}. Verifique o console.`); }
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

    // Função global de toast para o app (usável por módulos)
    showAppToast(message, type = 'info', duration = 3500) {
        try {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);
            // start animation
            window.getComputedStyle(toast).opacity;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        } catch (e) {
            // Fallback: usa alert se algo falhar
            console.error('Erro ao criar toast:', e, message);
            try { GeneratorCore.showAppToast(message, 'success'); } catch(e) { alert(message); }
        }
    },

    // Mostrar modal de confirmação reutilizável; retorna Promise<boolean>
    showAppConfirm(titleOrMessage, maybeMessage) {
        return new Promise((resolve) => {
            try {
                let title = 'Confirmar';
                let message = '';
                if (maybeMessage) {
                    title = titleOrMessage;
                    message = maybeMessage;
                } else {
                    message = titleOrMessage;
                }

                let modal = document.getElementById('confirm-modal');
                if (!modal) {
                    console.warn('confirm-modal não encontrado. Fallback para confirm()');
                    const result = confirm(message);
                    resolve(result);
                    return;
                }

                const titleEl = modal.querySelector('#confirm-modal-title');
                const bodyEl = modal.querySelector('#confirm-modal-message');
                const okBtn = modal.querySelector('#confirm-modal-ok');
                const cancelBtn = modal.querySelector('#confirm-modal-cancel');
                const closeBtn = modal.querySelector('#confirm-modal-close');

                if (titleEl) titleEl.textContent = title;
                if (bodyEl) bodyEl.textContent = message;

                modal.style.display = 'flex';

                const cleanup = () => {
                    modal.style.display = 'none';
                    okBtn.removeEventListener('click', onOk);
                    cancelBtn.removeEventListener('click', onCancel);
                    closeBtn.removeEventListener('click', onCancel);
                };

                const onOk = () => { cleanup(); resolve(true); };
                const onCancel = () => { cleanup(); resolve(false); };

                okBtn.addEventListener('click', onOk);
                cancelBtn.addEventListener('click', onCancel);
                closeBtn.addEventListener('click', onCancel);
            } catch (err) {
                console.error('Erro no showAppConfirm:', err);
                resolve(false);
            }
        });
    },

    // Mostrar modal simples com conteúdo - title + html/text
    showAppModal(title, contentHtml) {
        try {
            let modal = document.getElementById('app-modal');
            if (!modal) {
                console.warn('app-modal não encontrado. Fallback para alert.');
                alert(contentHtml);
                return;
            }

            const titleEl = modal.querySelector('#app-modal-title');
            const bodyEl = modal.querySelector('#app-modal-body');
            const closeBtn = modal.querySelector('#app-modal-close');
            const closeBtn2 = modal.querySelector('#app-modal-close-btn');

            if (titleEl) titleEl.textContent = title || '';
            if (bodyEl) bodyEl.innerHTML = contentHtml || '';

            const closeHandler = () => {
                modal.style.display = 'none';
                closeBtn.removeEventListener('click', closeHandler);
                closeBtn2.removeEventListener('click', closeHandler);
            };

            modal.style.display = 'flex';
            closeBtn.addEventListener('click', closeHandler);
            closeBtn2.addEventListener('click', closeHandler);
        } catch (err) {
            console.error('Erro no showAppModal:', err);
            alert(contentHtml);
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

    // --- INICIALIZAR QUIZ MANUALMENTE (FALLBACK) ---
    initQuizManually(wrapper) {
        console.log('🔧 Inicializando quiz manualmente:', wrapper);
        
        const options = wrapper.querySelectorAll('.quiz-option');
        const submitBtn = wrapper.querySelector('.quiz-submit-btn');
        const feedbackArea = wrapper.querySelector('.quiz-feedback-area');
        
        console.log('📋 Elementos encontrados manualmente:');
        console.log('  - Opções:', options.length);
        console.log('  - Botão submit:', !!submitBtn);
        console.log('  - Feedback area:', !!feedbackArea);
        
        if (!options.length || !submitBtn || !feedbackArea) {
            console.error('❌ Elementos do quiz não encontrados');
            return;
        }
        
        // Extrair índice correto do dataset ou HTML
        let correctIndex = 0;
        options.forEach((opt, idx) => {
            if (opt.classList.contains('correct') || opt.hasAttribute('data-correct')) {
                correctIndex = idx;
            }
        });
        
        let selectedIndex = null;
        
        // Adicionar eventos às opções
        options.forEach((option, index) => {
            console.log(`🔗 Anexando evento manual à opção ${index}`);
            
            option.addEventListener('click', (e) => {
                console.log('🖱️ CLICK MANUAL na opção detectado!', index);
                e.stopPropagation();
                
                if (wrapper.classList.contains('answered')) {
                    console.log('⏸️ Quiz já respondido');
                    return;
                }
                
                options.forEach(opt => {
                    opt.classList.remove('selected');
                    opt.setAttribute('aria-checked', 'false');
                });
                
                option.classList.add('selected');
                option.setAttribute('aria-checked', 'true');
                selectedIndex = index;
                submitBtn.disabled = false;
                console.log('✅ Opção selecionada:', selectedIndex);
            });
        });
        
        // Adicionar evento ao botão submit
        console.log('🔗 Anexando evento manual ao botão submit');
        submitBtn.addEventListener('click', (e) => {
            console.log('🖱️ CLICK MANUAL no botão submit!');
            e.stopPropagation();
            
            if (selectedIndex === null || wrapper.classList.contains('answered')) {
                console.log('⏸️ Não pode submeter');
                return;
            }
            
            wrapper.classList.add('answered');
            submitBtn.disabled = true;
            const isCorrect = (selectedIndex === correctIndex);
            
            options.forEach((opt, idx) => {
                opt.classList.add('disabled');
                if (idx === correctIndex) {
                    opt.classList.add('correct');
                } else {
                    opt.classList.add('incorrect');
                }
            });
            
            if (isCorrect) {
                feedbackArea.innerHTML = 'Correto! Parabéns!';
                feedbackArea.classList.add('correct');
            } else {
                feedbackArea.innerHTML = 'Incorreto. Tente novamente!';
                feedbackArea.classList.add('incorrect');
            }
            
            console.log('✅ Quiz respondido. Correto?', isCorrect);
        });
        
        // Ativar animação de visibilidade
        setTimeout(() => {
            wrapper.classList.add('is-visible');
        }, 50);
        
        console.log('✅ Quiz manualmente inicializado');
    },

    // --- INICIALIZAR DRAGDROP MANUALMENTE (FALLBACK) ---
    initDragDropManually(wrapper) {
        console.log('🔧 Inicializando dragdrop manualmente');
        
        const itemBank = wrapper.querySelector('.item-bank');
        const dropZones = wrapper.querySelectorAll('.drop-zone');
        const allItems = wrapper.querySelectorAll('.drag-item');
        const verifyButton = wrapper.querySelector('.drag-verify-btn');
        
        if (!itemBank || !verifyButton || allItems.length === 0) {
            console.log('❌ Elementos necessários não encontrados');
            return;
        }
        
        console.log(`📦 Encontrados: ${allItems.length} itens, ${dropZones.length} zonas`);
        
        let draggedItem = null;
        
        // Eventos de drag para os itens
        allItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                item.setAttribute('aria-grabbed', 'true');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                item.setAttribute('aria-grabbed', 'false');
                draggedItem = null;
            });
        });
        
        // Eventos de drop nas zonas
        dropZones.forEach(zone => {
            const inner = zone.querySelector('.drop-zone-inner');
            
            inner.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                zone.classList.add('drag-over');
            });
            
            inner.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            
            inner.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (draggedItem) {
                    inner.appendChild(draggedItem);
                }
            });
        });
        
        // Permitir drop de volta no banco
        itemBank.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        itemBank.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedItem) {
                itemBank.appendChild(draggedItem);
            }
        });
        
        // Botão verificar
        verifyButton.addEventListener('click', () => {
            console.log('✅ Verificando respostas');
            
            let allCorrect = true;
            let hasWrongItem = false;
            
            allItems.forEach(item => {
                const correctCategory = item.dataset.correctCategory;
                const currentZone = item.closest('.drop-zone');
                
                item.classList.remove('correct', 'incorrect');
                
                if (!currentZone) return;
                
                const currentCategory = currentZone.dataset.category;
                
                if (currentCategory === correctCategory) {
                    item.classList.add('correct');
                } else {
                    item.classList.add('incorrect');
                    hasWrongItem = true;
                    allCorrect = false;
                }
            });
            
            const itemsInBank = itemBank.querySelectorAll('.drag-item').length;
            if (itemsInBank > 0) {
                allCorrect = false;
            }
            
            if (hasWrongItem) {
                setTimeout(() => {
                    allItems.forEach(item => {
                        item.classList.remove('correct', 'incorrect');
                        itemBank.appendChild(item);
                    });
                }, 1000);
            } else if (allCorrect) {
                wrapper.classList.add('all-correct');
                const celebration = wrapper.querySelector('.confetti-celebration');
                if (celebration) {
                    celebration.classList.add('active');
                }
            }
        });
        
        // Ativar animação de visibilidade
        setTimeout(() => {
            wrapper.classList.add('is-visible');
        }, 50);
        
        console.log('✅ DragDrop manualmente inicializado');
    },

    // FALLBACK: Inicializar EncontreErro manualmente quando inline script não executa
    initEncontreErroManually(container) {
        console.log('🎯 Inicializando EncontreErro manualmente...');

        if (!container) {
            console.error('❌ Container do EncontreErro não encontrado');
            return;
        }

        // Entrada suave: adiciona a classe .is-visible quando o componente entra na viewport
        try {
            const obsTarget = container;
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        obsTarget.classList.add('is-visible');
                        obs.unobserve(obsTarget);
                    }
                });
            }, { threshold: 0.15 });
            observer.observe(obsTarget);
        } catch (e) {
            // Se IntersectionObserver não estiver disponível, mostra imediatamente
            container.classList.add('is-visible');
        }

        const items = container.querySelectorAll('.encontreerro-item');
        const feedback = container.querySelector('.encontreerro-feedback');
        const resetBtn = container.querySelector('.encontreerro-reset-btn');
        const helpBtn = container.querySelector('.encontreerro-help-btn');
        const verifyBtn = container.querySelector('.encontreerro-verify-btn');
        
        console.log('🔍 Elementos encontrados:', {
            items: items.length,
            feedback: !!feedback,
            resetBtn: !!resetBtn,
            helpBtn: !!helpBtn,
            verifyBtn: !!verifyBtn
        });
        
        if (!items.length || !feedback || !resetBtn || !helpBtn || !verifyBtn) {
            console.error('❌ Elementos necessários do EncontreErro não encontrados');
            console.log('Container HTML:', container.innerHTML);
            return;
        }

        const totalErros = items.length;

        // Extrair textos de feedback do HTML (já renderizados no template)
        const feedbackInitial = feedback.innerHTML;
        // Precisamos capturar os textos do template, mas como estão em variáveis JS,
        // vamos usar atributos data- ou extrair do próprio HTML
        const feedbackCorrect = container.dataset.feedbackCorrect || 'Parabéns! Você encontrou todos os erros.';
        const feedbackIncorrect = container.dataset.feedbackIncorrect || 'Você não encontrou todos os erros. As palavras que faltaram estão destacadas em vermelho.';
        const helpActiveText = container.dataset.helpActive || 'As palavras suspeitas foram destacadas.';

        // Evento de click nos itens
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Click no item:', item.textContent);
                // Permite selecionar/desselecionar apenas se a verificação não foi feita
                if (!container.classList.contains('verified')) {
                    item.classList.toggle('selected');
                    console.log('✅ Item selecionado/desmarcado');
                } else {
                    console.log('⏸️ Verificação já foi feita');
                }
            });
        });

        console.log('✅ Eventos anexados em', items.length, 'itens');

        // Evento de verificar
        verifyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔍 Botão verificar clicado');
            container.classList.add('verified'); // Marca que a verificação foi feita
            const selectedItems = container.querySelectorAll('.encontreerro-item.selected');

            // Desabilita todos os itens para cliques futuros
            items.forEach(item => item.setAttribute('aria-disabled', 'true'));

            if (selectedItems.length === totalErros) {
                // Caso de sucesso: todas as palavras corretas foram selecionadas
                feedback.innerHTML = feedbackCorrect;
                container.classList.add('success-anim');
                items.forEach(item => item.classList.add('correct'));
            } else {
                // Caso de erro: nem todas as palavras foram encontradas
                feedback.innerHTML = feedbackIncorrect;
                items.forEach(item => {
                    if (item.classList.contains('selected')) {
                        item.classList.add('correct'); // Marca as que acertou
                    } else {
                        item.classList.add('missed'); // Marca as que errou
                    }
                });
            }

            // Mostra o botão de reset e esconde (visualmente) o de verificar/ajuda
            resetBtn.classList.add('visible');
            verifyBtn.classList.add('hidden-preserve');
            helpBtn.classList.add('hidden-preserve');
        });

        // Evento de ajuda
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('💡 Botão ajuda clicado');
            container.classList.add('help-active');
            feedback.innerHTML = helpActiveText;
            helpBtn.classList.add('hidden-preserve'); // Esconde visualmente após o uso, mantendo o espaço
        });

        // Evento de reset
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Botão reset clicado');
            container.classList.remove('verified', 'help-active', 'success-anim');
            items.forEach(item => {
                item.classList.remove('selected', 'correct', 'missed');
                item.removeAttribute('aria-disabled');
            });

            feedback.innerHTML = feedbackInitial;
            resetBtn.classList.remove('visible');
            verifyBtn.classList.remove('hidden-preserve');
            helpBtn.classList.remove('hidden-preserve');
        });

        console.log('✅ EncontreErro inicializado com sucesso manualmente');
        console.log('📋 Feedbacks carregados:', { feedbackCorrect, feedbackIncorrect, helpActiveText });
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
                
                console.log('📦 Preview div criada:', previewDiv);
                console.log('📄 Conteúdo do preview:', previewDiv.innerHTML.substring(0, 200));
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'object-card-title-wrapper';
                titleDiv.innerHTML = `<h3 class="object-card-title">${obj.title}</h3>`;
                
                const descDiv = document.createElement('div');
                descDiv.className = 'object-card-description-wrapper';
                descDiv.innerHTML = `<p class="object-card-description">${obj.description}</p>`;
                
                // Tornar preview interativo - permite cliques nos elementos internos
                previewDiv.style.pointerEvents = 'auto';
                previewDiv.onclick = (e) => {
                    console.log('🖱️ Click no previewDiv detectado');
                    console.log('  - Target:', e.target);
                    console.log('  - Target classes:', e.target.className);
                    
                    // Permitir interação com elementos interativos (botões, opções, etc)
                    const isInteractive = e.target.closest('.quiz-option, .quiz-submit-btn, .drag-item, .drag-verify-btn, .drop-zone-inner, .encontreerro-item, .encontreerro-verify-btn, .encontreerro-help-btn, .encontreerro-reset-btn, .encontreerro-actions, .action-stack, button, input, select, textarea, a, [role="button"], [role="radio"]');
                    console.log('  - É interativo?', !!isInteractive);
                    console.log('  - Elemento interativo:', isInteractive);
                    
                    if (!isInteractive) {
                        console.log('  ⛔ Bloqueando propagação (não é interativo)');
                        e.stopPropagation(); // Apenas bloquear se não for elemento interativo
                    } else {
                        console.log('  ✅ Permitindo propagação (elemento interativo)');
                    }
                };
                
                // Montar card: título → preview → descrição
                card.appendChild(titleDiv);
                card.appendChild(previewDiv);
                card.appendChild(descDiv);
                console.log('✅ Card montado com título, preview e descrição');
                
                // Reexecutar scripts do demo APÓS adicionar ao DOM
                console.log('🔄 Executando scripts do demo...');
                const scripts = previewDiv.querySelectorAll('script');
                console.log(`📜 Scripts encontrados: ${scripts.length}`);
                scripts.forEach((oldScript, idx) => {
                    console.log(`▶️ Executando script ${idx + 1}/${scripts.length}`);
                    const newScript = document.createElement('script');
                    newScript.textContent = oldScript.textContent;
                    try {
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                        console.log(`✅ Script ${idx + 1} executado com sucesso`);
                    } catch (err) {
                        console.error(`❌ Erro ao executar script ${idx + 1}:`, err);
                    }
                });
                console.log('✅ Todos os scripts executados');
                
                // FALLBACK: Se for multiplechoice, anexar eventos manualmente
                const quizWrapper = previewDiv.querySelector('.quiz-wrapper');
                if (quizWrapper) {
                    console.log('🎮 Detectado quiz, anexando eventos manualmente...');
                    setTimeout(() => {
                        this.initQuizManually(quizWrapper);
                    }, 100);
                }

                // FALLBACK: Se for dragdrop, anexar eventos manualmente
                const dragWrapper = previewDiv.querySelector('.drag-wrapper');
                if (dragWrapper) {
                    console.log('🎯 Detectado dragdrop, anexando eventos manualmente...');
                    setTimeout(() => {
                        this.initDragDropManually(dragWrapper);
                    }, 100);
                }

                // FALLBACK: Se for encontreerro, anexar eventos manualmente
                const encontreErroWrapper = previewDiv.querySelector('.encontreerro-container');
                if (encontreErroWrapper) {
                    console.log('🔍 Detectado encontreerro, anexando eventos manualmente...');
                    setTimeout(() => {
                        this.initEncontreErroManually(encontreErroWrapper);
                    }, 100);
                }
            } else {
                // Card sem preview (fallback com ícone)
                card.innerHTML = `
                    <span class="object-card-icon">${obj.icon}</span>
                    <h3 class="object-card-title">${obj.title}</h3>
                    <p class="object-card-description">${obj.description}</p>
                `;
            }

            card.addEventListener('click', (e) => {
                console.log('🎴 Click no card detectado');
                console.log('  - Target:', e.target);
                console.log('  - Target classes:', e.target.className);
                
                // Não navegar se clicou em elemento interativo dentro do preview
                const isInteractive = e.target.closest('.quiz-option, .quiz-submit-btn, .drag-item, .drag-verify-btn, .drop-zone-inner, .encontreerro-item, .encontreerro-verify-btn, .encontreerro-help-btn, .encontreerro-reset-btn, .encontreerro-actions, .action-stack, .object-card-preview button, .object-card-preview input, .object-card-preview select, .object-card-preview textarea, .object-card-preview a, [role="button"], [role="radio"]');
                console.log('  - É interativo no card?', !!isInteractive);
                
                if (!isInteractive) {
                    console.log('  🚀 Navegando para configuração');
                    // Navegar para página de configuração apenas se não for elemento interativo
                    AppPages.goToConfig(obj.id, obj.title);
                } else {
                    console.log('  ⏸️ Navegação bloqueada (clique em elemento interativo)');
                }
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
        
        // Limpar o ID do objeto atual para não editar ao criar novo
        if (typeof ObjectManager !== 'undefined' && ObjectManager.currentObjectId) {
            ObjectManager.currentObjectId = null;
        }
        
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