// Shared Pixel Filmworks navigation + project runtime
(() => {
  const RUNTIME = '20261013-3';

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
      .watch-remaining{display:block;font-size:10px;line-height:1;letter-spacing:.3px;margin-left:8px;opacity:.72;text-transform:none}
      .restart-button{min-width:134px;width:auto;padding:0 18px}
      @media(max-width:520px){.play-and-trailer-container{gap:6px}.film-button-play,.film-button-trailer{margin-right:4px}.watch-remaining{display:none}}
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
    if (!current) {
      console.warn('[Pixel Filmworks] Project not found in catalog for', normalizedPath);
      return;
    }

    let progress = null;
    try { progress = JSON.parse(localStorage.getItem(`pfw:watch:${current.id}`)); } catch (_) {}

    const playContainer = document.querySelector('.play-and-trailer-container');
    const oldPlay = playContainer?.querySelector('.film-button-play');
    const hasProgress = progress && Number(progress.currentTime) > 10 && Number(progress.duration) > 0 && Number(progress.currentTime) < Number(progress.duration) - 15;
    const watchUrl = `/watch/?id=${encodeURIComponent(current.id)}`;

    if (oldPlay) {
      oldPlay.href = hasProgress ? `${watchUrl}&mode=continue` : `${watchUrl}&mode=restart`;
      const text = oldPlay.querySelector('.film-play-text');
      if (text) text.textContent = hasProgress ? 'CONTINUE' : 'PLAY';
    }

    if (hasProgress && playContainer && !playContainer.querySelector('.restart-button')) {
      const remaining = Math.max(0, Number(progress.duration) - Number(progress.currentTime));
      const mins = Math.max(1, Math.ceil(remaining / 60));
      if (oldPlay && !oldPlay.querySelector('.watch-remaining')) {
        const remainingEl = document.createElement('span');
        remainingEl.className = 'watch-remaining';
        remainingEl.textContent = `${mins}m left`;
        oldPlay.appendChild(remainingEl);
      }
      const restart = document.createElement('a');
      restart.className = 'film-button-trailer restart-button';
      restart.href = `${watchUrl}&mode=restart`;
      restart.innerHTML = '<span class="film-play-text">RESTART</span>';
      playContainer.insertBefore(restart, playContainer.children[1] || null);
    }

    const score = (candidate) => {
      let points = 0;
      if (candidate.series && current.series && candidate.series === current.series) points += 8;
      if (candidate.type === current.type) points += 4;
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
    .then(() => {
      if (isProjectDetail) {
        enhanceProjectDetail();
      } else {
        return loadScript(`/scripts/projects-page.js?v=${RUNTIME}`);
      }
    })
    .catch(error => console.error('[Pixel Filmworks] Project runtime failed', error));
})();
