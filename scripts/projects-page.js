(() => {
  const projects = (window.PFW_PROJECTS || []).slice();
  if (!projects.length) return;

  const headingFor = (label) => Array.from(document.querySelectorAll('.movie-category'))
    .find(el => el.textContent.trim().toLowerCase() === label.toLowerCase());

  const rowForHeading = (heading) => {
    if (!heading) return null;
    const container = heading.closest('.container');
    let node = container ? container.nextElementSibling : heading.parentElement?.nextElementSibling;
    while (node && !node.querySelector?.('.slider-services')) node = node.nextElementSibling;
    return node?.querySelector?.('.slider-services') || null;
  };

  const findRowAfterHeading = (label) => rowForHeading(headingFor(label));

  const destroySlider = (row) => {
    if (!row || !window.jQuery || !window.jQuery.fn?.slick) return;
    const $row = window.jQuery(row);
    if ($row.hasClass('slick-initialized')) {
      try { $row.slick('unslick'); } catch (_) {}
    }
  };

  const card = (item, progress, { continueCard = false } = {}) => {
    const outer = document.createElement('div');
    outer.className = continueCard ? 'pfw-continue-card' : 'col-xs-12 col-sm-6 col-md-4';

    const link = document.createElement('a');
    link.href = item.detailUrl;
    link.className = 'pfw-project-card';
    link.setAttribute('aria-label', item.title);

    const image = document.createElement('img');
    image.className = 'movie-box';
    image.src = item.thumbnail;
    image.alt = item.title;
    image.loading = 'lazy';
    link.appendChild(image);

    if (progress && Number(progress.duration) > 0) {
      const pct = Math.max(0, Math.min(100, (Number(progress.currentTime) / Number(progress.duration)) * 100));
      const remaining = Math.max(0, Number(progress.duration) - Number(progress.currentTime));
      const mins = Math.max(1, Math.ceil(remaining / 60));

      const progressWrap = document.createElement('span');
      progressWrap.className = 'pfw-continue-progress';
      progressWrap.innerHTML = `
        <span class="pfw-progress-track"><span class="pfw-progress-fill" style="width:${pct}%"></span></span>
        <span class="pfw-progress-copy">${mins} min left</span>
      `;
      link.appendChild(progressWrap);
    }

    outer.appendChild(link);
    return outer;
  };

  const initSlider = (row) => {
    if (!row || !window.jQuery || !window.jQuery.fn?.slick) return;
    const $row = window.jQuery(row);
    $row.slick({
      dots: false,
      arrows: true,
      infinite: false,
      slidesToScroll: 1,
      slidesToShow: 5,
      accessibility: true,
      variableWidth: false,
      focusOnSelect: false,
      centerMode: false,
      responsive: [
        { breakpoint: 1150, settings: { slidesToShow: 4 } },
        { breakpoint: 900, settings: { slidesToShow: 3 } },
        { breakpoint: 741, settings: { slidesToShow: 2 } }
      ]
    });
  };

  const populate = (label, items, sortMode = 'recent') => {
    const heading = headingFor(label);
    const row = rowForHeading(heading);
    if (!heading || !row) return;

    destroySlider(row);
    row.innerHTML = '';

    if (!items.length) {
      heading.closest('.container')?.setAttribute('hidden', '');
      row.closest('.container-fluid')?.setAttribute('hidden', '');
      return;
    }

    heading.closest('.container')?.removeAttribute('hidden');
    row.closest('.container-fluid')?.removeAttribute('hidden');

    const sorted = items.slice().sort((a, b) => {
      if (sortMode === 'episode') return (a.episode || 0) - (b.episode || 0);
      return (b.publishedOrder || 0) - (a.publishedOrder || 0);
    });

    sorted.forEach(item => row.appendChild(card(item)));
    initSlider(row);
  };

  // Existing visual structure, fully driven by the central catalog.
  populate('Recently Added', projects);
  populate('Documentaries', projects.filter(item => item.type === 'documentary'));
  populate('Shotfilms', projects.filter(item => item.type === 'shortfilm'));
  populate('Shortfilms', projects.filter(item => item.type === 'shortfilm'));
  populate('Griffincraft', projects.filter(item => item.series === 'griffincraft'), 'episode');
  populate('Minecraft Mobs', projects.filter(item => item.series === 'minecraft-mobs'), 'episode');

  const inProgress = projects.map(item => {
    try {
      const progress = JSON.parse(localStorage.getItem(`pfw:watch:${item.id}`));
      const valid = progress && Number(progress.duration) > 0 && Number(progress.currentTime) > 10 && Number(progress.currentTime) < Number(progress.duration) - 15;
      return valid ? { item, progress } : null;
    } catch (_) { return null; }
  }).filter(Boolean).sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));

  document.querySelector('.pfw-continue-section')?.remove();

  if (inProgress.length) {
    const recentHeading = headingFor('Recently Added');
    const recentHeadingContainer = recentHeading?.closest('.container');
    if (recentHeadingContainer) {
      const section = document.createElement('section');
      section.className = 'container pfw-continue-section';
      section.innerHTML = `
        <div class="pfw-continue-heading-row">
          <h4 class="text-color-primary movie-category">Continue Watching</h4>
        </div>
        <div class="pfw-continue-grid"></div>
      `;
      const grid = section.querySelector('.pfw-continue-grid');
      inProgress.slice(0, 5).forEach(({ item, progress }) => grid.appendChild(card(item, progress, { continueCard: true })));
      recentHeadingContainer.parentNode.insertBefore(section, recentHeadingContainer);
    }
  }

  const style = document.createElement('style');
  style.id = 'pfw-projects-runtime-style';
  style.textContent = `
    .pfw-project-card{display:block;position:relative;border-radius:6px;overflow:visible;text-decoration:none;z-index:1}
    .pfw-project-card:hover{z-index:6}
    .pfw-project-card .movie-box{position:relative;z-index:1;transition:all 200ms ease,transform 300ms ease;outline:0 solid #fff;outline-offset:3px}
    .pfw-project-card:hover .movie-box{transform:scale(1.05);outline:3px solid #fff;z-index:6}
    .pfw-continue-section{margin-top:36px;margin-bottom:28px;padding-left:15px;padding-right:15px}
    .pfw-continue-heading-row{margin-bottom:14px}
    .pfw-continue-heading-row .movie-category{margin:0}
    .pfw-continue-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:30px}
    .pfw-continue-card{min-width:0;position:relative;overflow:visible}
    .pfw-continue-card .movie-box{width:100%;height:auto;margin:0;display:block}
    .pfw-continue-progress{display:block;padding:8px 2px 0;color:#c8cbd6;font-size:12px;line-height:1.2}
    .pfw-progress-track{display:block;width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,.24);overflow:hidden}
    .pfw-progress-fill{display:block;height:100%;background:#fff;border-radius:inherit}
    .pfw-progress-copy{display:block;margin-top:6px;opacity:.82}
    @media(max-width:1150px){.pfw-continue-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}}
    @media(max-width:900px){.pfw-continue-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}
    @media(max-width:740px){.pfw-continue-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pfw-continue-section{margin-top:26px;margin-bottom:22px}}
  `;
  document.head.appendChild(style);
})();
