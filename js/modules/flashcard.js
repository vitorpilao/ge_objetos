// js/modules/flashcard.js
// Módulo Flashcard (v5.8.6 - Corrige bug de "Enter" na Frente)

GeneratorCore.registerModule('flashcard', {
    
    // 1. Setup: (Função para Adicionar/Remover cards)
    setup(core) {
        const addButton = document.getElementById('flashcard-add-card');
        const container = document.getElementById('flashcard-cards-container');
        
        const updateCardLabels = () => {
            const allBlocks = container.querySelectorAll('.flashcard-bloco, .flashcard-card-bloco');
            allBlocks.forEach((bloco, index) => {
                const cardNum = index + 1;
                const frenteLabel = bloco.querySelector('label[for^="input-flashcard-frente-"]');
                const frenteInput = bloco.querySelector('.flashcard-frente-input');
                const versoLabel = bloco.querySelector('label[for^="input-flashcard-verso-"]');
                const versoInput = bloco.querySelector('.flashcard-verso-input');
                if(frenteLabel && frenteInput) {
                    frenteLabel.innerText = `Frente do Card ${cardNum}`;
                    frenteLabel.htmlFor = `input-flashcard-frente-${index}`;
                    frenteInput.id = `input-flashcard-frente-${index}`;
                }
                if(versoLabel && versoInput) {
                    versoLabel.innerText = `Verso do Card ${cardNum}`;
                    versoLabel.htmlFor = `input-flashcard-verso-${index}`;
                    versoInput.id = `input-flashcard-verso-${index}`;
                }
            });
        };

        addButton.addEventListener('click', () => {
            const newIndex = container.querySelectorAll('.flashcard-bloco').length;
            const newCardBlock = document.createElement('div');
            newCardBlock.className = 'flashcard-bloco';
            
            // --- CAMPO RICH-TEXT: usar elementos `contenteditable` para frente/verso ---
            // Isso evita submissão por Enter e permite que o core.utils.enableRichText funcione corretamente.
            newCardBlock.innerHTML = `
                <button type="button" class="flashcard-remove-card" title="Remover este card">X</button>
                <div class="form-group">
                    <label for="input-flashcard-frente-${newIndex}">Frente do Card ${newIndex + 1}</label>
                    <div id="input-flashcard-frente-${newIndex}" class="rich-text-enabled flashcard-frente-input" contenteditable="true" role="textbox" aria-multiline="true" required></div>
                </div>
                <div class="form-group">
                    <label for="input-flashcard-verso-${newIndex}">Verso do Card ${newIndex + 1}</label>
                    <div id="input-flashcard-verso-${newIndex}" class="rich-text-enabled flashcard-verso-input" contenteditable="true" role="textbox" aria-multiline="true" required></div>
                </div>
            `;

            container.appendChild(newCardBlock);

            // Ativa o Rich Text nos novos campos
            const newFrenteInput = newCardBlock.querySelector(`#input-flashcard-frente-${newIndex}`);
            const newVersoInput = newCardBlock.querySelector(`#input-flashcard-verso-${newIndex}`);
            if (newFrenteInput) {
                core.utils.enableRichText(newFrenteInput);
                // Evita que Enter dispare comportamentos indesejados; insere quebra de linha simples
                newFrenteInput.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter'){
                        ev.preventDefault();
                        document.execCommand && document.execCommand('insertHTML', false, '<br>');
                    }
                });
            }
            if (newVersoInput) {
                core.utils.enableRichText(newVersoInput);
                newVersoInput.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter'){
                        ev.preventDefault();
                        document.execCommand && document.execCommand('insertHTML', false, '<br>');
                    }
                });
            }

            const removeButton = newCardBlock.querySelector('.flashcard-remove-card');
            removeButton.addEventListener('click', () => {
                container.removeChild(newCardBlock);
                updateCardLabels();
            });
        });

        updateCardLabels();
    },

    // 2. getFormData: (Nenhuma mudança necessária aqui)
    getFormData(core) {
        const corDestaque = document.getElementById('input-flashcard-cor').value;
        const corHover = document.getElementById('input-flashcard-cor-hover').value;
        const corFundo = document.getElementById('input-flashcard-bg').value;
        const cardDataArray = [];
        const cardBlocos = document.querySelectorAll('.flashcard-bloco');
        
        cardBlocos.forEach((bloco, idx) => {
            let frontVal = '';
            let backVal = '';
            
            // Card 1 (índice 0) tem estrutura diferente sem botão X
            // Cards adicionados têm botão X, então o :nth-child é diferente
            let frenteEditor, versoEditor;
            
            if (idx === 0) {
                // Primeiro card: sem botão X, então form-group é filho 1 e 2
                frenteEditor = bloco.querySelector('.form-group:nth-child(1) .wysiwyg-editor') || 
                               bloco.querySelector('.flashcard-frente-input.wysiwyg-editor') ||
                               bloco.querySelector('.flashcard-frente-input');
                
                versoEditor = bloco.querySelector('.form-group:nth-child(2) .wysiwyg-editor') || 
                              bloco.querySelector('.flashcard-verso-input.wysiwyg-editor') ||
                              bloco.querySelector('.flashcard-verso-input');
            } else {
                // Cards adicionados: com botão X, então form-group é filho 2 e 3
                frenteEditor = bloco.querySelector('.form-group:nth-child(2) .wysiwyg-editor') || 
                               bloco.querySelector('.flashcard-frente-input.wysiwyg-editor') ||
                               bloco.querySelector('.flashcard-frente-input');
                
                versoEditor = bloco.querySelector('.form-group:nth-child(3) .wysiwyg-editor') || 
                              bloco.querySelector('.flashcard-verso-input.wysiwyg-editor') ||
                              bloco.querySelector('.flashcard-verso-input');
            }
            
            if (frenteEditor) {
                // Se for um editor WYSIWYG, lê o innerHTML
                if (frenteEditor.classList.contains('wysiwyg-editor') || frenteEditor.contentEditable === 'true') {
                    frontVal = (frenteEditor.innerHTML || '').trim();
                } else if ('value' in frenteEditor) {
                    frontVal = (frenteEditor.value || '').trim();
                }
            }
            
            if (versoEditor) {
                if (versoEditor.classList.contains('wysiwyg-editor') || versoEditor.contentEditable === 'true') {
                    backVal = (versoEditor.innerHTML || '').trim();
                } else if ('value' in versoEditor) {
                    backVal = (versoEditor.value || '').trim();
                }
            }
            
            if (frontVal || backVal) {
                cardDataArray.push({ front: frontVal, back: backVal });
            }
        });

        let jsonString = JSON.stringify(cardDataArray);
        // Escapa sequências que podem quebrar a injeção dentro do template/script
        let safeJsonString = jsonString
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/<\/script>/gi, '<\\/script>')
            .replace(/<!--/g, '<\\!--');
        
        return {
            uniqueId: `flashcard-engine-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-flashcard-aria-label').value,
            audiodescricao: document.getElementById('input-flashcard-audiodescricao').value,
            corDestaque: corDestaque,
            corHover: corHover,
            corDestaqueTexto: core.utils.getContrastColor(corDestaque),
            corHoverTexto: core.utils.getContrastColor(corHover),
            corFundo: corFundo,
            corTexto: core.utils.getContrastColor(corFundo),
            cardDataJson: safeJsonString,
            cardDataArray: cardDataArray
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do Flashcard:', data);
        console.log('📦 cardDataArray:', data.cardDataArray);
        console.log('📦 Número de cards:', data.cardDataArray?.length);
        
        setTimeout(() => {
            const ariaField = document.getElementById('input-flashcard-aria-label');
            const audioField = document.getElementById('input-flashcard-audiodescricao');
            const corField = document.getElementById('input-flashcard-cor');
            const corHoverField = document.getElementById('input-flashcard-cor-hover');
            const bgField = document.getElementById('input-flashcard-bg');
            
            console.log('🔍 Campos encontrados:', {
                ariaField: !!ariaField,
                audioField: !!audioField,
                corField: !!corField,
                corHoverField: !!corHoverField,
                bgField: !!bgField
            });
            
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
            if (corField) corField.value = data.corDestaque || '#0A88F4';
            if (corHoverField) corHoverField.value = data.corHover || '#FF7A00';
            if (bgField) bgField.value = data.corFundo || '#FFFFFF';
            
            const container = document.getElementById('flashcard-cards-container');
            if (container && data.cardDataArray && data.cardDataArray.length > 0) {
                container.innerHTML = '';
                
                data.cardDataArray.forEach((card, index) => {
                    console.log(`🔍 Processando card ${index}:`, card);
                    // Suportar múltiplos formatos:
                    // - Array: [frente, verso]
                    // - Objeto PT: {frente, verso}
                    // - Objeto EN: {front, back}
                    let frente, verso;
                    if (Array.isArray(card)) {
                        frente = card[0];
                        verso = card[1];
                    } else {
                        frente = card.frente || card.front;
                        verso = card.verso || card.back;
                    }
                    
                    const bloco = document.createElement('div');
                    bloco.className = 'flashcard-bloco';
                    
                    bloco.innerHTML = `
                        <div class="form-group">
                            <label for="input-flashcard-frente-${index}">Frente do Card ${index + 1}</label>
                            <input type="text" id="input-flashcard-frente-${index}" class="rich-text-enabled flashcard-frente-input" placeholder="Ex: <b>HTML5</b>">
                        </div>
                        <div class="form-group">
                            <label for="input-flashcard-verso-${index}">Verso do Card ${index + 1}</label>
                            <textarea id="input-flashcard-verso-${index}" class="rich-text-enabled flashcard-verso-input" placeholder="A linguagem fundamental..."></textarea>
                        </div>
                    `;
                    
                    container.appendChild(bloco);
                    
                    const frenteField = document.getElementById(`input-flashcard-frente-${index}`);
                    const versoField = document.getElementById(`input-flashcard-verso-${index}`);
                    
                    console.log(`📝 Card ${index} - Frente:`, frente);
                    console.log(`📝 Card ${index} - Verso:`, verso);
                    console.log(`🔍 Campos encontrados - Frente:`, !!frenteField, 'Verso:', !!versoField);
                    
                    if (frenteField) {
                        frenteField.value = frente || '';
                        console.log(`✅ Campo frente ${index} preenchido com:`, frenteField.value);
                    }
                    if (versoField) {
                        versoField.value = verso || '';
                        console.log(`✅ Campo verso ${index} preenchido com:`, versoField.value);
                    }
                    
                    if (index > 0) {
                        const removeButton = document.createElement('button');
                        removeButton.type = 'button';
                        removeButton.className = 'flashcard-remove-card';
                        removeButton.innerHTML = '&times;';
                        removeButton.title = `Remover Card ${index + 1}`;
                        removeButton.style.cssText = "position: absolute; top: 10px; right: 10px; background-color: #dc3545; color: #fff; border: none; border-radius: 4px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer;";
                        
                        removeButton.addEventListener('click', () => bloco.remove());
                        bloco.appendChild(removeButton);
                    }
                });
                
                setTimeout(() => {
                    container.querySelectorAll('.rich-text-enabled').forEach(field => {
                        if (!field.closest('.rich-text-wrapper')) {
                            GeneratorCore.utils.enableRichText(field);
                        }
                    });
                }, 100);
            }
            
            console.log('✅ Flashcard restaurado com', data.cardDataArray?.length || 0, 'cards');
        }, 200);
    },
    
    // 3. createTemplate: (Nenhuma mudança necessária aqui)
    createTemplate(data) {
        const { 
            uniqueId, ariaLabel, audiodescricao, cardDataJson, 
            corDestaque, corDestaqueTexto, corHover, corHoverTexto,
            corFundo, corTexto 
        } = data;

        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        return `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;700&family=Arial&display=swap');
:root{
    --cinza-tech:#030200;--branco-puro:#fff;
    --cor-destaque-dinamica:${corDestaque};
    --cor-destaque-texto-dinamica:${corDestaqueTexto};
    --cor-hover-dinamica:${corHover};
    --cor-hover-texto-dinamica:${corHoverTexto};
    --cor-fundo-card:${corFundo};
    --cor-texto-card:${corTexto};
}
html{height:100%}body{font-family:'Arial',sans-serif;background-color:transparent;display:flex;justify-content:center;align-items:center;margin:0;padding:0;height:100%;box-sizing:border-box}.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.interactive-card-wrapper{opacity:0;transform:translateY(20px);transition:opacity .6s ease-out,transform .6s ease-out;width:100%;max-width:500px;margin:auto;display:flex;flex-direction:column;align-items:center;padding:20px 10px;box-sizing:border-box}
.interactive-card-wrapper.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.interactive-card-wrapper{transition:opacity .4s ease-out;transform:none}}
.flashcard-engine{width:100%;perspective:1000px;display:flex;flex-direction:column;align-items:center}
.flash-card{width:425px;height:216px;max-width:425px;max-height:216px;min-width:425px;min-height:216px;position:relative;transform-style:preserve-3d;transition:transform .6s;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,.1);background-color:var(--cor-fundo-card);border:2px solid rgba(0,0,0,.08);box-sizing:border-box;margin-bottom:20px;overflow:visible}
.flash-card.is-flipped{transform:rotateY(180deg)}
.card-face{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;-webkit-backface-visibility:hidden;backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;border-radius:12px;color:var(--cor-texto-card);overflow:visible;word-break:break-word;white-space:normal;text-align:center}
.card-face .card-inner{display:flex;flex-direction:column;justify-content:center;align-items:center;width:100%;height:100%;box-sizing:border-box;max-width:100%;margin:0;padding:0}
.card-face .card-inner p,.card-face .card-inner ul,.card-face .card-inner ol{margin:0}
.card-face .card-inner img{max-width:100%;max-height:100%;height:auto;display:block}
.card-face-front{font-family:'Montserrat',sans-serif;font-size:1.8rem;font-weight:700;text-align:center;line-height:1.3}
.card-face-back{font-family:'Arial',sans-serif;font-size:1.1rem;font-weight:400;transform:rotateY(180deg);line-height:1.5;text-align:center}
.card-controls{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:400px;margin-top:15px}
.card-button{border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-family:'Montserrat',sans-serif;font-weight:500;font-size:.9rem;transition:transform .2s ease,background-color .3s ease,color .3s ease;flex-grow:1;margin:0 5px;white-space:nowrap}
.card-button:first-child{margin-left:0}.card-button:last-child{margin-right:0}
.card-button:hover:not(:disabled){transform:scale(1.05);background-color:var(--cor-hover-dinamica)!important;color:var(--cor-hover-texto-dinamica)!important}
.card-button:focus-visible{outline:3px solid var(--cor-destaque-dinamica)}
.card-button:disabled{opacity:0.45;cursor:not-allowed;transform:none;filter:grayscale(20%)}
.btn-flip,.btn-prev,.btn-next{background-color:var(--cor-destaque-dinamica);color:var(--cor-destaque-texto-dinamica);font-weight:700}
.progress-indicator{color:var(--color-branco-puro);text-align:center;margin-top:10px;font-family:'Montserrat',sans-serif;font-weight:300;width:100%}
@media (max-width:480px){.card-face-front{font-size:1.5rem}.card-face-back{font-size:1rem}.card-button{padding:8px 12px;font-size:.8rem}.card-controls{max-width:100%}.flash-card{width:100%;height:auto;min-height:160px;max-height:none}}</style>
<div zclass="interactive-card-wrapper" role="region" aria-label="${ariaLabel}">
    ${audiodescricaoHTML}
    <div class="flashcard-engine" id="${uniqueId}">
        <div class="flash-card" aria-live="polite">
            <div class="card-face card-face-front" aria-hidden="false"></div>
            <div class="card-face card-face-back" aria-hidden="true"></div>
        </div>
        <div class="card-controls">
            <button class="card-button btn-prev" aria-label="Card anterior">&lt; Anterior</button>
            <button class="card-button btn-flip" aria-label="Virar card">Virar</button>
            <button class="card-button btn-next" aria-label="Próximo card">Próximo &gt;</button>
        </div>
        <div class="progress-indicator"></div>
    </div>
