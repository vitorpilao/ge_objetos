// js/modules/flashcard.js
// Módulo Flashcard (v5.8.6 - Corrige bug de "Enter" na Frente)

GeneratorCore.registerModule('flashcard', {
    
    // 1. Setup: (Função para Adicionar/Remover cards)
    setup(core) {
        const addButton = document.getElementById('flashcard-add-card');
        const container = document.getElementById('flashcard-cards-container');
        
        const updateCardLabels = () => {
            const allBlocks = container.querySelectorAll('.flashcard-bloco');
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
            
            // --- MUDANÇA ESTÁ AQUI ---
            // O campo "Frente" agora é um <input type="text">
            newCardBlock.innerHTML = `
                <button type="button" class="flashcard-remove-card" title="Remover este card">X</button>
                <div class="form-group">
                    <label for="input-flashcard-frente-${newIndex}">Frente do Card ${newIndex + 1}</label>
                    <input type="text" id="input-flashcard-frente-${newIndex}" class="rich-text-enabled flashcard-frente-input" required>
                </div>
                <div class="form-group">
                    <label for="input-flashcard-verso-${newIndex}">Verso do Card ${newIndex + 1}</label>
                    <textarea id="input-flashcard-verso-${newIndex}" class="rich-text-enabled flashcard-verso-input" required></textarea>
                </div>
            `;
            // --- FIM DA MUDANÇA ---

            container.appendChild(newCardBlock);

            // Ativa o Rich Text nos novos campos
            const newFrenteInput = newCardBlock.querySelector(`#input-flashcard-frente-${newIndex}`);
            const newVersoInput = newCardBlock.querySelector(`#input-flashcard-verso-${newIndex}`);
            if (newFrenteInput) core.utils.enableRichText(newFrenteInput);
            if (newVersoInput) core.utils.enableRichText(newVersoInput);

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
        
        cardBlocos.forEach(bloco => {
            const frenteInput = bloco.querySelector('.flashcard-frente-input');
            const versoInput = bloco.querySelector('.flashcard-verso-input');
            if (frenteInput && versoInput && (frenteInput.value || versoInput.value)) {
                cardDataArray.push({
                    front: frenteInput.value,
                    back: versoInput.value
                });
            }
        });

        let jsonString = JSON.stringify(cardDataArray);
        const safeJsonString = jsonString
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
        
        return {
            uniqueId: `flashcard-engine-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-flashcard-aria-label').value,
            corDestaque: corDestaque,
            corHover: corHover,
            corDestaqueTexto: core.utils.getContrastColor(corDestaque),
            corHoverTexto: core.utils.getContrastColor(corHover),
            corFundo: corFundo,
            corTexto: core.utils.getContrastColor(corFundo),
            cardDataJson: safeJsonString
        };
    },
    
    // 3. createTemplate: (Nenhuma mudança necessária aqui)
    createTemplate(data) {
        const { 
            uniqueId, ariaLabel, cardDataJson, 
            corDestaque, corDestaqueTexto, corHover, corHoverTexto,
            corFundo, corTexto 
        } = data;

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
html{height:100%}body{font-family:'Arial',sans-serif;background-color:transparent;display:flex;justify-content:center;align-items:center;margin:0;padding:0;height:100%;box-sizing:border-box}
.interactive-card-wrapper{opacity:0;transform:translateY(20px);transition:opacity .6s ease-out,transform .6s ease-out;width:100%;max-width:500px;margin:auto;display:flex;flex-direction:column;align-items:center;padding:20px 10px;box-sizing:border-box}
.interactive-card-wrapper.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.interactive-card-wrapper{transition:opacity .4s ease-out;transform:none}}
.flashcard-engine{width:100%;perspective:1000px;display:flex;flex-direction:column;align-items:center}
.flash-card{width:100%;height:250px;position:relative;transform-style:preserve-3d;transition:transform .6s;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,.1);background-color:var(--cor-fundo-card);border:2px solid rgba(0,0,0,.08);box-sizing:border-box;margin-bottom:20px}
.flash-card.is-flipped{transform:rotateY(180deg)}
.card-face{position:absolute;width:100%;height:100%;-webkit-backface-visibility:hidden;backface-visibility:hidden;display:flex;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;border-radius:12px;color:var(--cor-texto-card);overflow:auto}
.card-face-front{font-family:'Montserrat',sans-serif;font-size:1.8rem;font-weight:700;text-align:center;line-height:1.3}
.card-face-back{font-family:'Arial',sans-serif;font-size:1.1rem;font-weight:400;transform:rotateY(180deg);line-height:1.5;text-align:left}
.card-controls{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:400px;margin-top:15px}
.card-button{border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-family:'Montserrat',sans-serif;font-weight:500;font-size:.9rem;transition:transform .2s ease,background-color .3s ease,color .3s ease;flex-grow:1;margin:0 5px;white-space:nowrap}
.card-button:first-child{margin-left:0}.card-button:last-child{margin-right:0}
.card-button:hover:not(:disabled){transform:scale(1.05);background-color:var(--cor-hover-dinamica)!important;color:var(--cor-hover-texto-dinamica)!important}
.card-button:focus-visible{outline:3px solid var(--cor-destaque-dinamica)}
.btn-flip,.btn-prev,.btn-next{background-color:var(--cor-destaque-dinamica);color:var(--cor-destaque-texto-dinamica);font-weight:700}
.progress-indicator{color:var(--color-branco-puro);text-align:center;margin-top:10px;font-family:'Montserrat',sans-serif;font-weight:300;width:100%}
@media (max-width:480px){.card-face-front{font-size:1.5rem}.card-face-back{font-size:1rem}.card-button{padding:8px 12px;font-size:.8rem}.card-controls{max-width:100%}.flash-card{height:220px}}</style>
<div class="interactive-card-wrapper" role="region" aria-label="${ariaLabel}">
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
<script>document.addEventListener('DOMContentLoaded',()=>{
    const t="${uniqueId}";
    const e = JSON.parse('${cardDataJson}');
    const o = document.getElementById(t);
    if(!o)return;
    const n=o.querySelector(".flash-card"),r=o.querySelector(".card-face-front"),a=o.querySelector(".card-face-back"),l=o.querySelector(".btn-flip"),c=o.querySelector(".btn-prev"),s=o.querySelector(".btn-next"),i=o.querySelector(".progress-indicator");
    let d=0,u=!1;
    function p(t){
        if(t<0||!e||e.length===0){
            r.innerHTML='Sem dados.'; a.innerHTML='Sem dados.'; i.textContent='0 / 0';
            [l,c,s].forEach(b=>{b.disabled=true; b.style.display='none';});
            return;
        }
        const o=e[t];
        r.innerHTML=o.front; a.innerHTML=o.back;
        i.textContent=\`\${t+1} / \${e.length}\`;
        l.style.display='block';
        l.disabled=false;
        c.style.display = e.length <= 1 ? 'none' : 'block';
        s.style.display = e.length <= 1 ? 'none' : 'block';
        l.style.margin = e.length <= 1 ? 'auto' : '';
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
    if(b){const t=new IntersectionObserver((t,e)=>{t.forEach(t=>{if(t.isIntersecting){t.target.classList.add("is-visible");e.unobserve(t.target)}})},{threshold:.25});t.observe(b)}
});<\/script>`;
    }
});