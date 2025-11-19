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
        // Sempre inicia com um campo
        addErroBloco();
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
        };
    },

    // Gera o HTML do preview
    createTemplate(data) {
        const { uniqueId, ariaLabel, erros, textoBase, corFundo, corTexto, corDestaque, corDestaqueTexto, corBorda } = data;

        let textoDestacado = textoBase;
        // Usar um placeholder para evitar que substituições afetem outras
        const replacements = [];
        erros.forEach((erro, idx) => {
            if (erro.trim()) {
                const erroRegex = new RegExp(erro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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
    font-family: inherit;
    font-size: inherit;
    transition: background-color 0.2s ease, color 0.2s ease;
    border-bottom: 2px dotted var(--ee-cor-destaque);
}
.encontreerro-item:hover, .encontreerro-item:focus {
    background-color: var(--ee-cor-destaque);
    color: var(--ee-cor-destaque-texto);
    outline: none;
}
.encontreerro-item.found {
    background-color: var(--ee-cor-sucesso);
    color: white;
    cursor: default;
    border-bottom: 2px solid transparent;
    animation: found-anim 0.4s ease;
}
@keyframes found-anim {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
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
}
.encontreerro-progress-bar {
    flex-grow: 1;
    height: 10px;
    background-color: var(--ee-cor-borda);
    border-radius: 5px;
    overflow: hidden;
}
.encontreerro-progress-inner {
    width: 0%;
    height: 100%;
    background-color: var(--ee-cor-sucesso);
    transition: width 0.5s ease;
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
        <div class="encontreerro-feedback" aria-live="polite">Clique nas palavras que você acha que estão erradas.</div>
        <div class="encontreerro-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="${erros.length}">
            <div class="encontreerro-progress-inner"></div>
        </div>
        <button class="encontreerro-reset-btn">Tentar Novamente</button>
    </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('${uniqueId}');
    if (!container) return;

    const items = container.querySelectorAll('.encontreerro-item');
    const feedback = container.querySelector('.encontreerro-feedback');
    const progressBar = container.querySelector('.encontreerro-progress-bar');
    const progressInner = container.querySelector('.encontreerro-progress-inner');
    const resetBtn = container.querySelector('.encontreerro-reset-btn');
    
    const totalErros = items.length;
    let encontrados = 0;

    const updateState = () => {
        progressInner.style.width = \`\${(encontrados / totalErros) * 100}%\`;
        progressBar.setAttribute('aria-valuenow', encontrados);

        if (encontrados === 0) {
            feedback.textContent = 'Clique nas palavras que você acha que estão erradas.';
        } else if (encontrados === totalErros) {
            feedback.textContent = 'Parabéns! Você encontrou todos os erros.';
            resetBtn.classList.add('visible');
        } else {
            feedback.textContent = \`Erros encontrados: \${encontrados} de \${totalErros}\`;
        }
    };

    items.forEach(item => {
        item.addEventListener('click', () => {
            if (!item.classList.contains('found')) {
                item.classList.add('found');
                item.setAttribute('aria-disabled', 'true');
                encontrados++;
                updateState();
            }
        });
    });

    resetBtn.addEventListener('click', () => {
        encontrados = 0;
        items.forEach(item => {
            item.classList.remove('found');
            item.removeAttribute('aria-disabled');
        });
        resetBtn.classList.remove('visible');
        updateState();
    });

    updateState();
});
</script>
`;
    }
});
