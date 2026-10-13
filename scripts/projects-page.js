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
      <path d="M8 5v14l11-7z" fill="currentColor"/>
    </svg>`;

  const card = (item, progress, { continueCard = false } = {}) => {
    const outer = document.createElement('div');
    outer.className = continueCard ? 'pfw-continue-card' : 'col-xs-12 col-sm-6 col-md-4 pfw-catalog-card';
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

    const shade = document.createElement('span');
    shade.className = 'pfw-card-shade';
    visual.appendChild(shade);

    const play = document.createElement('span');
    play.className = 'pfw-card-play';
    play.innerHTML = playSvg;
    play.setAttribute('aria-hidden', 'true');
    visual.appendChild(play);

    link.appendChild(visual);

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
    .pfw-project-card{display:block;position:relative;text-decoration:none;color:inherit;z-index:1;overflow:visible}
    .pfw-card-visual{display:block;position:relative;border-radius:8px;overflow:visible;transition:transform .24s cubic-bezier(.2,.7,.2,1),filter .24s ease;transform-origin:center center}
    .pfw-card-visual .movie-box{display:block;width:100%;height:auto;margin-top:15px;border-radius:8px;outline:0 solid #fff;outline-offset:0;transition:transform .24s cubic-bezier(.2,.7,.2,1),outline-width .16s ease,box-shadow .24s ease;position:relative;z-index:1}
    .pfw-card-shade{position:absolute;inset:15px 0 0;border-radius:8px;background:rgba(4,6,14,0);transition:background .2s ease;z-index:2;pointer-events:none}
    .pfw-card-play{position:absolute;left:50%;top:calc(50% + 7px);width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#070914;box-shadow:0 8px 24px rgba(0,0,0,.34);opacity:0;transform:scale(.78);transition:opacity .18s ease,transform .22s cubic-bezier(.2,.7,.2,1);z-index:4;pointer-events:none}
    .pfw-card-play svg{width:27px;height:27px;margin-left:3px}
    .pfw-project-card:hover{z-index:8}
    .pfw-project-card:hover .pfw-card-visual{transform:scale(1.075);filter:brightness(1.02)}
    .pfw-project-card:hover .movie-box{outline:4px solid #fff;box-shadow:0 20px 42px rgba(0,0,0,.48)}
    .pfw-project-card:hover .pfw-card-shade{background:rgba(5,7,15,.18)}
    .pfw-project-card:hover .pfw-card-play{opacity:1;transform:scale(1)}

    .pfw-continue-section{margin-top:36px;margin-bottom:28px;padding-left:15px;padding-right:15px;overflow:visible}
    .pfw-continue-heading-row{margin-bottom:14px}
    .pfw-continue-heading-row .movie-category{margin:0}
    .pfw-continue-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:30px;overflow:visible}
    .pfw-continue-card{min-width:0;position:relative;overflow:visible;transition:opacity .18s ease,transform .18s ease}
    .pfw-continue-card.pfw-removing{opacity:0;transform:scale(.94)}
    .pfw-continue-card .movie-box{margin:0}
    .pfw-continue-card .pfw-card-shade{inset:0}
    .pfw-continue-card .pfw-card-play{top:50%}
    .pfw-continue-remove{position:absolute;right:-10px;top:-10px;width:38px;height:38px;border-radius:50%;border:3px solid #fff;background:rgba(8,10,18,.82);color:#fff;display:grid;place-items:center;font:700 26px/1 Inter,sans-serif;opacity:0;transform:scale(.78);transition:opacity .18s ease,transform .2s ease,background .18s ease;z-index:12;cursor:pointer;backdrop-filter:blur(10px)}
    .pfw-continue-remove span{transform:translateY(-1px)}
    .pfw-continue-card:hover .pfw-continue-remove,.pfw-continue-card:focus-within .pfw-continue-remove{opacity:1;transform:scale(1)}
    .pfw-continue-remove:hover{background:#fff;color:#080a12}
    .pfw-continue-progress{display:block;padding:8px 2px 0;color:#c8cbd6;font-size:12px;line-height:1.2}
    .pfw-progress-track{display:block;width:100%;height:4px;border-radius:99px;background:rgba(255,255,255,.24);overflow:hidden}
    .pfw-progress-fill{display:block;height:100%;background:#fff;border-radius:inherit}
    .pfw-progress-copy{display:block;margin-top:6px;opacity:.82}

    @media(hover:none){
      .pfw-card-play{display:none}
      .pfw-continue-remove{opacity:1;transform:scale(.9);right:5px;top:5px}
      .pfw-project-card:hover .pfw-card-visual{transform:none}
      .pfw-project-card:hover .movie-box{outline-width:0}
    }
    @media(max-width:1150px){.pfw-continue-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:24px}}
    @media(max-width:900px){.pfw-continue-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}
    @media(max-width:740px){.pfw-continue-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pfw-continue-section{margin-top:26px;margin-bottom:22px}.pfw-card-play{width:50px;height:50px;margin:-25px 0 0 -25px}}
  `;
  document.head.appendChild(style);
})();
