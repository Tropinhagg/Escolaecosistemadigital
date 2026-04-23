/**
 * carousel-bg.js
 * ==============
 * Carrossel de fundo com crossfade entre imagens e vídeos do Cloudinary.
 *
 * ARQUITETURA
 * -----------
 * Um único container #bg-carousel é injetado diretamente no <body>
 * (antes de qualquer outro elemento), fixado com position: fixed.
 * Isso significa que ele é completamente independente de qual tela
 * está visível — login, painel principal, tela de simulado, etc.
 * O fundo nunca some ao trocar de tela.
 *
 * COMO ADICIONAR MÍDIAS
 * ---------------------
 * Edite o array CAROUSEL_MEDIA abaixo. Duas regras simples:
 *   - Imagens: qualquer formato suportado pelo browser (jpg, webp, png)
 *   - Vídeos:  SEMPRE use .mp4 (H.264). É o único formato que o Safari
 *              no iOS toca com autoplay sem interação do usuário.
 *              O Cloudinary converte qualquer upload para .mp4
 *              automaticamente — basta trocar a extensão na URL,
 *              mesmo que o arquivo original seja .mov ou .webm.
 */

// ================================================================
//  ▶ CONFIGURE SUAS MÍDIAS AQUI
// ================================================================
const CAROUSEL_MEDIA = [
  {
    type: 'image',
    url:  'https://res.cloudinary.com/dnq9s0g7v/image/upload/v1776900361/michael-afonso-rR95ZJbFE14-unsplash_cxilmw.jpg',
  },
  {
    type: 'image',
    url:  'https://res.cloudinary.com/dnq9s0g7v/image/upload/v1776899666/kay-mayer-RfGk36Fsd8g-unsplash_cpamq6.jpg',
  },
  // Adicione mais itens abaixo:
  // {
  //   type: 'image',
  //   url:  'https://res.cloudinary.com/dnq9s0g7v/image/upload/v.../outra-foto.jpg',
  // },
  // {
  //   type: 'video',
  //   url:  'https://res.cloudinary.com/dnq9s0g7v/video/upload/v.../video.mp4',
  // },
];

// Tempo (ms) que cada slide permanece visível antes do dissolve.
// O dissolve em si dura 1.8s (definido no CSS), então use no mínimo 4000.
const SLIDE_DURATION_MS = 7000;

// Mostrar bolinhas indicadoras de progresso?
const SHOW_DOTS = true;

// ================================================================
//  ▶ CONSTRUÇÃO DO DOM
// ================================================================

function buildCarousel() {
  // Proteção contra dupla inicialização (ex: hot reload durante dev)
  if (document.getElementById('bg-carousel')) return;

  // Guard: sem mídias não há nada a fazer
  if (!CAROUSEL_MEDIA || CAROUSEL_MEDIA.length === 0) return;

  // ── 1. Criar o container principal ────────────────────────────
  const carousel = document.createElement('div');
  carousel.id = 'bg-carousel';

  // ── 2. Criar um slide para cada item da lista ─────────────────
  const slides = CAROUSEL_MEDIA.map((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'bgc-slide';

    // O primeiro slide começa visível imediatamente
    if (index === 0) slide.classList.add('active');

    if (item.type === 'video') {
      // muted + autoplay + playsinline são obrigatórios para iOS.
      // Sem eles, o Safari bloqueia o autoplay silenciosamente.
      const video = document.createElement('video');
      video.src         = item.url;
      video.muted       = true;
      video.autoplay    = true;
      video.loop        = true;
      video.playsInline = true;
      // aria-hidden: este elemento é puramente decorativo
      video.setAttribute('aria-hidden', 'true');
      video.setAttribute('tabindex', '-1');
      slide.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = ''; // alt vazio = decorativo para leitores de tela
      img.setAttribute('aria-hidden', 'true');
      // Lazy loading para slides que não são o primeiro,
      // para não atrasar o carregamento inicial da página
      if (index > 0) img.loading = 'lazy';
      slide.appendChild(img);
    }

    carousel.appendChild(slide);
    return slide;
  });

  // ── 3. Criar o overlay escuro semitransparente ─────────────────
  const overlay = document.createElement('div');
  overlay.id = 'bg-carousel-overlay';

  // ── 4. Criar os pontinhos indicadores (opcional) ───────────────
  let dotsContainer = null;
  let dotEls = [];

  if (SHOW_DOTS && CAROUSEL_MEDIA.length > 1) {
    dotsContainer = document.createElement('div');
    dotsContainer.id = 'bg-carousel-dots';

    dotEls = CAROUSEL_MEDIA.map((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'bgc-dot';
      if (index === 0) dot.classList.add('active');
      dotsContainer.appendChild(dot);
      return dot;
    });
  }

  // ── 5. Injetar no <body> antes de todos os outros elementos ────
  // insertBefore(novoElemento, referência) insere ANTES da referência.
  // body.firstChild é o primeiro elemento existente (normalmente #tela-login).
  // O carrossel e overlay ficam fisicamente no início do DOM, mas os
  // z-indexes do CSS fazem o empilhamento correto.
  document.body.insertBefore(overlay, document.body.firstChild);
  document.body.insertBefore(carousel, document.body.firstChild);

  // Os pontinhos vão no final do body para não interferir no fluxo
  if (dotsContainer) {
    document.body.appendChild(dotsContainer);
  }

  // ── 6. Lógica de rotação ───────────────────────────────────────
  // Com apenas 1 mídia, não há o que rotacionar
  if (CAROUSEL_MEDIA.length <= 1) return;

  let currentIndex = 0;

  function goToSlide(nextIndex) {
    // Remove o estado ativo do slide e ponto atuais
    slides[currentIndex].classList.remove('active');
    if (dotEls.length) dotEls[currentIndex].classList.remove('active');

    currentIndex = nextIndex;

    // Ativa o próximo
    slides[currentIndex].classList.add('active');
    if (dotEls.length) dotEls[currentIndex].classList.add('active');

    // Para vídeos: força o play. Alguns browsers pausam vídeos
    // que ficam com opacity: 0, então precisamos reiniciar.
    const videoEl = slides[currentIndex].querySelector('video');
    if (videoEl) {
      // .play() retorna uma Promise. A rejeição é silenciosa para
      // não poluir o console quando o browser bloqueia o autoplay.
      videoEl.play().catch(() => {});
    }
  }

  // O módulo aritmético (% length) faz o índice voltar para 0
  // automaticamente após o último slide — loop infinito sem if.
  setInterval(() => {
    goToSlide((currentIndex + 1) % CAROUSEL_MEDIA.length);
  }, SLIDE_DURATION_MS);
}

// ================================================================
//  ▶ PONTO DE ENTRADA EXPORTADO
// ================================================================

/**
 * Inicializa o carrossel de fundo.
 *
 * Deve ser chamada UMA ÚNICA VEZ no início do main.js,
 * antes de qualquer outra lógica da aplicação.
 *
 * Módulos ES já executam após o DOM estar pronto, mas
 * adicionamos a verificação de readyState por segurança.
 */
export function initBackgroundCarousel() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCarousel);
  } else {
    buildCarousel();
  }
}
