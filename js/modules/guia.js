// js/modules/guia.js
// Módulo Guia Sequencial (v5.8 - Com Fundo Dinâmico)

GeneratorCore.registerModule('guia', {
    
    // 1. Setup: Ativa os botões "+ Adicionar" e "X Remover" (Sem mudanças aqui)
    setup(core) {
        const addButton = document.getElementById('guia-add-passo');
        const container = document.getElementById('guia-passos-container');
        
        const updateStepLabels = () => {
            const allBlocks = container.querySelectorAll('.guia-passo-bloco');
            allBlocks.forEach((bloco, index) => {
                const stepNum = index + 1;
                const titleLabel = bloco.querySelector('label[for^="input-guia-titulo-"]');
                const titleInput = bloco.querySelector('.guia-titulo-input');
                const descLabel = bloco.querySelector('label[for^="input-guia-desc-"]');
                const descInput = bloco.querySelector('.guia-desc-input');
                if(titleLabel && titleInput) {
                    titleLabel.innerText = `Título do Passo ${stepNum}`;
                    titleLabel.htmlFor = `input-guia-titulo-${index}`;
                    titleInput.id = `input-guia-titulo-${index}`;
                }
                if(descLabel && descInput) {
                    descLabel.innerText = `Descrição do Passo ${stepNum}`;
                    descLabel.htmlFor = `input-guia-desc-${index}`;
                    descInput.id = `input-guia-desc-${index}`;
                }
            });
        };

        addButton.addEventListener('click', () => {
            const newIndex = container.querySelectorAll('.guia-passo-bloco').length;
            const newStepBlock = document.createElement('div');
            newStepBlock.className = 'guia-passo-bloco';
            newStepBlock.innerHTML = `
                <button type="button" class="guia-remove-passo" title="Remover este passo">X</button>
                <div class="form-group">
                    <label for="input-guia-titulo-${newIndex}">Título do Passo ${newIndex + 1}</label>
                    <input type="text" id="input-guia-titulo-${newIndex}" class="rich-text-enabled guia-titulo-input" placeholder="Ex: Passo ${newIndex + 1}: Execução" required>
                </div>
                <div class="form-group">
                    <label for="input-guia-desc-${newIndex}">Descrição do Passo ${newIndex + 1}</label>
                    <textarea id="input-guia-desc-${newIndex}" class="rich-text-enabled guia-desc-input" placeholder="Escreva o código..." required></textarea>
                </div>
            `;
            container.appendChild(newStepBlock);

            const newTitleInput = newStepBlock.querySelector(`#input-guia-titulo-${newIndex}`);
            const newDescTextarea = newStepBlock.querySelector(`#input-guia-desc-${newIndex}`);
            if (newTitleInput) core.utils.enableRichText(newTitleInput);
            if (newDescTextarea) core.utils.enableRichText(newDescTextarea);

            const removeButton = newStepBlock.querySelector('.guia-remove-passo');
            removeButton.addEventListener('click', () => {
                container.removeChild(newStepBlock);
                updateStepLabels();
            });
        });
        
        updateStepLabels();
    },

    // 2. (ATUALIZADO) getFormData: Lê os dados, incluindo a nova cor de fundo
    getFormData(core) {
        const uniqueId = `guia-${Date.now().toString().slice(-6)}`;
        
        // --- NOVAS CORES ---
        const corDestaque = document.getElementById('input-guia-cor').value;
        const corHover = document.getElementById('input-guia-cor-hover').value;
        const corFundo = document.getElementById('input-guia-bg').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        // Cor da barra de navegação (clara em fundos escuros, escura em fundos claros)
        const corNavBg = (corTexto === '#FFFFFF') ? 'rgba(255, 255, 255, .05)' : 'rgba(3, 2, 0, .03)';
        // --- FIM DAS NOVAS CORES ---

        const dataArray = [];
        const passoBlocos = document.querySelectorAll('.guia-passo-bloco');
        
        passoBlocos.forEach(bloco => {
            const tituloEditor = bloco.querySelector('.guia-titulo-input + .rich-text-wrapper .wysiwyg-editor') ||
                                 bloco.querySelector('.guia-titulo-input.wysiwyg-editor') ||
                                 bloco.querySelector('.guia-titulo-input');
            const descEditor = bloco.querySelector('.guia-desc-input + .rich-text-wrapper .wysiwyg-editor') ||
                               bloco.querySelector('.guia-desc-input.wysiwyg-editor') ||
                               bloco.querySelector('.guia-desc-input');
            
            let tituloVal = '';
            let descVal = '';
            
            if (tituloEditor) {
                if (tituloEditor.classList.contains('wysiwyg-editor') || tituloEditor.contentEditable === 'true') {
                    tituloVal = (tituloEditor.innerHTML || '').trim();
                } else if ('value' in tituloEditor) {
                    tituloVal = (tituloEditor.value || '').trim();
                }
            }
            
            if (descEditor) {
                if (descEditor.classList.contains('wysiwyg-editor') || descEditor.contentEditable === 'true') {
                    descVal = (descEditor.innerHTML || '').trim();
                } else if ('value' in descEditor) {
                    descVal = (descEditor.value || '').trim();
                }
            }
            
            if (tituloVal || descVal) {
                dataArray.push([ tituloVal, descVal ]);
            }
        });

        // Se não houver passos, adicionar passos padrão para demonstração
        if (dataArray.length === 0) {
            dataArray.push(
                ['Passo 1: Planejamento', 'Defina seus objetivos e crie um plano de ação claro.'],
                ['Passo 2: Execução', 'Implemente as ações planejadas com dedicação e foco.'],
                ['Passo 3: Avaliação', 'Analise os resultados e faça ajustes necessários.']
            );
        }

        const totalSteps = dataArray.length;

        const panelsHTML = dataArray.map((item, index) => {
            const [title, description] = item;
            return `
                <div class="step-panel" id="step-${index}-${uniqueId}" role="tabpanel">
                    <h3 tabindex="-1">${title}</h3>
                    <p>${description}</p> 
                </div>`;
        }).join('');

        return {
            uniqueId: uniqueId,
            ariaLabel: document.getElementById('input-guia-aria-label').value,
            audiodescricao: document.getElementById('input-guia-audiodescricao').value,
            panelsHTML: panelsHTML,
            totalSteps: totalSteps,
            corDestaque: corDestaque,
            corHover: corHover,
            corDestaqueTexto: core.utils.getContrastColor(corDestaque),
            corHoverTexto: core.utils.getContrastColor(corHover),
            // Passa as novas cores para o template
            corFundo: corFundo,
            corTexto: corTexto,
            corNavBg: corNavBg,
            dataArray: dataArray // Salvar array original
        };
    },

    setFormData(data) {
        console.log('🔄 Restaurando dados do Guia:', data);
        console.log('🎨 Cores recebidas - corDestaque:', data.corDestaque, 'corHover:', data.corHover, 'corFundo:', data.corFundo);
        
        setTimeout(() => {
            const ariaField = document.getElementById('input-guia-aria-label');
            const audioField = document.getElementById('input-guia-audiodescricao');
            const corField = document.getElementById('input-guia-cor');
            const corHoverField = document.getElementById('input-guia-cor-hover');
            const corFundoField = document.getElementById('input-guia-bg');
            
            console.log('🎨 Campos encontrados:', {
                cor: !!corField,
                corHover: !!corHoverField,
                corFundo: !!corFundoField
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
            
            const restoreSelectField = (field, value, defaultValue) => {
                if (!field) {
                    console.warn('⚠️ Campo não encontrado');
                    return;
                }
                
                const finalValue = value || defaultValue;
                console.log(`📝 Tentando restaurar select com valor: "${finalValue}"`);
                
                // Verificar se a opção existe
                const optionExists = Array.from(field.options).some(opt => opt.value === finalValue);
                console.log(`  Opção "${finalValue}" existe? ${optionExists}`);
                
                if (optionExists) {
                    field.value = finalValue;
                    console.log(`  ✅ Valor aplicado: "${field.value}"`);
                } else {
                    console.warn(`  ⚠️ Opção "${finalValue}" não encontrada, usando padrão`);
                    field.value = defaultValue;
                }
            };
            
            restoreFieldWithWYSIWYG(ariaField, data.ariaLabel);
            if (audioField) audioField.value = data.audiodescricao || '';
            
            restoreSelectField(corField, data.corDestaque, '#0A88F4');
            restoreSelectField(corHoverField, data.corHover, '#C3EB1E');
            restoreSelectField(corFundoField, data.corFundo, '#FFFFFF');
            
            // Restaurar passos
            const container = document.getElementById('guia-passos-container');
            if (container && data.dataArray && data.dataArray.length > 0) {
                container.innerHTML = '';
                
                data.dataArray.forEach((item, index) => {
                    const [titulo, desc] = item;
                    
                    const bloco = document.createElement('div');
                    bloco.className = 'guia-passo-bloco';
                    bloco.style.cssText = "position: relative; padding: 15px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 12px; background-color: #fff;";
                    
                    bloco.innerHTML = `
                        <div class="form-group">
                            <label for="input-guia-titulo-${index}">Título do Passo ${index + 1}</label>
                            <input type="text" id="input-guia-titulo-${index}" class="rich-text-enabled guia-titulo-input" placeholder="Ex: Passo 1: Planejamento">
                        </div>
                        <div class="form-group">
                            <label for="input-guia-desc-${index}">Descrição do Passo ${index + 1}</label>
                            <textarea id="input-guia-desc-${index}" class="rich-text-enabled guia-desc-input" placeholder="Defina seus objetivos..."></textarea>
                        </div>
                    `;
                    
                    container.appendChild(bloco);
                    
                    const tituloField = document.getElementById(`input-guia-titulo-${index}`);
                    const descField = document.getElementById(`input-guia-desc-${index}`);
                    
                    if (tituloField) tituloField.value = titulo || '';
                    if (descField) descField.value = desc || '';
                    
                    if (index > 0) {
                        const removeButton = document.createElement('button');
                        removeButton.type = 'button';
                        removeButton.className = 'guia-remove-passo';
                        removeButton.innerHTML = '&times;';
                        removeButton.title = `Remover Passo ${index + 1}`;
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
            
            console.log('✅ Guia restaurado com', data.dataArray?.length || 0, 'passos');
        }, 200);
    },

    // 3. (ATUALIZADO) createTemplate: Usa as novas variáveis de cor
    createTemplate(data) {
        // Recebe as novas variáveis
        const { 
            uniqueId, ariaLabel, audiodescricao, panelsHTML, totalSteps, 
            corDestaque, corDestaqueTexto, corHover, corHoverTexto,
            corFundo, corTexto, corNavBg
        } = data;

        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        // Adiciona as novas variáveis CSS (--cor-fundo-card, --cor-texto-card, --cor-nav-bg)
        // e as aplica em .steps-container, .step-panel p, .step-status, e .steps-nav
        return `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Arial&display=swap');
:root{
    --color-cinza-tech:#030200;
    --color-cinza-tech-light:rgba(3,2,0,.4);
    --color-branco-puro:#fff;
    --color-azul-moderno:#0a88f4;
    --color-verde-tech:#c3eb1e;
    --cor-destaque-dinamica:${corDestaque};
    --cor-destaque-texto-dinamica:${corDestaqueTexto};
    --cor-hover-dinamica:${corHover};
    --cor-hover-texto-dinamica:${corHoverTexto};
    /* Novas Cores */
    --cor-fundo-card:${corFundo};
    --cor-texto-card:${corTexto};
    --cor-nav-bg:${corNavBg};
}
html,body{margin:0;padding:0;background-color:transparent;font-family:'Montserrat',sans-serif;box-sizing:border-box}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.interactive-guia-wrapper{opacity:0;transform:translateY(20px);transition:opacity .6s ease-out,transform .6s ease-out;padding:10px;box-sizing:border-box;width:100%;max-width:500px;margin:0 auto}
.interactive-guia-wrapper.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.interactive-guia-wrapper{transition:opacity .4s ease-out;transform:none}}
.steps-container{width:100%;background:var(--cor-fundo-card);border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.1);overflow:hidden;border:1px solid rgba(0,0,0,.08)}
.steps-inner{padding:25px;position:relative;overflow:hidden;min-height:120px}
.step-panel{position:absolute;top:25px;left:25px;right:25px;opacity:0;transition:opacity .3s ease-out,transform .3s ease-out;visibility:hidden;transform:translateX(0)}
.step-panel.is-active{opacity:1;transform:translateX(0);visibility:visible;position:relative;top:auto;left:auto;right:auto}
.step-panel.prepare-enter-right{transform:translateX(20px);visibility:visible}
.step-panel.prepare-enter-left{transform:translateX(-20px);visibility:visible}
.step-panel.is-exiting-left{transform:translateX(-20px);opacity:0;position:absolute}
.step-panel.is-exiting-right{transform:translateX(20px);opacity:0;position:absolute}
@media (prefers-reduced-motion:reduce){.step-panel,.step-panel.prepare-enter-right,.step-panel.prepare-enter-left,.step-panel.is-exiting-left,.step-panel.is-exiting-right{transform:none;transition:opacity .3s ease-out}}
.step-panel h3{font-family:'Montserrat',sans-serif;font-weight:700;margin:0 0 10px;color:var(--cor-destaque-dinamica);font-size:1.2rem}
.step-panel h3:focus{outline:none}
.step-panel p{font-family:'Arial',sans-serif;margin:0;font-size:.95rem;line-height:1.5;color:var(--cor-texto-card);opacity:.85;min-height:80px}
.steps-nav{display:flex;justify-content:space-between;align-items:center;padding:15px 25px;background-color:var(--cor-nav-bg);border-top:1px solid rgba(0,0,0,.08)}
.step-status{font-size:.9rem;font-weight:600;color:var(--cor-texto-card);font-family:'Montserrat',sans-serif}
.nav-buttons button{font-family:'Montserrat',sans-serif;font-size:.9rem;font-weight:600;border:none;background-color:var(--cor-destaque-dinamica);color:var(--cor-destaque-texto-dinamica);padding:8px 15px;border-radius:5px;cursor:pointer;margin-left:10px;transition:transform .3s ease,background-color .3s ease,color .3s ease}
.nav-buttons button:hover:not(:disabled){transform:scale(1.05);background-color:var(--cor-hover-dinamica)!important;color:var(--cor-hover-texto-dinamica)!important}
.nav-buttons button:focus-visible{outline:2px solid var(--cor-destaque-dinamica);outline-offset:2px}
.nav-buttons button:disabled{background-color:var(--color-cinza-tech-light);opacity:.6;cursor:not-allowed}
.object-card-preview .interactive-guia-wrapper{max-width:100%;padding:5px}
.object-card-preview .steps-container{box-shadow:0 2px 8px rgba(0,0,0,.08)}
.object-card-preview .steps-inner{padding:12px;min-height:60px}
.object-card-preview .step-panel{top:12px;left:12px;right:12px}
.object-card-preview .step-panel h3{font-size:0.9rem;margin:0 0 6px}
.object-card-preview .step-panel p{font-size:0.75rem;line-height:1.3;min-height:40px}
.object-card-preview .steps-nav{padding:8px 12px;flex-wrap:wrap;gap:8px}
.object-card-preview .step-status{font-size:0.75rem;order:1;width:100%;text-align:center}
.object-card-preview .nav-buttons{order:2;display:flex;justify-content:center;width:100%;margin:0}
.object-card-preview .nav-buttons button{font-size:0.75rem;padding:5px 10px;margin:0 4px}</style><div class="interactive-guia-wrapper" role="region" aria-label="${ariaLabel}"><div class="steps-container" id="${uniqueId}"><div class="steps-inner" id="steps-live-region-${uniqueId}" aria-live="polite">${audiodescricaoHTML}${panelsHTML}</div><div class="steps-nav"><div class="step-status" id="step-status-${uniqueId}" aria-live="polite"></div><div class="nav-buttons"><button class="step-prev" disabled>Anterior</button><button class="step-next">Próximo</button></div></div></div></div><script>
(function(){
    const init = () => {
        const t="${uniqueId}",e=document.getElementById(t);
        console.log('🎯 Guia init - Container encontrado:', e);
        if(!e)return;
        const o=Array.from(e.querySelectorAll(".step-panel"));
        console.log('📋 Painéis encontrados:', o.length, o);
        const n=e.querySelector(".step-prev"),r=e.querySelector(".step-next"),a=e.querySelector('#step-status-${uniqueId}'),i=${totalSteps};
        console.log('🎮 Botões encontrados - prev:', n, 'next:', r, 'status:', a);
        let l=1;
        function s(t,d="forward"){
            console.log('🔄 Mudando para passo:', t, 'direção:', d);
            const c=t+1,p=l-1,u=p===t;
            o.forEach((e,o_idx)=>{
                if(o_idx===p&&!u){
                    e.classList.remove("is-active");
                    e.classList.remove("prepare-enter-left","prepare-enter-right");
                    "forward"===d?e.classList.add("is-exiting-left"):e.classList.add("is-exiting-right");
                    e.addEventListener("transitionend",function t(){
                        e.classList.contains("is-active")||(e.setAttribute("hidden",!0),e.classList.remove("is-exiting-left","is-exiting-right"),e.removeEventListener("transitionend",t))
                    },{once:!0})
                }else if(o_idx===t){
                    e.classList.remove("is-exiting-left","is-exiting-right");
                    e.removeAttribute("hidden");
                    if(!u){"forward"===d?e.classList.add("prepare-enter-right"):e.classList.add("prepare-enter-left")}
                    e.offsetWidth;
                    e.classList.remove("prepare-enter-left","prepare-enter-right");
                    e.classList.add("is-active");
                    if(!u){setTimeout(()=>{const t=e.querySelector("h3");t&&t.focus()},0)}
                }else{
                    e.setAttribute("hidden",!0);
                    e.classList.remove("is-active","is-exiting-left","is-exiting-right","prepare-enter-left","prepare-enter-right")
                }
            });
            a.textContent='Passo '+(c)+' de '+i;
            n.disabled=1===c;
            r.disabled=c===i;
            l=c
        }
        n.addEventListener('click',()=>{l>1&&s(l-2,"backward")});
        r.addEventListener('click',()=>{l<i&&s(l,"forward")});
        const d=e.closest(".interactive-guia-wrapper");
        if(d){
            // Se estiver dentro de um card preview, mostrar imediatamente
            if(d.closest('.object-card-preview')){
                d.classList.add("is-visible");
            }else{
                const t=new IntersectionObserver((t,e)=>{
                    t.forEach(t=>{
                        if(t.isIntersecting){
                            t.target.classList.add("is-visible");
                            e.unobserve(t.target)
                        }
                    })
                },{threshold:.25});
                t.observe(d)
            }
        }
        s(0,"forward");
        console.log('✅ Guia init completo!');
    };
    console.log('🚀 Script do guia carregado, readyState:', document.readyState);
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',init);
    }else{
        init();
    }
})();
<\/script>`;
    }
});