</div>
<script>(function(){
    const init = () => {
        const t="${uniqueId}";
        const e = JSON.parse('${cardDataJson}');
        const o = document.getElementById(t);
        if(!o) return;
    const n=o.querySelector(".flash-card"),r=o.querySelector(".card-face-front"),a=o.querySelector(".card-face-back"),l=o.querySelector(".btn-flip"),c=o.querySelector(".btn-prev"),s=o.querySelector(".btn-next"),i=o.querySelector(".progress-indicator");
    let d=0,u=!1;

    // Ajusta a altura do cartão para evitar barras de rolagem
    const adjustCardHeight = () => {
        try {
            // limpa alturas para medir corretamente
            r.style.height = 'auto';
            a.style.height = 'auto';
            n.style.minHeight = '0';

            const frontHeight = r.scrollHeight;
            const backHeight = a.scrollHeight;
            const target = Math.max(frontHeight, backHeight);

            n.style.minHeight = target + 'px';
        } catch (err) {
            // elementos podem não existir ainda
        }
    };

    const debounce = (fn, wait) => {
        let t = null;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    };

    const debouncedAdjust = debounce(adjustCardHeight, 60);

    window.addEventListener('resize', () => {
        debouncedAdjust();
    });

    try {
        const mo = new MutationObserver(debouncedAdjust);
        mo.observe(r, { subtree: true, childList: true, characterData: true });
        mo.observe(a, { subtree: true, childList: true, characterData: true });
    } catch (err) {
        // MutationObserver pode não estar disponível; segue sem observer
    }

    function p(t){
        if(t<0||!e||e.length===0){
            r.innerHTML='Sem dados.'; a.innerHTML='Sem dados.'; i.textContent='0 / 0';
            [l,c,s].forEach(b=>{b.disabled=true; b.style.display='none';});
            return;
        }
        const o=e[t];
        // Envolve o conteúdo em um wrapper para garantir centralização vertical/horizontal
        r.innerHTML = '<div class="card-inner">' + (o.front || '') + '</div>';
        a.innerHTML = '<div class="card-inner">' + (o.back || '') + '</div>';
        i.textContent = (t+1) + ' / ' + e.length;
        l.style.display='block';
        l.disabled=false;
        if (e.length <= 1) {
            c.style.display = 'none'; s.style.display = 'none';
            c.disabled = true; s.disabled = true;
            l.style.margin = 'auto';
        } else {
            c.style.display = 'block'; s.style.display = 'block';
            c.disabled = (t === 0);
            s.disabled = (t === e.length - 1);
            l.style.margin = '';
        }

        // Recalcula altura após inserir conteúdo
        adjustCardHeight();

        u&&f();
    }
    function f(){
        u=!u,n.classList.toggle("is-flipped"),
        u?(r.setAttribute("aria-hidden","true"),a.setAttribute("aria-hidden","false"),l.setAttribute("aria-label","Virar para a frente"))
         :(r.setAttribute("aria-hidden","false"),a.setAttribute("aria-hidden","true"),l.setAttribute("aria-label","Virar para o verso"))
    }
    l.addEventListener("click",f),
    s.addEventListener("click",()=>{d=(d+1)%e.length,p(d)}),
    c.addEventListener("click",()=>{d=(d-1+e.length)%e.length,p(d)}),
    p(d);
    const b=o.closest(".interactive-card-wrapper");
    if(b){
        if(b.closest('.object-card-preview')){
            b.classList.add("is-visible");
        }else{
            const t=new IntersectionObserver((t,e)=>{t.forEach(t=>{if(t.isIntersecting){t.target.classList.add("is-visible");e.unobserve(t.target)}})},{threshold:.25});
            t.observe(b)
        }
    }
    };
    // Executa imediatamente ou aguarda o DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();<\/script>`;
    }
});