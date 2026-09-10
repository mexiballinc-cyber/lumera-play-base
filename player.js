// player.js - Reproductor de Video Avanzado para Lumera
// Exclusivo para reproducción: multiaudio, subtítulos, autocierre de controles y encadenado de episodios.

import { state, updateState } from './state.js';

let controlsTimeout = null;

/**
 * Renderiza la pantalla del reproductor de video.
 * @param {HTMLElement} container - Contenedor del DOM donde se renderizará el reproductor.
 * @param {Object} customOptions - Opciones dinámicas opcionales.
 */
export function renderPlayer(container, customOptions = null) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  // Obtener datos desde las opciones o desde el estado global
  const playerData = customOptions || state.player || {};
  const currentMedia = playerData.currentMedia || {};
  const episodesList = playerData.episodesList || currentMedia.episodes || [];
  const currentIndex = playerData.currentIndex ?? 0;

  const isSeries = episodesList.length > 0;
  const videoUrl = currentMedia.videoUrl || currentMedia.url || (episodesList[currentIndex] ? episodesList[currentIndex].videoUrl || episodesList[currentIndex].url : '');
  const mediaTitle = currentMedia.title || 'Lumera Content';
  const episodeTitle = isSeries && episodesList[currentIndex] ? (episodesList[currentIndex].title || `Episodio ${currentIndex + 1}`) : '';

  const hasNextEpisode = isSeries && currentIndex < episodesList.length - 1;

  // Idiomas disponibles para audio y subtítulos
  const availableAudios = playerData.availableAudios || currentMedia.availableAudios || ['es', 'en'];
  const availableSubtitles = playerData.availableSubtitles || currentMedia.availableSubtitles || ['off', 'es', 'en'];

  container.innerHTML = `
    <div id="playerWrapper" class="player-wrapper">
      <video id="mainVideo" class="main-video" autoplay playsinline crossorigin="anonymous">
        <source src="${videoUrl}" type="video/mp4">
        Tu navegador no soporta la reproducción de video HTML5.
      </video>

      <!-- OVERLAY DE CONTROLES -->
      <div id="playerControls" class="player-controls">
        
        <!-- HEADER SUPERIOR -->
        <div class="player-header">
          <div class="player-header-left">
            <button id="btnPlayerBack" class="player-icon-btn" title="Volver">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="player-title-box">
              <h3 class="player-main-title">${mediaTitle}</h3>
              ${isSeries ? `<span class="player-episode-subtitle">T1:E${currentIndex + 1} - ${episodeTitle}</span>` : ''}
            </div>
          </div>

          <div class="player-header-right">
            ${isSeries ? `<button id="btnToggleEpisodes" class="player-btn-secondary">Episodios ☰</button>` : ''}
          </div>
        </div>

        <!-- CONTROLES CENTRALES -->
        <div class="player-center-controls">
          <button id="btnRewind10" class="player-icon-btn center-btn" title="Retroceder 10s">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="9" y="15" font-size="7" fill="currentColor" font-weight="bold">10</text></svg>
          </button>

          <button id="btnPlayPause" class="player-play-btn" title="Reproducir / Pausar">
            <svg id="svgPlay" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg id="svgPause" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>

          <button id="btnForward10" class="player-icon-btn center-btn" title="Adelantar 10s">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="9" y="15" font-size="7" fill="currentColor" font-weight="bold">10</text></svg>
          </button>

          ${hasNextEpisode ? `
            <button id="btnNextEpisode" class="player-btn-next" title="Siguiente Episodio">
              Siguiente Ep. ⏭
            </button>
          ` : ''}
        </div>

        <!-- BARRA DE PROGRESO E INFERIOR -->
        <div class="player-bottom-controls">
          <div class="progress-bar-container">
            <span id="currentTimeText" class="time-text">00:00</span>
            <input type="range" id="videoProgress" class="player-slider" value="0" min="0" max="100" step="0.1">
            <span id="durationTimeText" class="time-text">00:00</span>
          </div>

          <div class="player-bottom-bar">
            <div class="player-audio-sub-controls">
              <!-- Selector de Audios -->
              <button id="btnAudioMenu" class="player-icon-btn" title="Audio">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>

              <!-- Selector de Subtítulos -->
              <button id="btnSubtitlesMenu" class="player-icon-btn" title="Subtítulos (CC)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h3M7 11h5M14 15h3M14 11h1"/></svg>
              </button>
            </div>

            <div class="player-fullscreen-controls">
              <button id="btnFullscreen" class="player-icon-btn" title="Pantalla Completa">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- MODAL / MENÚ DROPDOWN DE AUDIO Y SUBTÍTULOS -->
      <div id="trackSelectorModal" class="player-track-modal hidden">
        <div class="modal-track-content">
          <div class="track-column">
            <h4>Audio</h4>
            <div id="audioOptionsList" class="track-options-list"></div>
          </div>
          <div class="track-column">
            <h4>Subtítulos</h4>
            <div id="subOptionsList" class="track-options-list"></div>
          </div>
        </div>
      </div>

      <!-- DRAWER LATERAL DE EPISODIOS -->
      ${isSeries ? `
        <div id="playerEpisodesDrawer" class="player-episodes-drawer">
          <div class="drawer-ep-header">
            <h3>Episodios</h3>
            <button id="btnCloseEpDrawer" class="close-btn">✕</button>
          </div>
          <div id="episodesListBody" class="episodes-list-body"></div>
        </div>
      ` : ''}

    </div>
  `;

  // REFERENCIAS AL DOM
  const wrapper = document.getElementById('playerWrapper');
  const video = document.getElementById('mainVideo');
  const controls = document.getElementById('playerControls');
  const btnBack = document.getElementById('btnPlayerBack');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const svgPlay = document.getElementById('svgPlay');
  const svgPause = document.getElementById('svgPause');
  const btnRewind10 = document.getElementById('btnRewind10');
  const btnForward10 = document.getElementById('btnForward10');
  const progress = document.getElementById('videoProgress');
  const currentTimeText = document.getElementById('currentTimeText');
  const durationTimeText = document.getElementById('durationTimeText');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnAudioMenu = document.getElementById('btnAudioMenu');
  const btnSubtitlesMenu = document.getElementById('btnSubtitlesMenu');
  const trackModal = document.getElementById('trackSelectorModal');

  // LÓGICA DE OCULTACIÓN AUTOMÁTICA DE CONTROLES POR INACTIVIDAD (PUNTO 5)
  function resetControlsTimer() {
    if (!controls) return;
    controls.classList.remove('fade-out');
    clearTimeout(controlsTimeout);

    if (video && !video.paused) {
      controlsTimeout = setTimeout(() => {
        controls.classList.add('fade-out');
        if (trackModal) trackModal.classList.add('hidden');
      }, 3500);
    }
  }

  wrapper.addEventListener('mousemove', resetControlsTimer);
  wrapper.addEventListener('click', resetControlsTimer);
  wrapper.addEventListener('touchstart', resetControlsTimer);

  // FORMATO DE TIEMPO
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // PLAY / PAUSE
  function togglePlay() {
    if (video.paused) {
      video.play();
      svgPlay.style.display = 'none';
      svgPause.style.display = 'block';
    } else {
      video.pause();
      svgPlay.style.display = 'block';
      svgPause.style.display = 'none';
    }
    resetControlsTimer();
  }

  btnPlayPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePlay();
  });

  // REBOBINAR Y ADELANTAR
  btnRewind10?.addEventListener('click', (e) => {
    e.stopPropagation();
    video.currentTime = Math.max(0, video.currentTime - 10);
    resetControlsTimer();
  });

  btnForward10?.addEventListener('click', (e) => {
    e.stopPropagation();
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    resetControlsTimer();
  });

  // ACTUALIZAR PROGRESO
  video.ontimeupdate = () => {
    if (video.duration) {
      progress.value = (video.currentTime / video.duration) * 100;
      currentTimeText.innerText = formatTime(video.currentTime);
      durationTimeText.innerText = formatTime(video.duration);
    }
  };

  progress.oninput = (e) => {
    if (video.duration) {
      video.currentTime = (e.target.value / 100) * video.duration;
    }
  };

  // REPRODUCCIÓN AUTOMÁTICA DEL SIGUIENTE EPISODIO AL FINALIZAR
  video.onended = () => {
    if (hasNextEpisode) {
      playNextEpisode();
    } else {
      controls.classList.remove('fade-out');
      svgPlay.style.display = 'block';
      svgPause.style.display = 'none';
    }
  };

  function playNextEpisode() {
    if (!hasNextEpisode) return;
    const nextIdx = currentIndex + 1;
    state.player.currentIndex = nextIdx;
    state.player.currentMedia = episodesList[nextIdx];
    renderPlayer(container);
  }

  document.getElementById('btnNextEpisode')?.addEventListener('click', (e) => {
    e.stopPropagation();
    playNextEpisode();
  });

  // PANTALLA COMPLETA
  btnFullscreen?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => console.error("Error fullscreen:", err));
    } else {
      document.exitFullscreen().catch(err => console.error("Error exit fullscreen:", err));
    }
  });

  // REGRESAR A LA PANTALLA ANTERIOR
  btnBack?.addEventListener('click', (e) => {
    e.stopPropagation();
    video.pause();
    clearTimeout(controlsTimeout);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    updateState('currentView', 'details');
  });

  // GESTIÓN DE OPCIONES DE AUDIO Y SUBTÍTULOS (PUNTO 5)
  function renderTrackOptions() {
    const audioContainer = document.getElementById('audioOptionsList');
    const subContainer = document.getElementById('subOptionsList');

    if (audioContainer) {
      audioContainer.innerHTML = availableAudios.map(lang => `
        <button class="track-btn ${state.player.selectedAudio === lang ? 'active' : ''}" data-type="audio" data-lang="${lang}">
          ${lang.toUpperCase()}
        </button>
      `).join('');
    }

    if (subContainer) {
      subContainer.innerHTML = availableSubtitles.map(lang => `
        <button class="track-btn ${state.player.selectedSubtitle === lang ? 'active' : ''}" data-type="sub" data-lang="${lang}">
          ${lang === 'off' ? 'Desactivado' : lang.toUpperCase()}
        </button>
      `).join('');
    }

    // Listeners para selección de pistas
    trackModal?.querySelectorAll('.track-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const lang = btn.dataset.lang;

        if (type === 'audio') {
          state.player.selectedAudio = lang;
          console.log(`Audio cambiado a: ${lang}`);
        } else {
          state.player.selectedSubtitle = lang;
          console.log(`Subtítulos cambiados a: ${lang}`);
        }
        renderTrackOptions();
        trackModal.classList.add('hidden');
      });
    });
  }

  const toggleModal = (e) => {
    e.stopPropagation();
    renderTrackOptions();
    trackModal?.classList.toggle('hidden');
  };

  btnAudioMenu?.addEventListener('click', toggleModal);
  btnSubtitlesMenu?.addEventListener('click', toggleModal);

  // DRAWER LATERAL DE EPISODIOS
  if (isSeries) {
    const btnToggleEpisodes = document.getElementById('btnToggleEpisodes');
    const btnCloseEpDrawer = document.getElementById('btnCloseEpDrawer');
    const epDrawer = document.getElementById('playerEpisodesDrawer');
    const epListBody = document.getElementById('episodesListBody');

    btnToggleEpisodes?.addEventListener('click', (e) => {
      e.stopPropagation();
      epDrawer?.classList.add('open');
    });

    btnCloseEpDrawer?.addEventListener('click', (e) => {
      e.stopPropagation();
      epDrawer?.classList.remove('open');
    });

    if (epListBody) {
      epListBody.innerHTML = episodesList.map((ep, idx) => `
        <div class="player-ep-item ${idx === currentIndex ? 'active' : ''}" data-ep-index="${idx}">
          <div class="ep-num">${idx + 1}</div>
          <div class="ep-details">
            <h5>${ep.title || `Episodio ${idx + 1}`}</h5>
            <span>${ep.duration || '24m'}</span>
          </div>
        </div>
      `).join('');

      epListBody.querySelectorAll('.player-ep-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedIdx = parseInt(item.dataset.epIndex, 10);
          state.player.currentIndex = selectedIdx;
          state.player.currentMedia = episodesList[selectedIdx];
          renderPlayer(container);
        });
      });
    }
  }

  resetControlsTimer();
}
