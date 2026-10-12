(() => {
  const projects = window.PFW_PROJECTS || [];
  const path = window.location.pathname.replace(/\/+$/, "") + "/";
  const current = projects.find((item) => path === item.detailUrl || path.endsWith(item.detailUrl));
  if (!current) return;

  const storageKey = `pfw:watch:${current.id}`;
  let progress = null;
  try { progress = JSON.parse(localStorage.getItem(storageKey)); } catch (_) {}

  const playContainer = document.querySelector('.play-and-trailer-container');
  if (playContainer) {
    const oldPlay = playContainer.querySelector('.film-button-play');
    const hasProgress = progress && Number(progress.currentTime) > 10 && Number(progress.duration) > 0 && Number(progress.currentTime) < Number(progress.duration) - 15;
    const watchUrl = `/watch/?id=${encodeURIComponent(current.id)}`;

    if (oldPlay) {
      oldPlay.href = hasProgress ? `${watchUrl}&mode=continue` : `${watchUrl}&mode=restart`;
      const text = oldPlay.querySelector('.film-play-text');
      if (text) text.textContent = hasProgress ? 'CONTINUE' : 'PLAY';
    }

    if (hasProgress) {
      const remaining = Math.max(0, Number(progress.duration) - Number(progress.currentTime));
      const mins = Math.max(1, Math.ceil(remaining / 60));
      const remainingEl = document.createElement('span');
      remainingEl.className = 'watch-remaining';
      remainingEl.textContent = `${mins}m left`;
      if (oldPlay) oldPlay.appendChild(remainingEl);

      const restart = document.createElement('a');
      restart.className = 'film-button-trailer restart-button';
      restart.href = `${watchUrl}&mode=restart`;
      restart.innerHTML = '<span class="film-play-text">RESTART</span>';
      playContainer.insertBefore(restart, playContainer.children[1] || null);
    }
  }

  const score = (candidate) => {
    let points = 0;
    if (candidate.series && current.series && candidate.series === current.series) points += 8;
    if (candidate.type === current.type) points += 4;
    const sharedTags = (candidate.tags || []).filter(tag => (current.tags || []).includes(tag)).length;
    points += sharedTags * 3;
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
      const a = document.createElement('a');
      a.href = item.detailUrl;
      a.setAttribute('aria-label', item.title);
      const img = document.createElement('img');
      img.className = 'movie-box';
      img.src = item.thumbnail;
      img.alt = item.title;
      img.loading = 'lazy';
      a.appendChild(img);
      card.appendChild(a);
      slider.appendChild(card);
    });

    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.slick) {
      window.jQuery(slider).slick({
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
    }
  }
})();
