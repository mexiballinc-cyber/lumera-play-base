// player.js - Reproductor SVG Personalizado para Lumera
export function renderPlayer(container, { videoUrl, title, subtitles = [], audioTracks = [] }) {
  const isDirectAudioTrack = audioTracks.length > 0;

  container.innerHTML = `
    <div id="playerWrapper" style="position: fixed; inset: 0; background: #000; z-index: 1000; display: flex; flex-direction: column; justify-content: center; align-items: center; user-select: none;">
      
      <!-- VIDEO -->
      <video id="lumeraVideo" style="width: 100%; height: 100%; object-fit: contain;" src="${videoUrl}" preload="metadata"></video>
      <audio id="lumeraAudioTrack" style="display:none;"></audio>

      <!-- BARRA DE HERRAMIENTAS TOP -->
      <div style="position: absolute; top: 0; left: 0; right: 0; padding: 20px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); z-index: 10;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <button id="btnPlayerBack" class="svg-btn" style="background: rgba(0,0,0,0.5);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h3 style="color: #fff; font-size: 1.1rem; margin: 0;">${title}</h3>
        </div>

        <!-- CC Y DOBLAJE -->
        <div style="position: relative;">
          <button id="btnCC" class="svg-btn" style="background: rgba(0,0,0,0.5); font-weight: bold; font-size: 12px;">CC</button>
          
          <!-- MENU DROPDOWN DE AUDIO Y SUBTÍTULOS -->
          <div id="ccMenu" style="display: none; position: absolute; top: 50px; right: 0; background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 15px; width: 220px; z-index: 20;">
            <h4 style="color: #d4af37; margin: 0 0 8px 0; font-size: 13px;">Subtítulos</h4>
            <div id="subtitlesList" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
              <button class="opt-sub active-opt" data-src="" style="text-align: left; background: transparent; border: none; color: #fff; cursor: pointer; font-size: 12px;">Desactivados</button>
            </div>

            <h4 style="color: #d4af37; margin: 8px 0; font-size: 13px;">Doblaje / Audio</h4>
            <div id="audioList" style="display: flex; flex-direction: column; gap: 6px;">
              <button class="opt-audio active-opt" data-src="" style="text-align: left; background: transparent; border: none; color: #fff; cursor: pointer; font-size: 12px;">Original</button>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTROLES BOTTOM -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); z-index: 10; display: flex; flex-direction: column; gap: 10px;">
        
        <!-- PROGRESS BAR -->
        <input type="range" id="playerProgress" value="0" min="0" max="100" style="width: 100%; accent-color: #d4af37; cursor: pointer;">

        <div style="display: flex; justify-content: center; align-items: center; gap: 25px;">
          <!-- RETRASAR 10s -->
          <button id="btnRewind" class="svg-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 19l-9-7 9-7v14zM22 19l-9-7 9-7v14z"/></svg>
          </button>

          <!-- PLAY/PAUSE -->
          <button id="btnPlayPause" class="svg-btn" style="width: 55px; height: 55px; background: #d4af37; color: #000;">
            <svg id="svgPlay" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <svg id="svgPause" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>

          <!-- ADELANTAR 10s -->
          <button id="btnForward" class="svg-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 19l9-7-9-7v14zM2 19l9-7-9-7v14z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('lumeraVideo');
  const audioTrack = document.getElementById('lumeraAudioTrack');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const svgPlay = document.getElementById('svgPlay');
  const svgPause = document.getElementById('svgPause');
  const progress = document.getElementById('playerProgress');
  const ccMenu = document.getElementById('ccMenu');

  // Lógica Subtítulos
  const subContainer = document.getElementById('subtitlesList');
  if (subtitles && subtitles.length > 0) {
    subtitles.forEach(sub => {
      const btn = document.createElement('button');
      btn.textContent = `${sub.lang || 'Español'} (${sub.label || 'CC'})`;
      btn.style.cssText = "text-align: left; background: transparent; border: none; color: #aaa; cursor: pointer; font-size: 12px;";
      btn.onclick = () => {
        // Remover track anterior
        const oldTrack = video.querySelector('track');
        if (oldTrack) oldTrack.remove();

        if (sub.url) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = sub.label || 'Subtítulos';
          track.srclang = sub.lang || 'es';
          track.src = sub.url;
          track.default = true;
          video.appendChild(track);
          track.track.mode = 'showing';
        }
        ccMenu.style.display = 'none';
      };
      subContainer.appendChild(btn);
    });
  }

  // Lógica Audio/Doblaje
  const audioContainer = document.getElementById('audioList');
  if (audioTracks && audioTracks.length > 0) {
    audioTracks.forEach(aud => {
      const btn = document.createElement('button');
      btn.textContent = aud.lang || 'Audio Alternativo';
      btn.style.cssText = "text-align: left; background: transparent; border: none; color: #aaa; cursor: pointer; font-size: 12px;";
      btn.onclick = () => {
        if (aud.url) {
          video.muted = true;
          audioTrack.src = aud.url;
          audioTrack.currentTime = video.currentTime;
          if (!video.paused) audioTrack.play();
        } else {
          video.muted = false;
          audioTrack.pause();
        }
        ccMenu.style.display = 'none';
      };
      audioContainer.appendChild(btn);
    });
  }

  // Eventos Reproductor
  document.getElementById('btnCC').onclick = () => {
    ccMenu.style.display = ccMenu.style.display === 'none' ? 'block' : 'none';
  };

  btnPlayPause.onclick = () => {
    if (video.paused) {
      video.play();
      if (video.muted && audioTrack.src) audioTrack.play();
      svgPlay.style.display = 'none';
      svgPause.style.display = 'block';
    } else {
      video.pause();
      if (audioTrack.src) audioTrack.pause();
      svgPlay.style.display = 'block';
      svgPause.style.display = 'none';
    }
  };

  document.getElementById('btnRewind').onclick = () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
    if (audioTrack.src) audioTrack.currentTime = video.currentTime;
  };

  document.getElementById('btnForward').onclick = () => {
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
    if (audioTrack.src) audioTrack.currentTime = video.currentTime;
  };

  video.ontimeupdate = () => {
    if (video.duration) {
      progress.value = (video.currentTime / video.duration) * 100;
    }
  };

  progress.oninput = () => {
    const time = (progress.value / 100) * video.duration;
    video.currentTime = time;
    if (audioTrack.src) audioTrack.currentTime = time;
  };

  document.getElementById('btnPlayerBack').onclick = () => {
    video.pause();
    if (audioTrack.src) audioTrack.pause();
    location.reload();
  };
}
