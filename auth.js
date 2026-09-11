// auth.js - Módulo de Autenticación, Catálogo, Perfiles y Modales
import { cerrarDrawerGlobal } from './app.js';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  collection, 
  getDocs
} from './firebase.js';
import { renderAdminPanel } from './admin.js';
import { renderPlayer } from './player.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let currentPerfilKids = false;
export let currentLang = localStorage.getItem('lumera_lang') || 'es';
let cachedContents = [];

// Diccionario de Traducciones (i18n)
const i18n = {
  es: {
    whoIsWatching: "¿Quién está viendo?",
    signOut: "Cerrar Sesión",
    catalogKids: "Sección Infantil",
    catalogHome: "Inicio",
    play: "Reproducir",
    seasons: "Temporadas",
    season: "Temporada",
    searchPlaceholder: "Buscar películas, series...",
    selectLangTitle: "Seleccionar Idioma",
    noResults: "No se encontraron resultados",
    close: "Cerrar",
    kidsName: "Niños",
    home: "Inicio",
    series: "Series",
    movies: "Películas",
    kids: "Niños",
    profiles: "Perfiles"
  },
  en: {
    whoIsWatching: "Who's watching?",
    signOut: "Sign Out",
    catalogKids: "Kids Section",
    catalogHome: "Home",
    play: "Play",
    seasons: "Seasons",
    season: "Season",
    searchPlaceholder: "Search movies, series...",
    selectLangTitle: "Select Language",
    noResults: "No results found",
    close: "Close",
    kidsName: "Kids",
    home: "Home",
    series: "Series",
    movies: "Movies",
    kids: "Kids",
    profiles: "Profiles"
  }
};

/**
 * Actualiza los textos con atributo data-i18n en el DOM
 */
function aplicarTraduccionesDOM() {
  const text = i18n[currentLang] || i18n.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (text[key]) el.textContent = text[key];
  });
}

/**
 * Cambia el idioma global de la app y refresca las vistas
 */
export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);
  aplicarTraduccionesDOM();
  
  const langSelect = document.getElementById('langSelect');
  if (langSelect) langSelect.value = lang;

  entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
}

/**
 * Modal para cambio de idioma desde el botón de Engranaje
 */
