// js/modules/modal.js
// Módulo Modal de Imagem (v5.9.1 - Estilo Lightbox)

GeneratorCore.registerModule('modal', {
    
    // 1. getFormData: (Nenhuma mudança aqui)
    getFormData(core) {
        const corBotao = document.getElementById('input-modal-cor-btn').value;
        const corFundo = document.getElementById('input-modal-bg').value;
        const corTexto = core.utils.getContrastColor(corFundo);
        const corBotaoTexto = core.utils.getContrastColor(corBotao);

        return {
            uniqueId: `modal-img-${Date.now().toString().slice(-6)}`,
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
        };
    },
    
    // 2. (ATUALIZADO) createTemplate: Estilos de Lightbox
    createTemplate(data) {
        const { 
            uniqueId, ariaLabel, corBotao, corBotaoTexto, corFundo, corTexto, corBorda,
            btnText, imgUrl, imgAlt, caption
        } = data;

        const triggerId = `btn-${uniqueId}`;
        const modalId = `modal-${uniqueId}`;
        const figcaptionHTML = caption ? `<figcaption class="modal-caption">${caption}</figcaption>` : '';

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
    
    <div class="modal-content">
        <figure style="margin:0;">
            <img class="modal-img" src="${imgUrl}" alt="${imgAlt}">
            ${figcaptionHTML}
        </figure>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById("${triggerId}");
    const modal = document.getElementById("${modalId}");
    const overlay = document.getElementById("overlay-${uniqueId}");
    const closeBtn = document.getElementById("close-${uniqueId}");
    
    if (!triggerBtn || !modal || !overlay || !closeBtn) return;

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