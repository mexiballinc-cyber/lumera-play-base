// search.js - Pantalla dedicada de búsqueda y filtrado de contenido
import { state, updateState } from './state.js';
import { db } from './db.js';
import { renderDetailsScreen } from './details.js';

let allMediaItems = [];

/**
 * Renderiza la pantalla dedicada de búsqueda independiente.
 */
export async function renderSearchScreen() {
  const appContainer = document.getElementById('appContainer');
  if (!appContainer) return;

  // Cargar elementos desde IndexedDB
  try {
    allMediaItems = await db.getAll('media') || [];
  } catch (err) {
    console.warn('Error al cargar contenido para búsqueda:', err);
    allMediaItems = [];
  }

  const categories = state.categories || ['Todas', 'Acción', 'Drama', 'Comedia', 'Ciencia Ficción', 'Niños'];

  appContainer.innerHTML = `
    <div class="search-view-container">
      <div class="search-header-box">
        <input type="text" id="searchInputField" class="search-input-large" placeholder="Escribe para buscar películas, series..." value="${state.search.query}" autofocus />
      </div>

      <div class="search-categories-bar">
        <button class="cat-chip active" data-cat="all">Todas</button>
        ${categories.map(cat => `<button class="cat-chip" data-cat="${cat}">${cat}</button>`).join('')}
      </div>

      <div class="search-results-grid" id="searchResultsGrid">
        <!-- Tarjetas de resultados dinámicas -->
      </div>
    </div>
  `;

  const input = document.getElementById('searchInputField');
  const resultsGrid = document.getElementById('searchResultsGrid');

  // Event Listener para búsqueda en tiempo real
  input?.addEventListener('input', (e) => {
    state.search.query = e.target.value.toLowerCase().trim();
    filterAndRenderResults(resultsGrid);
  });

  // Event Listener para chips de categorías
  const chips = appContainer.querySelectorAll('.cat-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterAndRenderResults(resultsGrid, chip.dataset.cat);
    });
  });

  // Render inicial
  filterAndRenderResults(resultsGrid);
}

function filterAndRenderResults(container, selectedCategory = 'all') {
  if (!container) return;

  const query = state.search.query;

  const filtered = allMediaItems.filter(item => {
    const matchesQuery = !query || item.title?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-results"><p>No se encontraron resultados para tu búsqueda.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="media-card" data-media-id="${item.id}">
      <img src="${item.poster || 'https://via.placeholder.com/180x270'}" alt="${item.title}" loading="lazy" />
      <div class="media-card-info">
        <h5>${item.title}</h5>
        <span>${item.type === 'series' ? 'Serie' : 'Película'}</span>
      </div>
    </div>
  `).join('');

  // Vincular clics para ir a la vista de detalles
  container.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', () => {
      const mediaId = card.dataset.mediaId;
      const selected = allMediaItems.find(m => String(m.id) === String(mediaId));
      if (selected) {
        renderDetailsScreen(selected);
      }
    });
  });
}
