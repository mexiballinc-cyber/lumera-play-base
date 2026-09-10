// details.js - Vista de Detalles de Películas y Series en Lumera
// Muestra sinopsis, ficha técnica, botón de reproducción y selector de episodios para series.

import { state, updateState } from './state.js';

/**
 * Renderiza la vista de detalles para el contenido seleccionado.
 * @param {HTMLElement} container - Contenedor principal donde se insertará la vista.
 */
export function renderDetails(container) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  const item = state.selectedMedia;

  // Redirigir al catálogo si no existe un ítem seleccionado
  if (!item) {
    updateState('currentView', 'home');
    return;
  }

  const isSeries = item.type === 'series';
  const episodes = isSeries && Array.isArray(item.episodes) ? item.episodes : [];
  const bannerBg = item.banner || item.poster || '';

  container.innerHTML = `
    <div class="details-wrapper" style="min-height: 100vh; background: #0b0b0e; color: #ffffff; padding-bottom: 60px;">
      
      <!-- BANNER DE FONDO -->
      <div class="details-hero" style="position: relative; width: 100%; height: 58vh; min-height: 380px; background: url('${bannerBg}') center/cover no-repeat;">
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,11,14,0.3) 0%, rgba(11,11,14,1) 100%);"></div>
        
        <!-- BOTÓN VOLVER -->
        <button id="btnBackToHome" style="position: absolute; top: 25px; left: 4%; z-index: 10; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 9px 18px; border-radius: 20px; cursor: pointer; font-size: 0.85rem; font-weight: bold; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 8px;">
          ← Volver al Catálogo
        </button>

        <!-- INFORMACIÓN DEL CONTENIDO -->
        <div class="details-hero-content" style="position: absolute; bottom: 25px; left: 4%; right: 4%; z-index: 5; display: flex; gap: 28px; align-items: flex-end; max-width: 1200px; margin: 0 auto;">
          
          <img src="${item.poster || 'https://via.placeholder.com/180x260'}" alt="${item.title}" style="width: 180px; height: 260px; object-fit: cover; border-radius: 12px; border: 2px solid rgba(212,175,55,0.4); box-shadow: 0 12px 35px rgba(0,0,0,0.8); flex-shrink: 0;">
          
          <div style="flex: 1;">
            <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
              <span style="background: #d4af37; color: #000; font-size: 0.75rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${isSeries ? 'Serie' : 'Película'}</span>
              <span style="color: #aaa; font-size: 0.85rem; font-weight: 500;">${item.category || 'General'}</span>
            </div>

            <h1 style="font-size: 2.4rem; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; text-shadow: 0 2px 12px rgba(0,0,0,0.9); line-height: 1.1;">${item.title}</h1>
            
            <p style="color: #ccc; font-size: 0.95rem; line-height: 1.5; max-width: 720px; margin-bottom: 22px; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">${item.description || 'Sin descripción disponible para este título.'}</p>

            <div style="display: flex; gap: 15px; align-items: center;">
              <button id="btnPlayMain" style="background: #d4af37; color: #000; border: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.2s ease, background 0.2s ease;">
                ▶ Reproducir ${isSeries ? 'Episodio 1' : ''}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- SECCIÓN DE EPISODIOS EN CASO DE SERIE -->
      ${isSeries ? `
        <section class="episodes-section" style="max-width: 1200px; margin: 40px auto 0 auto; padding: 0 4%;">
          <h2 style="font-size: 1.35rem; color: #d4af37; margin-bottom: 20px; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 10px; font-weight: 700;">Episodios Disponibles</h2>

          <div class="episodes-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            ${episodes.length === 0 ? `
              <p style="color: #888; font-style: italic;">No hay episodios disponibles creados en esta serie.</p>
            ` : episodes.map((ep, idx) => `
              <div class="episode-card" data-index="${idx}" style="background: #151518; border: 1px solid #2a2a30; border-radius: 10px; padding: 16px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <span style="font-size: 0.72rem; color: #d4af37; font-weight: 800; display: block; margin-bottom: 4px; text-transform: uppercase;">Episodio ${idx + 1}</span>
                  <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 600;">${ep.title || `Episodio ${idx + 1}`}</h4>
                </div>
                <div style="background: rgba(212,175,55,0.15); border: 1px solid #d4af37; color: #d4af37; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0;">
                  ▶
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

    </div>
  `;

  // MANEJO DE EVENTOS

  // Botón Regresar
  document.getElementById('btnBackToHome')?.addEventListener('click', () => {
    updateState('currentView', 'home');
  });

  // Botón Reproducir Principal
  document.getElementById('btnPlayMain')?.addEventListener('click', () => {
    state.player = {
      currentMedia: item,
      currentIndex: 0,
      episodesList: isSeries ? episodes : [],
      selectedAudio: 'es',
      selectedSubtitle: 'off'
    };
    updateState('currentView', 'player');
  });

  // Clic en tarjetas de episodios individuales
  if (isSeries) {
    container.querySelectorAll('.episode-card').forEach(card => {
      card.addEventListener('click', () => {
        const epIndex = parseInt(card.dataset.index, 10);
        state.player = {
          currentMedia: item,
          currentIndex: epIndex,
          episodesList: episodes,
          selectedAudio: 'es',
          selectedSubtitle: 'off'
        };
        updateState('currentView', 'player');
      });
    });
  }
}
