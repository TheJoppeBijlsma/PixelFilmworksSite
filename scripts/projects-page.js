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

  const destroySlider = (row) => {
    if (!row || !window.jQuery || !window.jQuery.fn?.slick) return;
    const $row = window.jQuery(row);
    if ($row.hasClass('slick-initialized')) {
      try { $row.slick('unslick'); } catch (_) {}
    }
  };

  const playSvg = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6.6v10.8L17.4 12 9 6.6Z" fill="currentColor"/>
    </svg>`;

  const card = (item, progress, { continueCard = false } = {}) => {
    const outer = document.createElement('div');
    outer.className = continueCard ? 'pfw-continue-card' : 'pfw-catalog-card';
    outer.dataset.projectId = item.id;

    const link = document.createElement('a');
    link.href = item.detailUrl;
    link.className = 'pfw-project-card';
    link.setAttribute('aria-label', item.title);

    const visual = document.createElement('span');
    visual.className = 'pfw-card-visual';

    const image = document.createElement('img');
    image.className = 'movie-box';
    image.src = item.thumbnail;
    image.alt = item.title;
    image.loading = 'lazy';
    visual.appendChild(image);

    if (continueCard && progress && Number(progress.duration) > 0) {
      const pct = Math.max(0, Math.min(100, (Number(progress.currentTime) / Number(progress.duration)) * 100));
      const remaining = Math.max(0, Number(progress.duration) - Number(progress.currentTime));
      const mins = Math.max(1, Math.ceil(remaining / 60));

      const shade = document.createElement('span');
      shade.className = 'pfw-card-shade';
      visual.appendChild(shade);

      const play = document.createElement('span');
      play.className = 'pfw-card-play';
      play.innerHTML = playSvg;
      play.setAttribute('aria-hidden', 'true');
      visual.appendChild(play);

      const bar = document.createElement('span');
      bar.className = 'pfw-progress-track pfw-progress-track-overlay';
      bar.innerHTML = `<span class="pfw-progress-fill" style="width:${pct}%"></span>`;
      visual.appendChild(bar);

      const progressCopy = document.createElement('span');
      progressCopy.className = 'pfw-progress-copy';
      progressCopy.textContent = `${mins} min left`;
      link.appendChild(visual);
      link.appendChild(progressCopy);
    } else {
      link.appendChild(visual);
    }

    outer.appendChild(link);

    if (continueCard) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'pfw-continue-remove';
      remove.setAttribute('aria-label', `Remove ${item.title} from Continue Watching`);
      remove.innerHTML = '<span aria-hidden="true">−</span>';
      remove.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        try { localStorage.removeItem(`pfw:watch:${item.id}`); } catch (_) {}
        outer.classList.add('pfw-removing');
        setTimeout(() => {
          outer.remove();
          const grid = document.querySelector('.pfw-continue-grid');
          if (grid && !grid.children.length) document.querySelector('.pfw-continue-section')?.remove();
        }, 180);
      });
      outer.appendChild(remove);
    }

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
    row.classList.remove('pfw-static-row');
    row.closest('.container-fluid')?.classList.add('pfw-dynamic-row-shell');

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

    if (sorted.length <= 5) {
      row.classList.add('pfw-static-row');
    } else {
      initSlider(row);
    }
  };

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
    .pfw-dynamic-row-shell{overflow:visible!important;max-height:none!important;padding-bottom:32px}
    .pfw-project-card{display:block;position:relative;text-decoration:none;color:inherit;z-index:1;overflow:visible}
    .pfw-card-visual{display:block;position:relative;border-radius:8px;overflow:visible;transition:transform .24s cubic-bezier(.2,.7,.2,1),filter .24s ease;transform-origin:center center}
    .pfw-card-visual .movie-box{display:block;width:100%;height:auto;margin:15px 0 0;border-radius:8px;outline:0 solid #fff;outline-offset:0;transition:transform .24s cubic-bezier(.2,.7,.2,1),outline-width .16s ease,box-shadow .24s ease;position:relative;z-index:1}
    .pfw-project-card:hover{z-index:8}
    .pfw-project-card:hover .pfw-card-visual{transform:scale(1.065)}
    .pfw-project-card:hover .movie-box{outline:4px solid #fff;box-shadow:0 22px 44px rgba(0,0,0,.5)}

    .pfw-static-row{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:30px;align-items:start;width:100%;overflow:visible!important}
    .pfw-static-row:before,.pfw-static-row:after{display:none!important}
    .pfw-static-row .pfw-catalog-card{min-width:0;width:auto!important;float:none!important;margin:0!important}

    .pfw-continue-section{margin-top:36px;margin-bottom:32px;padding-left:15px;padding-right:15px;overflow:visible}
    .pfw-continue-heading-row{margin-bottom:14px}
    .pfw-continue-heading-row .movie-category{margin:0}
    .pfw-continue-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:30px;overflow:visible}
    .pfw-continue-card{min-width:0;position:relative;overflow:visible;transition:opacity .18s ease,transform .18s ease}
    .pfw-continue-card.pfw-removing{opacity:0;transform:scale(.94)}
    .pfw-continue-card .movie-box{margin:0}
    .pfw-card-shade{position:absolute;inset:0;border-radius:8px;background:rgba(4,6,14,0);transition:background .2s ease;z-index:2;pointer-events:none}
    .pfw-card-play{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.96);color:#060714;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transform:scale(.84);transition:opacity .18s ease,transform .22s cubic-bezier(.2,.7,.2,1);z-index:4;pointer-events:none}
    .pfw-card-play:after{content:"";position:absolute;inset:-5px;border-radius:50%;border:1px solid rgba(255,255,255,.35)}
    .pfw-card-play svg{width:22px;height:22px;margin-left:2px}
    .pfw-continue-card:hover .pfw-card-shade{background:rgba(5,7,15,.16)}
    .pfw-continue-card:hover .pfw-card-play{opacity:1;transform:scale(1)}
    .pfw-continue-remove{position:absolute;right:-7px;top:-7px;width:30px;height:30px;border-radius:50%;border:2px solid #fff;background:rgba(8,10,18,.88);color:#fff;display:grid;place-items:center;font:600 20px/1 Inter,sans-serif;opacity:0;transform:scale(.82);transition:opacity .18s ease,transform .2s ease,background .18s ease;z-index:12;cursor:pointer;backdrop-filter:blur(10px)}
    .pfw-continue-remove span{transform:translateY(-1px)}
    .pfw-continue-card:hover .pfw-continue-remove,.pfw-continue-card:focus-within .pfw-continue-remove{opacity:1;transform:scale(1)}
    .pfw-continue-remove:hover{background:#fff;color:#080a12}
    .pfw-progress-track{display:block;width:100%;height:4px;border-radius:0 0 8px 8px;background:rgba(255,255,255,.28);overflow:hidden}
    .pfw-progress-track-overlay{position:absolute;left:0;right:0;bottom:0;z-index:5}
    .pfw-progress-fill{display:block;height:100%;background:#fff;border-radius:inherit}
    .pfw-progress-copy{display:block;margin-top:8px;color:#c8cbd6;font-size:12px;line-height:1.2;opacity:.84}

    @media(hover:none){
      .pfw-card-play{display:none}
      .pfw-continue-remove{opacity:1;transform:scale(.9);right:5px;top:5px}
      .pfw-project-card:hover .pfw-card-visual{transform:none}
      .pfw-project-card:hover .movie-box{outline-width:0}
    }
    @media(max-width:1150px){.pfw-static-row,.pfw-continue-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}}
    @media(max-width:900px){.pfw-static-row,.pfw-continue-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}
    @media(max-width:740px){.pfw-static-row,.pfw-continue-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pfw-continue-section{margin-top:26px;margin-bottom:22px}.pfw-card-play{width:40px;height:40px;margin:-20px 0 0 -20px}}
  `;
  document.head.appendChild(style);
})();
