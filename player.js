// player.js - Reproductor de Video con Estilos Encapsulados
import { state, updateState } from './state.js';

let controlsTimeout = null;

export function renderPlayer(container, customOptions = null) {
  if (!container) container = document.getElementById('appContainer');
  if (!container) return;

  const playerData = customOptions || state.player || {};
  const currentMedia = playerData.currentMedia || {};
  const episodesList = playerData.episodesList || currentMedia.episodes || [];
  const currentIndex = playerData.currentIndex ?? 0;

  const isSeries = episodesList.length > 0;
  const videoUrl = currentMedia.videoUrl || currentMedia.url || (episodesList[currentIndex] ? episodesList[currentIndex].videoUrl || episodesList[currentIndex].url : '');
  const mediaTitle = currentMedia.title || 'Lumera Content';
  const episodeTitle = isSeries && episodesList[currentIndex] ? (episodesList[currentIndex].title || `Episodio ${currentIndex + 1}`) : '';
  const hasNextEpisode = isSeries && currentIndex < episodesList.length - 1;

  const availableAudios = playerData.availableAudios || currentMedia.availableAudios || ['es', 'en'];
  const availableSubtitles = playerData.availableSubtitles || currentMedia.availableSubtitles || ['off', 'es', 'en'];

  container.innerHTML = `
    <style>
      .lumera-player-root {
        position: fixed;
        inset: 0;
        background: #000;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        user-select: none;
      }
      .lumera-video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .lumera-controls {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 24px 30px;
        background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%);
        transition: opacity 0.3s ease;
        opacity: 1;
        box-sizing: border-box;
      }
      .lumera-controls.fade-out {
        opacity: 0;
        pointer-events: none;
      }
      .lumera-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .lumera-btn-icon {
        background: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border-radius: 50%;
        transition: background 0.2s, transform 0.2s;
      }
      .lumera-btn-icon:hover {
        background: rgba(255,255,255,0.15);
        transform: scale(1.1);
      }
      .lumera-title-box h3 {
        margin: 0;
        color: #fff;
        font-size: 1.25rem;
      }
      .lumera-title-box span {
        color: #d4af37;
        font-size: 0.85rem;
      }
      .lumera-center-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 30px;
      }
      .lumera-play-btn {
        width: 64px;
        height: 64px;
        background: #d4af37;
        border: none;
        border-radius: 50%;
        color: #000;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .lumera-play-btn:hover {
        transform: scale(1.1);
      }
      .lumera-bottom-bar {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .lumera-progress-container {
        display: flex;
        align-items: center;
        gap: 14px;
        color: #fff;
        font-size: 0.85rem;
      }
      .lumera-slider {
        flex: 1;
        accent-color: #d4af37;
        cursor: pointer;
        height: 5px;
      }
      .lumera-footer-btns {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .lumera-drawer {
        position: absolute;
        top: 0; right: 0; bottom: 0;
        width: 320px;
        background: rgba(15,15,18,0.95);
        border-left: 1px solid #d4af37;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        padding: 20px;
        color: white;
        z-index: 20;
        overflow-y: auto;
      }
      .lumera-drawer.open {
        transform: translateX(0);
      }
    </style>

    <div id="playerWrapper" class="lumera-player-root">
      <video id="mainVideo" class="lumera-video" autoplay playsinline crossorigin="anonymous">
        <source src="${videoUrl}" type="video/mp4">
      </video>

      <div id="playerControls" class="lumera-controls">
        <div class="lumera-header">
          <div style="display:flex; align-items:center; gap:16px;">
            <button id="btnPlayerBack" class="lumera-btn-icon" title="Volver">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="lumera-title-box">
              <h3>${mediaTitle}</h3>
              ${isSeries ? `<span>T1:E${currentIndex + 1} - ${episodeTitle}</span>` : ''}
            </div>
          </div>
          ${isSeries ? `<button id="btnToggleEpisodes" style="background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:#d4af37; padding:6px 14px; border-radius:6px; cursor:pointer; font-weight:bold;">Episodios ☰</button>` : ''}
        </div>

        <div class="lumera-center-controls">
          <button id="btnRewind10" class="lumera-btn-icon" title="-10s">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <button id="btnPlayPause" class="lumera-play-btn">
            <svg id="svgPlay" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg id="svgPause" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
          <button id="btnForward10" class="lumera-btn-icon" title="+10s">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>

        <div class="lumera-bottom-bar">
          <div class="lumera-progress-container">
            <span id="currentTimeText">00:00</span>
            <input type="range" id="videoProgress" class="lumera-slider" value="0" min="0" max="100" step="0.1">
            <span id="durationTimeText">00:00</span>
          </div>
          <div class="lumera-footer-btns">
            <div style="display:flex; gap:10px;">
              <button id="btnAudioMenu" class="lumera-btn-icon" title="Audio">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              </button>
              <button id="btnSubtitlesMenu" class="lumera-btn-icon" title="Subtítulos">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h3M7 11h5M14 15h3"/></svg>
              </button>
            </div>
            <button id="btnFullscreen" class="lumera-btn-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>
          </div>
        </div>
      </div>

      ${isSeries ? `
        <div id="playerEpisodesDrawer" class="lumera-drawer">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="margin:0; color:#d4af37;">Episodios</h3>
            <button id="btnCloseEpDrawer" style="background:none; border:none; color:white; font-size:18px; cursor:pointer;">✕</button>
          </div>
          <div id="episodesListBody"></div>
        </div>
      ` : ''}
    </div>
  `;

  // ELEMENTOS
  const wrapper = document.getElementById('playerWrapper');
  const video = document.getElementById('mainVideo');
  const controls = document.getElementById('playerControls');
  const btnBack = document.getElementById('btnPlayerBack');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const svgPlay = document.getElementById('svgPlay');
  const svgPause = document.getElementById('svgPause');
  const progress = document.getElementById('videoProgress');

  function resetControlsTimer() {
    controls.classList.remove('fade-out');
    clearTimeout(controlsTimeout);
    if (!video.paused) {
      controlsTimeout = setTimeout(() => controls.classList.add('fade-out'), 3500);
    }
  }

  wrapper.addEventListener('mousemove', resetControlsTimer);

  btnPlayPause.onclick = () => {
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
  };

  video.ontimeupdate = () => {
    if (video.duration) {
      progress.value = (video.currentTime / video.duration) * 100;
      document.getElementById('currentTimeText').innerText = formatTime(video.currentTime);
      document.getElementById('durationTimeText').innerText = formatTime(video.duration);
    }
  };

  progress.oninput = (e) => {
    if (video.duration) video.currentTime = (e.target.value / 100) * video.duration;
  };

  btnBack.onclick = () => {
    video.pause();
    updateState('currentView', 'details');
  };

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  if (isSeries) {
    const drawer = document.getElementById('playerEpisodesDrawer');
    document.getElementById('btnToggleEpisodes').onclick = () => drawer.classList.add('open');
    document.getElementById('btnCloseEpDrawer').onclick = () => drawer.classList.remove('open');
    
    const epBody = document.getElementById('episodesListBody');
    epBody.innerHTML = episodesList.map((ep, i) => `
      <div class="ep-item" data-idx="${i}" style="padding:10px; margin-bottom:8px; background:#1e1e24; border-radius:6px; cursor:pointer; border:${i === currentIndex ? '1px solid #d4af37' : '1px solid #333'}">
        <h5 style="margin:0; color:${i === currentIndex ? '#d4af37' : '#fff'};">${i + 1}. ${ep.title || 'Episodio'}</h5>
      </div>
    `).join('');

    epBody.querySelectorAll('.ep-item').forEach(item => {
      item.onclick = () => {
        state.player.currentIndex = parseInt(item.dataset.idx, 10);
        state.player.currentMedia = episodesList[state.player.currentIndex];
        renderPlayer(container);
      };
    });
  }

  resetControlsTimer();
}
