GeneratorCore.registerModule('destaque', {
    getFormData(core) {
        // 1. Ler a nova cor de fundo
        const corFundo = document.getElementById('input-destaque-bg').value;

        const descricaoRaw = document.getElementById('input-destaque-descricao').value;
        const descricaoHTML = descricaoRaw
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => `<p>${line.trim()}</p>`)
            .join('\n  ');

        return {
            uniqueId: `destaque-${Date.now().toString().slice(-6)}`,
            ariaLabel: document.getElementById('input-destaque-aria-label').value,
            titulo: document.getElementById('input-destaque-titulo').value,
            corDestaque: document.getElementById('input-destaque-cor').value,
            // 2. Passar a cor de fundo
            corFundo: corFundo,
            // 3. CALCULAR AUTOMATICAMENTE A COR DO TEXTO baseada no fundo
            corTexto: core.utils.getContrastColor(corFundo),
            descricaoHTML: descricaoHTML
        };
    },

    createTemplate(data) {
        // Desestruturar as novas variáveis
        const { uniqueId, ariaLabel, titulo, descricaoHTML, corDestaque, corFundo, corTexto } = data;

        // Atualizei as variáveis CSS no :root abaixo para usar as novas cores dinâmicas
        return `<style>:root{--azul-moderno:#0a88f4;--cor-destaque-dinamica:${corDestaque};--cor-fundo-card:${corFundo};--cor-texto-card:${corTexto}}html,body{margin:0;padding:0;background-color:transparent;font-family:'Arial',sans-serif}.interactive-destaque-wrapper{padding:10px;box-sizing:border-box;width:100%}.interactive-reveal-card{font-family:'Arial',sans-serif;background-color:var(--cor-fundo-card);color:var(--cor-texto-card);padding:1.5rem;border-radius:8px;border-left:5px solid var(--cor-destaque-dinamica);box-shadow:0 4px 15px rgba(0,0,0,.15);opacity:0;transform:translateY(30px);transition:opacity .6s ease-out,transform .7s ease-out}.interactive-reveal-card.is-visible{opacity:1;transform:translateY(0)}@media (prefers-reduced-motion:reduce){.interactive-reveal-card{opacity:1;transform:none;transition:none}}.interactive-reveal-card h3{font-family:'Montserrat',sans-serif;font-weight:700;color:var(--cor-texto-card);margin-top:0;font-size:1.25rem}.interactive-reveal-card p{font-family:'Arial',sans-serif;font-size:.95rem;line-height:1.5;margin:.5em 0 0;opacity:.9}</style><div class="interactive-destaque-wrapper" role="region" aria-label="${ariaLabel}"><section class="interactive-reveal-card" id="${uniqueId}"><h3>${titulo}</h3>${descricaoHTML}</section></div><script>document.addEventListener('DOMContentLoaded',()=>{const t="${uniqueId}",e=document.getElementById(t);if(!e)return;const o={root:null,threshold:.3},n=(t,e)=>{t.forEach(t=>{if(t.isIntersecting){t.target.classList.add("is-visible");e.unobserve(t.target)}})},r=new IntersectionObserver(n,o);r.observe(e)});<\/script>`;
    }
});