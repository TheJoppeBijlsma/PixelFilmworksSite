// Shared Pixel Filmworks navigation + progressive project enhancements
(() => {
  const updateHeader = () => {
    const header = document.querySelector('.header');
    if (!header) return;
    const scrolled = window.scrollY > 10;
    header.style.background = scrolled ? '#060714' : 'rgba(0,0,0,0)';
    header.style.boxShadow = scrolled
      ? '0 26px 30px -10px rgba(0,0,0,.69)'
      : '0 26px 30px -10px rgba(0,0,0,0)';
  };

  updateHeader();
  document.addEventListener('DOMContentLoaded', updateHeader);
  window.addEventListener('scroll', updateHeader, { passive: true });

  const loadScript = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const isProjectsIndex = path === '/projects';
  const isProjectDetail = /^\/projects\/(films|series)\/.+/.test(path);
  if (!isProjectsIndex && !isProjectDetail) return;

  if (isProjectDetail) {
    const style = document.createElement('style');
    style.textContent = `
      .watch-remaining{display:block;font-size:10px;line-height:1;letter-spacing:.3px;margin-left:8px;opacity:.72;text-transform:none}
      .restart-button{min-width:134px;width:auto;padding:0 18px}
      @media(max-width:520px){.play-and-trailer-container{gap:6px}.film-button-play,.film-button-trailer{margin-right:4px}.watch-remaining{display:none}}
    `;
    document.head.appendChild(style);
  }

  loadScript('/data/projects.js')
    .then(() => loadScript(isProjectsIndex ? '/scripts/projects-page.js' : '/scripts/project-experience.js'))
    .catch(() => {});
})();
