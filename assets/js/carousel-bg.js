/**
 * carousel-bg.js
 * --------------
 * Carrossel de fundo com crossfade entre imagens e vídeos do Cloudinary.
 *
 * COMO USAR — adicione suas mídias aqui:
 *   { type: 'image', url: 'https://...' }
 *   { type: 'video', url: 'https://...mp4' }
 *
 * FORMATO DE VÍDEO RECOMENDADO:
 *   Use .mp4 (H.264). É o único formato que toca em todos os navegadores,
 *   incluindo Safari no iOS, sem precisar de interação do usuário.
 *   O Cloudinary entrega .mp4 por padrão — basta colocar a URL direta.
 *
 * DICA CLOUDINARY para vídeos:
 *   Se a URL original for .mov ou outro formato, substitua a extensão por .mp4
 *   na URL do Cloudinary e ele converte automaticamente:
 *   Ex: /v123/meu-video.mp4  ← mesmo que o upload tenha sido .mov
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
  // Adicione mais itens abaixo — imagens ou vídeos:
  // {
  //   type: 'image',
  //   url:  'https://res.cloudinary.com/SEU_CLOUD/image/upload/v.../nome.jpg',
  // },
  // {
  //   type: 'video',
  //   url:  'https://res.cloudinary.com/SEU_CLOUD/video/upload/v.../nome.mp4',
  // },
];

// Tempo (em ms) que cada slide fica visível antes de dissolver para o próximo.
// O dissolve em si dura 1.6s (definido no CSS), então coloque pelo menos 3000.
const SLIDE_DURATION_MS = 6000;

// Ativar os pontinhos indicadores de progresso? true | false
const SHOW_DOTS = true;

// ================================================================
//  ▶ LÓGICA DO CARROSSEL
// ================================================================

/**
 * Cria e injeta o carrossel dentro de um elemento-pai.
 *
 * @param {HTMLElement} parent  — o elemento que receberá o fundo (#tela-login ou #main-app)
 * @param {Array}       media   — array de { type, url }
 * @param {boolean}     dots    — exibir indicadores?
 * @returns {{ destroy: Function }}  — retorna um objeto com método para destruir o carrossel
 */
function createCarousel(parent, media, dots) {
  // Se não houver mídias, não faz nada — evita erro silencioso
  if (!media || media.length === 0) return { destroy: () => {} };

  // ── 1. Criar o container do carrossel ──────────────────────────
  const carousel = document.createElement('div');
  carousel.className = 'bg-carousel';

  // ── 2. Criar cada slide ────────────────────────────────────────
  const slides = media.map((item, index) => {
    const slide = document.createElement('div');
    slide.className = 'bg-carousel__slide';
    // O primeiro slide começa visível
    if (index === 0) slide.classList.add('active');

    if (item.type === 'video') {
      // Para vídeos: muted + autoplay + loop + playsinline são obrigatórios
      // para funcionar no iOS sem precisar de toque do usuário
      const video = document.createElement('video');
      video.src            = item.url;
      video.muted          = true;
      video.autoplay       = true;
      video.loop           = true;
      video.playsInline    = true; // sem fullscreen automático no iOS
      video.setAttribute('aria-hidden', 'true'); // decorativo, fora da leitura de tela
      video.setAttribute('tabindex', '-1');
      slide.appendChild(video);
    } else {
      // Para imagens: simples
      const img = document.createElement('img');
      img.src = item.url;
      img.alt = ''; // vazio = decorativo para leitores de tela
      img.setAttribute('aria-hidden', 'true');
      slide.appendChild(img);
    }

    carousel.appendChild(slide);
    return slide;
  });

  // ── 3. Criar o overlay escuro ──────────────────────────────────
  const overlay = document.createElement('div');
  overlay.className = 'bg-carousel-overlay';

  // ── 4. Criar os pontinhos (se habilitados) ─────────────────────
  let dotEls = [];
  let dotsContainer = null;
  if (dots && media.length > 1) {
    dotsContainer = document.createElement('div');
    dotsContainer.className = 'bg-carousel-dots';

    dotEls = media.map((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'bg-carousel-dots__dot';
      if (index === 0) dot.classList.add('active');
      dotsContainer.appendChild(dot);
      return dot;
    });

    parent.appendChild(dotsContainer);
  }

  // ── 5. Inserir na DOM — ANTES do primeiro filho do parent ──────
  // Assim o carrossel fica atrás do conteúdo existente (login-card, etc.)
  parent.insertBefore(overlay, parent.firstChild);
  parent.insertBefore(carousel, parent.firstChild);

  // ── 6. Lógica de avanço de slide ──────────────────────────────
  let currentIndex = 0;

  function goToSlide(nextIndex) {
    // Remove active do slide atual
    slides[currentIndex].classList.remove('active');
    if (dotEls.length) dotEls[currentIndex].classList.remove('active');

    currentIndex = nextIndex;

    // Ativa o próximo
    slides[currentIndex].classList.add('active');
    if (dotEls.length) dotEls[currentIndex].classList.add('active');

    // Se for vídeo, força o play (alguns browsers pausam vídeos não visíveis)
    const videoEl = slides[currentIndex].querySelector('video');
    if (videoEl) {
      // A Promise do play() pode rejeitar — capturamos silenciosamente
      videoEl.play().catch(() => {});
    }
  }

  // Só inicia o timer se houver mais de 1 mídia
  let timer = null;
  if (media.length > 1) {
    timer = setInterval(() => {
      const next = (currentIndex + 1) % media.length;
      goToSlide(next);
    }, SLIDE_DURATION_MS);
  }

  // ── 7. API de limpeza ──────────────────────────────────────────
  // Útil se você precisar trocar de rota ou desmontar a tela
  function destroy() {
    clearInterval(timer);
    carousel.remove();
    overlay.remove();
    if (dotsContainer) dotsContainer.remove();
  }

  return { destroy };
}

// ================================================================
//  ▶ INICIALIZAÇÃO
// ================================================================

/**
 * Inicializa o carrossel em ambas as telas.
 * Chame esta função uma única vez após o DOM estar pronto.
 *
 * Se a tela de login ou o painel principal não existirem no DOM
 * no momento da chamada, eles são ignorados silenciosamente.
 */
export function initBackgroundCarousel() {
  const telaLogin = document.getElementById('tela-login');
  const mainApp   = document.getElementById('main-app');

  if (telaLogin) {
    createCarousel(telaLogin, CAROUSEL_MEDIA, SHOW_DOTS);
  }

  if (mainApp) {
    createCarousel(mainApp, CAROUSEL_MEDIA, SHOW_DOTS);
  }
}