export function abrirModalIdioma() {
  const modal = document.createElement('div');
  modal.id = 'lumeraModalIdioma';
  modal.className = 'glass-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
  `;
  
  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="
      background: #151515;
      border: 1px solid var(--gold-accent);
      padding: 30px;
      border-radius: 16px;
      width: 320px;
      text-align: center;
      color: white;
    ">
      <h3 style="color: var(--gold-accent); margin-top: 0; margin-bottom: 20px;">${text.selectLangTitle}</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn-lang-opt" data-lang="es" style="padding: 12px; background: ${currentLang === 'es' ? 'var(--gold-accent)' : '#222'}; color: ${currentLang === 'es' ? '#000' : '#fff'}; border: 1px solid #444; font-weight: bold; border-radius: 8px; cursor: pointer;">Español</button>
        <button class="btn-lang-opt" data-lang="en" style="padding: 12px; background: ${currentLang === 'en' ? 'var(--gold-accent)' : '#222'}; color: ${currentLang === 'en' ? '#000' : '#fff'}; border: 1px solid #444; font-weight: bold; border-radius: 8px; cursor: pointer;">English</button>
      </div>
      <button id="btnCloseLang" style="margin-top: 20px; background: transparent; border: none; color: #aaa; cursor: pointer;">${text.close}</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.btn-lang-opt').forEach(btn => {
    btn.onclick = () => {
      setLanguage(btn.getAttribute('data-lang'));
      modal.remove();
    };
  });

  document.getElementById('btnCloseLang').onclick = () => modal.remove();
}

/**
 * Modal para búsqueda interactiva desde la Lupa
 */
export function abrirModalBusqueda() {
  const modal = document.createElement('div');
  modal.id = 'lumeraModalBusqueda';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 10, 0.96);
    z-index: 9999;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  `;

  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; width: 100%;">
      <input type="text" id="modalSearchInput" placeholder="${text.searchPlaceholder}" style="
        width: 100%;
        padding: 16px 24px;
        border-radius: 30px;
        background: #1c1c1c;
        border: 2px solid var(--gold-accent);
        color: white;
        font-size: 18px;
        outline: none;
      " autoFocus>
      <button id="btnCloseSearch" style="background: transparent; border: none; color: white; font-size: 28px; cursor: pointer; margin-left: 20px;">✕</button>
    </div>
    <div id="modalSearchResults" style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
      max-width: 900px;
      margin: 20px auto 0 auto;
      width: 100%;
    "></div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('modalSearchInput');
  const results = document.getElementById('modalSearchResults');

  input.oninput = (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      results.innerHTML = '';
      return;
    }

    const filtrados = cachedContents.filter(item => {
      const matchTitle = item.title && item.title.toLowerCase().includes(query);
      const isKidsFilter = currentPerfilKids ? item.isKids === true : true;
      return matchTitle && isKidsFilter;
    });

    if (filtrados.length === 0) {
      results.innerHTML = `<p style="color: #888; grid-column: 1 / -1; text-align: center;">${text.noResults}</p>`;
      return;
    }

    results.innerHTML = filtrados.map(item => `
      <div class="search-item-card" data-json='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="
        cursor: pointer;
        background: #181818;
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid #282828;
      ">
        <img src="${item.poster || ''}" style="width: 100%; height: 210px; object-fit: cover; display: block;">
        <div style="padding: 10px;">
          <p style="color: white; font-size: 13px; font-weight: 600; margin: 0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</p>
        </div>
      </div>
    `).join('');

    results.querySelectorAll('.search-item-card').forEach(card => {
      card.onclick = () => {
        modal.remove();
        abrirModalDetalles(JSON.parse(card.getAttribute('data-json')));
      };
    });
  };

  document.getElementById('btnCloseSearch').onclick = () => modal.remove();
}

// Observador de Autenticación
onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  aplicarTraduccionesDOM();

  if (user) {
    if (user.email === ADMIN_EMAIL) {
      inyectarBotonAdmin();
    }
    renderProfileSelection(container);
  } else {
    renderAuthScreen(container);
  }
});

/**
 * Pantalla de Login
 */
function renderAuthScreen(container) {
  container.innerHTML = `
    <div style="
      max-width: 380px;
      margin: 60px auto;
      background: #141414;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid var(--glass-border);
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: var(--gold-accent); margin: 0; font-size: 28px; font-weight: bold;">LUMERA</h2>
        <p style="color: #777; font-size: 14px; margin-top: 5px;">Bienvenido a la plataforma</p>
      </div>

      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px 16px; background: #222; border: 1px solid #333; color: white; border-radius: 8px; outline: none;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px 16px; background: #222; border: 1px solid #333; color: white; border-radius: 8px; outline: none;">
        <button type="submit" style="padding: 14px; background: var(--gold-accent); border: none; color: black; font-weight: bold; cursor: pointer; border-radius: 8px; margin-top: 10px;">Iniciar Sesión</button>
      </form>
    </div>
  `;

  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const pass = document.getElementById('passwordInput').value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  };
}

/**
 * Pantalla de Selección de Perfiles
 */
