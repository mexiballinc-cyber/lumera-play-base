// details.js - Pantalla de Descripción Lumera
import { renderPlayer } from './player.js';

export function renderDetailsScreen(container, item) {
  let temporadasHtml = '';

  if (item.type === 'serie' && item.seasons) {
    temporadasHtml += `<div style="margin-top: 30px;">`;
    item.seasons.forEach((season, sIdx) => {
      temporadasHtml += `
        <h3 style="color: #d4af37; font-size: 1.1rem; margin-bottom: 12px;">Temporada ${season.seasonNumber || (sIdx + 1)}</h3>
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
      `;
      
      (season.episodes || []).forEach((ep, eIdx) => {
        temporadasHtml += `
          <div class="ep-item" data-vurl="${ep.videoUrl || ''}" data-sub="${ep.subEs || ''}" data-audio="${ep.audioEs || ''}" data-title="${ep.title}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(255,255,255,0.05); border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: background 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="color: #d4af37; font-weight: bold; font-size: 14px;">E${eIdx + 1}</span>
              <span style="color: #fff; font-size: 14px;">${ep.title}</span>
            </div>
            <button class="svg-btn" style="width: 34px; height: 34px; background: rgba(212, 175, 55, 0.2); border-color: #d4af37;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#d4af37"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
          </div>
        `;
      });

      temporadasHtml += `</div>`;
    });
    temporadasHtml += `</div>`;
  }

  container.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
      <!-- BANNER / IMAGEN DE DESCRIPCIÓN -->
      <div style="width: 100%; height: 300px; border-radius: 20px; overflow: hidden; position: relative; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.1);">
        <img src="${item.banner || item.poster}" style="width: 100%; height: 100%; object-fit: cover;">
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,10,10,1), transparent);"></div>
      </div>

      <!-- TÍTULO EN ENCABEZADO Y NEGRITA -->
      <h1 style="color: #fff; font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px;">${item.title}</h1>

      <!-- DESCRIPCIÓN NORMAL -->
      <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">${item.description || 'Sin descripción disponible.'}</p>

      <!-- BOTÓN REPRODUCIR (PELÍCULA) -->
      ${item.type === 'pelicula' ? `
        <button id="btnPlayMovie" style="display: inline-flex; align-items: center; gap: 10px; padding: 14px 28px; background: #d4af37; color: #000; font-weight: bold; border: none; border-radius: 12px; font-size: 16px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Reproducir Película
        </button>
      ` : ''}

      <!-- LISTA DE TEMPORADAS Y EPISODIOS (SERIE) -->
      ${temporadasHtml}
    </div>
  `;

  // Evento Película
  if (item.type === 'pelicula') {
    document.getElementById('btnPlayMovie').onclick = () => {
      const subs = item.subUrl ? [{ url: item.subUrl, lang: 'es', label: 'Español' }] : [];
      const audios = item.audioUrl ? [{ url: item.audioUrl, lang: 'Español' }] : [];
      renderPlayer(container, { videoUrl: item.videoUrl, title: item.title, subtitles: subs, audioTracks: audios });
    };
  }

  // Eventos Episodios
  container.querySelectorAll('.ep-item').forEach(epBtn => {
    epBtn.onclick = () => {
      const vUrl = epBtn.getAttribute('data-vurl');
      const title = epBtn.getAttribute('data-title');
      const sub = epBtn.getAttribute('data-sub');
      const audio = epBtn.getAttribute('data-audio');

      const subs = sub ? [{ url: sub, lang: 'es', label: 'Español' }] : [];
      const audios = audio ? [{ url: audio, lang: 'Español' }] : [];

      renderPlayer(container, { videoUrl: vUrl, title: `${item.title} - ${title}`, subtitles: subs, audioTracks: audios });
    };
  });
}
