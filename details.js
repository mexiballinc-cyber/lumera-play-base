// details.js - Ficha técnica de películas y series
export function openDetailsModal(item, onClose, onPlay) {
  // Remover modal previo si existe
  const existingModal = document.getElementById('lumeraDetailsModal');
  if (existingModal) existingModal.remove();

  let selectedEpisodeVideo = item.videoUrl || '';
  let selectedSubtitles = item.subtitles || {};
  let selectedAudios = item.audios || {};

  const modal = document.createElement('div');
  modal.id = 'lumeraDetailsModal';
  modal.className = 'modal glass-modal';
  
  // Construcción del HTML interno
  modal.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: 750px; width: 90%; position: relative; max-height: 90vh; overflow-y: auto; padding: 25px;">
      <button id="btnCloseDetails" class="icon-btn" style="position: absolute; top: 15px; right: 15px; z-index: 10; background: rgba(0,0,0,0.6); border-radius: 50%; width: 35px; height: 35px;">✕</button>
      
      <!-- Banner de Fondo -->
      <div style="height: 280px; background: linear-gradient(to top, #090a0f, transparent), url('${item.banner || item.cover}') center/cover; border-radius: 10px; margin-bottom: 20px;"></div>
      
      <!-- Información del Contenido -->
      <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
        <span style="background: var(--accent-color); padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${item.type === 'series' ? 'Serie' : 'Película'}</span>
        <span style="background: rgba(255,255,255,0.15); padding: 3px 8px; border-radius: 4px; font-size: 12px;">${item.isForMinorsOver7 ? '+7 Años' : 'Para Todos (Kids)'}</span>
      </div>

      <h1 style="font-size: 2rem; margin-bottom: 10px;">${item.title}</h1>
      <p style="color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">${item.description || 'Sin descripción disponible.'}</p>

      <!-- Selector de Temporadas/Episodios si es Serie -->
      ${item.type === 'series' && item.seasons && item.seasons.length > 0 ? `
        <div style="margin: 20px 0; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid var(--glass-border);">
          <h3 style="margin-bottom: 10px;">Temporadas y Episodios</h3>
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <select id="selectSeason" style="padding: 8px 12px; background: #1a1c23; color: #fff; border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer;">
              ${item.seasons.map((s, idx) => `<option value="${idx}">${s.name || 'Temporada ' + (idx + 1)}</option>`).join('')}
            </select>
          </div>
          <div id="episodesContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto;"></div>
        </div>
      ` : ''}

      <!-- Acciones principales -->
      <div style="display: flex; gap: 15px; margin-top: 25px;">
        <button id="btnPlayMedia" style="flex: 1; padding: 14px; background: var(--accent-color); border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer; transition: transform 0.2s;">▶ Reproducir</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Lógica de interacción de Series
  if (item.type === 'series' && item.seasons && item.seasons.length > 0) {
    const selectSeason = document.getElementById('selectSeason');
    const episodesContainer = document.getElementById('episodesContainer');

    const updateEpisodesList = (seasonIndex) => {
      const season = item.seasons[seasonIndex];
      if (!season || !season.episodes) {
        episodesContainer.innerHTML = '<p style="color: var(--text-muted);">No hay episodios en esta temporada.</p>';
        return;
      }

      episodesContainer.innerHTML = season.episodes.map((ep, idx) => `
        <div class="ep-item ${idx === 0 ? 'selected-ep' : ''}" data-idx="${idx}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer;">
          <div>
            <strong>E${idx + 1}: ${ep.title}</strong>
            <p style="font-size: 12px; color: var(--text-muted);">${ep.description || ''}</p>
          </div>
          <span style="font-size: 18px;">▶</span>
        </div>
      `).join('');

      // Auto-seleccionar primer episodio por defecto
      if (season.episodes[0]) {
        selectedEpisodeVideo = season.episodes[0].videoUrl;
        selectedSubtitles = season.episodes[0].subtitles || {};
        selectedAudios = season.episodes[0].audios || {};
      }

      // Evento al presionar un episodio de la lista
      episodesContainer.querySelectorAll('.ep-item').forEach(epEl => {
        epEl.onclick = () => {
          episodesContainer.querySelectorAll('.ep-item').forEach(e => e.style.border = 'none');
          epEl.style.border = '1px solid var(--accent-color)';
          const epData = season.episodes[epEl.dataset.idx];
          selectedEpisodeVideo = epData.videoUrl;
          selectedSubtitles = epData.subtitles || {};
          selectedAudios = epData.audios || {};
        };
      });
    };

    selectSeason.onchange = (e) => updateEpisodesList(e.target.value);
    updateEpisodesList(0);
  }

  // Cierre de modal
  document.getElementById('btnCloseDetails').onclick = () => {
    modal.remove();
    if (onClose) onClose();
  };

  // Botón de Inicio de Reproducción
  document.getElementById('btnPlayMedia').onclick = () => {
    modal.remove();
    if (onPlay) {
      onPlay({
        title: item.title,
        videoUrl: selectedEpisodeVideo,
        subtitles: selectedSubtitles,
        audios: selectedAudios
      });
    }
  };
}
