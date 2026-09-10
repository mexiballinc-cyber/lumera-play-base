// player.js - Reproductor Integrado
export function renderPlayer(container, options = {}) {
  const { 
    videoUrl = '', 
    title = 'Video Lumera', 
    seasons = [], 
    currentSeasonIdx = 0, 
    currentEpisodeIdx = 0,
    onBack = () => {}, 
    onSelectEpisode = null 
  } = options;

  let selectorEpisodiosHtml = '';

  if (seasons.length > 0) {
    selectorEpisodiosHtml = `
      <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap;">
        <select id="playerSeasonSelect" style="padding: 8px 12px; background: #222; color: white; border: 1px solid #444; border-radius: 6px;">
          ${seasons.map((s, idx) => `<option value="${idx}" ${idx === currentSeasonIdx ? 'selected' : ''}>Temporada ${s.seasonNumber || idx + 1}</option>`).join('')}
        </select>
        <select id="playerEpisodeSelect" style="padding: 8px 12px; background: #222; color: white; border: 1px solid #444; border-radius: 6px;">
          ${(seasons[currentSeasonIdx]?.episodes || []).map((ep, idx) => `<option value="${idx}" ${idx === currentEpisodeIdx ? 'selected' : ''}>${ep.title || `Episodio ${idx + 1}`}</option>`).join('')}
        </select>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="max-width: 1000px; margin: 0 auto; padding: 10px; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <button id="btnPlayerBack" style="padding: 8px 16px; background: transparent; border: 1px solid #d4af37; color: #d4af37; border-radius: 8px; cursor: pointer; font-weight: bold;">
          ← Volver
        </button>
        <h2 style="font-size: 1.2rem; color: #fff; margin: 0; text-align: center;">${title}</h2>
        <div style="width: 80px;"></div>
      </div>

      <div style="position: relative; width: 100%; padding-top: 56.25%; background: #000; border-radius: 12px; overflow: hidden; border: 1px solid rgba(212,175,55,0.3);">
        <video id="lumeraVideoElem" controls autoplay style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          <source src="${videoUrl}" type="video/mp4">
          Tu navegador no soporta la reproducción de este video.
        </video>
      </div>

      ${selectorEpisodiosHtml}
    </div>
  `;

  document.getElementById('btnPlayerBack').onclick = () => {
    const video = document.getElementById('lumeraVideoElem');
    if (video) video.pause();
    onBack();
  };

  if (onSelectEpisode && seasons.length > 0) {
    const sSelect = document.getElementById('playerSeasonSelect');
    const eSelect = document.getElementById('playerEpisodeSelect');

    if (sSelect) {
      sSelect.onchange = (e) => {
        const newSIdx = parseInt(e.target.value);
        const epUrl = seasons[newSIdx]?.episodes[0]?.videoUrl || '';
        onSelectEpisode(newSIdx, 0, epUrl);
      };
    }

    if (eSelect) {
      eSelect.onchange = (e) => {
        const newEIdx = parseInt(e.target.value);
        const currentS = parseInt(sSelect.value);
        const epUrl = seasons[currentS]?.episodes[newEIdx]?.videoUrl || '';
        onSelectEpisode(currentS, newEIdx, epUrl);
      };
    }
  }
}
