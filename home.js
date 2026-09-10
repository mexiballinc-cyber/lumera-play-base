// home.js - Vista Principal de Lumera
// Muestra el Header con Avatar y Buscador, Carrusel Hero Banner y Catálogo por Categorías Dinámicas.

import { db } from './db.js';
import { state, updateState } from './state.js';

let heroInterval = null;
let currentHeroIndex = 0;

/**
 * Renderiza la pantalla principal (Home).
 * @param {HTMLElement} container - Contenedor principal del DOM.
 */
export async function renderHome(container) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  // Limpiar temporizadores anteriores
  if (heroInterval) {
    clearInterval(heroInterval);
    heroInterval = null;
  }

  // Carga de datos desde IndexedDB
  let allMedia = [];
  let heroList = [];
  let activeProfile = state.activeProfile || { name: 'Usuario', avatarUrl: 'https://via.placeholder.com/40' };

  try {
    allMedia = (await db.getAll('media')) || [];
    heroList = (await db.getAll('heroes')) || [];
  } catch (err) {
    console.warn('Error al cargar datos en home.js:', err);
  }

  // Filtrado de contenido según búsqueda activa
  const searchQuery = state.searchQuery ? state.searchQuery.toLowerCase().trim() : '';
  const filteredMedia = searchQuery 
    ? allMedia.filter(m => m.title.toLowerCase().includes(searchQuery) || m.category?.toLowerCase().includes(searchQuery))
    : allMedia;

  // Obtener categorías únicas presentes en la app o estado global
  const activeCategories = Array.from(new Set([...state.categories, ...allMedia.map(m => m.category).filter(Boolean)]));

  container.innerHTML = `
    <div class="home-wrapper" style="min-height: 100vh; background-color: #0b0b0e; color: #ffffff; padding-bottom: 60px;">
      
      <!-- HEADER / NAVEGACIÓN SUPERIOR -->
      <header class="lumera-header" style="position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 15px 4%; background: rgba(11, 11, 14, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.05);">
        
        <div class="header-left" style="display: flex; align-items: center; gap: 25px;">
          <h1 class="logo-text" style="margin: 0; color: #d4af37; font-size: 1.8rem; font-weight: 800; tracking-letter: 1px; cursor: pointer;">LUMERA</h1>
          
          <div class="search-box-container" style="position: relative;">
            <input type="text" id="inputHomeSearch" placeholder="Buscar películas, series..." value="${state.searchQuery || ''}" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.2); color: white; padding: 8px 16px; border-radius: 20px; outline: none; width: 220px; font-size: 0.9rem; transition: all 0.3s ease;">
          </div>
        </div>

        <div class="header-right" style="display: flex; align-items: center; gap: 15px;">
          <button id="btnOpenAdmin" style="background: rgba(212,175,55,0.15); border: 1px solid #d4af37; color: #d4af37; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: 0.2s;">
            ⚙ Panel Maestro
          </button>

          <div id="btnProfileMenu" style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: rgba(255,255,255,0.05); padding: 4px 10px 4px 4px; border-radius: 25px; border: 1px solid rgba(255,255,255,0.1);">
            <img src="${activeProfile.avatarUrl}" alt="Avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid #d4af37;">
            <span style="font-size: 0.85rem; font-weight: 500;">${activeProfile.name}</span>
          </div>
        </div>

      </header>

      <!-- SECCIÓN HERO CARROUSEL (Sólo si no hay búsqueda activa) -->
      ${!searchQuery && heroList.length > 0 ? `
        <section id="heroSection" class="hero-section" style="position: relative; width: 100%; height: 55vh; min-height: 380px; overflow: hidden; margin-bottom: 30px;">
          <div id="heroImageContainer" style="width: 100%; height: 100%; position: absolute; inset: 0; background-size: cover; background-position: center; transition: background-image 0.8s ease-in-out;">
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,11,14,0.2) 0%, rgba(11,11,14,1) 100%);"></div>
          </div>
          
          <div style="position: absolute; bottom: 40px; left: 4%; z-index: 2; max-width: 500px;">
            <span style="background: #d4af37; color: black; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">Destacado</span>
            <h2 id="heroTitle" style="font-size: 2.2rem; margin: 10px 0; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">Lumera Original</h2>
            <p style="color: #ccc; font-size: 0.95rem; line-height: 1.4; margin-bottom: 20px;">Disfruta de la máxima calidad de streaming en audio multilingüe y subtítulos adaptativos.</p>
          </div>

          <div id="heroDots" style="position: absolute; bottom: 20px; right: 4%; display: flex; gap: 8px; z-index: 2;">
            ${heroList.map((_, i) => `<span class="hero-dot" data-index="${i}" style="width: 10px; height: 10px; border-radius: 50%; background: ${i === 0 ? '#d4af37' : 'rgba(255,255,255,0.4)'}; cursor: pointer;"></span>`).join('')}
          </div>
        </section>
      ` : ''}

      <!-- CATALOGO Y CATEGORÍAS -->
      <main class="content-catalog" style="padding: 0 4%;">
        
        ${searchQuery ? `
          <h2 style="font-size: 1.3rem; color: #d4af37; margin-bottom: 20px;">Resultados para: "${searchQuery}" (${filteredMedia.length})</h2>
          <div class="media-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px;">
            ${filteredMedia.map(item => renderMediaCard(item)).join('')}
          </div>
        ` : `
          <!-- VISTA POR FILAS DE CATEGORÍAS (PUNTO 6) -->
          ${activeCategories.map(cat => {
            const itemsInCat = allMedia.filter(m => m.category === cat);
            if (itemsInCat.length === 0) return '';

            return `
              <section class="category-row-section" style="margin-bottom: 35px;">
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #ffffff; margin-bottom: 14px; border-left: 3px solid #d4af37; padding-left: 10px;">${cat}</h3>
                <div class="row-carousel" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 10px; scroll-behavior: smooth;">
                  ${itemsInCat.map(item => renderMediaCard(item)).join('')}
                </div>
              </section>
            `;
          }).join('')}
        `}

      </main>

    </div>
  `;

  // RENDERIZADO DE TARGETAS DE CONTENIDO
  function renderMediaCard(item) {
    return `
      <div class="media-card" data-id="${item.id}" style="flex: 0 0 160px; cursor: pointer; transition: transform 0.25s ease, box-shadow 0.25s ease; border-radius: 8px; overflow: hidden; background: #151518; position: relative;">
        <img src="${item.poster || 'https://via.placeholder.com/160x240'}" alt="${item.title}" style="width: 100%; height: 230px; object-fit: cover; display: block;">
        <div class="card-overlay" style="padding: 10px; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%); position: absolute; bottom: 0; left: 0; right: 0;">
          <span style="font-size: 0.7rem; color: #d4af37; text-transform: uppercase; font-weight: bold;">${item.type === 'series' ? 'Serie' : 'Película'}</span>
          <h4 style="margin: 2px 0 0 0; font-size: 0.9rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
        </div>
      </div>
    `;
  }

  // LÓGICA DEL CARRUSEL HERO AUTO-ROTATIVO
  if (!searchQuery && heroList.length > 0) {
    const heroBg = document.getElementById('heroImageContainer');
    const dots = container.querySelectorAll('.hero-dot');

    function setHero(index) {
      currentHeroIndex = index;
      if (heroBg && heroList[currentHeroIndex]) {
        heroBg.style.backgroundImage = `url('${heroList[currentHeroIndex].url}')`;
      }
      dots.forEach((dot, i) => {
        dot.style.background = i === currentHeroIndex ? '#d4af37' : 'rgba(255,255,255,0.4)';
      });
    }

    setHero(0);

    if (heroList.length > 1) {
      heroInterval = setInterval(() => {
        const nextIndex = (currentHeroIndex + 1) % heroList.length;
        setHero(nextIndex);
      }, 5000);
    }

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        setHero(idx);
      });
    });
  }

  // EVENT LISTENERS DE NAVEGACIÓN Y BÚSQUEDA
  const searchInput = document.getElementById('inputHomeSearch');
  searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderHome(container);
  });

  document.getElementById('btnOpenAdmin')?.addEventListener('click', () => {
    updateState('currentView', 'admin');
  });

  document.getElementById('btnProfileMenu')?.addEventListener('click', () => {
    updateState('currentView', 'profiles');
  });

  // SELECCIÓN DE CONTENIDO (ABRIR DETALLES)
  container.querySelectorAll('.media-card').forEach(card => {
    card.addEventListener('click', async () => {
      const id = card.dataset.id;
      const selectedItem = allMedia.find(m => String(m.id) === String(id));
      if (selectedItem) {
        state.selectedMedia = selectedItem;
        updateState('currentView', 'details');
      }
    });
  });
}
