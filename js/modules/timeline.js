// js/modules/timeline.js
// Módulo Timeline (v5.9.2 - Rich Text nas Abas)

GeneratorCore.registerModule('timeline', {
    
    // 1. (ATUALIZADO) Setup: Ativa Rich Text em todos os campos
    setup(core) {
        const addButton = document.getElementById('timeline-add-passo');
        const container = document.getElementById('timeline-passos-container');
        
        // Função para renumerar todas as labels
        const updateStepLabels = () => {
            const allBlocks = container.querySelectorAll('.timeline-passo-bloco');
            allBlocks.forEach((bloco, index) => {
                const stepNum = index + 1; // Numeração humana
                
                const abaLabel = bloco.querySelector('label[for^="input-timeline-aba-"]');
                const abaInput = bloco.querySelector('.timeline-aba-input');
                const tituloLabel = bloco.querySelector('label[for^="input-timeline-titulo-"]');
                const tituloInput = bloco.querySelector('.timeline-titulo-input');
                const descLabel = bloco.querySelector('label[for^="input-timeline-desc-"]');
                const descInput = bloco.querySelector('.timeline-desc-input');

                // MUDANÇA AQUI: Remove "(Texto Simples)"
                if (abaLabel && abaInput) {
                    abaLabel.innerText = `Título da Aba ${stepNum}`;
                    abaLabel.htmlFor = `input-timeline-aba-${index}`;
                    abaInput.id = `input-timeline-aba-${index}`;
                }
                if (tituloLabel && tituloInput) {
                    tituloLabel.innerText = `Título do Conteúdo ${stepNum}`;
                    tituloLabel.htmlFor = `input-timeline-titulo-${index}`;
                    tituloInput.id = `input-timeline-titulo-${index}`;
                }
                if (descLabel && descInput) {
                    descLabel.innerText = `Descrição do Conteúdo ${stepNum}`;
                    descLabel.htmlFor = `input-timeline-desc-${index}`;
                    descInput.id = `input-timeline-desc-${index}`;
                }
            });
        };

        // Evento de ADICIONAR Passo
        addButton.addEventListener('click', () => {
            const newIndex = container.querySelectorAll('.timeline-passo-bloco').length;
            
            const newStepBlock = document.createElement('div');
            newStepBlock.className = 'timeline-passo-bloco';
            
            // MUDANÇA AQUI: Adiciona "rich-text-enabled" ao input da Aba
            newStepBlock.innerHTML = `
                <button type="button" class="timeline-remove-passo" title="Remover este passo">X</button>
                <div class="form-group">
                    <label for="input-timeline-aba-${newIndex}">Título da Aba ${newIndex + 1}</label>
                    <input type="text" id="input-timeline-aba-${newIndex}" class="rich-text-enabled timeline-aba-input" placeholder="Ex: ${newIndex + 2}000s" required>
                </div>
                <div class="form-group">
                    <label for="input-timeline-titulo-${newIndex}">Título do Conteúdo ${newIndex + 1}</label>
                    <input type="text" id="input-timeline-titulo-${newIndex}" class="rich-text-enabled timeline-titulo-input" placeholder="Ex: A Era Mobile" required>
                </div>
                <div class="form-group">
                    <label for="input-timeline-desc-${newIndex}">Descrição do Conteúdo ${newIndex + 1}</label>
                    <textarea id="input-timeline-desc-${newIndex}" class="rich-text-enabled timeline-desc-input" placeholder="A ascensão dos smartphones..." required></textarea>
                </div>
            `;
            container.appendChild(newStepBlock);

            // MUDANÇA AQUI: Ativa o Rich Text no novo input da Aba
            const newAbaInput = newStepBlock.querySelector(`#input-timeline-aba-${newIndex}`);
            const newTitleInput = newStepBlock.querySelector(`#input-timeline-titulo-${newIndex}`);
            const newDescTextarea = newStepBlock.querySelector(`#input-timeline-desc-${newIndex}`);
            
            if (newAbaInput) core.utils.enableRichText(newAbaInput);
            if (newTitleInput) core.utils.enableRichText(newTitleInput);
            if (newDescTextarea) core.utils.enableRichText(newDescTextarea);

            // Adiciona evento de REMOVER
            const removeButton = newStepBlock.querySelector('.timeline-remove-passo');
            removeButton.addEventListener('click', () => {
                container.removeChild(newStepBlock);
                updateStepLabels(); // Renumera tudo
            });
        });
        
        updateStepLabels(); // Garante que o Passo 1 tenha a numeração correta
    },

    // 2. getFormData: (Nenhuma mudança necessária aqui)
    getFormData(core) {
        const uniqueId = `timeline-${Date.now().toString().slice(-6)}`;
        const corDestaque = document.getElementById('input-timeline-cor').value;
        const corFundo = document.getElementById('input-timeline-bg').value;
        const corTextoPrincipal = core.utils.getContrastColor(corFundo);
        const corBorda = (corTextoPrincipal === '#FFFFFF') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(3, 2, 0, 0.2)';
        const corTextoSecundario = (corTextoPrincipal === '#FFFFFF') ? 'rgba(255, 255, 255, 0.6)' : 'rgba(3, 2, 0, 0.6)';

        const dataArray = [];
        const passoBlocos = document.querySelectorAll('.timeline-passo-bloco');
        
        passoBlocos.forEach(bloco => {
            const abaInput = bloco.querySelector('.timeline-aba-input');
            const tituloInput = bloco.querySelector('.timeline-titulo-input');
            const descInput = bloco.querySelector('.timeline-desc-input');

            if (abaInput && tituloInput && descInput) {
                dataArray.push([
                    abaInput.value,    // Título Aba (agora com HTML)
                    tituloInput.value, // Título Conteúdo
                    descInput.value    // Descrição
                ]);
            }
        });

        // Gera o HTML das Abas (Tabs)
        const tabsHTML = dataArray.map((item, index) => {
            const [tabTitle] = item;
            const isSelected = index === 0;
            return `
        <div
          class="timeline-tab"
          role="tab"
          id="tab-${index}-${uniqueId}"
          aria-controls="panel-${index}-${uniqueId}"
          aria-selected="${isSelected ? 'true' : 'false'}"
          tabindex="${isSelected ? '0' : '-1'}"
        >
          <span class="timeline-tab-text">${tabTitle}</span>
        </div>`;
        }).join('');

        // Gera o HTML dos Painéis de Conteúdo
        const panelsHTML = dataArray.map((item, index) => {
            const [, panelTitle, panelDesc] = item;
            const isActive = index === 0;
            return `
        <div
          class="timeline-content ${isActive ? 'is-active' : ''}"
          role="tabpanel"
          id="panel-${index}-${uniqueId}"
          aria-labelledby="tab-${index}-${uniqueId}"
          ${isActive ? '' : 'hidden'}
        >
          <h3 class="timeline-title">${panelTitle}</h3>
          <div class="timeline-description">${panelDesc}</div>
        </div>`;
        }).join('');
        
        return {
            uniqueId: uniqueId,
            ariaLabel: document.getElementById('input-timeline-aria-label').value,
            audiodescricao: document.getElementById('input-timeline-audiodescricao').value,
            tabsHTML: tabsHTML,
            panelsHTML: panelsHTML,
            corDestaque: corDestaque,
            corFundo: corFundo,
            corTextoPrincipal: corTextoPrincipal,
            corTextoSecundario: corTextoSecundario,
            corBorda: corBorda
        };
    },

    // 3. createTemplate: (Mudei <p> para <div> na descrição para aceitar melhor o HTML)
    createTemplate(data) {
        const { 
            uniqueId, ariaLabel, audiodescricao, tabsHTML, panelsHTML, corDestaque,
            corFundo, corTextoPrincipal, corTextoSecundario, corBorda 
        } = data;

        const audiodescricaoHTML = audiodescricao ? `<div class="visually-hidden">${audiodescricao}</div>` : '';

        return `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Arial:wght@400;700&display=swap');
:root{
    --font-primary:'Montserrat','Arial',sans-serif;
    --font-secondary:'Arial',sans-serif;
    --cor-destaque-dinamica:${corDestaque};
    --cor-fundo-card: ${corFundo};
    --cor-texto-principal: ${corTextoPrincipal};
    --cor-texto-secundario: ${corTextoSecundario};
    --cor-borda-leve: ${corBorda};
}
html,body{margin:0;padding:0;background-color:transparent}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.interactive-timeline-wrapper{opacity:0;transform:translateY(20px);transition:opacity .6s ease-out,transform .6s ease-out;padding:10px;box-sizing:border-box;width:100%}
.interactive-timeline-wrapper.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.interactive-timeline-wrapper{transition:opacity .4s ease-out;transform:none}}
.timeline-stepper-wrapper{font-family:var(--font-secondary);background-color:var(--cor-fundo-card);border:1px solid var(--cor-borda-leve);border-radius:8px;overflow:hidden}
.timeline-nav{display:flex;overflow-x:auto;border-bottom:2px solid var(--cor-borda-leve);-ms-overflow-style:none;scrollbar-width:none}
.timeline-nav::-webkit-scrollbar{display:none}
.timeline-tab{appearance:none;background:none;border:none;cursor:pointer;font-family:var(--font-primary);font-size:1.1rem;font-weight:700;color:var(--cor-texto-secundario);padding:14px 20px;margin:0;border-bottom:3px solid transparent;flex-shrink:0;transition:color .3s ease,border-color .3s ease,filter .3s ease}
.timeline-tab:hover,.timeline-tab:focus{color:var(--cor-destaque-dinamica);outline:none;filter:brightness(1.15)}
.timeline-tab:focus-visible{outline:2px solid var(--cor-destaque-dinamica);outline-offset:2px}
.timeline-tab[aria-selected=true]{color:var(--cor-destaque-dinamica);border-bottom-color:var(--cor-destaque-dinamica)}
.timeline-content-area{padding:24px;position:relative;min-height:150px}
.timeline-content{position:absolute;top:24px;left:24px;right:24px;bottom:24px;opacity:0;transform:translateY(15px);transition:opacity .4s ease-out,transform .4s ease-out;visibility:hidden;pointer-events:none}
.timeline-content.is-active{opacity:1;transform:translateY(0);visibility:visible;pointer-events:auto;position:relative;top:auto;left:auto;right:auto;bottom:auto}
@media (prefers-reduced-motion:reduce){.timeline-content{transition:opacity .3s ease-out;transform:none}.timeline-content.is-active{transform:none}}
.timeline-title{font-family:var(--font-primary);font-weight:700;font-size:1.2rem;color:var(--cor-texto-principal);margin:0 0 10px}
/* (MUDANÇA AQUI) Mudei de <p> para <div> para aceitar melhor o HTML do editor */
.timeline-description{font-family:var(--font-secondary);font-size:.95rem;color:var(--cor-texto-principal);line-height:1.5;margin:0;opacity:.85}
.timeline-description p { margin: 0 0 1em 0; }
.timeline-description p:last-child { margin-bottom: 0; }
.timeline-tab-text > *:first-child { margin-top: 0; }
.timeline-tab-text > *:last-child { margin-bottom: 0; }

</style><div class="interactive-timeline-wrapper" role="region" aria-label="${ariaLabel}"><div class="timeline-stepper-wrapper" id="${uniqueId}">${audiodescricaoHTML}<div class="timeline-nav" role="tablist" aria-label="Marcos da timeline">${tabsHTML}</div><div class="timeline-content-area">${panelsHTML}</div></div></div><script>document.addEventListener('DOMContentLoaded',()=>{const t="${uniqueId}",e=document.getElementById(t);if(!e)return;const o=e.querySelector(".timeline-nav"),n=Array.from(o.querySelectorAll(".timeline-tab")),r=e.querySelector(".timeline-content-area"),a=Array.from(r.querySelectorAll(".timeline-content"));function i(t){a.forEach(t=>{t.classList.remove("is-active"),t.addEventListener("transitionend",function e(){t.classList.contains("is-active")||(t.setAttribute("hidden",!0),t.removeEventListener("transitionend",e))})}),n.forEach(t=>{t.setAttribute("aria-selected","false"),t.setAttribute("tabindex","-1")}),t.setAttribute("aria-selected","true"),t.setAttribute("tabindex","0");const o=t.getAttribute("aria-controls"),r=e.querySelector(\`#\${o}\`);r&&(r.removeAttribute("hidden"),setTimeout(()=>{r.classList.add("is-active")},50)),t.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}o.addEventListener("click",t=>{const e=t.target.closest(".timeline-tab");e&&"true"!==e.getAttribute("aria-selected")&&i(e)}),o.addEventListener("keydown",t=>{let e=o.querySelector('[tabindex="0"]');if(!e)return;let r;const l=n.indexOf(e);if("ArrowRight"===t.key)t.preventDefault(),r=(l+1)%n.length;else if("ArrowLeft"===t.key)t.preventDefault(),r=(l-1+n.length)%n.length;else if("Home"===t.key)t.preventDefault(),r=0;else{if("End"!==t.key)return;t.preventDefault(),r=n.length-1}const c=n[r];c.focus(),i(c)});const l=e.closest(".interactive-timeline-wrapper");if(l){const t=new IntersectionObserver((t,e)=>{t.forEach(t=>{if(t.isIntersecting){t.target.classList.add("is-visible");e.unobserve(t.target)}})},{threshold:.25});t.observe(l)}});<\/script>`;
    }
});