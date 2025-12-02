// js/modules/multiplechoice.js
// Módulo de Múltipla Escolha (Quiz) v2.2
// (Adiciona Rótulo de Acessibilidade - Aria-Label)

GeneratorCore.registerModule('multiplechoice', {

    // 1. Setup: (Sem mudanças aqui)
    setup(core) {
        const container = document.getElementById('multiplechoice-options-container');
        const addButton = document.getElementById('multiplechoice-add-option');

        if (!container || !addButton) {
            console.error("Erro no setup do Múltipla Escolha: elementos do formulário não encontrados.");
            return;
        }

        const updateOptionIndices = () => {
            const allBlocks = container.querySelectorAll('.multiplechoice-option-bloco');
            allBlocks.forEach((bloco, index) => {
                const optionNum = index + 1;

                const radio = bloco.querySelector('input[type="radio"]');
                const radioLabel = bloco.querySelector('.radio-label');
                if (radio) {
                    radio.id = `multiplechoice-correct-${index}`;
                    radio.value = index;
                }
                if (radioLabel) {
                    radioLabel.setAttribute('for', `multiplechoice-correct-${index}`);
                }

                const textarea = bloco.querySelector('textarea');
                const textareaLabel = bloco.querySelector('.form-group-textarea label');
                if (textarea) {
                    textarea.id = `input-multiplechoice-option-${index}`;
                }
                if (textareaLabel) {
                    textareaLabel.textContent = `Opção ${optionNum}`;
                    textareaLabel.setAttribute('for', `input-multiplechoice-option-${index}`);
                }

                const removeBtn = bloco.querySelector('.multiplechoice-remove-option');
                if(removeBtn) {
                    removeBtn.title = `Remover Opção ${optionNum}`;
                }
            });
        };

        const addRemoveButton = (bloco, index) => {
            if (index === 0) return; 

            let removeButton = bloco.querySelector('.multiplechoice-remove-option');
            if (removeButton) return;

            removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'multiplechoice-remove-option';
            removeButton.innerHTML = '&times;';
            removeButton.title = `Remover Opção ${index + 1}`;
            removeButton.style.cssText = "position: absolute; top: 15px; right: 15px; background-color: #dc3545; color: var(--color-branco-puro); border: none; border-radius: 4px; width: auto; height: auto; padding: 4px 10px; font-size: 0.8rem; font-weight: bold; line-height: 1.5; cursor: pointer; opacity: 0.7; transition: opacity 0.2s ease, transform 0.2s ease;";

            removeButton.addEventListener('click', () => {
                const wasChecked = bloco.querySelector('input[type="radio"]').checked;
                bloco.remove();

                if (wasChecked) {
                    const firstRadio = container.querySelector('input[type="radio"]');
                    if(firstRadio) firstRadio.checked = true;
                }

                updateOptionIndices();
            });

            bloco.appendChild(removeButton);
        };

        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                console.log('[multiplechoice] add-option clicked');
                const newIndex = container.querySelectorAll('.multiplechoice-option-bloco').length;
                const newBlock = document.createElement('div');
                newBlock.className = 'multiplechoice-option-bloco';
                newBlock.dataset.index = newIndex;

                newBlock.innerHTML = `
                    <div class="multiplechoice-option-flex-group">
                        <div class="form-group-radio">
                            <input type="radio" name="multiplechoice-correct" id="multiplechoice-correct-${newIndex}" value="${newIndex}">
                            <label for="multiplechoice-correct-${newIndex}" class="radio-label">Correta</label>
                        </div>
                        <div class="form-group-textarea">
                            <label for="input-multiplechoice-option-${newIndex}">Opção ${newIndex + 1}</label>
                            <textarea id="input-multiplechoice-option-${newIndex}" class="rich-text-enabled" rows="1" placeholder="Nova opção..." required></textarea>
                        </div>
                    </div>
                `;

                container.appendChild(newBlock);

                const newTextarea = newBlock.querySelector(`#input-multiplechoice-option-${newIndex}`);
                if (newTextarea) {
                    try {
                        core.utils.enableRichText(newTextarea);
                    } catch (errInner) {
                        console.error('[multiplechoice] erro ao ativar rich text no novo textarea:', errInner);
                    }
                }

                try {
                    addRemoveButton(newBlock, newIndex);
                } catch (errRemove) {
                    console.error('[multiplechoice] erro ao adicionar botão remover:', errRemove);
                }
            } catch (err) {
                console.error('[multiplechoice] erro geral no handler de adicionar opção:', err);
                alert('Ocorreu um erro ao adicionar a opção. Veja o console para detalhes.');
            }
        });

        container.querySelectorAll('.multiplechoice-option-bloco').forEach((bloco, index) => {
             addRemoveButton(bloco, index);
        });

        updateOptionIndices();
    },

    // 2. getFormData: (ATUALIZADO)
    getFormData(core) {

        const checkedRadio = document.querySelector('input[name="multiplechoice-correct"]:checked');

        if (!checkedRadio) {
            alert("Erro: Você precisa selecionar uma opção como a correta antes de visualizar.");
            throw new Error("Validação do Múltipla Escolha falhou: Nenhuma resposta correta selecionada."); 
        }

        const correctIndex = parseInt(checkedRadio.value, 10);

        const options = [];
        const optionBlocos = document.querySelectorAll('.multiplechoice-option-bloco');
        optionBlocos.forEach(bloco => {
            const editor = bloco.querySelector('textarea + .rich-text-wrapper .wysiwyg-editor') ||
                          bloco.querySelector('textarea.wysiwyg-editor') ||
                          bloco.querySelector('textarea');
            
            let optionVal = '';
            if (editor) {
                if (editor.classList.contains('wysiwyg-editor') || editor.contentEditable === 'true') {
                    optionVal = (editor.innerHTML || '').trim();
                } else if ('value' in editor) {
                    optionVal = (editor.value || '').trim();
                }
            }
            options.push(optionVal);
        });

        const corFundo = document.getElementById('input-multiplechoice-bg').value;
        const corDestaque = document.getElementById('input-multiplechoice-cor').value;

        return {
            uniqueId: `quiz-${Date.now().toString().slice(-6)}`,
            audiodescricao: document.getElementById('input-multiplechoice-audiodescricao').value,
            ariaLabel: document.getElementById('input-multiplechoice-aria-label').value,
            title: document.getElementById('input-multiplechoice-title').value,
            question: document.getElementById('input-multiplechoice-question').value,
            options: options,
            correctIndex: correctIndex,
            feedbackCorrect: document.getElementById('input-multiplechoice-feedback-correct').value,
            feedbackIncorrect: document.getElementById('input-multiplechoice-feedback-incorrect').value,

            // Cores
            corFundo: corFundo,
            corTexto: core.utils.getContrastColor(corFundo),
            corBorda: (core.utils.getContrastColor(corFundo) === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)',
            corDestaque: corDestaque,
            corDestaqueTexto: core.utils.getContrastColor(corDestaque)
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do Multiplechoice:', data);
        
        setTimeout(() => {
            // Restaurar campos simples
            const ariaField = document.getElementById('input-multiplechoice-aria-label');
            const audioField = document.getElementById('input-multiplechoice-audiodescricao');
            const titleField = document.getElementById('input-multiplechoice-title');
            const questionField = document.getElementById('input-multiplechoice-question');
            const corFundoField = document.getElementById('select-multiplechoice-bg');
            const corDestaqueField = document.getElementById('select-multiplechoice-destaque');
            const feedbackCorrectField = document.getElementById('input-multiplechoice-feedback-correct');
            const feedbackIncorrectField = document.getElementById('input-multiplechoice-feedback-incorrect');
            
            // Restaurar campos com WYSIWYG
            const restoreFieldWithWYSIWYG = (field, value) => {
                if (!field || !value) return;
                const wrapper = field.closest('.rich-text-wrapper');
                if (wrapper) {
                    const wysiwyg = wrapper.querySelector('.wysiwyg-editor');
                    if (wysiwyg) wysiwyg.innerHTML = value;
                }
                field.value = value;
            };
            
            restoreFieldWithWYSIWYG(ariaField, data.ariaLabel);
            if (audioField) audioField.value = data.audiodescricao || '';
            restoreFieldWithWYSIWYG(titleField, data.title);
            restoreFieldWithWYSIWYG(questionField, data.question);
            if (corFundoField) corFundoField.value = data.corFundo || '#FFFFFF';
            if (corDestaqueField) corDestaqueField.value = data.corDestaque || '#0A88F4';
            restoreFieldWithWYSIWYG(feedbackCorrectField, data.feedbackCorrect);
            restoreFieldWithWYSIWYG(feedbackIncorrectField, data.feedbackIncorrect);
            
            // Restaurar opções
            const container = document.getElementById('multiplechoice-options-container');
            if (container && data.options && data.options.length > 0) {
                // Limpar opções existentes
                container.innerHTML = '';
                
                // Recriar opções
                data.options.forEach((optionHTML, index) => {
                    const bloco = document.createElement('div');
                    bloco.className = 'multiplechoice-option-bloco';
                    bloco.style.cssText = "position: relative; padding: 15px; border: 1px solid var(--color-cinza-input, #ccc); border-radius: 6px; margin-bottom: 12px; background-color: var(--color-branco-puro, #fff);";
                    
                    const radioGroup = document.createElement('div');
                    radioGroup.className = 'form-group-inline';
                    radioGroup.innerHTML = `
                        <input type="radio" 
                               name="multiplechoice-correct" 
                               id="multiplechoice-correct-${index}" 
                               value="${index}"
                               ${index === data.correctIndex ? 'checked' : ''}>
                        <label class="radio-label" for="multiplechoice-correct-${index}">Resposta Correta?</label>
                    `;
                    
                    const textareaGroup = document.createElement('div');
                    textareaGroup.className = 'form-group-textarea';
                    textareaGroup.innerHTML = `
                        <label for="input-multiplechoice-option-${index}">Opção ${index + 1}</label>
                        <textarea id="input-multiplechoice-option-${index}" 
                                  class="rich-text-enabled multiplechoice-option-textarea" 
                                  placeholder="Digite o texto da opção..."></textarea>
                    `;
                    
                    bloco.appendChild(radioGroup);
                    bloco.appendChild(textareaGroup);
                    container.appendChild(bloco);
                    
                    // Restaurar valor do textarea
                    const textarea = document.getElementById(`input-multiplechoice-option-${index}`);
                    if (textarea) {
                        // Converter HTML de volta para texto
                        const optionText = optionHTML
                            .replace(/<p>/gi, '')
                            .replace(/<\/p>/gi, '\n')
                            .trim();
                        textarea.value = optionText;
                    }
                    
                    // Adicionar botão de remover (exceto primeira opção)
                    if (index > 0) {
                        const removeButton = document.createElement('button');
                        removeButton.type = 'button';
                        removeButton.className = 'multiplechoice-remove-option';
                        removeButton.innerHTML = '&times;';
                        removeButton.title = `Remover Opção ${index + 1}`;
                        removeButton.style.cssText = "position: absolute; top: 15px; right: 15px; background-color: #dc3545; color: #fff; border: none; border-radius: 4px; width: auto; height: auto; padding: 4px 10px; font-size: 0.8rem; font-weight: bold; cursor: pointer;";
                        
                        removeButton.addEventListener('click', () => {
                            bloco.remove();
                            // Reindexar opções restantes
                            const allBlocks = container.querySelectorAll('.multiplechoice-option-bloco');
                            allBlocks.forEach((b, i) => {
                                const radio = b.querySelector('input[type="radio"]');
                                const label = b.querySelector('.radio-label');
                                const textarea = b.querySelector('textarea');
                                const textareaLabel = b.querySelector('.form-group-textarea label');
                                
                                if (radio) {
                                    radio.id = `multiplechoice-correct-${i}`;
                                    radio.value = i;
                                }
                                if (label) label.setAttribute('for', `multiplechoice-correct-${i}`);
                                if (textarea) textarea.id = `input-multiplechoice-option-${i}`;
                                if (textareaLabel) {
                                    textareaLabel.textContent = `Opção ${i + 1}`;
                                    textareaLabel.setAttribute('for', `input-multiplechoice-option-${i}`);
                                }
                            });
                        });
                        
                        bloco.appendChild(removeButton);
                    }
                });
                
                // Reativar WYSIWYG nos textareas
                setTimeout(() => {
                    const textareas = container.querySelectorAll('.rich-text-enabled');
                    textareas.forEach(textarea => {
                        if (!textarea.nextElementSibling || !textarea.nextElementSibling.classList.contains('rich-text-toolbar')) {
                            GeneratorCore.utils.enableRichText(textarea);
                        }
                    });
                }, 100);
            }
            
            console.log('✅ Multiplechoice restaurado com', data.options?.length || 0, 'opções');
        }, 200);
    },

    // 3. createTemplate: (ATUALIZADO)
    createTemplate(data) {
        const {
            uniqueId, audiodescricao, ariaLabel, title,
            question, options, correctIndex, feedbackCorrect, feedbackIncorrect,
            corFundo, corTexto, corBorda, corDestaque, corDestaqueTexto
        } = data;

        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        const optionsHTML = options.map((optionHTML, index) => {
            return `
            <div class="quiz-option" 
                 role="radio" 
                 aria-checked="false" 
                 data-index="${index}"
                 tabindex="0">
                <span class="quiz-option-text">${optionHTML}</span>
            </div>
            `;
        }).join('');

        const safeFeedbackCorrect = feedbackCorrect.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const safeFeedbackIncorrect = feedbackIncorrect.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, "\\n");

        return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Arial&display=swap');
:root {
    --quiz-cor-fundo: ${corFundo};
    --quiz-cor-texto: ${corTexto};
    --quiz-cor-borda: ${corBorda};
    --quiz-cor-destaque: ${corDestaque};
    --quiz-cor-destaque-texto: ${corDestaqueTexto};
    --quiz-cor-sucesso: #28a745;
    --quiz-cor-erro: #dc3545;
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-secondary: 'Arial', sans-serif;
}
.quiz-option-text > *:first-child {
    margin-top: 0;
}
html, body {
    margin: 0; padding: 0;
    background-color: transparent;
}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.quiz-wrapper {
    font-family: var(--font-secondary);
    background-color: var(--quiz-cor-fundo);
    color: var(--quiz-cor-texto);
    border: 1px solid var(--quiz-cor-borda);
    border-radius: 8px;
    padding: 24px;
    max-width: 700px;
    margin: 10px auto;
    opacity: 0;
    transform: translateY(20px);
    position: relative; /* Necessário para o posicionamento da celebração */
    transition: opacity .6s ease-out, transform .6s ease-out;
}
.quiz-wrapper.is-visible {
    opacity: 1;
    transform: translateY(0);
}
.quiz-title {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 1.4rem;
    line-height: 1.3;
    margin: 0 0 16px 0;
}
.quiz-question {
    font-family: var(--font-primary);
    font-weight: 250;
    font-size: 1.2rem;
    line-height: 1.4;
    margin: 0 0 20px 0;
}
.quiz-options-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.quiz-option {
    font-family: var(--font-secondary);
    font-size: 1rem;
    text-align: left;
    width: 100%;
    padding: 12px 16px;
    border-radius: 6px; /* Adicionado para consistência */
    border: 1px solid var(--quiz-cor-borda);
    background-color: #f0f0f0;
    color: var(--quiz-cor-texto);
    cursor: pointer;
    box-sizing: border-box; /* Garante que padding e borda não aumentem a largura */
    transition: border-color 0.2s ease, background-color 0.2s ease;
}
.quiz-option:hover {
    border-color: var(--quiz-cor-destaque);
}
.quiz-option.selected {
    background-color: var(--quiz-cor-destaque);
    color: var(--quiz-cor-destaque-texto);
    border-color: var(--quiz-cor-destaque);
}
.quiz-option:focus-visible {
    outline: 2px solid var(--quiz-cor-destaque);
    outline-offset: 2px;
}
.quiz-option.correct {
    background-color: var(--quiz-cor-sucesso);
    color: var(--quiz-cor-destaque-texto);
    border-color: var(--quiz-cor-sucesso);
}
.quiz-option.incorrect {
    background-color: var(--quiz-cor-erro);
    color: var(--quiz-cor-destaque-texto);
    border-color: var(--quiz-cor-erro);
}
.quiz-option.disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
.quiz-submit-btn {
    font-family: var(--font-primary);
    font-weight: 700;
    font-size: 1rem;
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: var(--quiz-cor-destaque);
    color: var(--quiz-cor-destaque-texto);
    margin-top: 20px;
}
.quiz-submit-btn:disabled {
    background-color: var(--quiz-cor-borda);
    cursor: not-allowed;
}
.quiz-feedback-area {
    padding: 15px;
    border-radius: 6px;
    margin-top: 20px;
    display: none;
    font-size: 0.95rem;
    line-height: 1.5;
}
.quiz-feedback-area.correct {
    display: block;
    background-color: rgba(40, 167, 69, 0.1);
    border: 1px solid var(--quiz-cor-sucesso);
    color: var(--quiz-cor-texto);
}
.quiz-feedback-area.incorrect {
    display: block;
    background-color: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--quiz-cor-erro);
    color: var(--quiz-cor-texto);
}
/* --- ESTILOS PARA CONFETES E MENSAGEM DE SUCESSO (do Drag&Drop) --- */
.confetti-celebration {
    position: fixed; /* Cobrir a viewport inteira */
    inset: 0; /* top:0; right:0; bottom:0; left:0 */
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    font-family: var(--font-primary);
    font-size: 2.2rem;
    font-weight: 700;
    text-align: center;
    z-index: 10;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.5s ease, visibility 0.5s ease;
    pointer-events: none;
    overflow: hidden; /* Impede que confetes causem scroll na viewport */
}
.confetti-celebration.active {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
}
.confetti-message {
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    transform: translateY(-20px);
    opacity: 0;
    animation: slideInMessage-quiz 0.6s ease-out forwards 0.5s;
}
.confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #f00;
    border-radius: 50%;
    opacity: 0;
    animation: confetti-fall-quiz 3s linear forwards;
    will-change: transform, opacity; /* Ajuda desempenho e evita repaints desnecessários */
}
@keyframes confetti-fall-quiz {
    0% {
        transform: translateY(-100px) rotateZ(0deg);
        opacity: 0;
    }
    10% {
        opacity: 1;
    }
    100% {
        transform: translateY(calc(100% + 100px)) rotateZ(720deg);
        opacity: 0;
    }
}
@keyframes slideInMessage-quiz {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>

<div class="quiz-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    ${audiodescricaoHTML}
    ${title ? `<h3 class="quiz-title">${title}</h3>` : ''}
    <div class="quiz-question" id="quiz-question-${uniqueId}">${question}</div>
    <div class="quiz-options-list" role="radiogroup" aria-labelledby="quiz-question-${uniqueId}">
        ${optionsHTML}
    </div>
    <button class="quiz-submit-btn" disabled>Verificar</button>
    <div class="quiz-feedback-area" aria-live="polite"></div>
    <div class="confetti-celebration" id="celebration-${uniqueId}">
        <p class="confetti-message">Parabéns, você acertou!</p>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById("${uniqueId}");
    if (!wrapper) return;
    
    const options = wrapper.querySelectorAll('.quiz-option');
    const submitBtn = wrapper.querySelector('.quiz-submit-btn');
    const feedbackArea = wrapper.querySelector('.quiz-feedback-area');
    const celebrationOverlay = document.getElementById('celebration-${uniqueId}');
    
    const correctIndex = ${correctIndex};
    const feedbackCorrect = '${safeFeedbackCorrect}';
    const feedbackIncorrect = '${safeFeedbackIncorrect}';
    
    let selectedIndex = null;

    options.forEach(option => {
        option.addEventListener('click', () => {
            // Se o quiz já foi respondido, não faz nada.
            if (wrapper.classList.contains('answered')) return; 

            // Se o usuário está selecionando texto, não seleciona a opção.
            const selection = window.getSelection();
            if (selection.toString().length > 0 && option.contains(selection.anchorNode)) return;
            
            options.forEach(opt => {
                opt.classList.remove('selected');
                opt.setAttribute('aria-checked', 'false');
            });
            
            option.classList.add('selected');
            option.setAttribute('aria-checked', 'true');
            selectedIndex = parseInt(option.dataset.index, 10);
            submitBtn.disabled = false;
        });

        option.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                option.click();
            }
        });
    });

    // --- LÓGICA DOS CONFETES (do Drag&Drop) ---
    const createConfetti = () => {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = \`hsl(\${Math.random() * 360}, 100%, 70%)\`;
        confetti.style.animationDelay = \`\${Math.random() * 0.5}s\`;
        confetti.style.animationDuration = \`\${2 + Math.random() * 1}s\`;
        celebrationOverlay.appendChild(confetti);

        confetti.addEventListener('animationend', () => {
            confetti.remove();
        });
    };

    const startConfetti = () => {
        celebrationOverlay.classList.add('active');
        for (let i = 0; i < 50; i++) {
            createConfetti();
        }
        setTimeout(() => celebrationOverlay.classList.remove('active'), 2500);
    };

    submitBtn.addEventListener('click', () => {
        if (selectedIndex === null || wrapper.classList.contains('answered')) return;

        wrapper.classList.add('answered');
        submitBtn.disabled = true;
        const isCorrect = (selectedIndex === correctIndex);

        options.forEach((opt, idx) => {
            opt.disabled = true;
            opt.classList.add('disabled');
            if (idx === correctIndex) {
                opt.classList.add('correct');
            } else {
                opt.classList.add('incorrect');
            }
        });

        if (isCorrect) {
            feedbackArea.innerHTML = feedbackCorrect;
            feedbackArea.classList.add('correct');
            startConfetti(); // <-- Nova chamada para a animação de confetes
        } else {
            feedbackArea.innerHTML = feedbackIncorrect;
            feedbackArea.classList.add('incorrect');
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(wrapper);
});
</script>
`;
    }
});
