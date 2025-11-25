// js/modules/accordion.js
// Módulo Acordeão (v5.9.1 - Padding do header reduzido)

GeneratorCore.registerModule('accordion', {
    
    // 1. Setup: (Função para Adicionar/Remover)
    setup(core) {
        const addButton = document.getElementById('accordion-add-item');
        const container = document.getElementById('accordion-items-container');
        
        const updateItemLabels = () => {
            const allBlocks = container.querySelectorAll('.accordion-item-bloco');
            allBlocks.forEach((bloco, index) => {
                const itemNum = index + 1;
                const tituloLabel = bloco.querySelector('label[for^="input-accordion-titulo-"]');
                const tituloInput = bloco.querySelector('.accordion-titulo-input');
                const descLabel = bloco.querySelector('label[for^="input-accordion-desc-"]');
                const descInput = bloco.querySelector('.accordion-desc-input');

                if (tituloLabel && tituloInput) {
                    tituloLabel.innerText = `Título do Item ${itemNum}`;
                    tituloLabel.htmlFor = `input-accordion-titulo-${index}`;
                    tituloInput.id = `input-accordion-titulo-${index}`;
                }
                if (descLabel && descInput) {
                    descLabel.innerText = `Conteúdo do Item ${itemNum}`;
                    descLabel.htmlFor = `input-accordion-desc-${index}`;
                    descInput.id = `input-accordion-desc-${index}`;
                }
            });
        };

        addButton.addEventListener('click', () => {
            const newIndex = container.querySelectorAll('.accordion-item-bloco').length;
            const newItemBlock = document.createElement('div');
            newItemBlock.className = 'accordion-item-bloco';
            
            newItemBlock.innerHTML = `
                <button type="button" class="accordion-remove-item" title="Remover este item">X</button>
                <div class="form-group">
                    <label for="input-accordion-titulo-${newIndex}">Título do Item ${newIndex + 1}</label>
                    <input type="text" id="input-accordion-titulo-${newIndex}" class="rich-text-enabled accordion-titulo-input" required>
                </div>
                <div class="form-group">
                    <label for="input-accordion-desc-${newIndex}">Conteúdo do Item ${newIndex + 1}</label>
                    <textarea id="input-accordion-desc-${newIndex}" class="rich-text-enabled accordion-desc-input" required></textarea>
                </div>
            `;
            container.appendChild(newItemBlock);

            const newTitleInput = newItemBlock.querySelector(`#input-accordion-titulo-${newIndex}`);
            const newDescTextarea = newItemBlock.querySelector(`#input-accordion-desc-${newIndex}`);
            if (newTitleInput) core.utils.enableRichText(newTitleInput);
            if (newDescTextarea) core.utils.enableRichText(newDescTextarea);

            const removeButton = newItemBlock.querySelector('.accordion-remove-item');
            removeButton.addEventListener('click', () => {
                container.removeChild(newItemBlock);
                updateItemLabels();
            });
        });
        
        updateItemLabels();
    },

    // 2. getFormData: (Lê os campos dinâmicos e cores)
    getFormData(core) {
        const corDestaque = document.getElementById('input-accordion-cor').value;
        const corFundo = document.getElementById('input-accordion-bg').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        const corBorda = (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)';
        
        const itemDataArray = [];
        const itemBlocos = document.querySelectorAll('.accordion-item-bloco');
        
        itemBlocos.forEach(bloco => {
            const tituloInput = bloco.querySelector('.accordion-titulo-input');
            const descInput = bloco.querySelector('.accordion-desc-input');
            if (tituloInput && descInput && (tituloInput.value || descInput.value)) {
                itemDataArray.push({
                    titulo: tituloInput.value,
                    conteudo: descInput.value
                });
            }
        });

        let jsonString = JSON.stringify(itemDataArray);
        const safeJsonString = jsonString
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
        
        return {
            uniqueId: `accordion-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-accordion-aria-label').value,
            corDestaque: corDestaque,
            corFundo: corFundo,
            corTexto: corTexto,
            corBorda: corBorda,
            audiodescricao: document.getElementById('input-accordion-audiodescricao').value,
            itemsJson: safeJsonString
        };
    },
    
    // 3. createTemplate: (Gera o código do componente)
    createTemplate(data) {
        const { uniqueId, ariaLabel, corDestaque, corFundo, corTexto, corBorda, itemsJson, audiodescricao } = data;
        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Arial&display=swap');
:root {
    --acc-cor-fundo: ${corFundo};
    --acc-cor-texto: ${corTexto};
    --acc-cor-borda: ${corBorda};
    --acc-cor-destaque: ${corDestaque};
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-secondary: 'Arial', sans-serif;
}
html, body {
    margin: 0; padding: 0;
    background-color: transparent;
}
.accordion-wrapper {
    font-family: var(--font-secondary);
    background-color: var(--acc-cor-fundo);
    border-radius: 8px;
    border: 1px solid var(--acc-cor-borda);
    overflow: hidden;
    color: var(--acc-cor-texto);
    max-width: 700px;
    margin: 10px auto;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .6s ease-out, transform .6s ease-out;
}
.accordion-wrapper.is-visible {
    opacity: 1;
    transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
    .accordion-wrapper { transition: opacity .4s ease-out; transform: none; }
}
.accordion-item {
    border-bottom: 1px solid var(--acc-cor-borda);
}
.accordion-item:last-child {
    border-bottom: none;
}
.accordion-header {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 1.1rem;
    background: none;
    border: none;
    color: var(--acc-cor-texto);
    width: 100%;
    text-align: left;
    padding: 1px 20px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.3s ease, color 0.3s ease;
}
.accordion-header:hover {
    background-color: rgba(0,0,0,0.05);
    color: var(--acc-cor-destaque);
}
.accordion-header.is-open {
    color: var(--acc-cor-destaque);
}
.accordion-header:focus-visible {
    outline: 2px solid var(--acc-cor-destaque);
    outline-offset: -2px;
}
.accordion-header > span:first-child {
    user-select: text;
}
/* Ícone +/- */
.accordion-icon {
    font-size: 1.5rem;
    font-weight: 400;
    margin-left: 15px;
    transition: transform 0.3s ease;
}
.accordion-header.is-open .accordion-icon {
    transform: rotate(45deg);
}
.accordion-panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-out, padding 0.4s ease-out;
}
.accordion-content {
    /* (Mudei o padding-top para 5px para dar um espaço menor após o título) */
    padding: 5px 20px 20px 20px;
    font-size: 0.95rem;
    line-height: 1.6;
    opacity: 0.9;
}
.accordion-content p { margin: 0 0 1em 0; }
.accordion-content p:last-child { margin-bottom: 0; }
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>

<div class="accordion-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    ${audiodescricaoHTML}
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById("${uniqueId}");
    if (!container) return;

    // 1. Parse dos dados
    const itemsData = JSON.parse('${itemsJson}');
    
    // 2. Criação do HTML
    let html = '';
    itemsData.forEach((item, index) => {
        const headerId = 'acc-header-${uniqueId}-' + index;
        const panelId = 'acc-panel-${uniqueId}-' + index;
        
        html += \`
        <div class="accordion-item">
            <h2>
                <button class="accordion-header" id="\${headerId}" aria-controls="\${panelId}" aria-expanded="false">
                    <span>\${item.titulo}</span>
                    <span class="accordion-icon" aria-hidden="true">+</span>
                </button>
            </h2>
            <div class="accordion-panel" id="\${panelId}" role="region" aria-labelledby="\${headerId}" style="max-height: 0;">
                <div class="accordion-content">
                    \${item.conteudo}
                </div>
            </div>
        </div>
        \`;
    });
    container.insertAdjacentHTML('beforeend', html);

    // 3. Lógica de Clique
    container.addEventListener('click', (e) => {
        const header = e.target.closest('.accordion-header');
        if (!header) return;

        const panel = header.parentElement.nextElementSibling;
        const isOpen = header.classList.toggle('is-open');

        header.setAttribute('aria-expanded', isOpen);
        
        if (isOpen) {
            panel.style.maxHeight = panel.scrollHeight + 'px';
        } else {
            panel.style.maxHeight = '0px';
        }
    });
    
    // 4. Efeito de fade-in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(container);
});
</script>
`;
    }
});