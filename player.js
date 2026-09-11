// player.js - Reproductor Simple Personalizado Blanco y Negro
export function renderPlayer(container, { item, selectedEp = null, title = '' }) {
  const mediaObj = selectedEp || item;
  let videoSrc = mediaObj.videoUrl || '';
  const subs = mediaObj.subtitles || {};
  const dubs = mediaObj.doblajes || {};

  container.innerHTML = `
    <div id="playerWrapper" style="position: fixed; inset: 0; background: black; z-index: 10000; display: flex; flex-direction: column; justify-content: space-between; font-family: sans-serif; color: white;">
      
      <!-- HEADER / BARRA SUPERIOR -->
      <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); z-index: 10;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <button id="btnBackPlayer" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">←</button>
          <span style="font-size: 16px; font-weight: 600;">${title}</span>
        </div>

        <!-- BOTÓN DE SUBTÍTULOS E IDIOMAS (ESQUINA SUPERIOR DERECHA) -->
        <div style="position: relative;">
          <button id="btnAudioSubMenu" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Audio y Subtítulos
          </button>

          <!-- DESPLEGABLE DE OPCIONES -->
          <div id="langDropdown" style="display: none; position: absolute; right: 0; top: 40px; background: #111; border: 1px solid #333; border-radius: 8px; width: 260px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.8); z-index: 20;">
            
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase;">Idioma del Video (Doblaje)</p>
            <div id="dubList" style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px;"></div>

            <p style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase;">Subtítulos</p>
            <div id="subList" style="display: flex; flex-direction: column; gap: 4px;"></div>
          </div>
        </div>
      </div>

      <!-- VIDEO -->
      <video id="customVideo" src="${videoSrc}" style="width: 100%; height: 100%; object-fit: contain; absolute; inset: 0;" autoplay></video>

      <!-- BARRA DE CONTROLES INFERIOR BLANCA Y NEGRA -->
      <div style="padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 10; display: flex; flex-direction: column; gap: 10px;">
        
        <!-- BARRA DE PROGRESO BLANCA -->
        <input type="range" id="seekBar" value="0" max="100" style="width: 100%; accent-color: white; cursor: pointer; height: 4px;">

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <button id="btnPlayPause" style="background: white; border: none; color: black; width: 36px; height: 36px; border-radius: 50%; font-weight: bold; cursor: pointer;">❚❚</button>
            <span id="timeDisplay" style="font-size: 12px; color: #ccc;">00:00 / 00:00</span>
          </div>

          <button id="btnFullscreen" style="background: transparent; border: none; color: white; cursor: pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('customVideo');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const seekBar = document.getElementById('seekBar');
  const timeDisplay = document.getElementById('timeDisplay');
  const dropdown = document.getElementById('langDropdown');

  // Salir
  document.getElementById('btnBackPlayer').onclick = () => {
    video.pause();
    document.getElementById('playerWrapper').remove();
  };

  // Play / Pause
  btnPlayPause.onclick = () => {
    if (video.paused) { video.play(); btnPlayPause.textContent = '❚❚'; }
    else { video.pause(); btnPlayPause.textContent = '▶'; }
  };

  // Progreso
  video.ontimeupdate = () => {
    if (video.duration) {
      seekBar.value = (video.currentTime / video.duration) * 100;
      timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    }
  };

  seekBar.oninput = () => {
    video.currentTime = (seekBar.value / 100) * video.duration;
  };

  // Fullscreen
  document.getElementById('btnFullscreen').onclick = () => {
    if (!document.fullscreenElement) document.getElementById('playerWrapper').requestFullscreen();
    else document.exitFullscreen();
  };

  // Menú desplegable Subtítulos/Audio
  document.getElementById('btnAudioSubMenu').onclick = () => {
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  };

  // Cargar lista de audios
  const dubList = document.getElementById('dubList');
  const langNames = { es: 'Español', en: 'Inglés', de: 'Alemán', pt: 'Portugués', fr: 'Francés', ja: 'Japonés' };
  
  dubList.innerHTML = `<button class="opt-btn active-opt" data-url="${videoSrc}" style="text-align: left; background: #222; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">Original / Principal</button>`;
  Object.keys(dubs).forEach(k => {
    if (dubs[k]) {
      dubList.innerHTML += `<button class="opt-btn" data-url="${dubs[k]}" style="text-align: left; background: transparent; border: none; color: #aaa; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">${langNames[k] || k}</button>`;
    }
  });

  dubList.querySelectorAll('.opt-btn').forEach(btn => {
    btn.onclick = () => {
      const time = video.currentTime;
      video.src = btn.getAttribute('data-url');
      video.currentTime = time;
      video.play();
      dropdown.style.display = 'none';
    };
  });

  // Cargar lista de subtítulos
  const subList = document.getElementById('subList');
  subList.innerHTML = `<button class="sub-btn" data-lang="off" style="text-align: left; background: #222; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">Desactivados</button>`;
  Object.keys(subs).forEach(k => {
    if (subs[k]) {
      subList.innerHTML += `<button class="sub-btn" data-src="${subs[k]}" data-lang="${k}" style="text-align: left; background: transparent; border: none; color: #aaa; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 12px;">${langNames[k] || k}</button>`;
    }
  });

  subList.querySelectorAll('.sub-btn').forEach(btn => {
    btn.onclick = () => {
      // Limpiar tracks existentes
      Array.from(video.querySelectorAll('track')).forEach(t => t.remove());
      const src = btn.getAttribute('data-src');
      if (src) {
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.src = src;
        track.srclang = btn.getAttribute('data-lang');
        track.default = true;
        video.appendChild(track);
      }
      dropdown.style.display = 'none';
    };
  });
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}
