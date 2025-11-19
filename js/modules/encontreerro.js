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

        const textoBase = document.getElementById('input-encontreerro-texto')?.value || '';
        const corFundo = document.getElementById('input-encontreerro-bg')?.value || '#FFFFFF';
        const corDestaque = document.getElementById('input-encontreerro-cor')?.value || '#0A88F4';
        const corTexto = core.utils.getContrastColor(corFundo);
        const feedbackCorrect = document.getElementById('input-encontreerro-feedback-correct')?.value || 'Parabéns! Você encontrou todos os erros.';
        const feedbackIncorrect = document.getElementById('input-encontreerro-feedback-incorrect')?.value || 'Você não encontrou todos os erros. As palavras que faltaram estão destacadas em vermelho.';
        const feedbackInitial = document.getElementById('input-encontreerro-feedback-initial')?.value || 'Clique nas palavras que você acha que estão erradas.';
        const helpBtnText = document.getElementById('input-encontreerro-help-btn')?.value || 'Ajuda';
        const helpActiveText = document.getElementById('input-encontreerro-help-text')?.value || 'As palavras suspeitas foram destacadas.';
        const verifyBtnText = document.getElementById('input-encontreerro-verify-btn')?.value || 'Verificar';


        return {
            uniqueId: `encontreerro-${Date.now().toString().slice(-6)}`,
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
            verifyBtnText
        };
    },

    // Gera o HTML do preview
    createTemplate(data) {
        const { uniqueId, ariaLabel, erros, textoBase, corFundo, corTexto, corDestaque, corDestaqueTexto, corBorda, feedbackCorrect, feedbackIncorrect, feedbackInitial, helpBtnText, helpActiveText, verifyBtnText } = data;

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
    justify-content: space-between;
    gap: 20px;
    margin-top: 15px;
}
.encontreerro-feedback {
    font-weight: 600;
    flex-grow: 1; /* Faz o feedback ocupar o espaço disponível */
}
.encontreerro-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
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
</style>
<div class="encontreerro-container" id="${uniqueId}" role="group" aria-label="${ariaLabel}">
    <div class="encontreerro-texto">${textoDestacado}</div>
    <div class="encontreerro-status">
        <div class="encontreerro-feedback" aria-live="polite">${feedbackInitial}</div>
        <div class="encontreerro-actions">
            <button class="encontreerro-help-btn">${helpBtnText}</button>
            <button class="encontreerro-verify-btn">${verifyBtnText}</button>
            <button class="encontreerro-reset-btn">Tentar Novamente</button>
        </div>
    </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('${uniqueId}');
    if (!container) return;

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

        // Mostra o botão de reset e esconde o de verificar/ajuda
        resetBtn.classList.add('visible');
        verifyBtn.style.display = 'none';
        helpBtn.style.display = 'none';
    });

    helpBtn.addEventListener('click', () => {
        container.classList.add('help-active');
        feedback.innerHTML = '${helpActiveText}';
        helpBtn.style.display = 'none'; // Esconde o botão após o uso
    });

    resetBtn.addEventListener('click', () => {
        container.classList.remove('verified', 'help-active', 'success-anim');
        items.forEach(item => {
            item.classList.remove('selected', 'correct', 'missed');
            item.removeAttribute('aria-disabled');
        });

        feedback.innerHTML = '${feedbackInitial}';
        resetBtn.classList.remove('visible');
        verifyBtn.style.display = 'inline-block';
        helpBtn.style.display = 'inline-block';
    });
});
</script>
`;
    }
});
