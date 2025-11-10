// js/modules/flipcard.js
// Módulo Flipcard (v5.9.2 - Restaurado para layout original de 250px)

GeneratorCore.registerModule('flipcard', {
    iconMap: {
        'lightbulb': { label: "Ícone de lâmpada", path: "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6 8.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" },
        'bullseye': { label: "Ícone de alvo", path: "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10zm0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" },
        'patch-check': { label: "Ícone de selo de verificação", path: "M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z m-4.04-4.85a3.001 3.001 0 0 0-2.122.879L3.43 2.44a1.5 1.5 0 0 1-2.121 0l-.707-.707a.5.5 0 0 0-.708 0L.002 2.62a.5.5 0 0 0 0 .708l.707.707a1.5 1.5 0 0 1 0 2.122L.002 7.42a.5.5 0 0 0 0 .708l.879.878a.5.5 0 0 0 .708 0l.707-.707a1.5 1.5 0 0 1 2.121 0l1.263 1.263a3.001 3.001 0 0 0 2.122.879h.571a3.001 3.001 0 0 0 2.122-.879l1.263-1.263a1.5 1.5 0 0 1 2.121 0l.707.707a.5.5 0 0 0 .708 0l.878-.878a.5.5 0 0 0 0-.708l-.707-.707a1.5 1.5 0 0 1 0-2.122l.707-.707a.5.5 0 0 0 0-.708l-.878-.878a.5.5 0 0 0-.708 0l-.707.707a1.5 1.5 0 0 1-2.121 0L10.19 2.44a3.001 3.001 0 0 0-2.122-.879h-.571zM8 1.5a1.5 1.5 0 0 1 .707.293l1.263 1.263a.5.5 0 0 0 .707 0l.707-.707a1.5 1.5 0 0 1 2.121 0l.707.707a.5.5 0 0 0 .708 0L15.707 2.2a.5.5 0 0 0 0-.708l-.707-.707a1.5 1.5 0 0 1 0-2.121L15.707.002a.5.5 0 0 0-.708 0l-.707.707a.5.5 0 0 0 0 .707L12.44 3.26a1.5 1.5 0 0 1-2.121 0L9.057 2.002A1.5 1.5 0 0 1 8 1.5z" },
        'book': { label: "Ícone de livro", path: "M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.43-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.746c-.917-.381-2.107-.691-3.287-.81-1.094-.11-2.278-.027-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" },
        'cpu': { label: "Ícone de chip de CPU", path: "M5 0a.5.5 0 0 1 .5.5V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2h1V.5a.5.5 0 0 1 1 0V2A2.5 2.5 0 0 1 14.5 4.5V6h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14v1h1.5a.5.5 0 0 1 0 1H14.5A2.5 2.5 0 0 1 12 14v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14h-1v1.5a.5.5 0 0 1-1 0V14A2.5 2.5 0 0 1 1.5 11.5V10H0a.5.5 0 0 1 0-1h1.5V8H0a.5.5 0 0 1 0-1h1.5V6H0a.5.5 0 0 1 0-1h1.5A2.5 2.5 0 0 1 4 2V.5A.5.5 0 0 1 5 0zm-.5 3A1.5 1.5 0 0 0 3 4.5V6h1V4.5A1.5 1.5 0 0 0 4.5 3h-1zm1 0h1v3h-1v-3zm2 0h1v3h-1v-3zm2 0h1v3h-1v-3zm2 0h1v3h-1v-3zM3 7h1v2H3V7zm2 0h1v2H5V7zm2 0h1v2H7V7zm2 0h1v2H9V7zm2 0h1v2h-1V7zM3 10h1v2H3v-2zm2 0h1v2H5v-2zm2 0h1v2H7v-2zm2 0h1v2H9v-2zm2 0h1v2h-1v-2zm-1 3.5A1.5 1.5 0 0 0 10 12h1v1.5a.5.5 0 0 0 1.5 1.5h-1A1.5 1.5 0 0 0 10.5 13.5v-1zm-1 0v1A1.5 1.5 0 0 0 11 15h-1a1.5 1.5 0 0 0-1.5-1.5v-1zm-2 0v1A1.5 1.5 0 0 0 9 15H8a1.5 1.5 0 0 0-1.5-1.5v-1zm-2 0v1A1.5 1.5 0 0 0 7 15H6a1.5 1.5 0 0 0-1.5-1.5v-1zm-2 0v1A1.5 1.5 0 0 0 5 15H4a1.5 1.5 0 0 0-1.5-1.5v-1z" },
        'bar-chart-steps': { label: "Ícone de gráfico de barras", path: "M.5 0a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-1 0V.5A.5.5 0 0 1 .5 0zM2 1.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1zm6 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1zm6 4a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-1z" },
        'people': { label: "Ícone de pessoas", path: "M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.004a.274.274 0 0 1-.274.274H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 1 1 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 10.5C3.163 11.42 3 12.36 3 13c0 .58.068 1.05.18 1.485.11.433.266.82.457 1.152A.659.659 0 0 0 3 16h.5l.003-.001.004-.001.006-.001.006-.001.006-.001.007-.001.007-.001.007-.001.008-.001.008-.001.008-.001.008-.001.009-.001.009-.001.01-.001.01-.001.01-.001.01-.001.011-.001.011-.001.011-.001.012-.001c.219-.034.468-.08.754-.142.285-.062.613-.14.99-.24.376-.1.802-.218 1.27-.36.469-.14.986-.3 1.53-.47C8.18 15.04 8.582 15 9 15c.418 0 .82.04 1.21.117.545.17.96.33 1.53.47.468.142.894.26 1.27.36.377.1.705.178.99.24.286.062.535.108.754.142l.012.001.011.001.011.001.011.001.01.001.01.001.01.001.009.001.009.001.008.001.008.001.008.001.008.001.007.001.007.001.007.001.006.001.006.001.006.001.004.001.003.001H16a.5.5 0 0 0 .5-.5c0-1.01-.377-2.042-1.09-2.904-.243-.294-.526-.569-.846-.816A5.88 5.88 0 0 0 13.064 9.28zM4 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" },
        'question-circle': { label: "Ícone de interrogação", path: "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" }
    },

    // 1. Setup: (Função para "Adicionar Linha")
    setup(core) {
        const addButton = document.getElementById('flipcard-add-item');
        const container = document.getElementById('flipcard-itens-container');
        const updateItemLabels = () => {
            const allBlocks = container.querySelectorAll('.flipcard-item-bloco');
            allBlocks.forEach((bloco, index) => {
                const itemNum = index + 1;
                const label = bloco.querySelector('label');
                const textarea = bloco.querySelector('textarea');
                
                if (label && textarea) {
                    label.innerText = `Linha ${itemNum}`;
                    label.htmlFor = `input-flipcard-item-${index}`;
                    textarea.id = `input-flipcard-item-${index}`;
                }
            });
        };

        addButton.addEventListener('click', () => {
            const newIndex = container.querySelectorAll('.flipcard-item-bloco').length;
            const newItemBlock = document.createElement('div');
            newItemBlock.className = 'flipcard-item-bloco';
            
            newItemBlock.innerHTML = `
                <button type="button" class="flipcard-remove-item" title="Remover esta linha">X</button>
                <div class="form-group">
                    <label for="input-flipcard-item-${newIndex}">Linha ${newIndex + 1}</label>
                    <textarea id="input-flipcard-item-${newIndex}" class="rich-text-enabled flipcard-item-input" placeholder="Digite o texto da linha ${newIndex + 1}..." required></textarea>
                </div>
            `;
            container.appendChild(newItemBlock);
            
            const newItemTextarea = newItemBlock.querySelector(`#input-flipcard-item-${newIndex}`);
            if (newItemTextarea) core.utils.enableRichText(newItemTextarea);
            
            const removeButton = newItemBlock.querySelector('.flipcard-remove-item');
            removeButton.addEventListener('click', () => {
                container.removeChild(newItemBlock);
                updateItemLabels();
            });
        });
        
        updateItemLabels();
    },

    // 2. getFormData: (Lê os itens dinâmicos)
    getFormData(core) {
        const tituloFrenteRaw = document.getElementById('input-titulo-frente-flipcard').value;
        const iconeSelect = document.getElementById('input-icone-flipcard');
        const iconeKey = iconeSelect.value;
        const corFundo = document.getElementById('input-flipcard-bg').value;

        const stripHTML = (html) => {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        };

        const itemInputs = document.querySelectorAll('.flipcard-item-input');
        const listaItensHTML = Array.from(itemInputs)
            .map(input => (input.value.trim() !== '') ? `<li>${input.value}</li>` : null)
            .filter(item => item !== null)
            .join('\n');

        return {
            uniqueId: `card-flipper-${Date.now().toString().slice(-6)}`,
            corTema: document.getElementById('input-cor-tema-flipcard').value,
            corFundo: corFundo,
            corTexto: core.utils.getContrastColor(corFundo),
            tituloFrente: tituloFrenteRaw,
            descricaoFrente: document.getElementById('input-descricao-frente-flipcard').value,
            tituloVerso: document.getElementById('input-titulo-verso-flipcard').value,
            iconePath: this.iconMap[iconeKey]?.path || 'M8 15A7...',
            iconeAriaLabel: iconeSelect.options[iconeSelect.selectedIndex].getAttribute('data-label'),
            ariaLabelRegiao: document.getElementById('input-aria-label-flipcard').value,
            ariaLabelBotao: `${stripHTML(tituloFrenteRaw)}. Pressione para ver os objetivos.`,
            listaItensHTML: listaItensHTML
        };
    },

    // 3. createTemplate: (CSS Corrigido - Retorno ao v5.9.2)
    createTemplate(data) {
        const { uniqueId, corTema, corFundo, corTexto, tituloFrente, descricaoFrente, tituloVerso, listaItensHTML, iconePath, iconeAriaLabel, ariaLabelRegiao, ariaLabelBotao } = data;

        return `<style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap');
/* --- CORREÇÃO 1: Reset Global --- */
html,body{
    margin:0;
    padding:0; /* Remove o padding do body */
    font-family:'Montserrat',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    height:100%;
    display:flex;
    justify-content:center;
    align-items:center;
    perspective:1000px;
    background-color:transparent;
    box-sizing:border-box;
}
*, *:before, *:after { box-sizing: inherit; }

/* --- CORREÇÃO 2: Wrapper com padding de 10px --- */
/* (Este padding é o "respiro" que você vê no preview) */
.interactive-card-wrapper{
    opacity:0;
    transform:translateY(20px);
    transition:opacity .6s ease-out,transform .6s ease-out;
    padding: 20px; /* Este é o padding que causava o scroll */
    box-sizing:border-box;
    width: 250px; /* Largura fixa (250px + 2*10px padding) */
    height: 180px; /* Altura fixa (180px + 2*10px padding) */
}
.interactive-card-wrapper.is-visible{opacity:1;transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.interactive-card-wrapper{transition:opacity .4s ease-out;transform:none}}

/* --- CORREÇÃO 3: Card com 100% de largura e altura fixa --- */
/* (Ele terá 100% da largura do wrapper, ou seja, 250px) */
.interactive-card{
    width: 90%;    
    height: 90%;
    cursor:pointer;
    position:relative;
    display:block;
    perspective:1000px;
    border-radius:8px;
}
.card-inner{
    width: 100%;
    height: 100%;
    transition:transform .6s,box-shadow .3s ease,border-left-color .3s ease;
    transform-style:preserve-3d;
    border:1px solid rgba(0,0,0,0.1);
    border-radius:8px;
    box-sizing:border-box;
    border-left:4px solid ${corTema};
    background-color:${corFundo};
}
.interactive-card:hover .card-inner{transform:translateY(-5px);box-shadow:0 10px 20px rgba(0,0,0,.15);border-left-color:${corTema}}
.interactive-card:focus-visible{outline:3px solid ${corTema};outline-offset:4px;border-radius:8px}
.interactive-card.is-flipped .card-inner{transform:rotateY(180deg)}
.interactive-card.is-flipped:hover .card-inner{transform:rotateY(180deg) translateY(-5px)}
/* --- CORREÇÃO 4: overflow: auto para o conteúdo --- */
.card-front,.card-back{position:absolute;width:100%;height:100%;-webkit-backface-visibility:hidden;backface-visibility:hidden;border-radius:6px;padding:20px;box-sizing:border-box; overflow: auto;}
.card-back{transform:rotateY(180deg);text-align:left}
.icon{color:${corTema};margin-bottom:12px}
.card-title{font-size:1.1rem;font-weight:600;color:${corTexto};margin:0 0 8px;overflow-wrap:break-word;word-break:break-word}
.card-description{font-size:.9rem;font-weight:400;color:${corTexto};line-height:1.4;opacity:.9;overflow-wrap:break-word;word-break:break-word}
.back-title{font-size:1.1rem;font-weight:600;color:${corTexto};margin:0 0 10px;border-bottom:2px solid ${corTema};padding-bottom:5px;overflow-wrap:break-word;word-break:break-word}
.objectives-list{font-size:.85rem;font-weight:400;color:${corTexto};margin:0;padding-left:20px;opacity:.9;overflow-wrap:break-word;word-break:break-word}
.objectives-list li{margin-bottom:5px;overflow-wrap:break-word;word-break:break-word}
.card-title > *:first-child,.card-description > *:first-child,.back-title > *:first-child,.objectives-list li > *:first-child {margin-top: 0;}
.card-title > *:last-child,.card-description > *:last-child,.back-title > *:last-child,.objectives-list li > *:last-child {margin-bottom: 0;}
</style>
<div class="interactive-card-wrapper" role="region" aria-label="${ariaLabelRegiao}">
    <div id="${uniqueId}" class="interactive-card" role="button" tabindex="0" aria-pressed="false" aria-label="${ariaLabelBotao}">
        <div class="card-inner">
            <div class="card-front" aria-hidden="false">
                <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi" viewBox="0 0 16 16" role="img" aria-label="${iconeAriaLabel}"><path d="${iconePath}"/></svg></div>
                <h3 class="card-title">${tituloFrente}</h3>
                <div class="card-description">${descricaoFrente}</div>
            </div>
            <div class="card-back" aria-hidden="true">
                <h4 class="back-title">${tituloVerso}</h4>
                <ul class="objectives-list">${listaItensHTML}</ul>
            </div>
        </div>
    </div>
</div>
<script>document.addEventListener('DOMContentLoaded',()=>{const t=document.querySelector(\`#${uniqueId}\`).closest(".interactive-card-wrapper");if(t){const e=new IntersectionObserver((t,o)=>{t.forEach(t=>{if(t.isIntersecting){t.target.classList.add("is-visible");o.unobserve(t.target)}})},{threshold:.25});e.observe(t)}const e=document.getElementById("${uniqueId}");if(!e)return;const o=e.querySelector(".card-front"),n=e.querySelector(".card-back"),r=()=>{const t="true"===e.getAttribute("aria-pressed");e.setAttribute("aria-pressed",!t),e.classList.toggle("is-flipped",!t),o.setAttribute("aria-hidden",!t),n.setAttribute("aria-hidden",t),t?e.setAttribute("aria-label",e.getAttribute("aria-label").replace("Pressione para fechar","Pressione para ver")):e.setAttribute("aria-label",e.getAttribute("aria-label").replace("Pressione para ver","Pressione para fechar"))};e.addEventListener("click",r),e.addEventListener("keydown",t=>{if("Enter"===t.key||" "===t.key){t.preventDefault();r()}})});<\/script>`;
    }
});
