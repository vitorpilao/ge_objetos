// js/modules/dragdrop.js
// Módulo Drag and Drop (v6.2.12 - Correção de Interpolação Aninhada)

GeneratorCore.registerModule('dragdrop', {
    
    currentCategory: null,

    // 1. Setup:
    setup(core) {
        const catList = document.getElementById('dragdrop-category-list');
        const catAddBtn = document.getElementById('dragdrop-add-category');
        const itemList = document.getElementById('dragdrop-items-container');
        const itemAddBtn = document.getElementById('dragdrop-add-item');
        const itemTitle = document.getElementById('dragdrop-selected-category-name');

        let catCounter = 0;
        let itemCounter = 0;

        core.utils.syncCategoryDropdowns = () => {};

        const renderItemManager = (categoryName, selectedEditor = null) => {
            this.currentCategory = categoryName;
            itemTitle.innerHTML = `"${categoryName}"`;
            itemAddBtn.disabled = false;

            itemList.querySelectorAll('.dragdrop-item-bloco').forEach(bloco => {
                bloco.style.display = 'none';
            });
            itemList.querySelectorAll(`.dragdrop-item-bloco[data-category="${categoryName}"]`).forEach(bloco => {
                bloco.style.display = 'block';
            });
            
            catList.querySelectorAll('.wysiwyg-editor').forEach(editor => {
                editor.classList.remove('selected');
            });
            if (selectedEditor) {
                selectedEditor.classList.add('selected');
            }
        };

        const disableItemManager = () => {
            this.currentCategory = null;
            itemTitle.textContent = '[Nenhuma]';
            itemAddBtn.disabled = true;
            itemList.querySelectorAll('.dragdrop-item-bloco').forEach(bloco => {
                bloco.style.display = 'none';
            });
            catList.querySelectorAll('.wysiwyg-editor').forEach(editor => {
                editor.classList.remove('selected');
            });
        };

        // --- LÓGICA DAS CATEGORIAS (COLUNA A) ---
        catAddBtn.addEventListener('click', () => {
            const newCatIndex = catCounter++;
            const newCatName = `Nova Categoria ${newCatIndex + 1}`;
            
            const newCatBlock = document.createElement('div');
            newCatBlock.className = 'category-list-item';
            newCatBlock.innerHTML = `<input type="text" class="rich-text-enabled dragdrop-category-input" placeholder="${newCatName}" value="${newCatName}" style="display:none;"><button type="button" class="category-remove-btn" title="Remover Categoria">X</button>`;
            catList.appendChild(newCatBlock);
            
            const hiddenInput = newCatBlock.querySelector('.dragdrop-category-input');
            const removeButton = newCatBlock.querySelector('.category-remove-btn');
            
            const editorElements = core.utils.enableRichText(hiddenInput);
            const categoryEditor = editorElements.editor;
            
            categoryEditor.dataset.name = newCatName;

            categoryEditor.addEventListener('input', () => {
                const oldCatName = categoryEditor.dataset.name;
                const newCatName = categoryEditor.textContent.trim() || "";
                
                categoryEditor.dataset.name = newCatName;
                
                itemList.querySelectorAll(`.dragdrop-item-bloco[data-category="${oldCatName}"]`).forEach(bloco => {
                    bloco.dataset.category = newCatName;
                });
                
                renderItemManager(newCatName, categoryEditor);
            });

            categoryEditor.addEventListener('click', () => {
                renderItemManager(categoryEditor.dataset.name, categoryEditor);
            });
            
            removeButton.addEventListener('click', () => {
                const catName = categoryEditor.dataset.name;
                
                itemList.querySelectorAll(`.dragdrop-item-bloco[data-category="${catName}"]`).forEach(bloco => {
                    itemList.removeChild(bloco);
                });
                
                catList.removeChild(newCatBlock);
                
                if (this.currentCategory === catName) {
                    disableItemManager();
                }
                
                const firstRemainingCatEditor = catList.querySelector('.wysiwyg-editor');
                if (firstRemainingCatEditor) {
                    renderItemManager(firstRemainingCatEditor.dataset.name, firstRemainingCatEditor);
                } else {
                    disableItemManager();
                }
            });
            
            renderItemManager(newCatName, categoryEditor);
        });

        // --- LÓGICA DOS ITENS (COLUNA B) ---
        itemAddBtn.addEventListener('click', () => {
            if (!this.currentCategory) {
                alert('Por favor, selecione ou adicione uma categoria primeiro.');
                return;
            }

            const newItemIndex = itemCounter++;
            const newBlock = document.createElement('div');
            newBlock.className = 'dragdrop-item-bloco';
            newBlock.dataset.category = this.currentCategory;
            
            newBlock.innerHTML = `<button type="button" class="dragdrop-item-remove-btn" title="Remover Item">X</button><div class="form-group"><label for="input-dragdrop-item-text-${newItemIndex}">Texto do Item</label><input type="text" id="input-dragdrop-item-text-${newItemIndex}" class="rich-text-enabled dragdrop-item-text" placeholder="Ex: Maçã" required style="display:none;"></div>`;
            
            itemList.appendChild(newBlock);
            
            const newTextInput = newBlock.querySelector(`#input-dragdrop-item-text-${newItemIndex}`);
            if (newTextInput) core.utils.enableRichText(newTextInput);
            
            newBlock.querySelector('.dragdrop-item-remove-btn').addEventListener('click', () => {
                itemList.removeChild(newBlock);
            });
        });

        disableItemManager();
    },

    // 2. getFormData:
    getFormData(core) {
        const corFundo = document.getElementById('input-dragdrop-cor-fundo').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        const corBorda = (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)';
        const corDestaque = document.getElementById('input-dragdrop-cor-destaque').value;
        
        const categories = [];
        const categoriesHTML = [];
        const categoryEditors = document.querySelectorAll('#dragdrop-category-list .wysiwyg-editor');
        
        categoryEditors.forEach(editor => {
            const cleanText = editor.textContent.trim();
            const htmlText = editor.innerHTML.trim();
            if (cleanText !== '') {
                categories.push(cleanText);
                categoriesHTML.push(htmlText);
            }
        });

        const items = [];
        let itemIdCounter = 0;
        const itemBlocos = document.querySelectorAll('.dragdrop-item-bloco');
        
        itemBlocos.forEach(itemBlock => {
            const itemEditor = itemBlock.querySelector('.wysiwyg-editor'); 
            const categoryName = itemBlock.dataset.category;
            
            if (itemEditor) {
                const itemHTML = itemEditor.innerHTML.trim(); 
                
                if (itemHTML !== '' && categories.includes(categoryName)) {
                    items.push({
                        id: `item-${itemIdCounter++}`,
                        text: itemHTML,
                        category: categoryName
                    });
                }
            }
        });

        return {
            uniqueId: `dragdrop-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-dragdrop-aria-label').value,
            corFundo: corFundo,
            corTexto: corTexto,
            corBorda: corBorda,
            corDestaque: corDestaque,
            categories: categories,
            categoriesHTML: categoriesHTML,
            items: items,
            corBotaoResetTexto: core.utils.getContrastColor(corDestaque)
        };
    },
    
    // 3. createTemplate:
    createTemplate(data) {
        const { uniqueId, ariaLabel, corFundo, corTexto, corBorda, corDestaque, categories, categoriesHTML, items, corBotaoResetTexto } = data;
        const shuffle = (array) => array.sort(() => Math.random() - 0.5);
        
        const itemsHTML = shuffle(items).map(item => `
            <div class="drag-item" id="${item.id}-${uniqueId}" draggable="true" data-correct-category="${item.category}" aria-grabbed="false">
                ${item.text}
            </div>
        `).join('\n');
        
        const categoriesHTMLBlocks = categories.map((categoryName, index) => `
            <div class="drop-zone" data-category="${categoryName}">
                <h3 class="drop-zone-title">${categoriesHTML[index]}</h3>
                <div class="drop-zone-inner" aria-label="Caixa da categoria ${categoryName}"></div>
            </div>
        `).join('\n');

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Drag & Drop</title>
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
    margin: 0; 
    padding: 0; 
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
}
@media (prefers-reduced-motion: reduce) { 
    .drag-wrapper { transition: none; transform: none; } 
}
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
    overflow-wrap: break-word;
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
    overflow-wrap: break-word;
}
.drag-item:focus { outline-color: var(--dd-cor-destaque); }
.drag-item.dragging { opacity: 0.5; transform: scale(0.95); cursor: grabbing; }
.drag-item p { margin: 0; }
.drag-item.correct { border-left: 4px solid var(--dd-cor-sucesso); }
.drag-item.incorrect { border-left: 4px solid var(--dd-cor-erro); }
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
</head>
<body>

<div class="drag-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    <h3 class="item-bank-title">Itens para categorizar:</h3>
    <div class="item-bank" id="bank-${uniqueId}">
        ${itemsHTML}
    </div>
    <div class="drop-zones-container">
        ${categoriesHTMLBlocks}
    </div>
    <button class="drag-reset-btn" id="reset-${uniqueId}">Resetar</button>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('${uniqueId}');
    if (!wrapper) return;

    const itemBank = document.getElementById('bank-${uniqueId}');
    const dropZones = wrapper.querySelectorAll('.drop-zone');
    const allItems = wrapper.querySelectorAll('.drag-item');
    const resetButton = document.getElementById('reset-${uniqueId}');
    let draggedItem = null;

    // --- Funções de Feedback de Acessibilidade (Live Region) ---
    let ariaLiveRegion = document.getElementById('dragdrop-live-region');
    if (!ariaLiveRegion) {
        ariaLiveRegion = document.createElement('div');
        ariaLiveRegion.id = 'dragdrop-live-region';
        ariaLiveRegion.setAttribute('aria-live', 'assertive');
        ariaLiveRegion.style.cssText = 'position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);';
        document.body.appendChild(ariaLiveRegion);
    }
    const announce = (message) => {
        ariaLiveRegion.textContent = '';
        setTimeout(() => { ariaLiveRegion.textContent = message; }, 150);
    };

    // --- Lógica de Arrastar (Drag) ---
    const onDragStart = (e) => {
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
        e.target.setAttribute('aria-grabbed', 'true');
    
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.id);
        }
        // === CORREÇÃO APLICADA AQUI ===
        announce(\`Item \${draggedItem.textContent.trim()} selecionado.\`);
    };

    const onDragEnd = (e) => {
        e.target.classList.remove('dragging');
        e.target.setAttribute('aria-grabbed', 'false');
        draggedItem = null;
        dropZones.forEach(zone => zone.classList.remove('drag-over'));
    };

    // --- Lógica de Soltar (Drop) ---
    const onDragOver = (e) => {
        e.preventDefault();
        const dropZone = e.target.closest('.drop-zone');
        if (dropZone) {
            dropZones.forEach(zone => zone.classList.remove('drag-over'));
            dropZone.classList.add('drag-over');
        }
    };

    const onDragLeave = (e) => {
        const dropZone = e.target.closest('.drop-zone');
        if (dropZone) {
            dropZone.classList.remove('drag-over');
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        const targetZone = e.target.closest('.drop-zone, .item-bank');
        if (!targetZone || !draggedItem) return;
        const correctCategory = draggedItem.dataset.correctCategory;
        const targetCategory = targetZone.dataset.category || null;

        // Soltando em uma caixa de categoria
        if (targetZone.classList.contains('drop-zone')) {
            const innerZone = targetZone.querySelector('.drop-zone-inner');
            innerZone.appendChild(draggedItem);
            
            // Verifica se está correto
            if (correctCategory === targetCategory) {
                draggedItem.classList.add('correct');
                draggedItem.classList.remove('incorrect');
                // === CORREÇÃO APLICADA AQUI ===
                announce(\`\${draggedItem.textContent.trim()} solto em \${targetCategory}. Correto.\`);
            } else {
                draggedItem.classList.add('incorrect');
                draggedItem.classList.remove('correct');
                // === CORREÇÃO APLICADA AQUI ===
                announce(\`\${draggedItem.textContent.trim()} solto em \${targetCategory}. Incorreto.\`);

            }
        } 
        // Soltando de volta no banco
        else if (targetZone.classList.contains('item-bank')) {
            targetZone.appendChild(draggedItem);
            draggedItem.classList.remove('correct', 'incorrect');
            // === CORREÇÃO APLICADA AQUI ===
            announce(\`\${draggedItem.textContent.trim()} retornado ao banco.\`);
        }
    };


    // --- Lógica de Reset ---
    const resetAll = () => {
        allItems.forEach(item => {
            item.classList.remove('correct', 'incorrect');
            itemBank.appendChild(item); // Devolve ao banco
        });
        announce('Atividade resetada. Todos os itens voltaram ao banco.');
    };

    // --- Adiciona os Event Listeners ---
    allItems.forEach(item => {
        item.addEventListener('dragstart', onDragStart);
        item.addEventListener('dragend', onDragEnd);
    });

    wrapper.addEventListener('dragover', onDragOver);
    wrapper.addEventListener('dragleave', onDragLeave);
    wrapper.addEventListener('drop', onDrop);
    resetButton.addEventListener('click', resetAll);
});
</script>
</body>
</html>
`;
    }
});