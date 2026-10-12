(() => {
  const projects = (window.PFW_PROJECTS || []).slice();
  if (!projects.length) return;

  const findRowAfterHeading = (label) => {
    const headings = Array.from(document.querySelectorAll('.movie-category'));
    const heading = headings.find(el => el.textContent.trim().toLowerCase() === label.toLowerCase());
    if (!heading) return null;
    const container = heading.closest('.container');
    let node = container ? container.nextElementSibling : heading.parentElement?.nextElementSibling;
    while (node && !node.querySelector?.('.slider-services')) node = node.nextElementSibling;
    return node?.querySelector?.('.slider-services') || null;
  };

  const card = (item, progress) => {
    const outer = document.createElement('div');
    outer.className = 'col-xs-12 col-sm-6 col-md-4';
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

    if (progress && progress.duration > 0) {
      const pct = Math.max(0, Math.min(100, (progress.currentTime / progress.duration) * 100));
      const bar = document.createElement('span');
      bar.className = 'pfw-progress-track';
      bar.innerHTML = `<span class="pfw-progress-fill" style="width:${pct}%"></span>`;
      link.appendChild(bar);
    }

    outer.appendChild(link);
    return outer;
  };

  const initSlider = (row) => {
    if (!row || !window.jQuery || !window.jQuery.fn?.slick) return;
    const $row = window.jQuery(row);
    if ($row.hasClass('slick-initialized')) {
      try { $row.slick('unslick'); } catch (_) {}
    }
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

  const recentRow = findRowAfterHeading('Recently Added');
  if (recentRow) {
    recentRow.innerHTML = '';
    projects
      .sort((a, b) => (b.publishedOrder || 0) - (a.publishedOrder || 0))
      .forEach(item => recentRow.appendChild(card(item)));
    initSlider(recentRow);
  }

  const inProgress = projects.map(item => {
    try {
      const progress = JSON.parse(localStorage.getItem(`pfw:watch:${item.id}`));
      const valid = progress && Number(progress.duration) > 0 && Number(progress.currentTime) > 10 && Number(progress.currentTime) < Number(progress.duration) - 15;
      return valid ? { item, progress } : null;
    } catch (_) { return null; }
  }).filter(Boolean).sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0));

  if (inProgress.length && recentRow) {
    const recentSection = recentRow.closest('.container-fluid');
    const recentHeading = Array.from(document.querySelectorAll('.movie-category')).find(el => el.textContent.trim().toLowerCase() === 'recently added');
    const recentHeadingContainer = recentHeading?.closest('.container');

    const headingContainer = document.createElement('div');
    headingContainer.className = 'container pfw-continue-heading';
    headingContainer.innerHTML = '<h4 class="text-color-primary movie-category">Continue Watching</h4>';

    const fluid = document.createElement('div');
    fluid.className = 'container-fluid pfw-continue-section';
    fluid.innerHTML = '<div class="container"><div class="row"><div class="slider-services pfw-continue-row"></div></div></div>';
    const row = fluid.querySelector('.pfw-continue-row');
    inProgress.forEach(({ item, progress }) => row.appendChild(card(item, progress)));

    const insertBefore = recentHeadingContainer || recentSection;
    insertBefore.parentNode.insertBefore(headingContainer, insertBefore);
    insertBefore.parentNode.insertBefore(fluid, insertBefore);
    initSlider(row);
  }

  const style = document.createElement('style');
  style.textContent = `
    .pfw-project-card{display:block;position:relative;border-radius:6px;overflow:hidden}
    .pfw-progress-track{position:absolute;left:5%;right:5%;bottom:8px;height:4px;border-radius:99px;background:rgba(255,255,255,.28);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.35)}
    .pfw-progress-fill{display:block;height:100%;background:#fff;border-radius:inherit}
    .pfw-continue-heading{margin-top:18px}
    .pfw-continue-section{margin-bottom:12px}
  `;
  document.head.appendChild(style);
})();
