// Shared Pixel Filmworks navigation + project runtime
(() => {
  const RUNTIME = '20261013-6';

  const updateHeader = () => {
    const header = document.querySelector('.header');
    if (!header) return;
    const scrolled = window.scrollY > 10;
    header.style.background = scrolled ? '#060714' : 'rgba(0,0,0,0)';
    header.style.boxShadow = scrolled
      ? '0 26px 30px -10px rgba(0,0,0,.69)'
      : '0 26px 30px -10px rgba(0,0,0,0)';
  };

  const installLegacyOverrides = () => {
    if (document.getElementById('pfw-runtime-overrides')) return;
    const style = document.createElement('style');
    style.id = 'pfw-runtime-overrides';
    style.textContent = `
      .footer-text:before{content:"© 2021-2026 | Pixel Filmworks" !important}
      .pfw-start-over{display:inline-flex!important;align-items:center;justify-content:center;gap:8px;min-width:0!important;width:auto!important;padding:0 18px!important;background:rgba(9,11,22,.78)!important;border:1px solid rgba(255,255,255,.28)!important;color:#fff!important}
      .pfw-start-over:hover{background:rgba(255,255,255,.13)!important}
      .pfw-watch-progress-detail{width:min(450px,100%);margin-top:11px;color:rgba(255,255,255,.76);font-family:Inter,sans-serif;font-size:12px}
      .pfw-watch-progress-detail-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:6px}
      .pfw-watch-progress-detail-track{display:block;width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,.24);overflow:hidden}
      .pfw-watch-progress-detail-fill{display:block;height:100%;border-radius:inherit;background:#fff}
      @media(max-width:520px){.play-and-trailer-container{gap:7px;flex-wrap:wrap}.film-button-play,.film-button-trailer{margin-right:4px}.pfw-watch-progress-detail{margin-top:10px}}
    `;
    document.head.appendChild(style);
  };

  updateHeader();
  installLegacyOverrides();
  document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    installLegacyOverrides();
  });
  window.addEventListener('scroll', updateHeader, { passive: true });

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const isProjectsIndex = path === '/projects';
  const isProjectDetail = /^\/projects\/(films|series)\/.+/.test(path);
  if (!isProjectsIndex && !isProjectDetail) return;

  const initSlider = (slider) => {
    if (!slider || !window.jQuery || !window.jQuery.fn?.slick) return;
    const $slider = window.jQuery(slider);
    if ($slider.hasClass('slick-initialized')) {
      try { $slider.slick('unslick'); } catch (_) {}
    }
    $slider.slick({
      dots: false,
      arrows: true,
      infinite: false,
      slidesToScroll: 1,
      slidesToShow: 5,
      accessibility: true,
      variableWidth: false,
      centerMode: false,
      responsive: [
        { breakpoint: 1100, settings: { slidesToShow: 4 } },
        { breakpoint: 850, settings: { slidesToShow: 3 } },
        { breakpoint: 620, settings: { slidesToShow: 2 } }
      ]
    });
  };

  const enhanceProjectDetail = () => {
    const projects = window.PFW_PROJECTS || [];
    const normalizedPath = `${path}/`;
    const current = projects.find(item => normalizedPath === item.detailUrl || normalizedPath.endsWith(item.detailUrl));
    if (!current) return;

    let progress = null;
    try { progress = JSON.parse(localStorage.getItem(`pfw:watch:${current.id}`)); } catch (_) {}

    const playContainer = document.querySelector('.play-and-trailer-container');
    const play = playContainer?.querySelector('.film-button-play');
    const hasProgress = progress && Number(progress.currentTime) > 10 && Number(progress.duration) > 0 && Number(progress.currentTime) < Number(progress.duration) - 15;
    const watchUrl = `/watch/?id=${encodeURIComponent(current.id)}`;

    if (play) {
      play.href = hasProgress ? `${watchUrl}&mode=continue` : `${watchUrl}&mode=restart`;
      const text = play.querySelector('.film-play-text');
      if (text) text.textContent = hasProgress ? 'CONTINUE' : 'PLAY';
    }

    document.querySelector('.pfw-watch-progress-detail')?.remove();
    playContainer?.querySelector('.pfw-start-over')?.remove();

    if (hasProgress && playContainer) {
      const currentTime = Number(progress.currentTime);
      const duration = Number(progress.duration);
      const remaining = Math.max(0, duration - currentTime);
      const mins = Math.max(1, Math.ceil(remaining / 60));
      const pct = Math.max(0, Math.min(100, (currentTime / duration) * 100));

      const restart = document.createElement('a');
      restart.className = 'film-button-trailer pfw-start-over';
      restart.href = `${watchUrl}&mode=restart`;
      restart.innerHTML = '<span aria-hidden="true" style="font-size:17px;line-height:1">↺</span><span class="film-play-text">START OVER</span>';
      playContainer.insertBefore(restart, playContainer.children[1] || null);

      const progressBlock = document.createElement('div');
      progressBlock.className = 'pfw-watch-progress-detail';
      progressBlock.innerHTML = `
        <div class="pfw-watch-progress-detail-row"><span>Continue watching</span><span>${mins} min left</span></div>
        <span class="pfw-watch-progress-detail-track"><span class="pfw-watch-progress-detail-fill" style="width:${pct}%"></span></span>
      `;
      playContainer.parentNode.insertBefore(progressBlock, playContainer.nextSibling);
    }

    const score = (candidate) => {
      let points = 0;
      if (candidate.series && current.series && candidate.series === current.series) points += 10;
      if (candidate.type === current.type) points += 5;
      points += (candidate.tags || []).filter(tag => (current.tags || []).includes(tag)).length * 3;
      if (candidate.year === current.year) points += 1;
      points += (candidate.publishedOrder || 0) / 100;
      return points;
    };

    const recommendations = projects
      .filter(item => item.id !== current.id)
      .map(item => ({ item, score: score(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(entry => entry.item);

    const slider = document.querySelector('.slider-services');
    if (slider && recommendations.length) {
      if (window.jQuery && window.jQuery(slider).hasClass('slick-initialized')) {
        try { window.jQuery(slider).slick('unslick'); } catch (_) {}
      }
      slider.innerHTML = '';
      recommendations.forEach(item => {
        const card = document.createElement('div');
        card.className = 'col-xs-12 col-sm-6 col-md-4';
        const link = document.createElement('a');
        link.href = item.detailUrl;
        link.setAttribute('aria-label', item.title);
        const img = document.createElement('img');
        img.className = 'movie-box';
        img.src = item.thumbnail;
        img.alt = item.title;
        img.loading = 'lazy';
        link.appendChild(img);
        card.appendChild(link);
        slider.appendChild(card);
      });
      initSlider(slider);
    }
  };

  loadScript(`/data/projects.js?v=${RUNTIME}`)
    .then(() => isProjectDetail ? enhanceProjectDetail() : loadScript(`/scripts/projects-page.js?v=${RUNTIME}`))
    .catch(error => console.error('[Pixel Filmworks] Project runtime failed', error));
})();
