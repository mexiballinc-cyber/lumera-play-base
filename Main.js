import { openDetailsModal } from './details.js';
import { openPlayer } from './player.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export async function renderMainView(container, filterType = 'all', isKids = false) {
  container.innerHTML = `<div style="padding: 100px; text-align: center;"><h2>Cargando contenido de Lumera...</h2></div>`;

  try {
    const snap = await getDocs(collection(window.db, "content"));
    let items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    // Filtro Kids (Excluye contenido para mayores de 7 años si el perfil es Kids)
    if (isKids) {
      items = items.filter(item => !item.isForMinorsOver7);
    }

    // Filtro por sección (Home, Movies, Series)
    if (filterType === 'movies') items = items.filter(i => i.type === 'movie');
    if (filterType === 'series') items = items.filter(i => i.type === 'series');

    const heroItem = items[0] || {
      title: "Bienvenido a Lumera 3.0",
      description: "El cascarón está listo para cargar tu contenido dinámico.",
      cover: "https://i.imgur.com/YMTYgCS.png"
    };

    const continueWatching = JSON.parse(localStorage.getItem('lumera_continue') || '[]');

    container.innerHTML = `
      <!-- HERO DINÁMICO -->
      <div class="hero-banner" style="height: 60vh; background: linear-gradient(to top, var(--bg-dark), transparent), url('${heroItem.banner || heroItem.cover}') center/cover; display: flex; align-items: flex-end; padding: 40px;">
        <div class="hero-info" style="max-width: 500px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 10px;">${heroItem.title}</h1>
          <p style="color: var(--text-muted); margin-bottom: 20px;">${heroItem.description || ''}</p>
          <button id="btnPlayHero" style="padding: 12px 24px; background: var(--accent-color); border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">▶ Reproducir</button>
        </div>
      </div>

      <div class="catalog-sections" style="padding: 20px;">
        <!-- FILA: CONTINUAR VIENDO (LOCALSTORAGE) -->
        ${continueWatching.length > 0 ? `
          <div class="row-section" style="margin-bottom: 30px;">
            <h3>Continuar Viendo</h3>
            <div class="media-row" style="display: flex; gap: 15px; overflow-x: auto; padding: 10px 0;">
              ${continueWatching.map(item => createCardHTML(item, isKids)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- FILA: CATÁLOGO PRINCIPAL -->
        <div class="row-section">
          <h3>${isKids ? 'Contenido Infantil' : 'Destacados'}</h3>
          <div class="media-row" style="display: flex; gap: 15px; overflow-x: auto; padding: 10px 0;">
            ${items.map(item => createCardHTML(item, isKids)).join('')}
          </div>
        </div>
      </div>
    `;

    // Eventos
    const btnHero = document.getElementById('btnPlayHero');
    if (btnHero && heroItem.id) {
      btnHero.onclick = () => saveAndPlay(heroItem);
    }

    container.querySelectorAll('.media-card').forEach(card => {
      card.onclick = () => {
        const selected = items.find(i => i.id === card.dataset.id);
        if (selected) {
          openDetailsModal(selected, null, (media) => saveAndPlay(media));
        }
      };
    });

  } catch (err) {
    container.innerHTML = `<div style="padding: 100px; text-align: center;"><h2>Error al conectar con Firestore.</h2></div>`;
  }
}

function createCardHTML(item, isKids) {
  return `
    <div class="media-card ${isKids ? 'rainbow-avatar' : ''}" data-id="${item.id}" style="min-width: 160px; cursor: pointer;">
      <img src="${item.cover}" style="width: 100%; height: 230px; object-fit: cover; border-radius: 8px;">
      <p style="margin-top: 5px; font-weight: 500; font-size: 14px;">${item.title}</p>
    </div>
  `;
}

function saveAndPlay(item) {
  let list = JSON.parse(localStorage.getItem('lumera_continue') || '[]');
  list = list.filter(i => i.id !== item.id);
  list.unshift(item);
  localStorage.setItem('lumera_continue', JSON.stringify(list.slice(0, 10)));
  openPlayer(item);
}
