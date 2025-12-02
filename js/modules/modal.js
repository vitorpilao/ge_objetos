// js/modules/modal.js
// Módulo Modal de Imagem (v5.9.1 - Estilo Lightbox)

GeneratorCore.registerModule('modal', {
    // 0. Setup: gerencia UI de Hotspots no painel (editor)
    setup(core) {
        const addBtn = document.getElementById('modal-add-hotspot');
        const container = document.getElementById('modal-hotspots-container');

        if (!addBtn || !container) return;

        const createHotspotBlock = (index, data = {}) => {
            const bloco = document.createElement('div');
            bloco.className = 'modal-hotspot-bloco';
            bloco.style.position = 'relative';
            bloco.style.padding = '10px';
            bloco.style.marginBottom = '8px';
            bloco.style.background = 'rgba(255,255,255,0.03)';
            bloco.style.borderRadius = '6px';

            const html = `
                <label>Hotspot ${index + 1}</label>
                <div style="display:flex;gap:8px;margin-top:6px;align-items:center;">
                    <input type="text" class="hotspot-text" placeholder="Texto do ponto" value="${(data.text||'').replace(/"/g,'&quot;')}">
                    <input type="number" class="hotspot-x" placeholder="X (%)" value="${data.x||50}" min="0" max="100" style="width:80px;">
                    <input type="number" class="hotspot-y" placeholder="Y (%)" value="${data.y||50}" min="0" max="100" style="width:80px;">
                    <button type="button" class="modal-hotspot-remove" title="Remover" style="background:#dc3545;color:#fff;border:none;border-radius:4px;padding:6px 8px;">Remover</button>
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
            });

            return bloco;
        };

        // Adiciona listener para criar novo hotspot
        addBtn.addEventListener('click', () => {
            const index = container.querySelectorAll('.modal-hotspot-bloco').length;
            const bloco = createHotspotBlock(index);
            container.appendChild(bloco);
        });

        // Inicializa botões de remover se já existir algum bloco
        Array.from(container.querySelectorAll('.modal-hotspot-bloco')).forEach((b,i)=>{
            const removeBtn = b.querySelector('.modal-hotspot-remove');
            if(removeBtn) {
                removeBtn.addEventListener('click', () => { b.remove(); });
            }
        });
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
            btnText: document.getElementById('input-modal-btn-text').value,
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
                        x: (b.querySelector('.hotspot-x')?.value || '').toString(),
                        y: (b.querySelector('.hotspot-y')?.value || '').toString()
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
            
            // Restaurar hotspots
            const container = document.getElementById('modal-hotspots-container');
            if (container && data.hotspots && data.hotspots.length > 0) {
                container.innerHTML = '';
                
                data.hotspots.forEach((hotspot, index) => {
                    const bloco = document.createElement('div');
                    bloco.className = 'modal-hotspot-bloco';
                    bloco.style.cssText = "position: relative; padding: 15px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 12px; background-color: #fff;";
                    
                    bloco.innerHTML = `
                        <div class="form-group">
                            <label>Texto do Hotspot ${index + 1}</label>
                            <input type="text" class="hotspot-text" placeholder="Ex: Ponto de interesse" value="${hotspot.text || ''}">
                        </div>
                        <div class="form-group">
                            <label>Posição X (%)</label>
                            <input type="number" class="hotspot-x" min="0" max="100" placeholder="Ex: 50" value="${hotspot.x || ''}">
                        </div>
                        <div class="form-group">
                            <label>Posição Y (%)</label>
                            <input type="number" class="hotspot-y" min="0" max="100" placeholder="Ex: 50" value="${hotspot.y || ''}">
                        </div>
                    `;
                    
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
            }
            
            console.log('✅ Modal restaurado');
        }, 200);
    },
    
    // 2. (ATUALIZADO) createTemplate: Estilos de Lightbox
    createTemplate(data) {
        const { 
            uniqueId, audiodescricao, ariaLabel, corBotao, corBotaoTexto, corFundo, corTexto, corBorda,
            btnText, imgUrl, imgAlt, caption, hotspots = []
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

        const resolvedImgUrl = resolveDriveImage(imgUrl);
        // Gera candidatos alternativos (tentativas) para URLs do Drive/host direto
        const driveIdMatch = (imgUrl || '').match(/\/d\/([a-zA-Z0-9_-]+)/) || (imgUrl || '').match(/[?&]id=([a-zA-Z0-9_-]+)/);
        const driveId = driveIdMatch ? driveIdMatch[1] : null;
        const candidates = [];
        if (resolvedImgUrl) candidates.push(resolvedImgUrl);
        if (driveId) {
            candidates.push(`https://drive.google.com/uc?export=download&id=${driveId}`);
            candidates.push(`https://drive.googleusercontent.com/uc?export=view&id=${driveId}`);
            candidates.push(`https://drive.google.com/thumbnail?id=${driveId}`);
        }
        if (imgUrl && candidates.indexOf(imgUrl) === -1) candidates.push(imgUrl);
        // garante unicidade
        const uniqueCandidates = Array.from(new Set(candidates));

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
    padding: 1rem; /* Espaço seguro nas bordas */
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
    width: 100%;
    /* Limites maiores para o efeito de lightbox */
    max-width: 1000px; 
    max-height: 95vh;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Para o border-radius funcionar na imagem */
}
.modal-img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain; /* Garante que a imagem caiba sem distorcer */
    max-height: 75vh; /* Limita a altura da imagem */
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
.hotspot-marker{position:absolute;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:var(--modal-cor-btn);color:var(--modal-cor-btn-texto);display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer;border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 6px rgba(0,0,0,0.3)}
.hotspot-popup{position:absolute;min-width:160px;max-width:300px;background:var(--modal-cor-fundo);color:var(--modal-cor-texto);border:1px solid var(--modal-cor-borda);padding:8px;border-radius:6px;box-shadow:0 6px 18px rgba(0,0,0,0.35);display:none;z-index:1003}
.hotspot-popup.visible{display:block}
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

<button class="modal-trigger-btn" id="${triggerId}" aria-haspopup="dialog" aria-controls="${modalId}">
    ${btnText}
</button>

<button class="modal-close-btn" id="close-${uniqueId}" aria-label="Fechar modal" style="opacity:0; visibility:hidden;">&times;</button>
<div class="modal-overlay" id="overlay-${uniqueId}"></div>
<div class="modal-dialog" id="${modalId}" role="dialog" aria-modal="true" aria-labelledby="${triggerId}" aria-label="${ariaLabel}" tabindex="-1">
    ${audiodescricaoHTML}
    <div class="modal-content">
        <figure style="margin:0; position:relative;">
            <div class="hotspots-wrapper">
                <img id="modal-img-${uniqueId}" class="modal-img" src="${uniqueCandidates[0] || ''}" alt="${imgAlt}">
                <!-- Hotspots serão inseridos via JS -->
            </div>
            ${figcaptionHTML}
        </figure>
        <div style="display:flex;align-items:center;justify-content:flex-end;">
            <button type="button" class="hotspot-debug-toggle" aria-expanded="false">Mostrar dados (Hotspots)</button>
        </div>
        <pre class="hotspot-debug" aria-hidden="true"></pre>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const hotspots = ${JSON.stringify(hotspots)} || [];
    const imgCandidates = ${JSON.stringify(uniqueCandidates)} || [];
    const triggerBtn = document.getElementById("${triggerId}");
    const modal = document.getElementById("${modalId}");
    const overlay = document.getElementById("overlay-${uniqueId}");
    const closeBtn = document.getElementById("close-${uniqueId}");
    
    if (!triggerBtn || !modal || !overlay || !closeBtn) return;

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
            });
            // Se não houver src inicial, inicie com o primeiro candidato
            if ((!imgElement.src || imgElement.src.trim() === '') && imgCandidates.length) {
                imgElement.src = imgCandidates[0];
            }
        }
    } catch (err) {
        console.warn('Erro ao aplicar candidatos de imagem:', err);
    }

    // Elementos focáveis (agora inclui o botão de fechar que está fora)
    const focusableElements = modal.querySelectorAll('a[href], button, textarea, input, select');
    const firstFocusable = closeBtn; // O botão de fechar é o primeiro
    const lastFocusable = focusableElements.length > 0 ? focusableElements[focusableElements.length - 1] : firstFocusable;
    let lastActiveElement = null;

    const openModal = () => {
        lastActiveElement = document.activeElement;
        modal.classList.add('is-open');
        overlay.classList.add('is-open');
        // Mostra o botão de fechar
        closeBtn.style.opacity = '1';
        closeBtn.style.visibility = 'visible';
        
        modal.setAttribute('tabindex', '0');
        closeBtn.setAttribute('tabindex', '0');
        
        setTimeout(() => closeBtn.focus(), 50);
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        overlay.classList.remove('is-open');
        // Esconde o botão de fechar
        closeBtn.style.opacity = '0';
        closeBtn.style.visibility = 'hidden';
        
        modal.setAttribute('tabindex', '-1');
        closeBtn.setAttribute('tabindex', '-1');
        
        if (lastActiveElement) lastActiveElement.focus();
    };

    triggerBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Renderiza hotspots sobre a imagem e painel debug
    try {
        const wrapper = modal.querySelector('.hotspots-wrapper');
        const debugPre = modal.querySelector('.hotspot-debug');
        const debugToggle = modal.querySelector('.hotspot-debug-toggle');
        if (wrapper) {
            hotspots.forEach((h, idx) => {
                const left = (h.x !== undefined && h.x !== null && h.x !== '') ? h.x : 50;
                const top = (h.y !== undefined && h.y !== null && h.y !== '') ? h.y : 50;
                const marker = document.createElement('button');
                marker.className = 'hotspot-marker';
                marker.type = 'button';
                marker.setAttribute('aria-label', 'Ponto interativo ' + (idx+1) + ': ' + (h.text || ''));
                marker.style.left = left + '%';
                marker.style.top = top + '%';
                marker.innerText = (idx+1).toString();

                const popup = document.createElement('div');
                popup.className = 'hotspot-popup';
                popup.innerHTML = '<div>' + ((h.text||'').replace(/</g,'&lt;')) + '</div>';
                popup.style.left = (left + 3) + '%';
                popup.style.top = (top + 3) + '%';

                marker.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    if (popup.classList.contains('visible')) {
                        popup.classList.remove('visible');
                    } else {
                        wrapper.querySelectorAll('.hotspot-popup.visible').forEach(p=>p.classList.remove('visible'));
                        popup.classList.add('visible');
                    }
                });

                document.addEventListener('click', () => { popup.classList.remove('visible'); });

                wrapper.appendChild(marker);
                wrapper.appendChild(popup);
            });

            if (debugToggle && debugPre) {
                debugPre.textContent = JSON.stringify(hotspots, null, 2);
                debugToggle.addEventListener('click', () => {
                    const expanded = debugToggle.getAttribute('aria-expanded') === 'true';
                    debugToggle.setAttribute('aria-expanded', (!expanded).toString());
                    debugPre.setAttribute('aria-hidden', expanded ? 'true' : 'false');
                    debugPre.style.display = expanded ? 'none' : 'block';
                });
                debugPre.style.display = 'none';
            }
        }
    } catch (err) {
        console.warn('Erro ao renderizar hotspots:', err);
    }

    // Ajuste no Keydown para incluir o closeBtn no "focus trap"
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('is-open')) return;

        if (e.key === 'Escape') {
            closeModal();
        }
        
        if (e.key === 'Tab') {
            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else { // Tab
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
});
</script>
`;
    }
});