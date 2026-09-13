// player.js - Reproductor personalizado con soporte para 14 tracks
export function openPlayer(mediaData) {
  const existingPlayer = document.getElementById('lumeraPlayerOverlay');
  if (existingPlayer) existingPlayer.remove();

  const playerOverlay = document.createElement('div');
  playerOverlay.id = 'lumeraPlayerOverlay';
  playerOverlay.style.cssText = 'position: fixed; inset: 0; background: #000; z-index: 2000; display: flex; flex-direction: column; font-family: sans-serif;';

  const languages = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'Inglés' },
    { code: 'fr', label: 'Francés' },
    { code: 'it', label: 'Italiano' },
    { code: 'de', label: 'Alemán' },
    { code: 'ja', label: 'Japonés' },
    { code: 'pt', label: 'Portugués' }
  ];

  const subtitles = mediaData.subtitles || {};
  const audios = mediaData.audios || {};

  playerOverlay.innerHTML = `
    <!-- BARRA SUPERIOR DE CONTROLES -->
    <div style="padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(0,0,0,0.9), transparent); position: absolute; top: 0; width: 100%; z-index: 10;">
      <div>
        <h2 style="color: #fff; font-size: 1.2rem; margin: 0;">${mediaData.title}</h2>
      </div>
      <div style="display: flex; gap: 15px; align-items: center;">
        <button id="btnTracksMenu" class="icon-btn" style="background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); padding: 8px 15px; border-radius: 6px; cursor: pointer; color: #fff; font-size: 14px;">💬 Audio y Subtítulos</button>
        <button id="btnClosePlayer" class="icon-btn" style="background: rgba(255,255,255,0.1); border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; color: #fff; font-size: 16px;">✕ Salir</button>
      </div>
    </div>

    <!-- ÁREA DE VIDEO -->
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative;">
      <video id="lumeraVideo" controls autoplay style="width: 100%; height: 100%; max-height: 100vh; object-fit: contain;">
        <source id="videoSource" src="${mediaData.videoUrl || ''}" type="video/mp4">
        ${languages.map(lang => subtitles[lang.code] ? `<track kind="subtitles" srclang="${lang.code}" label="${lang.label}" src="${subtitles[lang.code]}">` : '').join('')}
      </video>

      <!-- PANEL SELECTOR DE PISTAS (MODAL INTERNO) -->
      <div id="tracksPanel" class="glass-panel hidden" style="position: absolute; right: 25px; top: 70px; background: rgba(15, 17, 26, 0.95); border: 1px solid var(--glass-border); padding: 20px; border-radius: 10px; width: 320px; z-index: 20; color: #fff;">
        <h3 style="margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Doblaje (Audio)</h3>
        <div id="audioTracksList" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; max-height: 120px; overflow-y: auto;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
            <input type="radio" name="audioTrack" value="default" checked> Principal (Original)
          </label>
          ${languages.map(lang => audios[lang.code] ? `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
              <input type="radio" name="audioTrack" value="${audios[lang.code]}"> ${lang.label}
            </label>
          ` : '').join('')}
        </div>

        <h3 style="margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">Subtítulos</h3>
        <div id="subTracksList" style="display: flex; flex-direction: column; gap: 8px; max-height: 120px; overflow-y: auto;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
            <input type="radio" name="subTrack" value="off" checked> Desactivados
          </label>
          ${languages.map(lang => subtitles[lang.code] ? `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px;">
              <input type="radio" name="subTrack" value="${lang.code}"> ${lang.label}
            </label>
          ` : '').join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(playerOverlay);

  const video = document.getElementById('lumeraVideo');
  const tracksPanel = document.getElementById('tracksPanel');

  // Toggle Menú de Pistas
  document.getElementById('btnTracksMenu').onclick = () => {
    tracksPanel.classList.toggle('hidden');
  };

  // Cambio de Pista de Audio
  document.querySelectorAll('input[name="audioTrack"]').forEach(radio => {
    radio.onchange = (e) => {
      const currentTime = video.currentTime;
      const isPaused = video.paused;
      const newSource = e.target.value === 'default' ? mediaData.videoUrl : e.target.value;
      
      const sourceEl = document.getElementById('videoSource');
      sourceEl.src = newSource;
      video.load();
      video.currentTime = currentTime;
      if (!isPaused) video.play();
    };
  });

  // Cambio de Subtítulos
  document.querySelectorAll('input[name="subTrack"]').forEach(radio => {
    radio.onchange = (e) => {
      const selectedLang = e.target.value;
      for (let i = 0; i < video.textTracks.length; i++) {
        if (selectedLang === 'off') {
          video.textTracks[i].mode = 'disabled';
        } else {
          video.textTracks[i].mode = (video.textTracks[i].language === selectedLang) ? 'showing' : 'disabled';
        }
      }
    };
  });

  // Cierre del reproductor
  document.getElementById('btnClosePlayer').onclick = () => playerOverlay.remove();
}
