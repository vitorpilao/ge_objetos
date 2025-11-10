// js/core.js
// Núcleo da Central de Componentes Interativos (v5.4 - Com Rich Text)

const GeneratorCore = {
    // Repositório de módulos registrados
    modules: {},

    // Utilitários globais compartilhados
    utils: {
        // Mapa de Contraste WCAG (Fundo -> Texto ideal)
        colorContrastMap: {
            '#FFFFFF': '#030200', // Branco -> Preto
            '#F8F9FA': '#030200', // Off-white -> Preto
            '#030200': '#FFFFFF', // Cinza Tech -> Branco
            '#00011E': '#FFFFFF', // Azul Profundo -> Branco
            '#0A88F4': '#FFFFFF', // Azul Moderno -> Branco
            '#FF7A00': '#FFFFFF', // Laranja Quente -> Branco
            '#9D4DFF': '#FFFFFF', // Roxo -> Branco
            '#C3EB1E': '#030200', // Verde Tech -> Preto
            '#FF8C00': '#FFFFFF', // Laranja (Legado) -> Branco
            '#28a745': '#FFFFFF'  // Verde (Legado) -> Branco
        },

        // Retorna a cor de texto ideal para um dado fundo
        getContrastColor(hex) {
            return this.colorContrastMap[hex] || '#FFFFFF';
        },

        // Configura o botão de "Copiar Código" com feedback
        setupCopyButton(btnId, textareaId) {
            const btn = document.getElementById(btnId);
            const textarea = document.getElementById(textareaId);
            if (!btn || !textarea) return;

            btn.addEventListener('click', () => {
                if (!textarea.value) return;
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

        // Configura o seletor de cor de fundo do preview
        setupPreviewBg(selectId, containerId) {
            const selector = document.getElementById(selectId);
            const container = document.getElementById(containerId);
            if (selector && container) {
                // Define a cor inicial baseada no selected do HTML
                container.style.backgroundColor = selector.value;
                selector.addEventListener('change', () => {
                    container.style.backgroundColor = selector.value;
                });
            }
        },

        // === EDITOR DE TEXTO RICO (Rich Text) ===
        enableRichText(originalInput) {
            // 1. Identifica se é para ser linha única (input) ou múltipla (textarea)
            const isSingleLine = originalInput.tagName === 'INPUT';

            // 2. Cria o wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'rich-text-wrapper' + (isSingleLine ? ' single-line' : '');

            // 3. Cria a área editável visual
            const editor = document.createElement('div');
            editor.className = 'wysiwyg-editor';
            editor.contentEditable = true;
            // Define o placeholder visual
            editor.setAttribute('data-placeholder', originalInput.getAttribute('placeholder') || 'Digite aqui...');
            
            // Carrega o conteúdo inicial (se houver)
            editor.innerHTML = originalInput.value;

            // 4. Cria a Toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'rich-text-toolbar';

            // Definição das ferramentas usando comandos nativos do navegador
            const tools = [
                { icon: '<b>B</b>', command: 'bold', title: 'Negrito' },
                { icon: '<i>I</i>', command: 'italic', title: 'Itálico' },
                { icon: '<u>U</u>', command: 'underline', title: 'Sublinhado' }
            ];

            // Adiciona botões de formatação básica
            tools.forEach(tool => {
                const btn = document.createElement('button');
                btn.innerHTML = tool.icon;
                btn.title = tool.title;
                btn.type = 'button';
                // O mousedown evita que o editor perca o foco ao clicar no botão
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    document.execCommand(tool.command, false, null);
                    syncData(); // Sincroniza após aplicar o estilo
                });
                toolbar.appendChild(btn);
            });

            // Adiciona ferramenta de COR
            const colorWrapper = document.createElement('div');
            colorWrapper.style.display = 'flex';
            colorWrapper.style.alignItems = 'center';
            colorWrapper.style.marginLeft = '8px';
            
            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.className = 'rich-text-color-picker';
            colorPicker.value = '#000000'; // Cor inicial
            colorPicker.title = 'Escolher Cor do Texto';
            
            // O evento 'input' dispara enquanto arrasta, 'change' quando solta. 
            // Usar 'change' é mais seguro para execCommand.
            colorPicker.addEventListener('change', () => {
                // Restaura o foco para o editor antes de aplicar a cor
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

            // 5. SISTEMA DE SINCRONIZAÇÃO (Crucial!)
            // Sempre que o usuário digitar no editor visual, atualiza o input original escondido
            const syncData = () => {
                originalInput.value = editor.innerHTML;
            };

            editor.addEventListener('input', syncData);
            // Também sincroniza ao colar ou perder foco para garantir
            editor.addEventListener('blur', syncData);
            editor.addEventListener('paste', (e) => {
                // Pequeno delay para deixar o navegador colar primeiro, depois sincronizamos
                setTimeout(syncData, 0);
            });

            // Se for linha única, evita quebra de linha ao apertar Enter
            if (isSingleLine) {
                editor.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault(); // Impede o Enter
                    }
                });
            }

            // 6. Montagem no DOM
            // Insere o wrapper antes do input original
            originalInput.parentNode.insertBefore(wrapper, originalInput);
            // Move o input original para dentro do wrapper (mas vamos escondê-lo)
            wrapper.appendChild(originalInput);
            wrapper.appendChild(toolbar);
            wrapper.appendChild(editor);

            // Esconde o input original (ele agora só serve para guardar os dados para o envio)
            originalInput.style.display = 'none';
        }
    },

    // === REGISTRADOR DE MÓDULOS ===
    // js/core.js (Esta é a função registerModule)

    registerModule(type, moduleDef) {
        // Salva a definição para referência futura
        this.modules[type] = moduleDef;
        
        // Encontra o formulário principal do módulo
        const form = document.getElementById(`generator-form-${type}`);
        
        // Se o formulário não existir no HTML, aborta
        if (!form) {
            console.warn(`[GeneratorCore] Formulário não encontrado para o módulo: ${type}`);
            return;
        }

        // Encontra os elementos de output (preview)
        const elements = {
            outputSection: document.getElementById(`output-section-${type}`),
            codeTextarea: document.getElementById(`output-code-${type}`),
            previewIframe: document.getElementById(`preview-iframe-${type}`),
        };

        // 1. Configura o evento de SUBMIT (Visualizar)
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            try {
                // Passo A: Pede ao módulo para ler os dados do formulário
                const formData = moduleDef.getFormData(this); // 'this' é o core

                // Passo B: Pede ao módulo para gerar o HTML final
                const finalCode = moduleDef.createTemplate(formData);

                // Passo C: O Core atualiza a interface
                elements.previewIframe.srcdoc = finalCode;
                elements.codeTextarea.value = finalCode;
                elements.outputSection.style.display = 'block';

                // Rola a página suavemente até o resultado
                elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            } catch (err) {
                console.error(`[GeneratorCore] Erro ao gerar componente ${type}:`, err);
                alert(`Ocorreu um erro ao gerar o componente ${type}. Verifique o console.`);
            }
        });

        // 2. Configura os utilitários padrão (Botão de Copiar e Fundo do Preview)
        this.utils.setupCopyButton(`copy-button-${type}`, `output-code-${type}`);
        this.utils.setupPreviewBg(`preview-bg-${type}`, `preview-container-${type}`);

        // 3. (NOVO) Executa a configuração inicial do módulo, se ela existir
        // (Usado pelo Guia.js para ativar o botão "+ Adicionar Passo")
        if (moduleDef.setup) {
            moduleDef.setup(this); // Passa o 'core' para ele ter acesso aos utils
        }
        
        console.log(`[GeneratorCore] Módulo registrado: ${type}`);
    },

    // === INICIALIZAÇÃO ===
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

        // (Código novo - CORRIGIDO)
        // Ativa o Rich Text em TODOS os elementos (input ou textarea) com a classe
        document.querySelectorAll('.rich-text-enabled').forEach(el => {
            this.utils.enableRichText(el);
        });

        console.log("[GeneratorCore] v5.4 inicializado com sucesso.");
    }
};