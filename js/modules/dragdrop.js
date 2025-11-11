// js/modules/dragdrop.js
// Módulo Drag and Drop (v6.1.1 - Correção de bug de Setup)

GeneratorCore.registerModule('dragdrop', {
    
    // 1. (ATUALIZADO) Setup: Ordem da lógica corrigida
    setup(core) {
        // --- Referências dos Containers ---
        const catContainer = document.getElementById('dragdrop-categories-container');
        const itemContainer = document.getElementById('dragdrop-items-container');
        const catAddButton = document.getElementById('dragdrop-add-category');
        const itemAddButton = document.getElementById('dragdrop-add-item');

        // --- FUNÇÃO DE SINCRONIZAÇÃO (Definida PRIMEIRO) ---
        // (Anexa ao core.utils para ser acessível por todos)
        core.utils.syncCategoryDropdowns = () => {
            const categoryInputs = catContainer.querySelectorAll('.dragdrop-category-input');
            const categories = Array.from(categoryInputs)
                                    .map(input => input.value.trim())
                                    .filter(val => val !== '');
            const allDropdowns = document.querySelectorAll('.dragdrop-item-cat');
            
            allDropdowns.forEach(dropdown => {
                const currentValue = dropdown.value;
                dropdown.innerHTML = '';
                dropdown.add(new Option('-- Selecione --', ''));
                categories.forEach(catName => {
                    dropdown.add(new Option(catName, catName));
                });
                dropdown.value = currentValue;
            });
        };

        // --- Lógica para Categorias ---
        const updateCatLabels = () => {
            const allBlocks = catContainer.querySelectorAll('.dragdrop-category-bloco');
            allBlocks.forEach((bloco, index) => {
                const itemNum = index + 1;
                const label = bloco.querySelector('label');
                const input = bloco.querySelector('input');
                if (label && input) {
                    label.innerText = `Nome da Categoria ${itemNum}`;
                    label.htmlFor = `input-dragdrop-category-${index}`;
                    input.id = `input-dragdrop-category-${index}`;
                }
            });
        };

        // Gatilho 1: Quando o usuário DIGITA em qualquer campo de categoria
        catContainer.addEventListener('input', (e) => {
            if (e.target.classList.contains('dragdrop-category-input')) {
                core.utils.syncCategoryDropdowns();
            }
        });

        // Gatilho 2: Quando clica em "+ Adicionar Categoria"
        catAddButton.addEventListener('click', () => {
            const newIndex = catContainer.querySelectorAll('.dragdrop-category-bloco').length;
            const newBlock = document.createElement('div');
            newBlock.className = 'dragdrop-category-bloco';
            
            newBlock.innerHTML = `
                <button type="button" class="dragdrop-remove-category" title="Remover Categoria">X</button>
                <div class="form-group">
                    <label for="input-dragdrop-category-${newIndex}">Nome da Categoria ${newIndex + 1}</label>
                    <input type="text" id="input-dragdrop-category-${newIndex}" class="dragdrop-category-input" placeholder="Ex: Vegetais" required>
                </div>
            `;
            catContainer.appendChild(newBlock);

            const removeButton = newBlock.querySelector('.dragdrop-remove-category');
            removeButton.addEventListener('click', () => {
                catContainer.removeChild(newBlock);
                updateCatLabels();
                core.utils.syncCategoryDropdowns();
            });
            
            updateCatLabels();
            core.utils.syncCategoryDropdowns();
        });
        
        // --- Lógica para Itens ---
        const updateItemLabels = () => {
            const allBlocks = itemContainer.querySelectorAll('.dragdrop-item-bloco');
            allBlocks.forEach((bloco, index) => {
                const itemNum = index + 1;
                const textLabel = bloco.querySelector('label[for^="input-dragdrop-item-text-"]');
                const textInput = bloco.querySelector('.dragdrop-item-text');
                const catLabel = bloco.querySelector('label[for^="input-dragdrop-item-cat-"]');
                const catInput = bloco.querySelector('.dragdrop-item-cat');
                if (textLabel && textInput) {
                    textLabel.innerText = `Texto do Item ${itemNum}`;
                    textLabel.htmlFor = `input-dragdrop-item-text-${index}`;
                    textInput.id = `input-dragdrop-item-text-${index}`;
                }
                if (catLabel && catInput) {
                    catLabel.innerText = `Categoria Correta do Item ${itemNum}`;
                    catLabel.htmlFor = `input-dragdrop-item-cat-${index}`;
                    catInput.id = `input-dragdrop-item-cat-${index}`;
                }
            });
        };

        // Gatilho 3: Quando clica em "+ Adicionar Item"
        itemAddButton.addEventListener('click', () => {
            const newIndex = itemContainer.querySelectorAll('.dragdrop-item-bloco').length;
            const newBlock = document.createElement('div');
            newBlock.className = 'dragdrop-item-bloco';
            
            newBlock.innerHTML = `
                <button type="button" class="dragdrop-remove-item" title="Remover Item">X</button>
                <div class="form-group">
                    <label for="input-dragdrop-item-text-${newIndex}">Texto do Item ${newIndex + 1}</label>
                    <input type="text" id="input-dragdrop-item-text-${newIndex}" class="rich-text-enabled dragdrop-item-text" placeholder="Ex: Cenoura" required>
                </div>
                <div class="form-group">
                    <label for="input-dragdrop-item-cat-${newIndex}">Categoria Correta do Item ${newIndex + 1}</label>
                    <select id="input-dragdrop-item-cat-${newIndex}" class="dragdrop-item-cat" required>
                    </select>
                </div>
            `;
            itemContainer.appendChild(newBlock);

            const newTextInput = newBlock.querySelector(`#input-dragdrop-item-text-${newIndex}`);
            if (newTextInput) core.utils.enableRichText(newTextInput);

            const removeButton = newBlock.querySelector('.dragdrop-remove-item');
            removeButton.addEventListener('click', () => {
                itemContainer.removeChild(newBlock);
                updateItemLabels();
            });
            
            updateItemLabels();
            core.utils.syncCategoryDropdowns();
        });
        
        // --- Sincronização Inicial ---
        updateCatLabels();
        updateItemLabels();
        core.utils.syncCategoryDropdowns(); // Agora esta função já existe no 'core'
    },

    // 2. getFormData:
    getFormData(core) {
        const corFundo = document.getElementById('input-dragdrop-cor-fundo').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        const corBorda = (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)';
        const corDestaque = document.getElementById('input-dragdrop-cor-destaque').value;

        const categoryInputs = document.querySelectorAll('.dragdrop-category-input');
        const categories = Array.from(categoryInputs).map(input => input.value.trim());

        const itemBlocos = document.querySelectorAll('.dragdrop-item-bloco');
        const items = Array.from(itemBlocos).map((bloco, index) => {
            const textInput = bloco.querySelector('.dragdrop-item-text');
            const catInput = bloco.querySelector('.dragdrop-item-cat');
            return {
                id: `item-${index}`,
                text: textInput.value,
                category: catInput.value.trim()
            };
        });
        
        return {
            uniqueId: `dragdrop-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-dragdrop-aria-label').value,
            corFundo: corFundo,
            corTexto: corTexto,
            corBorda: corBorda,
            corDestaque: corDestaque,
            categories: categories,
            items: items,
            corBotaoResetTexto: core.utils.getContrastColor(corDestaque)
        };
    },
    
    // 3. createTemplate:
    createTemplate(data) {
        const { uniqueId, ariaLabel, corFundo, corTexto, corBorda, corDestaque, categories, items, corBotaoResetTexto } = data;
        const shuffle = (array) => array.sort(() => Math.random() - 0.5);
        const itemsHTML = shuffle(items).map(item => `
            <div class="drag-item" id="${item.id}-${uniqueId}" draggable="true" data-correct-category="${item.category}" aria-grabbed="false">
                ${item.text}
            </div>
        `).join('\n');
        const categoriesHTML = categories.map((category, index) => `
            <div class="drop-zone" data-category="${category}">
                <h3 class="drop-zone-title">${category}</h3>
                <div class="drop-zone-inner" aria-label="Caixa da categoria ${category}"></div>
            </div>
        `).join('\n');

        return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Arial&display=swap');
:root {
    --dd-cor-fundo: ${corFundo};
    --dd-cor-texto: ${corTexto};
    --dd-cor-borda: ${corBorda};
    --dd-cor-destaque: ${corDestaque};
    --dd-cor-sucesso: ${corDestaque};
    --dd-cor-erro: #dc3545;
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-secondary: 'Arial', sans-serif;
}
html, body {
    margin: 0; padding: 0;
    background-color: transparent;
    font-family: var(--font-secondary);
}
.drag-wrapper {
    background-color: var(--dd-cor-fundo);
    color: var(--dd-cor-texto);
    border: 1px solid var(--dd-cor-borda);
    border-radius: 8px;
    padding: 1.5rem;
    max-width: 800px;
    margin: 10px auto;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .6s ease-out, transform .6s ease-out;
}
.drag-wrapper.is-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .drag-wrapper { transition: none; transform: none; } }
.item-bank {
    padding: 1rem;
    border: 2px dashed var(--dd-cor-borda);
    border-radius: 6px;
    min-height: 80px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
}
.item-bank-title {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 1rem;
    opacity: 0.8;
    margin: 0 0 10px 0;
}
.drop-zones-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}
.drop-zone {
    border: 1px solid var(--dd-cor-borda);
    border-radius: 6px;
    transition: background-color 0.3s ease;
}
.drop-zone.drag-over {
    background-color: rgba(0,0,0,0.1);
}
.drop-zone-title {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 1.1rem;
    margin: 0;
    padding: 12px 15px;
    border-bottom: 1px solid var(--dd-cor-borda);
}
.drop-zone-inner {
    padding: 15px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.drag-item {
    background-color: var(--dd-cor-fundo);
    border: 1px solid var(--dd-cor-borda);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    border-radius: 4px;
    padding: 10px 15px;
    font-size: 0.95rem;
    cursor: grab;
    transition: all 0.2s ease;
    user-select: none;
    outline: 2px solid transparent;
}
.drag-item:focus {
    outline-color: var(--dd-cor-destaque);
}
.drag-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
    cursor: grabbing;
}
.drag-item p { margin: 0; }
.drag-item.correct {
    border-left: 4px solid var(--dd-cor-sucesso);
}
.drag-item.incorrect {
    border-left: 4px solid var(--dd-cor-erro);
}
.drag-reset-btn {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: var(--dd-cor-destaque);
    color: ${corBotaoResetTexto};
    margin-top: 20px;
    display: block;
}
</style>

<div class="drag-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    <h3 class="item-bank-title">Itens para categorizar:</h3>
    <div class="item-bank" id="bank-${uniqueId}">
        ${itemsHTML}
    </div>
    <div class="drop-zones-container">
        ${categoriesHTML}
    </div>
    <button class="drag-reset-btn" id="reset-${uniqueId}">Resetar</button>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById("${uniqueId}");
    if (!container) return;
    
    const bank = document.getElementById("bank-${uniqueId}");
    const items = container.querySelectorAll('.drag-item');
    const zones = container.querySelectorAll('.drop-zone-inner');
    const resetBtn = document.getElementById("reset-${uniqueId}");

    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target;
            e.dataTransfer.setData('text/plain', e.target.id);
            setTimeout(() => {
                e.target.classList.add('dragging');
                e.target.setAttribute('aria-grabbed', 'true');
            }, 0);
        });
        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            e.target.setAttribute('aria-grabbed', 'false');
            draggedItem = null;
        });
    });

    const allDropAreas = [bank, ...Array.from(zones)];
    
    allDropAreas.forEach(area => {
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.parentElement.classList.add('drag-over');
        });
        area.addEventListener('dragleave', (e) => {
            area.parentElement.classList.remove('drag-over');
        });
        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.parentElement.classList.remove('drag-over');
            if (!draggedItem) return;
            area.appendChild(draggedItem);
            
            const zoneCategory = area.parentElement.dataset.category;
            const itemCategory = draggedItem.dataset.correctCategory;

            if (area === bank) {
                draggedItem.classList.remove('correct', 'incorrect');
            } else {
                if (zoneCategory === itemCategory) {
                    draggedItem.classList.add('correct');
                    draggedItem.classList.remove('incorrect');
                } else {
                    draggedItem.classList.add('incorrect');
                    draggedItem.classList.remove('correct');
                }
            }
        });
    });

    resetBtn.addEventListener('click', () => {
        items.forEach(item => {
            item.classList.remove('correct', 'incorrect');
            bank.appendChild(item);
        });
    });

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