// details.js - Renderizado exclusivo de detalles de películas y series
import { state, updateState } from './state.js';
import { translations } from './translations.js';

/**
 * Renderiza la vista de detalles completa en el contenedor principal.
 * @param {Object} item - Objeto con la información de la película o serie.
 */
export function renderDetailsScreen(item) {
  state.selectedDetailMedia = item;
  const lang = state.currentLang || 'es';
  const t = translations[lang] || translations['es'];
  const appContainer = document.getElementById('appContainer');

  if (!appContainer || !item) return;

  const isSeries = item.type === 'series' && Array.isArray(item.episodes);

  // Generar HTML para audios y subtítulos disponibles
  const audiosBadges = (item.availableAudios || ['es'])
    .map(a => `<span class="badge badge-audio">${a.toUpperCase()}</span>`)
    .join(' ');
    
  const subsBadges = (item.availableSubtitles || ['off'])
    .map(s => `<span class="badge badge-sub">${s === 'off' ? 'Sin Subs' : s.toUpperCase()}</span>`)
    .join(' ');

  // Renderizado de lista de episodios si es serie
  let episodesHTML = '';
  if (isSeries && item.episodes.length > 0) {
    episodesHTML = `
      <div class="episodes-section">
        <h3 class="section-subtitle">Episodios</h3>
        <div class="episodes-list">
          ${item.episodes.map((ep, index) => `
            <div class="episode-card" data-episode-index="${index}">
              <div class="episode-thumbnail">
                <img src="${ep.thumbnail || item.poster || 'https://via.placeholder.com/160x90'}" alt="${ep.title}">
                <button class="btn-play-episode" data-index="${index}">▶</button>
              </div>
              <div class="episode-info">
                <h4>E${index + 1}: ${ep.title || `Episodio ${index + 1}`}</h4>
                <p>${ep.description || 'Sin descripción disponible.'}</p>
                <span class="episode-duration">${ep.duration || '24m'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  appContainer.innerHTML = `
    <div class="details-screen">
      <div class="details-hero" style="background-image: linear-gradient(to top, rgba(10,10,12,1), rgba(10,10,12,0.4)), url('${item.banner || item.poster}');">
        <button id="btnBackDetails" class="btn-back">← Volver</button>
        <div class="details-content">
          <h1 class="details-title">${item.title}</h1>
          <div class="details-meta">
            <span class="meta-year">${item.year || '2026'}</span>
            <span class="meta-rating">${item.rating || '13+'}</span>
            <span class="meta-category">${item.category || 'General'}</span>
          </div>
          <p class="details-description">${item.description || 'Sin sinopsis disponible.'}</p>
          
          <div class="details-tracks-info">
            <div class="track-group"><strong>Idiomas de audio:</strong> ${audiosBadges}</div>
            <div class="track-group"><strong>Subtítulos:</strong> ${subsBadges}</div>
          </div>

          <div class="details-actions">
            <button id="btnStartPlayback" class="btn-primary">
              ▶ ${t.play || 'Reproducir'}
            </button>
            <button id="btnAddMyList" class="btn-secondary">
              + ${t.myList || 'Mi Lista'}
            </button>
          </div>
        </div>
      </div>
      ${episodesHTML}
    </div>
  `;

  // Event Listeners
  document.getElementById('btnBackDetails')?.addEventListener('click', () => {
    updateState('currentView', 'home');
  });

  document.getElementById('btnStartPlayback')?.addEventListener('click', () => {
    if (isSeries && item.episodes.length > 0) {
      startEpisodePlayback(0);
    } else {
      startMoviePlayback();
    }
  });

  // Eventos de selección de episodios individuales
  const episodeButtons = appContainer.querySelectorAll('.btn-play-episode, .episode-card');
  episodeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index || btn.closest('.episode-card')?.dataset.episodeIndex, 10);
      if (!isNaN(idx)) {
        startEpisodePlayback(idx);
      }
    });
  });
}

function startMoviePlayback() {
  const media = state.selectedDetailMedia;
  if (!media) return;

  state.player.currentMedia = media;
  state.player.episodesList = [];
  state.player.currentIndex = 0;
  state.player.availableAudios = media.availableAudios || ['es'];
  state.player.availableSubtitles = media.availableSubtitles || ['off'];

  updateState('currentView', 'player');
}

function startEpisodePlayback(index) {
  const media = state.selectedDetailMedia;
  if (!media || !media.episodes || !media.episodes[index]) return;

  const episode = media.episodes[index];
  state.player.currentMedia = episode;
  state.player.episodesList = media.episodes;
  state.player.currentIndex = index;
  state.player.availableAudios = episode.availableAudios || media.availableAudios || ['es'];
  state.player.availableSubtitles = episode.availableSubtitles || media.availableSubtitles || ['off'];

  updateState('currentView', 'player');
}
