// player.js - Reproductor de Video Avanzado (Pantalla Completa, Episodios y Autocierre de Controles)

export function renderPlayer(container, options = {}) {
  const { 
    videoUrl, 
    title, 
    seasons = [], 
    currentSeasonIdx = 0, 
    currentEpisodeIdx = 0, 
    onBack, 
    onSelectEpisode 
  } = options;

  let controlsTimeout;

  // Verificación de lista de episodios para series
  const hasEpisodes = seasons.length > 0 && seasons[currentSeasonIdx]?.episodes?.length > 0;
  const currentEpisodeList = hasEpisodes ? seasons[currentSeasonIdx].episodes : [];
  const hasNextEpisode = hasEpisodes && currentEpisodeIdx < currentEpisodeList.length - 1;

  container.innerHTML = `
    <div id="playerWrapper" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:9999; font-family:sans-serif; overflow:hidden;">
      <video id="mainVideo" src="${videoUrl}" style="width:100%; height:100%; object-fit:contain;" autoplay></video>
      
      <!-- CAPA DE CONTROLES -->
      <div id="playerControls" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(to bottom, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.9)); transition:opacity 0.3s ease; opacity:1; padding:20px; box-sizing:border-box;">
        
        <!-- HEADER DEL REPRODUCTOR -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:15px;">
            <button id="btnPlayerBack" style="background:none; border:none; color:#fff; font-size:30px; cursor:pointer; line-height:1;">←</button>
            <div>
              <h3 style="color:#fff; margin:0; font-size:1.2rem;">${title || ''}</h3>
              ${hasEpisodes ? `<small style="color:#aaa;">${seasons[currentSeasonIdx].name || ''} - Ep. ${currentEpisodeIdx + 1}: ${currentEpisodeList[currentEpisodeIdx]?.title || ''}</small>` : ''}
            </div>
          </div>
          ${hasEpisodes ? `<button id="btnToggleEpisodes" style="background:rgba(255,255,255,0.2); color:#fff; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Episodios ☰</button>` : ''}
        </div>

        <!-- BOTÓN CENTRAL PLAY / PAUSE -->
        <div style="display:flex; align-items:center; justify-content:center; gap:30px;">
          <button id="btnPlayPause" style="background:rgba(255,255,255,0.2); border:none; color:#fff; width:65px; height:65px; border-radius:50%; font-size:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">⏸</button>
          ${hasNextEpisode ? `<button id="btnNextEpisode" style="background:rgba(255,255,255,0.2); border:none; color:#fff; padding:10px 18px; border-radius:20px; font-size:14px; cursor:pointer; font-weight:bold;">Siguiente Ep. ⏭</button>` : ''}
        </div>

        <!-- BARRA DE PROGRESO Y CONTROLES INFERIORES -->
        <div>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <span id="currentTimeText" style="color:#fff; font-size:12px;">00:00</span>
            <input type="range" id="videoProgress" value="0" min="0" max="100" style="flex:1; cursor:pointer; accent-color:#e50914;">
            <span id="durationTimeText" style="color:#fff; font-size:12px;">00:00</span>
            <button id="btnFullscreen" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer; margin-left:10px;">⛶</button>
          </div>
        </div>

      </div>

      <!-- PANEL LATERAL DE EPISODIOS (DESPLEGABLE) -->
      ${hasEpisodes ? `
        <div id="episodesDrawer" style="position:absolute; top:0; right:-320px; width:300px; height:100%; background:rgba(20,20,20,0.95); transition:right 0.3s ease; padding:20px; box-sizing:border-box; overflow-y:auto; z-index:10000; color:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h4 style="margin:0;">Episodios</h4>
            <button id="btnCloseEpisodes" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">✕</button>
          </div>
          <div id="episodesListContainer"></div>
        </div>
      ` : ''}

    </div>
  `;

  const video = document.getElementById('mainVideo');
  const controls = document.getElementById('playerControls');
  const btnBack = document.getElementById('btnPlayerBack');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const progress = document.getElementById('videoProgress');
  const currentTimeText = document.getElementById('currentTimeText');
  const durationTimeText = document.getElementById('durationTimeText');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const wrapper = document.getElementById('playerWrapper');

  // FORMATEAR TIEMPO (SEGUNDOS A MM:SS)
  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // TEMPORIZADOR PARA OCULTAR CONTROLES AUTOMÁTICAMENTE
  function resetControlsTimer() {
    controls.style.opacity = '1';
    controls.style.pointerEvents = 'auto';
    clearTimeout(controlsTimeout);

    if (!video.paused) {
      controlsTimeout = setTimeout(() => {
        controls.style.opacity = '0';
        controls.style.pointerEvents = 'none';
      }, 3500);
    }
  }

  wrapper.addEventListener('mousemove', resetControlsTimer);
  wrapper.addEventListener('click', resetControlsTimer);
  wrapper.addEventListener('touchstart', resetControlsTimer);

  // BOTÓN PLAY / PAUSE
  btnPlayPause.onclick = (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play();
      btnPlayPause.innerText = '⏸';
    } else {
      video.pause();
      btnPlayPause.innerText = '▶';
    }
    resetControlsTimer();
  };

  // BOTÓN SALIR
  btnBack.onclick = (e) => {
    e.stopPropagation();
    video.pause();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (onBack) onBack();
  };

  // PANTALLA COMPLETA
  btnFullscreen.onclick = (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  // ACTUALIZACIÓN DE PROGRESO DE VIDEO
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

  // MANEJO DE EPISODIOS
  if (hasEpisodes) {
    const btnToggleEpisodes = document.getElementById('btnToggleEpisodes');
    const btnCloseEpisodes = document.getElementById('btnCloseEpisodes');
    const episodesDrawer = document.getElementById('episodesDrawer');
    const episodesListContainer = document.getElementById('episodesListContainer');

    btnToggleEpisodes.onclick = (e) => {
      e.stopPropagation();
      episodesDrawer.style.right = '0px';
    };

    btnCloseEpisodes.onclick = (e) => {
      e.stopPropagation();
      episodesDrawer.style.right = '-320px';
    };

    // LISTAR EPISODIOS
    currentEpisodeList.forEach((ep, idx) => {
      const epCard = document.createElement('div');
      const isCurrent = idx === currentEpisodeIdx;
      epCard.style.cssText = `padding:10px; margin-bottom:8px; background:${isCurrent ? '#e50914' : '#333'}; border-radius:4px; cursor:pointer; font-size:13px;`;
      epCard.innerHTML = `<strong>Ep. ${idx + 1}</strong>: ${ep.title || 'Episodio ' + (idx + 1)}`;
      
      epCard.onclick = (e) => {
        e.stopPropagation();
        if (onSelectEpisode) {
          onSelectEpisode(currentSeasonIdx, idx, ep.url);
        }
      };
      episodesListContainer.appendChild(epCard);
    });

    const btnNextEpisode = document.getElementById('btnNextEpisode');
    if (btnNextEpisode) {
      btnNextEpisode.onclick = (e) => {
        e.stopPropagation();
        const nextIdx = currentEpisodeIdx + 1;
        if (onSelectEpisode && currentEpisodeList[nextIdx]) {
          onSelectEpisode(currentSeasonIdx, nextIdx, currentEpisodeList[nextIdx].url);
        }
      };
    }
  }

  resetControlsTimer();
}
