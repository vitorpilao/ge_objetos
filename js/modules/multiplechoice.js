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

        addButton.addEventListener('click', () => {
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
                core.utils.enableRichText(newTextarea);
            }

            addRemoveButton(newBlock, newIndex);
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
        const optionInputs = document.querySelectorAll('#multiplechoice-options-container textarea');
        optionInputs.forEach(input => {
            options.push(input.value);
        });

        const corFundo = document.getElementById('input-multiplechoice-bg').value;
        const corDestaque = document.getElementById('input-multiplechoice-cor').value;

        return {
            uniqueId: `quiz-${Date.now().toString().slice(-6)}`,
            // *** NOVO CAMPO LIDO AQUI ***
            ariaLabel: document.getElementById('input-multiplechoice-aria-label').value,
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

    // 3. createTemplate: (ATUALIZADO)
    createTemplate(data) {
        const {
            uniqueId, 
            // *** NOVA VARIÁVEL AQUI ***
            ariaLabel, 
            question, options, correctIndex, feedbackCorrect, feedbackIncorrect,
            corFundo, corTexto, corBorda, corDestaque, corDestaqueTexto
        } = data;

        const optionsHTML = options.map((optionHTML, index) => {
            return `
            <button class="quiz-option" 
                    role="radio" 
                    aria-checked="false" 
                    data-index="${index}">
                ${optionHTML}
            </button>
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
html, body {
    margin: 0; padding: 0;
    background-color: transparent;
}
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
    transition: opacity .6s ease-out, transform .6s ease-out;
}
.quiz-wrapper.is-visible {
    opacity: 1;
    transform: translateY(0);
}
.quiz-question {
    font-family: var(--font-primary);
    font-weight: 600;
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
    border-radius: 6px;
    border: 2px solid var(--quiz-cor-borda);
    background-color: transparent;
    color: var(--quiz-cor-texto);
    cursor: pointer;
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
</style>

<div class="quiz-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    <div class="quiz-question">${question}</div>
    <div class="quiz-options-list" role="radiogroup" aria-labelledby="quiz-question-${uniqueId}">
        ${optionsHTML}
    </div>
    <button class="quiz-submit-btn" disabled>Verificar</button>
    <div class="quiz-feedback-area" aria-live="polite"></div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById("${uniqueId}");
    if (!wrapper) return;
    
    const options = wrapper.querySelectorAll('.quiz-option');
    const submitBtn = wrapper.querySelector('.quiz-submit-btn');
    const feedbackArea = wrapper.querySelector('.quiz-feedback-area');
    
    const correctIndex = ${correctIndex};
    const feedbackCorrect = '${safeFeedbackCorrect}';
    const feedbackIncorrect = '${safeFeedbackIncorrect}';
    
    let selectedIndex = null;

    options.forEach(option => {
        option.addEventListener('click', () => {
            if (wrapper.classList.contains('answered')) return;
            
            options.forEach(opt => {
                opt.classList.remove('selected');
                opt.setAttribute('aria-checked', 'false');
            });
            
            option.classList.add('selected');
            option.setAttribute('aria-checked', 'true');
            selectedIndex = parseInt(option.dataset.index, 10);
            submitBtn.disabled = false;
        });
    });

    submitBtn.addEventListener('click', () => {
        if (selectedIndex === null || wrapper.classList.contains('answered')) return;

        wrapper.classList.add('answered');
        submitBtn.disabled = true;
        const isCorrect = (selectedIndex === correctIndex);
        
        options.forEach(opt => {
            opt.disabled = true;
            opt.classList.add('disabled');
        });

        if (isCorrect) {
            feedbackArea.innerHTML = feedbackCorrect;
            feedbackArea.classList.add('correct');
            options[selectedIndex].classList.add('correct');
        } else {
            feedbackArea.innerHTML = feedbackIncorrect;
            feedbackArea.classList.add('incorrect');
            if (selectedIndex !== null) {
                options[selectedIndex].classList.add('incorrect');
            }
            options[correctIndex].classList.add('correct');
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