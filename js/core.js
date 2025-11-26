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
        
        syncCategoryDropdowns: () => {
            // (Função placeholder)
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
                form.querySelectorAll('.wysiwyg-editor').forEach(editor => editor.blur());
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

    // --- INICIALIZAÇÃO ---
    init() {
        const selector = document.getElementById('object-selector');
        const panels = document.querySelectorAll('.generator-panel');
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