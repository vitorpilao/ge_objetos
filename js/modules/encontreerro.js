// js/modules/encontreerro.js
// Novo módulo "Encontre o Erro" - objeto interativo

GeneratorCore.registerModule('encontreerro', {
    // Inicializa os campos dinâmicos de erro
    setup(core) {
        const container = document.getElementById('encontreerro-erros-lista');
        const addButton = document.getElementById('encontreerro-add-erro');
        if (!container || !addButton) return;

        // Limpa o container ao abrir o painel
        container.innerHTML = '';

        function addErroBloco(value = '') {
            const newIndex = container.querySelectorAll('.encontreerro-bloco').length;
            const bloco = document.createElement('div');
            bloco.className = 'encontreerro-bloco';
            bloco.innerHTML = `
                <div class="encontreerro-flex-group">
                    <div class="form-group-textarea" style="flex:1; margin-right:8px;">
                        <label for="input-encontreerro-${newIndex}" style="font-weight:600; margin-bottom:4px;">Erro ${newIndex + 1}</label>
                        <input type="text" id="input-encontreerro-${newIndex}" class="encontreerro-input" placeholder="Digite o texto com erro..." required style="padding:12px; border:1.5px solid var(--color-azul-moderno); border-radius:6px; font-size:1.05rem; font-family:var(--font-secondary); width:100%;" value="${value}">
                    </div>
                    <button type="button" class="encontreerro-remove" title="Remover">&times;</button>
                </div>
            `;
            bloco.querySelector('.encontreerro-remove').onclick = () => bloco.remove();
            container.appendChild(bloco);
        }
        
        addButton.onclick = () => addErroBloco(); // <-- CORREÇÃO: Restaurando o evento de clique.
    },

    // Coleta dados do formulário
    getFormData(core) {
        const erros = [];
        document.querySelectorAll('.encontreerro-input').forEach(input => {
            erros.push(input.value);
        });

        // Função auxiliar para ler de WYSIWYG ou input normal
        const readFieldValue = (fieldId, defaultValue = '') => {
            const field = document.getElementById(fieldId);
            if (!field) return defaultValue;
            
            const wrapper = field.closest('.rich-text-wrapper');
            if (wrapper) {
                const wysiwyg = wrapper.querySelector('.wysiwyg-editor');
                if (wysiwyg) {
                    return (wysiwyg.innerHTML || '').trim();
                }
            }
            return field.value || defaultValue;
        };

        const textoBase = readFieldValue('input-encontreerro-texto', '');
        const corFundo = document.getElementById('input-encontreerro-bg')?.value || '#FFFFFF';
        const corDestaque = document.getElementById('input-encontreerro-cor')?.value || '#0A88F4';
        const corTexto = core.utils.getContrastColor(corFundo);
        const feedbackCorrect = readFieldValue('input-encontreerro-feedback-correct', 'Parabéns! Você encontrou todos os erros.');
        const feedbackIncorrect = readFieldValue('input-encontreerro-feedback-incorrect', 'Você não encontrou todos os erros. As palavras que faltaram estão destacadas em vermelho.');
        const feedbackInitial = readFieldValue('input-encontreerro-feedback-initial', 'Clique nas palavras que você acha que estão erradas.');
        const helpBtnText = readFieldValue('input-encontreerro-help-btn', 'Ajuda');
        const helpActiveText = readFieldValue('input-encontreerro-help-text', 'As palavras suspeitas foram destacadas.');
        const verifyBtnText = readFieldValue('input-encontreerro-verify-btn', 'Verificar');


        return {
            uniqueId: `encontreerro-${Date.now().toString().slice(-6)}`,
            audiodescricao: document.getElementById('input-encontreerro-audiodescricao')?.value,
            ariaLabel: document.getElementById('input-encontreerro-aria-label')?.value || 'Atividade de encontrar o erro',
            erros,
            textoBase,
            corFundo,
            corTexto,
            corDestaque,
            corDestaqueTexto: core.utils.getContrastColor(corDestaque),
            corBorda: (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)',
            feedbackCorrect,
            feedbackIncorrect,
            feedbackInitial,
            helpBtnText,
            helpActiveText,
            verifyBtnText,
            rawErros: erros
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do EncontreErro:', data);
        
        setTimeout(() => {
            const ariaField = document.getElementById('input-encontreerro-aria-label');
            const audioField = document.getElementById('input-encontreerro-audiodescricao');
            const textoField = document.getElementById('input-encontreerro-texto');
            const bgField = document.getElementById('input-encontreerro-bg');
            const corField = document.getElementById('input-encontreerro-cor');
            const feedbackCorrectField = document.getElementById('input-encontreerro-feedback-correct');
            const feedbackIncorrectField = document.getElementById('input-encontreerro-feedback-incorrect');
            const feedbackInitialField = document.getElementById('input-encontreerro-feedback-initial');
            const helpBtnField = document.getElementById('input-encontreerro-help-btn');
            const helpActiveField = document.getElementById('input-encontreerro-help-text');
            const verifyBtnField = document.getElementById('input-encontreerro-verify-btn');
            
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
            restoreFieldWithWYSIWYG(textoField, data.textoBase);
            if (bgField) bgField.value = data.corFundo || '#FFFFFF';
            if (corField) corField.value = data.corDestaque || '#dc3545';
            restoreFieldWithWYSIWYG(feedbackCorrectField, data.feedbackCorrect);
            restoreFieldWithWYSIWYG(feedbackIncorrectField, data.feedbackIncorrect);
            restoreFieldWithWYSIWYG(feedbackInitialField, data.feedbackInitial);
            restoreFieldWithWYSIWYG(helpBtnField, data.helpBtnText);
            restoreFieldWithWYSIWYG(helpActiveField, data.helpActiveText);
            restoreFieldWithWYSIWYG(verifyBtnField, data.verifyBtnText);
            
            // Restaurar erros dinamicamente
            const container = document.getElementById('encontreerro-erros-lista');
            if (container && data.rawErros && Array.isArray(data.rawErros)) {
                container.innerHTML = ''; // Limpa blocos existentes
                
                data.rawErros.forEach((erro, index) => {
                    const bloco = document.createElement('div');
                    bloco.className = 'encontreerro-bloco';
                    bloco.innerHTML = `
                        <div class="encontreerro-flex-group">
                            <div class="form-group-textarea" style="flex:1; margin-right:8px;">
                                <label for="input-encontreerro-${index}" style="font-weight:600; margin-bottom:4px;">Erro ${index + 1}</label>
                                <input type="text" id="input-encontreerro-${index}" class="encontreerro-input" placeholder="Digite o texto com erro..." required style="padding:12px; border:1.5px solid var(--color-azul-moderno); border-radius:6px; font-size:1.05rem; font-family:var(--font-secondary); width:100%;" value="${erro}">
                            </div>
                            <button type="button" class="encontreerro-remove" title="Remover">&times;</button>
                        </div>
                    `;
                    bloco.querySelector('.encontreerro-remove').onclick = () => bloco.remove();
                    container.appendChild(bloco);
                });
            }
            
            console.log('✅ EncontreErro restaurado');
        }, 200);
    },

    // Gera o HTML do preview
    createTemplate(data) {
        const { uniqueId, ariaLabel, audiodescricao, erros, textoBase, corFundo, corTexto, corDestaque, corDestaqueTexto, corBorda, feedbackCorrect, feedbackIncorrect, feedbackInitial, helpBtnText, helpActiveText, verifyBtnText } = data;

        let textoDestacado = textoBase;
        // Usar um placeholder para evitar que substituições afetem outras
        const replacements = [];
        erros.forEach((erro, idx) => {
            if (erro.trim()) {
                const escapedErro = erro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapa caracteres especiais para a regex
                
                // Verifica se o erro é uma "palavra" (letras, números, underscore)
                // ou um "símbolo" (contém outros caracteres).
                const isWord = /^\w+$/.test(erro);

                // Constrói a regex de forma condicional
                const erroRegex = isWord 
                    ? new RegExp(`\\b${escapedErro}\\b`, 'g') // Usa limites de palavra para palavras
                    : new RegExp(escapedErro, 'g');          // Não usa limites para símbolos/tokens

                textoDestacado = textoDestacado.replace(erroRegex, (match) => {
                    const placeholder = `__PLACEHOLDER_${replacements.length}__`;
                    replacements.push(`<button class="encontreerro-item" data-index="${idx}" aria-label="Palavra suspeita: ${match}">${match}</button>`);
                    return placeholder;
                });
            }
        });

        // Substituir os placeholders
        replacements.forEach((replacement, index) => {
            textoDestacado = textoDestacado.replace(`__PLACEHOLDER_${index}__`, replacement);
        });

        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Roboto+Slab:wght@400;700&display=swap');
:root {
    --ee-cor-fundo: ${corFundo};
    --ee-cor-texto: ${corTexto};
    --ee-cor-borda: ${corBorda};
    --ee-cor-destaque: ${corDestaque};
    --ee-cor-destaque-texto: ${corDestaqueTexto};
    --ee-cor-sucesso: #28a745;
    --ee-cor-erro: #dc3545;
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-code: 'Roboto Slab', 'Courier New', monospace;
}
html, body { margin: 0; padding: 0; background-color: transparent; }
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.encontreerro-container {
    background-color: var(--ee-cor-fundo);
    color: var(--ee-cor-texto);
    border: 1px solid var(--ee-cor-borda);
    border-radius: 8px;
    padding: 24px;
    position: relative; /* Para a animação de sucesso */
    max-width: 750px;
    margin: 10px auto;
    font-family: var(--font-primary);
}
/* Entrada suave do componente (fade + slide) */
.encontreerro-container {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .6s ease-out, transform .6s ease-out;
}
.encontreerro-container.is-visible{
    opacity: 1;
    transform: translateY(0);
}
@media (prefers-reduced-motion:reduce){
    .encontreerro-container{transition:none;transform:none;opacity:1}
}
.encontreerro-texto {
    font-family: var(--font-code);
    background-color: rgba(0,0,0,0.2);
    padding: 20px;
    border-radius: 6px;
    font-size: 1.1rem;
    line-height: 1.8;
    white-space: pre-wrap;
    margin-bottom: 20px;
}
.encontreerro-item {
    background-color: transparent;
    color: inherit;
    border: none;
    padding: 2px 4px;
    margin: -2px -4px;
    border-radius: 4px;
    cursor: pointer;
    font: inherit; /* Herda toda a tipografia */
    transition: background-color 0.2s ease, color 0.2s ease;
    border-bottom: 2px dotted transparent; /* Borda invisível por padrão */
}
/* Destaque no hover/focus apenas quando a ajuda estiver ativa */
.help-active .encontreerro-item:hover, .help-active .encontreerro-item:focus {
    background-color: var(--ee-cor-destaque);
    color: var(--ee-cor-destaque-texto);
    outline: none;
}
/* Estilo da borda quando a ajuda está ativa */
.help-active .encontreerro-item {
    border-bottom-color: var(--ee-cor-destaque);
}
/* Estilo para item selecionado pelo usuário */
.encontreerro-item.selected {
    background-color: var(--ee-cor-destaque);
    color: var(--ee-cor-destaque-texto);
    border-bottom-color: transparent;
}
/* Estilo para item correto após verificação */
.encontreerro-item.correct {
    background-color: var(--ee-cor-sucesso);
    color: white;
    cursor: default;
    border-bottom-color: transparent;
    animation: found-anim 0.4s ease;
}
/* Estilo para item que o usuário não encontrou */
.encontreerro-item.missed {
    background-color: var(--ee-cor-erro);
    color: white;
    border-bottom-color: transparent;
}
@keyframes found-anim {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}
/* Animação de sucesso (similar ao Drag&Drop) */
.encontreerro-container.success-anim::before {
    content: '✔';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 80px;
    color: var(--ee-cor-sucesso);
    opacity: 0;
    animation: success-burst 0.8s ease-out forwards;
}
@keyframes success-burst {
    0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

.encontreerro-status {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 15px;
    justify-content: space-between; /* Espaça feedback e ações para extremos */
}
.encontreerro-feedback {
    font-weight: 600;
    flex: 1 1 auto; /* Ocupa o espaço restante, empurrando os botões para a direita */
}
.encontreerro-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-end; /* Garante os botões sempre alinhados à direita */
    flex: 0 0 auto; /* Não expande além do necessário */
    padding-right: 16px; /* Espaço entre os botões e a margem direita do container */
}
.action-stack {
    position: relative;
    display: inline-block; /* Define largura baseada no botão de verificação */
    min-width: max-content; /* Garante largura mínima baseada no conteúdo */
}
.action-stack .encontreerro-verify-btn {
    position: relative; /* Mantém o botão de verificação no fluxo para definir o tamanho da pilha */
    z-index: 1;
}
.action-stack .encontreerro-reset-btn {
    position: absolute; /* Sobrepõe o botão de reset exatamente sobre o verificar */
    top: 0;
    left: 0;
    z-index: 2;
    /*width: 100%; Garante que o botão de reset tenha a mesma largura do botão de verificar */
}
.encontreerro-help-btn {
    font-family: var(--font-primary);
    font-weight: 600;
    background: none;
    border: none;
    color: var(--ee-cor-destaque);
    cursor: pointer;
    text-decoration: underline;
}
.encontreerro-verify-btn {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: var(--ee-cor-destaque);
    color: var(--ee-cor-destaque-texto);
}
.encontreerro-reset-btn {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: var(--ee-cor-destaque);
    color: var(--ee-cor-destaque-texto);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
}
.encontreerro-reset-btn.visible {
    opacity: 1;
    visibility: visible;
}
/* Oculta visualmente mantendo o espaço no layout (não usar display:none) */
.hidden-preserve {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
}
</style>
<div class="encontreerro-container" id="${uniqueId}" role="group" aria-label="${ariaLabel}">
    ${audiodescricaoHTML}
    <div class="encontreerro-texto">${textoDestacado}</div>
    <div class="encontreerro-status">
        <div class="encontreerro-feedback" aria-live="polite">${feedbackInitial}</div>
        <div class="encontreerro-actions">
            <button class="encontreerro-help-btn">${helpBtnText}</button>
            <div class="action-stack">
                <button class="encontreerro-verify-btn">${verifyBtnText}</button>
                <button class="encontreerro-reset-btn">Tentar Novamente</button>
            </div>
        </div>
    </div>
</div>
<script>
(function() {
    const init = () => {
        const container = document.getElementById('${uniqueId}');
        if (!container) return;

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
        
        const totalErros = items.length;

        items.forEach(item => {
            item.addEventListener('click', () => {
                // Permite selecionar/desselecionar apenas se a verificação não foi feita
                if (!container.classList.contains('verified')) {
                    item.classList.toggle('selected');
                }
            });
        });

        verifyBtn.addEventListener('click', () => {
            container.classList.add('verified'); // Marca que a verificação foi feita
            const selectedItems = container.querySelectorAll('.encontreerro-item.selected');

            // Desabilita todos os itens para cliques futuros
            items.forEach(item => item.setAttribute('aria-disabled', 'true'));

            if (selectedItems.length === totalErros) {
                // Caso de sucesso: todas as palavras corretas foram selecionadas
                feedback.innerHTML = '${feedbackCorrect}';
                container.classList.add('success-anim');
                items.forEach(item => item.classList.add('correct'));
            } else {
                // Caso de erro: nem todas as palavras foram encontradas
                feedback.innerHTML = '${feedbackIncorrect}';
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

        helpBtn.addEventListener('click', () => {
            container.classList.add('help-active');
            feedback.innerHTML = '${helpActiveText}';
            helpBtn.classList.add('hidden-preserve'); // Esconde visualmente após o uso, mantendo o espaço
        });

        resetBtn.addEventListener('click', () => {
            container.classList.remove('verified', 'help-active', 'success-anim');
            items.forEach(item => {
                item.classList.remove('selected', 'correct', 'missed');
                item.removeAttribute('aria-disabled');
            });

            feedback.innerHTML = '${feedbackInitial}';
            resetBtn.classList.remove('visible');
            verifyBtn.classList.remove('hidden-preserve');
            helpBtn.classList.remove('hidden-preserve');
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
`;
    }
});