function renderProfileSelection(container) {
  const text = i18n[currentLang] || i18n.es;

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; color: white;">
      <h1 style="font-size: 32px; font-weight: 600; margin-bottom: 40px;">${text.whoIsWatching}</h1>
      
      <div style="display: flex; gap: 25px; flex-wrap: wrap; justify-content: center; margin-bottom: 40px;">
        <!-- Perfil Usuario -->
        <div class="profile-card-item" data-kids="false" style="cursor: pointer; text-align: center;">
          <div style="width: 120px; height: 120px; border-radius: 16px; overflow: hidden; background: #222;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <p style="margin-top: 12px; color: #ccc;">Usuario</p>
        </div>

        <!-- Perfil Kids -->
        <div class="profile-card-item" data-kids="true" style="cursor: pointer; text-align: center;">
          <div class="kids-avatar-active" style="width: 120px; height: 120px; border-radius: 16px; overflow: hidden;">
            <img src="https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qd9iat32key2ges8.jpg" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <p style="margin-top: 12px; color: #ccc;">${text.kidsName}</p>
        </div>
      </div>

      <button id="btnSignOutApp" style="background: transparent; border: 1px solid #444; color: #888; padding: 10px 24px; border-radius: 6px; cursor: pointer;">${text.signOut}</button>
    </div>
  `;

  container.querySelectorAll('.profile-card-item').forEach(card => {
    card.onclick = () => {
      const isKids = card.getAttribute('data-kids') === 'true';
      entrarPlataforma({ isKids, filtroTipo: 'todos' });
    };
  });

  document.getElementById('btnSignOutApp').onclick = () => signOut(auth);
}

/**
 * Carga e Inicia el Catálogo Principal
 */
export async function entrarPlataforma({ isKids = false, filtroTipo = 'todos' } = {}) {
  currentPerfilKids = isKids;
  const container = document.getElementById('appContainer');
  const text = i18n[currentLang] || i18n.es;

  try {
    const contentsSnap = await getDocs(collection(db, "contents"));
    cachedContents = [];
    contentsSnap.forEach(d => cachedContents.push({ id: d.id, ...d.data() }));

    const heroSnap = await getDocs(collection(db, "heroes"));
    let heroImages = [];
    heroSnap.forEach(d => heroImages.push(d.data().url));
    if (heroImages.length === 0) {
      heroImages = ["https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1200"];
    }

    container.innerHTML = `
      <div style="max-width: 1300px; margin: 0 auto;">
        <!-- BANNER HERO -->
        <div style="width: 100%; height: 260px; border-radius: 20px; overflow: hidden; border: 1px solid var(--glass-border); margin-bottom: 35px; position: relative;">
          <img src="${heroImages[0]}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <!-- TÍTULO -->
        <h2 style="color: var(--gold-accent); margin-bottom: 20px; font-size: 22px;">
          ${isKids ? text.catalogKids : text.catalogHome}
        </h2>

        <!-- GRID DE CONTENIDO -->
        <div id="catalogArea" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px;"></div>
      </div>
    `;

    const area = document.getElementById('catalogArea');
    const filtrados = cachedContents.filter(item => {
      if (isKids && !item.isKids) return false;
      if (filtroTipo === 'pelicula' && item.type !== 'pelicula') return false;
      if (filtroTipo === 'serie' && item.type !== 'serie') return false;
      return true;
    });

    if (filtrados.length === 0) {
      area.innerHTML = `<p style="color: #666; grid-column: 1/-1;">No hay contenido disponible en esta sección.</p>`;
      return;
    }

    area.innerHTML = filtrados.map(item => `
      <div class="card-media-item" data-json='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="
        background: #141414;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        border: 1px solid #222;
      ">
        <img src="${item.poster || ''}" style="width: 100%; height: 220px; object-fit: cover; display: block;">
        <div style="padding: 12px;">
          <h4 style="color: white; font-size: 13px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
          <span style="color: var(--gold-accent); font-size: 11px; text-transform: uppercase; margin-top: 4px; display: block;">${item.type}</span>
        </div>
      </div>
    `).join('');

    area.querySelectorAll('.card-media-item').forEach(card => {
      card.onclick = () => abrirModalDetalles(JSON.parse(card.getAttribute('data-json')));
    });

  } catch (e) {
    console.error("Error al cargar plataforma:", e);
    container.innerHTML = `<p style="color: white; text-align: center; margin-top: 50px;">Error al cargar datos del catálogo.</p>`;
  }
}

/**
 * Modal de Detalles a Pantalla Completa (Full Screen + Backdrop Blur)
 */
function abrirModalDetalles(item) {
  const modal = document.createElement('div');
  modal.id = 'lumeraModalDetallesFull';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background-color: #0a0a0a;
    background-image: linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.85) 60%, #0a0a0a 100%), url('${item.banner || item.poster || ''}');
    background-size: cover;
    background-position: center top;
    overflow-y: auto;
    color: white;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
  `;

  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="max-width: 1000px; margin: 0 auto; width: 100%; position: relative; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- BOTÓN CERRAR -->
      <button id="btnCloseDetFull" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2); color: white; width: 44px; height: 44px; border-radius: 50%; font-size: 22px; cursor: pointer; backdrop-filter: blur(8px);">✕</button>

      <!-- INFORMACIÓN PRINCIPAL (ARRIBA Y CENTRO) -->
      <div style="margin-top: 100px; max-width: 650px;">
        <span style="color: var(--gold-accent); text-transform: uppercase; font-weight: bold; font-size: 13px; letter-spacing: 2px;">${item.type}</span>
        <h1 style="font-size: 48px; font-weight: 800; margin: 10px 0 20px 0; text-shadow: 0 4px 20px rgba(0,0,0,0.9); text-transform: uppercase;">${item.title}</h1>
        
        <p style="color: #ddd; font-size: 16px; line-height: 1.6; text-shadow: 0 2px 10px rgba(0,0,0,0.9); margin-bottom: 30px;">
          ${item.description || 'Sin descripción disponible.'}
        </p>

        <!-- BOTÓN REPRODUCIR -->
        <button id="btnPlayMainFull" style="
          padding: 16px 40px;
          background: var(--gold-accent);
          border: none;
          border-radius: 35px;
          font-weight: bold;
          color: black;
          cursor: pointer;
          font-size: 18px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
          transition: transform 0.2s;
        ">▶ ${text.play}</button>
      </div>

      <!-- SECCIÓN DE TEMPORADAS (SOLO SI ES SERIE) -->
      <div id="episodesAreaFull" style="margin-top: 60px; margin-bottom: 40px;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseDetFull').onclick = () => modal.remove();

  // Si es serie, inyectar el listado de temporadas y episodios
  if (item.type === 'serie' && item.seasons && item.seasons.length > 0) {
    const area = document.getElementById('episodesAreaFull');
    area.innerHTML = `<h2 style="color: var(--gold-accent); border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; font-size: 24px;">${text.seasons}</h2>`;

    item.seasons.forEach((s, sIdx) => {
      area.innerHTML += `<h3 style="color: #fff; margin-top: 25px;">${s.name || `${text.season} ${sIdx + 1}`}</h3>`;

      const epContainer = document.createElement('div');
      epContainer.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 12px;";

      (s.episodes || []).forEach((ep, eIdx) => {
        const epCard = document.createElement('div');
        epCard.style.cssText = "padding: 16px; background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; backdrop-filter: blur(10px);";
        epCard.innerHTML = `
          <div>
            <strong style="display: block; font-size: 14px;">E${eIdx + 1}: ${ep.title || 'Episodio'}</strong>
          </div>
          <span style="color: var(--gold-accent); font-size: 13px; font-weight: bold;">▶ Play</span>
        `;

        epCard.onclick = () => {
          modal.remove();
          renderPlayer(document.getElementById('appContainer'), { 
            videoUrl: ep.videoUrl, 
            title: `${item.title} - ${ep.title || 'Episodio'}`,
            tracks: ep.subtitles || {}
          });
        };

        epContainer.appendChild(epCard);
      });

      area.appendChild(epContainer);
    });
  }

  document.getElementById('btnPlayMainFull').onclick = () => {
    modal.remove();
    let url = item.videoUrl;
    if (item.type === 'serie' && item.seasons?.[0]?.episodes?.[0]) {
      url = item.seasons[0].episodes[0].videoUrl;
    }
    renderPlayer(document.getElementById('appContainer'), { 
      videoUrl: url, 
      title: item.title, 
      tracks: item.subtitles || {} 
    });
  };
}

function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btn = document.createElement('button');
    btn.id = 'btnAdminSecret';
    btn.className = 'svg-btn';
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    btn.onclick = () => renderAdminPanel(document.getElementById('appContainer'));
    navRight.prepend(btn);
  }
}
