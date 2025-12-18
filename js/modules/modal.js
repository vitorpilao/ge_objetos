// js/modules/modal.js
// Módulo Modal de Imagem (v5.9.1 - Estilo Lightbox)

GeneratorCore.registerModule('modal', {
    // 0. Setup: gerencia UI de Hotspots no painel (editor)
    setup(core) {
        const container = document.getElementById('modal-hotspots-container');

        if (!container) return;

        // Função para criar bloco de hotspot
        const createHotspotBlock = (index, data = {}) => {
            const bloco = document.createElement('div');
            bloco.className = 'modal-hotspot-bloco';
            bloco.style.cssText = "position: relative; padding: 15px; border-radius: 6px; margin-bottom: 12px; background-color: rgba(255, 255, 255, 0.03);";
            // Armazenar coordenadas no dataset
            bloco.dataset.x = data.x || 50;
            bloco.dataset.y = data.y || 50;

            const html = `
                <label>Hotspot ${index + 1}</label>
                <div style="display:flex;gap:8px;margin-top:6px;align-items:center;">
                    <input type="text" class="hotspot-text" placeholder="Texto do hotspot" value="${(data.text||'').replace(/"/g,'&quot;')}">
                    <button type="button" class="modal-hotspot-remove" title="Remover" style="background:#dc3545;color:#fff;border:none;border-radius:4px;padding:6px 8px;">&times;</button>
                </div>
            `;

            bloco.innerHTML = html;
            const removeBtn = bloco.querySelector('.modal-hotspot-remove');
            removeBtn.addEventListener('click', () => {
                bloco.remove();
                // renumerar labels
                Array.from(container.querySelectorAll('.modal-hotspot-bloco')).forEach((b,i)=>{
                    const lbl = b.querySelector('label');
                    if(lbl) lbl.textContent = `Hotspot ${i+1}`;
                });
                updatePreviewHotspots();
            });

            return bloco;
        };

        // Inicializa botões de remover se já existir algum bloco
        Array.from(container.querySelectorAll('.modal-hotspot-bloco')).forEach((b,i)=>{
            const removeBtn = b.querySelector('.modal-hotspot-remove');
            if(removeBtn) {
                removeBtn.addEventListener('click', () => { b.remove(); updatePreviewHotspots(); });
            }
        });

        // Setup para preview da imagem
        const urlInput = document.getElementById('input-modal-img-url');
        const previewDiv = document.getElementById('modal-image-preview');
        const previewImg = document.getElementById('modal-preview-img');
        const previewContainer = document.getElementById('modal-image-container');
        const loadingSpinner = document.getElementById('image-loading-spinner');

        if (urlInput && previewDiv && previewImg && previewContainer) {
            console.log('Modal preview setup initialized');
            // Função para resolver links do Google Drive
            const resolveDriveImage = (url) => {
                try {
                    if (!url) return url;
                    // Ex.: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
                    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
                    // Ex.: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
                    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                    return url;
                } catch (err) {
                    return url;
                }
            };

            const updateImagePreview = (src) => {
                if (src) {
                    // Mostra o spinner de carregamento
                    if (loadingSpinner) loadingSpinner.style.display = 'block';
                    
                    // Gera candidatos começando com a URL original para preservar qualidade
                    const driveIdMatch = (src || '').match(/\/d\/([a-zA-Z0-9_-]+)/) || (src || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    const driveId = driveIdMatch ? driveIdMatch[1] : null;
                    const candidates = [];
                    
                    // Tenta a URL original primeiro
                    if (src) candidates.push(src);
                    
                    // Depois tenta variações do Drive para melhor qualidade
                    if (driveId) {
                        candidates.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
                        candidates.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
                        candidates.push(`https://drive.googleusercontent.com/uc?export=view&id=${driveId}`);
                        candidates.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
                    }
                    
                    let tryIndex = 0;
                    previewImg.addEventListener('error', function onError() {
                        tryIndex++;
                        if (tryIndex < candidates.length) {
                            console.warn('[Modal Preview] Fallback image candidate', candidates[tryIndex]);
                            previewImg.src = candidates[tryIndex];
                        } else {
                            console.warn('[Modal Preview] All image candidates failed');
                            // Esconde o spinner em caso de erro
                            if (loadingSpinner) loadingSpinner.style.display = 'none';
                            previewImg.removeEventListener('error', onError);
                        }
                    });
                    
                    previewImg.addEventListener('load', function onLoad() {
                        // Esconde o spinner quando a imagem carrega
                        if (loadingSpinner) loadingSpinner.style.display = 'none';
                        previewDiv.style.display = 'block';
                        previewImg.removeEventListener('load', onLoad);
                    });
                    
                    previewImg.src = candidates[0];
                    urlInput.value = src; // Mantém a URL original no input
                } else {
                    // Esconde tudo se não há URL
                    if (loadingSpinner) loadingSpinner.style.display = 'none';
                    previewDiv.style.display = 'none';
                    previewImg.src = '';
                }
                updatePreviewHotspots();
            };

            // Mudança na URL
            urlInput.addEventListener('input', () => {
                if (urlInput.value.trim()) {
                    updateImagePreview(urlInput.value.trim());
                } else {
                    updateImagePreview('');
                }
            });

            // Função para atualizar hotspots no preview
            const updatePreviewHotspots = () => {
                // Remove hotspots existentes no preview
                previewContainer.querySelectorAll('.preview-hotspot').forEach(h => h.remove());

                // Adiciona hotspots do container
                const blocks = container.querySelectorAll('.modal-hotspot-bloco');
                blocks.forEach((block, index) => {
                    const textInput = block.querySelector('.hotspot-text');

                    if (textInput) {
                        const x = parseFloat(block.dataset.x) || 0;
                        const y = parseFloat(block.dataset.y) || 0;
                        const text = textInput.value || `Hotspot ${index + 1}`;

                        const hotspot = document.createElement('div');
                        hotspot.className = 'preview-hotspot';
                        hotspot.style.position = 'absolute';
                        hotspot.style.left = x + '%';
                        hotspot.style.top = y + '%';
                        hotspot.style.transform = 'translate(-50%, -50%)';
                        hotspot.style.width = '20px';
                        hotspot.style.height = '20px';
                        hotspot.style.borderRadius = '50%';
                        hotspot.style.background = '#0A88F4';
                        hotspot.style.border = '2px solid white';
                        hotspot.style.cursor = 'pointer';
                        hotspot.style.display = 'flex';
                        hotspot.style.alignItems = 'center';
                        hotspot.style.justifyContent = 'center';
                        hotspot.style.fontSize = '12px';
                        hotspot.style.fontWeight = 'bold';
                        hotspot.style.color = 'white';
                        hotspot.title = text;
                        hotspot.textContent = (index + 1).toString();
                        hotspot.setAttribute('tabindex', '0');

                        // Mostrar texto ao passar mouse ou focar
                        const showText = () => {
                            // Tooltip
                            const tooltip = document.createElement('div');
                            tooltip.className = 'preview-tooltip';
                            tooltip.textContent = text;
                            tooltip.style.position = 'absolute';
                            tooltip.style.bottom = '25px';
                            tooltip.style.left = '50%';
                            tooltip.style.transform = 'translateX(-50%)';
                            tooltip.style.background = 'rgba(0,0,0,0.8)';
                            tooltip.style.color = 'white';
                            tooltip.style.padding = '5px 10px';
                            tooltip.style.borderRadius = '4px';
                            tooltip.style.fontSize = '12px';
                            tooltip.style.whiteSpace = 'nowrap';
                            tooltip.style.zIndex = '10';
                            hotspot.appendChild(tooltip);
                        };
                        const hideText = () => {
                            hotspot.textContent = (index + 1).toString();
                            const tooltip = hotspot.querySelector('.preview-tooltip');
                            if (tooltip) tooltip.remove();
                        };

                        hotspot.addEventListener('mouseenter', showText);
                        hotspot.addEventListener('mouseleave', hideText);
                        hotspot.addEventListener('focus', showText);
                        hotspot.addEventListener('blur', hideText);

                        previewContainer.appendChild(hotspot);
                    }
                });
            };

            // Clique na imagem para adicionar hotspot
            previewImg.addEventListener('click', (e) => {
                if (!previewImg.src) return;

                const rect = previewImg.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                // Cria novo bloco de hotspot
                const index = container.querySelectorAll('.modal-hotspot-bloco').length;
                const bloco = createHotspotBlock(index, { x: x.toFixed(2), y: y.toFixed(2), text: `Hotspot ${index + 1}` });
                container.appendChild(bloco);

                // Atualiza inputs
                const xInput = bloco.querySelector('.hotspot-x');
                const yInput = bloco.querySelector('.hotspot-y');
                if (xInput) xInput.value = x.toFixed(2);
                if (yInput) yInput.value = y.toFixed(2);

                updatePreviewHotspots();
            });

            // Inicializa preview se já houver URL
            if (urlInput.value.trim()) {
                updateImagePreview(urlInput.value.trim());
            }
        }
    },
    
    // 1. getFormData: (Nenhuma mudança aqui)
    getFormData(core) {
        const corBotao = document.getElementById('input-modal-cor-btn').value;
        const corFundo = document.getElementById('input-modal-bg').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        const corBotaoTexto = core.utils.getContrastColor(corBotao);

        return {
            uniqueId: `modal-img-${Date.now().toString().slice(-6)}`,
            audiodescricao: document.getElementById('input-modal-audiodescricao').value,
            ariaLabel: document.getElementById('input-modal-aria-label').value,
            corBotao: corBotao,
            corBotaoTexto: corBotaoTexto,
            corFundo: corFundo,
            corTexto: corTexto,
            corBorda: (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)',
            imgUrl: document.getElementById('input-modal-img-url').value,
            imgAlt: document.getElementById('input-modal-img-alt').value,
            caption: document.getElementById('input-modal-caption').value,
            // Hotspots: coleta pontos interativos configurados no painel do Modal
            hotspots: (() => {
                try {
                    const container = document.getElementById('modal-hotspots-container');
                    if (!container) return [];
                    const blocks = container.querySelectorAll('.modal-hotspot-bloco');
                    return Array.from(blocks).map(b => ({
                        text: (b.querySelector('.hotspot-text')?.value || '').trim(),
                        x: (b.dataset.x || '').toString(),
                        y: (b.dataset.y || '').toString()
                    })).filter(h => h.text || h.x || h.y);
                } catch (err) {
                    return [];
                }
            })()
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do Modal:', data);
        
        setTimeout(() => {
            const ariaField = document.getElementById('input-modal-aria-label');
            const audioField = document.getElementById('input-modal-audiodescricao');
            const imagemField = document.getElementById('input-modal-imagem');
            const altField = document.getElementById('input-modal-alt');
            const captionField = document.getElementById('input-modal-caption');
            
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
            if (imagemField) imagemField.value = data.imagemUrl || '';
            restoreFieldWithWYSIWYG(altField, data.altText);
            restoreFieldWithWYSIWYG(captionField, data.caption);
            
            // Restaurar imagem no preview se houver
            const urlInput = document.getElementById('input-modal-img-url');
            const previewDiv = document.getElementById('modal-image-preview');
            const previewImg = document.getElementById('modal-preview-img');
            if (urlInput && previewDiv && previewImg && data.imgUrl) {
                // Função para resolver links do Google Drive (mesma do setup)
                const resolveDriveImage = (url) => {
                    try {
                        if (!url) return url;
                        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
                        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                        if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                        return url;
                    } catch (err) {
                        return url;
                    }
                };
                
                urlInput.value = data.imgUrl;
                
                // Gera candidatos começando com a URL original para preservar qualidade
                const driveIdMatch = (data.imgUrl || '').match(/\/d\/([a-zA-Z0-9_-]+)/) || (data.imgUrl || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
                const driveId = driveIdMatch ? driveIdMatch[1] : null;
                const candidates = [];
                
                // Tenta a URL original primeiro
                if (data.imgUrl) candidates.push(data.imgUrl);
                
                // Depois tenta variações do Drive para melhor qualidade
                if (driveId) {
                    candidates.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
                    candidates.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
                    candidates.push(`https://drive.googleusercontent.com/uc?export=view&id=${driveId}`);
                    candidates.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
                }
                
                let tryIndex = 0;
                previewImg.addEventListener('error', function onError() {
                    tryIndex++;
                    if (tryIndex < candidates.length) {
                        console.warn('[Modal Restore] Fallback image candidate', candidates[tryIndex]);
                        previewImg.src = candidates[tryIndex];
                    } else {
                        console.warn('[Modal Restore] All image candidates failed');
                        previewImg.removeEventListener('error', onError);
                    }
                });
                
                previewImg.src = candidates[0];
                previewDiv.style.display = 'block';
            }
            
            // Restaurar hotspots
            const container = document.getElementById('modal-hotspots-container');
            if (container && data.hotspots && data.hotspots.length > 0) {
                container.innerHTML = '';
                
                data.hotspots.forEach((hotspot, index) => {
                    const bloco = document.createElement('div');
                    bloco.className = 'modal-hotspot-bloco';
                    bloco.style.cssText = "position: relative; padding: 15px; border-radius: 6px; margin-bottom: 12px; background-color: rgba(255, 255, 255, 0.03);";
                    
                    bloco.innerHTML = `
                        <div class="form-group">
                            <label>Texto do Hotspot ${index + 1}</label>
                            <input type="text" class="hotspot-text" placeholder="Ex: Hotspot de interesse" value="${hotspot.text || ''}">
                        </div>
                    `;
                    
                    // Definir coordenadas no dataset
                    bloco.dataset.x = hotspot.x || '';
                    bloco.dataset.y = hotspot.y || '';
                    
                    container.appendChild(bloco);
                    
                    if (index > 0) {
                        const removeButton = document.createElement('button');
                        removeButton.type = 'button';
                        removeButton.className = 'modal-remove-hotspot';
                        removeButton.innerHTML = '&times;';
                        removeButton.title = `Remover Hotspot ${index + 1}`;
                        removeButton.style.cssText = "position: absolute; top: 10px; right: 10px; background-color: #dc3545; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer;";
                        
                        removeButton.addEventListener('click', () => bloco.remove());
                        bloco.appendChild(removeButton);
                    }
                });
                
                // Atualizar preview dos hotspots após restaurar
                setTimeout(() => {
                    const previewContainer = document.getElementById('modal-image-container');
                    if (previewContainer) {
                        // Simular updatePreviewHotspots
                        previewContainer.querySelectorAll('.preview-hotspot').forEach(h => h.remove());
                        data.hotspots.forEach((hotspot, index) => {
                            const x = parseFloat(hotspot.x) || 0;
                            const y = parseFloat(hotspot.y) || 0;
                            const text = hotspot.text || `Hotspot ${index + 1}`;

                            const hotspotEl = document.createElement('div');
                            hotspotEl.className = 'preview-hotspot';
                            hotspotEl.style.position = 'absolute';
                            hotspotEl.style.left = x + '%';
                            hotspotEl.style.top = y + '%';
                            hotspotEl.style.transform = 'translate(-50%, -50%)';
                            hotspotEl.style.width = '20px';
                            hotspotEl.style.height = '20px';
                            hotspotEl.style.borderRadius = '50%';
                            hotspotEl.style.background = '#0A88F4';
                            hotspotEl.style.border = '2px solid white';
                            hotspotEl.style.cursor = 'pointer';
                            hotspotEl.style.display = 'flex';
                            hotspotEl.style.alignItems = 'center';
                            hotspotEl.style.justifyContent = 'center';
                            hotspotEl.style.fontSize = '12px';
                            hotspotEl.style.fontWeight = 'bold';
                            hotspotEl.style.color = 'white';
                            hotspotEl.title = text;
                            hotspotEl.textContent = (index + 1).toString();

                            previewContainer.appendChild(hotspotEl);
                        });
                    }
                }, 100);
            }
            
            console.log('✅ Modal restaurado');
        }, 200);
    },
    
    // 2. (ATUALIZADO) createTemplate: Estilos de Lightbox
    createTemplate(data) {
        const { 
            uniqueId, audiodescricao, ariaLabel, corBotao, corBotaoTexto, corFundo, corTexto, corBorda,
            imgUrl, imgAlt, caption, hotspots = []
        } = data;

        // Resolve possíveis links do Google Drive para uma URL direta de imagem
        const resolveDriveImage = (url) => {
            try {
                if (!url) return url;
                // Ex.: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
                const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
                // Ex.: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
                const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (idMatch && idMatch[1]) return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
                return url;
            } catch (err) {
                return url;
            }
        };

        // Gera candidatos começando com a URL original para preservar qualidade
        const driveIdMatch = (imgUrl || '').match(/\/d\/([a-zA-Z0-9_-]+)/) || (imgUrl || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const driveId = driveIdMatch ? driveIdMatch[1] : null;
        const candidates = [];
        
        // Tenta a URL original primeiro
        if (imgUrl) candidates.push(imgUrl);
        
        // Depois tenta variações do Drive para melhor qualidade
        if (driveId) {
            candidates.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
            candidates.push(`https://drive.google.com/uc?export=view&id=${driveId}`);
            candidates.push(`https://drive.googleusercontent.com/uc?export=view&id=${driveId}`);
            candidates.push(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`);
        }

        const triggerId = `btn-${uniqueId}`;
        const modalId = `modal-${uniqueId}`;
        const figcaptionHTML = caption ? `<figcaption class="modal-caption">${caption}</figcaption>` : '';
        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';


        return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&family=Arial&display=swap');
:root {
    --modal-cor-fundo: ${corFundo};
    --modal-cor-texto: ${corTexto};
    --modal-cor-borda: ${corBorda};
    --modal-cor-btn: ${corBotao};
    --modal-cor-btn-texto: ${corBotaoTexto};
    --font-primary: 'Montserrat', 'Arial', sans-serif;
    --font-secondary: 'Arial', sans-serif;
}
html, body {
    margin: 0; padding: 0;
    font-family: var(--font-secondary);
}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
/* 1. O Botão de Gatilho (Sem mudança) */
.modal-trigger-btn {
    font-family: var(--font-primary);
    font-weight: 600;
    font-size: 1rem;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background-color: var(--modal-cor-btn);
    color: var(--modal-cor-btn-texto);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.modal-trigger-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.modal-trigger-btn:focus-visible {
    outline: 3px solid var(--modal-cor-btn);
    outline-offset: 3px;
}

/* 2. O Overlay (Fundo escuro) */
.modal-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100vw; height: 100vh;
    /* MUDANÇA: Mais opaco para o site "sumir" */
    background-color: rgba(0, 0, 0, 0.9); 
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;
}

/* 3. A "Janela" (Agora é um container invisível que preenche a tela) */
.modal-dialog {
    position: fixed;
    top: 0; left: 0;
    transform: scale(0.95); /* Animação de zoom */
    background-color: transparent; /* Fundo invisível */
    z-index: 1001;
    width: 100%;
    height: 100%;
    /* Flexbox para centralizar o conteúdo */
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem; /* Espaço seguro nas bordas - será ajustado dinamicamente */
    box-sizing: border-box;
    overflow-y: auto;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

/* 4. O Conteúdo (A "janela" visível com a imagem) */
.modal-content {
    background-color: var(--modal-cor-fundo);
    color: var(--modal-cor-texto);
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    width: auto;
    height: auto;
    /* Limites removidos para ajustar ao tamanho da imagem */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Para o border-radius funcionar na imagem */
}
.modal-img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain; /* Garante que a imagem caiba sem distorcer */
    /* Removido max-height para permitir expansão ao tamanho original */
    background-color: rgba(0,0,0,0.1); /* Fundo sutil para a imagem */
}
.modal-caption {
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.9;
    padding: 1rem 1.5rem; /* Padding para a legenda */
    text-align: left;
    overflow-y: auto;
    flex-shrink: 0; /* Impede que a legenda seja esmagada */
}
.modal-caption p { margin: 0; }

/* Hotspots overlay */
.hotspots-wrapper{position:relative}
.hotspot-marker{position:absolute;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:var(--modal-cor-btn);color:var(--modal-cor-btn-texto);display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.3)}
.hotspot-tooltip{position:absolute;min-width:160px;max-width:300px;background:black;color:white;border:1px solid rgba(255,255,255,0.5);padding:8px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,0.35);display:none;z-index:1003;pointer-events:none;text-align:center}
.hotspot-debug{background:rgba(0,0,0,0.05);padding:10px;border-top:1px dashed rgba(255,255,255,0.05);font-family:monospace;font-size:0.85rem;color:var(--modal-cor-texto);max-height:140px;overflow:auto}
.hotspot-debug-toggle{background:transparent;border:1px solid var(--modal-cor-borda);color:var(--modal-cor-texto);padding:6px 10px;border-radius:6px;cursor:pointer;margin:10px}
.modal-img-fallback{padding:24px;text-align:center;color:var(--modal-cor-texto);background:linear-gradient(180deg, rgba(0,0,0,0.03), transparent);border-top:1px dashed var(--modal-cor-borda)}

/* 5. Botão de Fechar (X) */
.modal-close-btn {
    position: fixed; /* Fixo na tela, não na janela */
    top: 20px; right: 20px;
    background-color: rgba(255,255,255,0.2);
    color: #FFFFFF; /* Cor fixo em branco */
    border: none;
    border-radius: 50%;
    width: 40px; height: 40px;
    font-size: 1.8rem;
    font-weight: 200; /* Mais fino */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background-color 0.2s ease, transform 0.2s ease;
    z-index: 1002; /* Acima de tudo */
    opacity: 0;
    visibility: hidden;
}
.modal-close-btn:hover {
    background-color: rgba(255,255,255,0.4);
    transform: scale(1.1);
}

/* 6. Estado Aberto */
.modal-overlay.is-open,
.modal-dialog.is-open {
    opacity: 1;
    visibility: visible;
}
.modal-dialog.is-open {
    transform: scale(1);
}
</style>

<div class="modal-overlay is-open" id="overlay-${uniqueId}"></div>
<div class="modal-dialog is-open" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${triggerId}" aria-label="${ariaLabel}" tabindex="-1">
    ${audiodescricaoHTML}
    <div class="modal-content">
        <figure style="margin:0; position:relative;">
            <div class="hotspots-wrapper">
                <img id="modal-img-${uniqueId}" class="modal-img" src="${candidates[0] || ''}" alt="${imgAlt}">
                <!-- Hotspots serão inseridos via JS -->
            </div>
            ${figcaptionHTML}
        </figure>
        <div style="display:flex;align-items:center;justify-content:flex-end;">
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const hotspots = ${JSON.stringify(hotspots)} || [];
    const imgCandidates = ${JSON.stringify(candidates)} || [];
    const modal = document.getElementById("${modalId}");
    const overlay = document.getElementById("overlay-${uniqueId}");
    
    if (!modal || !overlay) return;

    // Gerencia tentativas de carregamento da imagem usando múltiplos candidatos
    try {
        const imgElement = modal.querySelector('#modal-img-${uniqueId}');
        if (imgElement) {
            const candidatesList = Array.isArray(imgCandidates) && imgCandidates.length ? imgCandidates : [];
            let tryIndex = 0;
            imgElement.addEventListener('error', function () {
                tryIndex++;
                if (tryIndex < candidatesList.length) {
                    console.warn('[Modal] fallback image candidate', candidatesList[tryIndex]);
                    imgElement.src = candidatesList[tryIndex];
                } else {
                    if (!modal.querySelector('.modal-img-fallback')) {
                        const wrapper = modal.querySelector('.hotspots-wrapper');
                        const fb = document.createElement('div');
                        fb.className = 'modal-img-fallback';
                        fb.textContent = 'Imagem indisponível. Verifique a URL ou permissões de compartilhamento.';
                        if (wrapper) wrapper.appendChild(fb);
                    }
                }
            });
            imgElement.addEventListener('load', function () {
                const fb = modal.querySelector('.modal-img-fallback');
                if (fb) fb.remove();
                
                // Ajustar tamanho do modal-content para o tamanho da imagem
                const modalContent = modal.querySelector('.modal-content');
                const modalDialog = modal.closest('.modal-dialog');
                if (modalContent && modalDialog) {
                    const imgWidth = imgElement.naturalWidth;
                    const imgHeight = imgElement.naturalHeight;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    // Se a imagem for maior que 80% da viewport, reduzir padding para maximizar espaço
                    if (imgWidth > viewportWidth * 0.8 || imgHeight > viewportHeight * 0.8) {
                        modalDialog.style.padding = '0.5rem';
                    } else {
                        modalDialog.style.padding = '1rem';
                    }
                    
                    // Permitir que o modal-content se expanda ao tamanho natural da imagem
                    modalContent.style.width = 'auto';
                    modalContent.style.height = 'auto';
                    modalContent.style.maxWidth = 'none';
                    modalContent.style.maxHeight = 'none';
                    
                    // Garantir que a imagem seja exibida em seu tamanho natural se couber na tela
                    if (imgWidth <= viewportWidth * 0.9 && imgHeight <= viewportHeight * 0.9) {
                        imgElement.style.width = imgWidth + 'px';
                        imgElement.style.height = imgHeight + 'px';
                        imgElement.style.objectFit = 'none'; // Mostrar em tamanho real
                    } else {
                        imgElement.style.width = '100%';
                        imgElement.style.height = 'auto';
                        imgElement.style.objectFit = 'contain';
                    }
                }
            });
            // Se não houver src inicial, inicie com o primeiro candidato
            if ((!imgElement.src || imgElement.src.trim() === '') && imgCandidates.length) {
                imgElement.src = imgCandidates[0];
            }
        }
    } catch (err) {
        console.warn('Erro ao aplicar candidatos de imagem:', err);
    }

    // Renderiza hotspots sobre a imagem e painel debug
    try {
        const wrapper = modal.querySelector('.hotspots-wrapper');
        if (wrapper) {
            hotspots.forEach((h, idx) => {
                const left = (h.x !== undefined && h.x !== null && h.x !== '') ? h.x : 50;
                const top = (h.y !== undefined && h.y !== null && h.y !== '') ? h.y : 50;
                const marker = document.createElement('div');
                marker.className = 'hotspot-marker';
                marker.setAttribute('aria-label', 'Hotspot interativo ' + (idx+1) + ': ' + (h.text || ''));
                marker.setAttribute('tabindex', '0');
                marker.style.left = left + '%';
                marker.style.top = top + '%';
                marker.innerText = (idx+1).toString();

                const tooltip = document.createElement('div');
                tooltip.className = 'hotspot-tooltip';
                tooltip.innerHTML = '<div>' + ((h.text||'').replace(/</g,'&lt;')) + '</div>';
                tooltip.style.left = (parseFloat(left) + 3) + '%';
                tooltip.style.top = (parseFloat(top) + 3) + '%';

                const showTooltip = () => {
                    wrapper.querySelectorAll('.hotspot-tooltip').forEach(t => t.style.display = 'none');
                    tooltip.style.display = 'block';
                };
                const hideTooltip = () => {
                    tooltip.style.display = 'none';
                    marker.innerText = (idx+1).toString();
                };

                marker.addEventListener('mouseenter', showTooltip);
                marker.addEventListener('mouseleave', hideTooltip);
                marker.addEventListener('focus', showTooltip);
                marker.addEventListener('blur', hideTooltip);
                marker.addEventListener('click', () => {
                    if (tooltip.style.display === 'block') {
                        hideTooltip();
                    } else {
                        showTooltip();
                    }
                });

                wrapper.appendChild(marker);
                wrapper.appendChild(tooltip);
            });
        }
    } catch (err) {
        console.warn('Erro ao renderizar hotspots:', err);
    }
});
</script>
`;
    }
});