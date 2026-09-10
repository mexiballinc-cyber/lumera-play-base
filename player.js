// player.js - Reproductor Integrado con Controles Dinámicos y Opciones de Idioma
import { IDIOMAS_DISPONIBLES } from './i18n.js';

export function renderPlayer(container, { item, onBack }) {
  const isSerie = item.type === 'serie';
  let currentSeasonIdx = 0;
  let currentEpisodeIdx = 0;

  // Obtener la URL o episodio inicial
  let currentEp = isSerie && item.seasons?.[0]?.episodes?.[0] 
    ? item.seasons[0].episodes[0] 
    : item;

  let selectorEpisodiosHtml = '';

  if (isSerie && item.seasons && item.seasons.length > 0) {
    selectorEpisodiosHtml = `
      <div style="display:flex; gap:10px; align-items:center;">
        <select id="playerSeasonSelect" style="padding:6px 10px; background:#222; color:white; border:1px solid #444; border-radius:6px; font-size:13px;">
          ${item.seasons.map((s, idx) => `<option value="${idx}">Temporada ${s.seasonNumber || idx + 1}</option>`).join('')}
        </select>
        <select id="playerEpisodeSelect" style="padding:6px 10px; background:#222; color:white; border:1px solid #444; border-radius:6px; font-size:13px;">
          ${(item.seasons[0]?.episodes || []).map((ep, idx) => `<option value="${idx}">${ep.title || `Episodio ${idx + 1}`}</option>`).join('')}
        </select>
      </div>
    `;
  }

  container.innerHTML = `
    <div id="playerWrapper" style="position:relative; width:100%; height:85vh; background:black; border-radius:16px; overflow:hidden; border:1px solid rgba(212,175,55,0.3);">
      
      <!-- Barra Superior -->
      <div id="playerHeader" style="position:absolute; top:0; left:0; right:0; z-index:10; display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); transition:opacity 0.3s;">
        <button id="btnPlayerBack" style="padding:8px 16px; background:rgba(0,0,0,0.6); border:1px solid #d4af37; color:#d4af37; border-radius:8px; cursor:pointer; font-weight:bold;">
          ← Volver
        </button>
        <h3 id="playerMediaTitle" style="color:white; margin:0; font-size:1rem; text-shadow:0 2px 4px rgba(0,0,0,0.8);">${item.title} ${isSerie ? `- E1` : ''}</h3>
        ${selectorEpisodiosHtml}
      </div>

      <!-- Pantalla de Video -->
      <video id="mainVideoPlayer" controls autoplay style="width:100%; height:100%; object-fit:contain;">
        <source id="videoSource" src="${currentEp.videoUrl || ''}" type="video/mp4">
      </video>

      <!-- Barra de Controles para Subtítulos y Doblaje -->
      <div id="playerControls" style="position:absolute; bottom:20px; right:20px; z-index:10; display:flex; gap:10px; background:rgba(0,0,0,0.7); padding:10px; border-radius:8px; backdrop-filter:blur(5px); transition:opacity 0.3s;">
        <select id="selectSubtitles" style="background:#222; color:white; border:1px solid #444; padding:6px; border-radius:4px; font-size:12px;">
          <option value="">💬 Subtítulos (Desactivados)</option>
        </select>
        <select id="selectAudio" style="background:#222; color:white; border:1px solid #444; padding:6px; border-radius:4px; font-size:12px;">
          <option value="${currentEp.videoUrl || ''}">🔊 Audio Principal</option>
        </select>
      </div>

    </div>
  `;

  const video = document.getElementById('mainVideoPlayer');
  const wrapper = document.getElementById('playerWrapper');
  const playerHeader = document.getElementById('playerHeader');
  const playerControls = document.getElementById('playerControls');

  // Ocultar Controles automáticamente tras 3 segundos de inactividad
  let hideTimeout;
  wrapper.onmousemove = () => {
    wrapper.style.cursor = 'default';
    if (playerHeader) playerHeader.style.opacity = '1';
    if (playerControls) playerControls.style.opacity = '1';
    
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      wrapper.style.cursor = 'none';
      if (playerHeader) playerHeader.style.opacity = '0';
      if (playerControls) playerControls.style.opacity = '0';
    }, 3000);
  };

  // Cargar Pistas de Subtítulos y Doblajes
  function actualizarPistasAudioYSubtitulos(epData) {
    const subSelect = document.getElementById('selectSubtitles');
    const audSelect = document.getElementById('selectAudio');

    if (subSelect) {
      subSelect.innerHTML = `<option value="">💬 Subtítulos (Desactivados)</option>`;
      if (epData.subtitles) {
        IDIOMAS_DISPONIBLES.forEach(lang => {
          if (epData.subtitles[lang.code]) {
            subSelect.innerHTML += `<option value="${epData.subtitles[lang.code]}">${lang.name}</option>`;
          }
        });
      }
    }

    if (audSelect) {
      audSelect.innerHTML = `<option value="${epData.videoUrl || ''}">🔊 Audio Principal</option>`;
      if (epData.dubbings) {
        IDIOMAS_DISPONIBLES.forEach(lang => {
          if (epData.dubbings[lang.code]) {
            audSelect.innerHTML += `<option value="${epData.dubbings[lang.code]}">Doblaje: ${lang.name}</option>`;
          }
        });
      }

      audSelect.onchange = (e) => {
        const currentTime = video.currentTime;
        video.src = e.target.value;
        video.currentTime = currentTime;
        video.play();
      };
    }
  }

  actualizarPistasAudioYSubtitulos(currentEp);

  // Cambio de Temporadas / Episodios
  if (isSerie && item.seasons && item.seasons.length > 0) {
    const sSelect = document.getElementById('playerSeasonSelect');
    const eSelect = document.getElementById('playerEpisodeSelect');

    const actualizarEpisodiosSelect = (sIdx) => {
      const episodios = item.seasons[sIdx]?.episodes || [];
      eSelect.innerHTML = episodios.map((ep, idx) => `<option value="${idx}">${ep.title || `Episodio ${idx + 1}`}</option>`).join('');
    };

    if (sSelect && eSelect) {
      sSelect.onchange = (e) => {
        currentSeasonIdx = parseInt(e.target.value);
        currentEpisodeIdx = 0;
        actualizarEpisodiosSelect(currentSeasonIdx);
        
        const ep = item.seasons[currentSeasonIdx]?.episodes[0];
        if (ep) {
          video.src = ep.videoUrl || '';
          video.play();
          actualizarPistasAudioYSubtitulos(ep);
        }
      };

      eSelect.onchange = (e) => {
        currentEpisodeIdx = parseInt(e.target.value);
        const ep = item.seasons[currentSeasonIdx]?.episodes[currentEpisodeIdx];
        if (ep) {
          video.src = ep.videoUrl || '';
          video.play();
          actualizarPistasAudioYSubtitulos(ep);
        }
      };
    }
  }

  // Botón Volver
  document.getElementById('btnPlayerBack').onclick = () => {
    video.pause();
    onBack();
  };
}
