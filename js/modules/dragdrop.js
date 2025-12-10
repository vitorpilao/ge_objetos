// js/modules/dragdrop.js
// Módulo Drag and Drop (v6.2.18 - Adiciona fundo no título da categoria)

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
                try { GeneratorCore.showAppToast('Por favor, selecione ou adicione uma categoria primeiro.', 'error'); } catch(e) { alert('Por favor, selecione ou adicione uma categoria primeiro.'); }
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
        
        const corItemFundo = document.getElementById('input-dragdrop-cor-item').value;
        const corItemTexto = core.utils.getContrastColor(corItemFundo);

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
            audiodescricao: document.getElementById('input-dragdrop-audiodescricao').value,
            corFundo: corFundo,
            corTexto: corTexto,
            corBorda: corBorda,
            corDestaque: corDestaque,
            corItemFundo: corItemFundo,
            corItemTexto: corItemTexto,
            categories: categories,
            categoriesHTML: categoriesHTML,
            items: items,
            corBotaoResetTexto: core.utils.getContrastColor(corDestaque),
            rawCategories: categories,
            rawItems: items
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do DragDrop:', data);
        
        setTimeout(() => {
            const ariaField = document.getElementById('input-dragdrop-aria-label');
            const audioField = document.getElementById('input-dragdrop-audiodescricao');
            const bgField = document.getElementById('input-dragdrop-bg');
            const corItemBgField = document.getElementById('input-dragdrop-item-bg');
            const corDestaqueField = document.getElementById('input-dragdrop-cor-destaque');
            
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
            if (bgField) bgField.value = data.corFundo || '#FFFFFF';
            if (corItemBgField) corItemBgField.value = data.corItemFundo || '#F8F9FA';
            if (corDestaqueField) corDestaqueField.value = data.corDestaque || '#0A88F4';
            
            // Restaurar categorias
            const catList = document.getElementById('dragdrop-category-list');
            const itemList = document.getElementById('dragdrop-items-container');
            const itemTitle = document.getElementById('dragdrop-selected-category-name');
            const itemAddBtn = document.getElementById('dragdrop-add-item');
            
            // Função auxiliar para mostrar itens de uma categoria
            const showItemsForCategory = (categoryName, selectedEditor = null) => {
                console.log('📂 Mostrando itens para categoria:', categoryName);
                
                // IMPORTANTE: Atualizar this.currentCategory para que o botão "Adicionar Item" funcione
                this.currentCategory = categoryName;
                
                itemTitle.innerHTML = `"${categoryName}"`;
                itemAddBtn.disabled = false;
                
                // Esconder todos os itens
                const allItems = itemList.querySelectorAll('.dragdrop-item-bloco');
                console.log('  📦 Total de itens:', allItems.length);
                allItems.forEach(bloco => {
                    bloco.style.display = 'none';
                });
                
                // Mostrar apenas itens desta categoria
                const categoryItems = itemList.querySelectorAll(`.dragdrop-item-bloco[data-category="${categoryName}"]`);
                console.log('  ✅ Itens desta categoria:', categoryItems.length);
                categoryItems.forEach(bloco => {
                    bloco.style.display = 'block';
                });
                
                catList.querySelectorAll('.wysiwyg-editor').forEach(editor => {
                    editor.classList.remove('selected');
                });
                if (selectedEditor) {
                    selectedEditor.classList.add('selected');
                }
            };
            
            if (catList && data.rawCategories && data.rawCategories.length > 0) {
                console.log('📋 Restaurando', data.rawCategories.length, 'categorias:', data.rawCategories);
                catList.innerHTML = '';
                
                data.rawCategories.forEach((categoryName, catIndex) => {
                    console.log(`  ➕ Criando categoria ${catIndex + 1}:`, categoryName);
                    
                    const newCatBlock = document.createElement('div');
                    newCatBlock.className = 'category-list-item';
                    newCatBlock.innerHTML = `<input type="text" class="rich-text-enabled dragdrop-category-input" value="${categoryName}" style="display:none;"><button type="button" class="category-remove-btn" title="Remover Categoria">X</button>`;
                    catList.appendChild(newCatBlock);
                    
                    const hiddenInput = newCatBlock.querySelector('.dragdrop-category-input');
                    const editorElements = GeneratorCore.utils.enableRichText(hiddenInput);
                    const categoryEditor = editorElements.editor;
                    categoryEditor.dataset.name = categoryName;
                    categoryEditor.innerHTML = categoryName;
                    
                    // Adicionar evento de clique para mostrar os itens desta categoria
                    categoryEditor.addEventListener('click', () => {
                        console.log('🖱️ Categoria clicada:', categoryName);
                        showItemsForCategory(categoryName, categoryEditor);
                    });
                    
                    // Adicionar evento de remoção
                    const removeBtn = newCatBlock.querySelector('.category-remove-btn');
                    removeBtn.addEventListener('click', async () => {
                        const catName = categoryEditor.dataset.name;
                        const confirmed = await GeneratorCore.showAppConfirm(`Deseja remover a categoria "${catName}" e todos os seus itens?`);
                        if (!confirmed) return;
                        itemList.querySelectorAll(`.dragdrop-item-bloco[data-category="${catName}"]`).forEach(item => item.remove());
                        newCatBlock.remove();
                        if (this.currentCategory === catName) {
                            this.currentCategory = null;
                            itemAddBtn.disabled = true;
                            itemTitle.innerHTML = '(nenhuma selecionada)';
                        }
                    });
                    
                    console.log('  ✅ Categoria criada e evento anexado');
                });
            }
            
            // Restaurar itens
            if (itemList && data.rawItems && data.rawItems.length > 0) {
                console.log('📦 Restaurando', data.rawItems.length, 'itens');
                itemList.innerHTML = '';
                
                data.rawItems.forEach((item, index) => {
                    console.log(`  ➕ Criando item ${index + 1}:`, item.text, 'para categoria:', item.category);
                    
                    const newBlock = document.createElement('div');
                    newBlock.className = 'dragdrop-item-bloco';
                    newBlock.dataset.category = item.category;
                    newBlock.style.display = 'none'; // Esconder até selecionar categoria
                    
                    newBlock.innerHTML = `<button type="button" class="dragdrop-item-remove-btn" title="Remover Item">X</button><div class="form-group"><label for="input-dragdrop-item-text-${index}">Texto do Item</label><input type="text" id="input-dragdrop-item-text-${index}" class="rich-text-enabled dragdrop-item-text" placeholder="Ex: Item" required style="display:none;"></div>`;
                    
                    itemList.appendChild(newBlock);
                    
                    const textInput = newBlock.querySelector(`#input-dragdrop-item-text-${index}`);
                    if (textInput) {
                        const editorElements = GeneratorCore.utils.enableRichText(textInput);
                        const editor = editorElements.editor;
                        editor.innerHTML = item.text || '';
                        console.log('  ✅ Item criado com texto:', item.text);
                    }
                });
                
                console.log('✅ Todos os itens restaurados');
            }
            
            console.log('✅ DragDrop restaurado');
            
            // Selecionar automaticamente a primeira categoria para mostrar os itens
            setTimeout(() => {
                const firstCategory = catList.querySelector('.wysiwyg-editor');
                if (firstCategory) {
                    console.log('🎯 Selecionando primeira categoria automaticamente');
                    firstCategory.click();
                }
            }, 100);
        }, 200);
    },
    
    // 3. createTemplate:
    createTemplate(data) {
        const { uniqueId, ariaLabel, audiodescricao, corFundo, corTexto, corBorda, corDestaque, categories, categoriesHTML, items, corBotaoResetTexto, corItemFundo, corItemTexto } = data;
        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        const shuffle = (array) => array.sort(() => Math.random() - 0.5);
        
        const itemsHTML = shuffle(items).map(item => `
            <div class="drag-item" id="${item.id}-${uniqueId}" draggable="true" data-correct-category="${item.category}" aria-grabbed="false" tabindex="0">
                ${item.text}
            </div>
        `).join('\n');
        
        const categoriesHTMLBlocks = categories.map((categoryName, index) => `
            <div class="drop-zone" data-category="${categoryName}">
                <h3 class="drop-zone-title">${categoriesHTML[index]}</h3>
                <div class="drop-zone-inner" tabindex="0" aria-label="Caixa da categoria ${categoryName}"></div>
            </div>
        `).join('\n');

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Drag & Drop</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Arial&display=swap');
:root {
    --dd-cor-fundo: ${corFundo};
    --dd-cor-texto: ${corTexto};
    --dd-cor-borda: ${corBorda};
    --dd-cor-destaque: ${corDestaque};
    --dd-cor-sucesso: ${corDestaque}; 
    --dd-cor-erro: #dc3545; 
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-secondary: 'Arial', sans-serif;
    --dd-cor-item-fundo: ${corItemFundo};
    --dd-cor-item-texto: ${corItemTexto};
}
html, body { 
    margin: 0; 
    padding: 0; 
    background-color: transparent; 
    font-family: var(--font-secondary); 
}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.drag-wrapper { 
    background-color: var(--dd-cor-fundo); 
    color: var(--dd-cor-texto); 
    border: 1px solid var(--dd-cor-borda); 
    border-radius: 8px; 
    padding: 1.5rem; 
    max-width: 800px; 
    margin: 10px auto; 
    /* Entrada suave: comece invisível e desloque-se para baixo */
    opacity: 0;
    transform: translateY(20px);
    transition: opacity .6s ease-out, transform .6s ease-out, box-shadow .3s ease-in-out;
    position: relative; 
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); 
}
.drag-wrapper.is-visible{
    opacity: 1;
    transform: translateY(0);
}
.drag-wrapper.all-correct {
    box-shadow: 0 0 15px var(--dd-cor-sucesso);
    border-color: var(--dd-cor-sucesso);
}
@media (prefers-reduced-motion: reduce) { 
    .drag-wrapper { transition: none; transform: none; opacity:1 } 
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
/* --- MUDANÇA APLICADA AQUI --- */
.drop-zone-title { 
    font-family: var(--font-primary); 
    font-weight: 600; 
    font-size: 1.1rem; 
    margin: 0; 
    padding: 12px 15px; 
    border-bottom: 1px solid var(--dd-cor-borda); 
    overflow-wrap: break-word;
    background-color: rgba(16, 29, 214, 0.507); /* <-- SUA ALTERAÇÃO */
}
/* --- FIM DA MUDANÇA --- */

.drop-zone-inner { 
    padding: 15px; 
    min-height: 100px; 
    display: flex; 
    flex-direction: column; 
    gap: 10px; 
}
.drag-item { 
    background-color: var(--dd-cor-item-fundo);
    color: var(--dd-cor-item-texto);
    border: 2px solid transparent; 
    box-shadow: 0 2px 5px rgba(0,0,0,0.1); 
    border-radius: 99px; 
    padding: 8px 16px; 
    font-size: 0.95rem; 
    font-weight: 600; 
    font-family: var(--font-primary);
    cursor: grab; 
    transition: all 0.2s ease; 
    /* Permite seleção de texto nas "pills" (por mouse/teclado) */
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
    outline: 2px solid transparent; 
    overflow-wrap: break-word;
    display: inline-block; 
    text-align: center;
}
.drag-item:focus { outline-color: var(--dd-cor-destaque); }
.drag-item.dragging { opacity: 0.5; transform: scale(0.95); cursor: grabbing; }

/* Enquanto o item está sendo arrastado, evitar seleção de texto */
.drag-item.dragging {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
.drag-item p { margin: 0; }
.drag-item.correct { 
    border-color: var(--dd-cor-sucesso); 
}
.drag-item.incorrect { 
    border-color: var(--dd-cor-erro); 
}
.drag-verify-btn { 
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
.drag-verify-btn:disabled {
    background-color: #888;
    cursor: not-allowed;
}

/* --- ESTILOS PARA CONFETES E MENSAGEM DE SUCESSO --- */
.confetti-celebration {
    position: absolute;
    top: 0;
    left: 0;
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
    animation: slideInMessage 0.6s ease-out forwards 0.5s;
}

.confetti {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #f00;
    border-radius: 50%;
    opacity: 0;
    animation: confetti-fall 3s linear forwards;
}

@keyframes confetti-fall {
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
@keyframes slideInMessage {
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
</head>
<body>

<div class="drag-wrapper" id="${uniqueId}" role="region" aria-label="${ariaLabel}">
    ${audiodescricaoHTML}
    <h3 class="item-bank-title">Itens para categorizar:</h3>
    <div class="item-bank" id="bank-${uniqueId}">
        ${itemsHTML}
    </div>
    <div class="drop-zones-container">
        ${categoriesHTMLBlocks}
    </div>
    <button class="drag-verify-btn" id="verify-${uniqueId}">Verificar Respostas</button>

    
<div class="confetti-celebration" id="celebration-${uniqueId}">
        <p class="confetti-message">Parabéns, você acertou!</p>
    </div>
    
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('${uniqueId}');
    if (!wrapper) return;

    // Entrada suave: adiciona a classe .is-visible quando o componente entra na viewport
    try {
        const obsTarget = wrapper;
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
        wrapper.classList.add('is-visible');
    }

    const itemBank = document.getElementById('bank-${uniqueId}');
    const dropZones = wrapper.querySelectorAll('.drop-zone');
    const allItems = wrapper.querySelectorAll('.drag-item');
    const verifyButton = document.getElementById('verify-${uniqueId}');
    const celebrationOverlay = document.getElementById('celebration-${uniqueId}');
    const confettiMessage = celebrationOverlay.querySelector('.confetti-message');
    let draggedItem = null;

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
        for (let i = 0; i < 50; i++) {
            createConfetti();
        }
    };

    const stopConfetti = () => {
        celebrationOverlay.querySelectorAll('.confetti').forEach(c => c.remove());
    };


    const onDragStart = (e) => {
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
        e.target.setAttribute('aria-grabbed', 'true');
    
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.id);
        }
        announce(\`Item \${draggedItem.textContent.trim()} selecionado.\`);
    };

    const onDragEnd = (e) => {
        e.target.classList.remove('dragging');
        e.target.setAttribute('aria-grabbed', 'false');
        draggedItem = null;
        dropZones.forEach(zone => zone.classList.remove('drag-over'));
    };

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
        
        draggedItem.classList.remove('correct', 'incorrect');
        wrapper.classList.remove('all-correct');
        celebrationOverlay.classList.remove('active');
        stopConfetti();
        verifyButton.disabled = false;

        if (targetZone.classList.contains('drop-zone')) {
            const innerZone = targetZone.querySelector('.drop-zone-inner');
            innerZone.appendChild(draggedItem);
            announce(\`\${draggedItem.textContent.trim()} solto em \${targetZone.dataset.category}.\`);
        } 
        else if (targetZone.classList.contains('item-bank')) {
            targetZone.appendChild(draggedItem);
            announce(\`\${draggedItem.textContent.trim()} retornado ao banco.\`);
        }
    };

    const resetAll = () => {
        allItems.forEach(item => {
            item.classList.remove('correct', 'incorrect');
            itemBank.appendChild(item); 
        });
        wrapper.classList.remove('all-correct');
        celebrationOverlay.classList.remove('active');
        stopConfetti();
        verifyButton.disabled = false;
        announce('Atividade resetada. Tente novamente.');
    };

    const verifyAll = () => {
        let hasWrongItem = false;
        let itemsInBank = itemBank.querySelectorAll('.drag-item').length > 0;

        allItems.forEach(item => item.classList.remove('correct', 'incorrect'));

        if (itemsInBank) {
            announce('Você precisa categorizar todos os itens antes de verificar.');
            return;
        }

        dropZones.forEach(zone => {
            const targetCategory = zone.dataset.category;
            zone.querySelectorAll('.drag-item').forEach(item => {
                if (item.dataset.correctCategory === targetCategory) {
                    item.classList.add('correct');
                } else {
                    item.classList.add('incorrect');
                    hasWrongItem = true;
                }
            });
        });

        if (hasWrongItem) {
            announce('Quase lá! Verifique os erros. Resetando em 1 segundo.');
            verifyButton.disabled = true;
            setTimeout(() => {
                resetAll();
            }, 1000); 

        } else {
            wrapper.classList.add('all-correct');
            celebrationOverlay.classList.add('active');
            startConfetti();
            verifyButton.disabled = true; 
            announce('Parabéns, você acertou tudo!');
        }
    };

    allItems.forEach(item => {
        item.addEventListener('dragstart', onDragStart);
        item.addEventListener('dragend', onDragEnd);
    });

    wrapper.addEventListener('dragover', onDragOver);
    wrapper.addEventListener('dragleave', onDragLeave);
    wrapper.addEventListener('drop', onDrop);
    
    verifyButton.addEventListener('click', verifyAll);
});
</script>
</body>
</html>
`;
    }
});