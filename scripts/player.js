(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const mode = params.get('mode') || 'continue';
  const project = (window.PFW_PROJECTS || []).find(item => item.id === id);
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const controls = document.getElementById('controls');

  if (!project || !project.youtubeId) {
    loading.hidden = true;
    error.hidden = false;
    controls.hidden = true;
    return;
  }

  document.title = `Watch ${project.title} | Pixel Filmworks`;
  document.getElementById('back-link').href = project.detailUrl;
  document.getElementById('back-title').textContent = project.title;

  const key = `pfw:watch:${project.id}`;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(key)); } catch (_) {}

  const playPause = document.getElementById('play-pause');
  const rewind = document.getElementById('rewind');
  const forward = document.getElementById('forward');
  const mute = document.getElementById('mute');
  const volume = document.getElementById('volume');
  const timeline = document.getElementById('timeline');
  const timeLabel = document.getElementById('time');
  const fullscreen = document.getElementById('fullscreen');
  const restart = document.getElementById('restart');
  const shell = document.querySelector('.watch-shell');
  let player;
  let timer;
  let controlsTimer;
  let dragging = false;

  const fmt = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${m}:${String(r).padStart(2,'0')}`;
  };

  const saveProgress = () => {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    const currentTime = Number(player.getCurrentTime()) || 0;
    const duration = Number(player.getDuration()) || 0;
    if (!duration) return;
    try {
      localStorage.setItem(key, JSON.stringify({ currentTime, duration, updatedAt: Date.now(), completed: currentTime >= duration - 15 }));
    } catch (_) {}
  };

  const updateUi = () => {
    if (!player || typeof player.getDuration !== 'function') return;
    const current = Number(player.getCurrentTime()) || 0;
    const duration = Number(player.getDuration()) || 0;
    if (!dragging && duration > 0) timeline.value = Math.round((current / duration) * 1000);
    timeLabel.textContent = `${fmt(current)} / ${fmt(duration)}`;
  };

  const showControls = () => {
    document.body.classList.add('controls-visible');
    clearTimeout(controlsTimer);
    controlsTimer = setTimeout(() => {
      if (player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
        document.body.classList.remove('controls-visible');
      }
    }, 2600);
  };

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('player', {
      videoId: project.youtubeId,
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, cc_load_policy: 1 },
      events: {
        onReady: () => {
          const resume = mode !== 'restart' && saved && saved.currentTime > 10 && saved.duration > 0 && saved.currentTime < saved.duration - 15;
          player.seekTo(resume ? saved.currentTime : 0, true);
          player.playVideo();
          loading.hidden = true;
          showControls();
          updateUi();
          timer = setInterval(() => { updateUi(); saveProgress(); }, 1000);
        },
        onStateChange: (event) => {
          const playing = event.data === YT.PlayerState.PLAYING;
          playPause.textContent = playing ? '❚❚' : '▶';
          playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
          showControls();
          if (event.data === YT.PlayerState.ENDED) saveProgress();
        },
        onError: () => { loading.hidden = true; error.hidden = false; controls.hidden = true; }
      }
    });
  };

  playPause.addEventListener('click', () => {
    if (!player) return;
    player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
    showControls();
  });
  rewind.addEventListener('click', () => player && player.seekTo(Math.max(0, player.getCurrentTime() - 10), true));
  forward.addEventListener('click', () => player && player.seekTo(Math.min(player.getDuration(), player.getCurrentTime() + 10), true));
  restart.addEventListener('click', () => { if (player) { player.seekTo(0, true); player.playVideo(); } });
  mute.addEventListener('click', () => {
    if (!player) return;
    if (player.isMuted()) { player.unMute(); mute.textContent = '🔊'; } else { player.mute(); mute.textContent = '🔇'; }
  });
  volume.addEventListener('input', () => {
    if (!player) return;
    player.setVolume(Number(volume.value));
    if (Number(volume.value) > 0 && player.isMuted()) player.unMute();
  });
  timeline.addEventListener('pointerdown', () => dragging = true);
  timeline.addEventListener('input', () => {
    if (!player) return;
    const duration = player.getDuration();
    timeLabel.textContent = `${fmt((Number(timeline.value) / 1000) * duration)} / ${fmt(duration)}`;
  });
  timeline.addEventListener('change', () => {
    if (player) player.seekTo((Number(timeline.value) / 1000) * player.getDuration(), true);
    dragging = false;
    showControls();
  });
  fullscreen.addEventListener('click', async () => {
    try { if (!document.fullscreenElement) await shell.requestFullscreen(); else await document.exitFullscreen(); } catch (_) {}
  });

  ['mousemove','pointermove','touchstart','click'].forEach(name => document.addEventListener(name, showControls, { passive: true }));
  document.addEventListener('keydown', (event) => {
    if (!player) return;
    if (event.code === 'Space') { event.preventDefault(); playPause.click(); }
    if (event.code === 'ArrowLeft') player.seekTo(Math.max(0, player.getCurrentTime() - 10), true);
    if (event.code === 'ArrowRight') player.seekTo(Math.min(player.getDuration(), player.getCurrentTime() + 10), true);
    if (event.key.toLowerCase() === 'f') fullscreen.click();
    showControls();
  });
  window.addEventListener('pagehide', saveProgress);
})();
