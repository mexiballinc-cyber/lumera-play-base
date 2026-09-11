// auth.js - Módulo de Autenticación, Catálogo, Perfiles y Modales
import { cerrarDrawerGlobal } from './app.js';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc,
  updateDoc
} from './firebase.js';
import { renderAdminPanel } from './admin.js';
import { renderPlayer } from './player.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let currentPerfilKids = false;
let currentPerfilData = null;
export let currentLang = localStorage.getItem('lumera_lang') || 'es';
let cachedContents = [];

// Diccionario de Traducciones (i18n)
const i18n = {
  es: {
    whoIsWatching: "¿Quién está viendo?",
    addProfile: "Añadir Perfil",
    signOut: "Cerrar Sesión",
    catalogKids: "Sección Infantil",
    catalogHome: "Inicio",
    movies: "Películas",
    series: "Series",
    loading: "Cargando Lumera...",
    play: "Reproducir",
    details: "Detalles",
    seasons: "Temporadas",
    season: "Temporada",
    episode: "Episodio",
    searchPlaceholder: "Buscar películas, series...",
    selectLangTitle: "Seleccionar Idioma",
    noResults: "No se encontraron resultados",
    episodes: "Episodios",
    close: "Cerrar",
    kidsName: "Niños"
  },
  en: {
    whoIsWatching: "Who's watching?",
    addProfile: "Add Profile",
    signOut: "Sign Out",
    catalogKids: "Kids Section",
    catalogHome: "Home",
    movies: "Movies",
    series: "Series",
    loading: "Loading Lumera...",
    play: "Play",
    details: "Details",
    seasons: "Seasons",
    season: "Season",
    episode: "Episode",
    searchPlaceholder: "Search movies, series...",
    selectLangTitle: "Select Language",
    noResults: "No results found",
    episodes: "Episodes",
    close: "Close",
    kidsName: "Kids"
  }
};

/**
 * Cambia el idioma global de la app y refresca las vistas activas
 */
export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);
  entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
}

/**
 * Modal para cambio de idioma desde el botón de Engranaje
 */
export function abrirModalIdioma() {
  const modal = document.createElement('div');
  modal.id = 'lumeraModalIdioma';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(8px);
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="
      background: #151515;
      border: 1px solid #d4af37;
      padding: 30px;
      border-radius: 16px;
      width: 320px;
      text-align: center;
      color: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
    ">
      <h3 style="color: #d4af37; margin-top: 0; margin-bottom: 20px; font-size: 20px;">${text.selectLangTitle}</h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn-lang-opt" data-lang="es" style="
          padding: 12px;
          background: ${currentLang === 'es' ? '#d4af37' : '#222'};
          color: ${currentLang === 'es' ? '#000' : '#fff'};
          border: 1px solid #444;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Español</button>
        <button class="btn-lang-opt" data-lang="en" style="
          padding: 12px;
          background: ${currentLang === 'en' ? '#d4af37' : '#222'};
          color: ${currentLang === 'en' ? '#000' : '#fff'};
          border: 1px solid #444;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">English</button>
      </div>
      <button id="btnCloseLang" style="
        margin-top: 20px;
        background: transparent;
        border: none;
        color: #aaa;
        cursor: pointer;
        font-size: 14px;
      ">${text.close}</button>
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
 * Modal para búsqueda interactiva desde el botón de Lupa
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
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; width: 100%;">
      <input type="text" id="modalSearchInput" placeholder="${text.searchPlaceholder}" style="
        width: 100%;
        padding: 16px 24px;
        border-radius: 30px;
        background: #1c1c1c;
        border: 2px solid #d4af37;
        color: white;
        font-size: 18px;
        outline: none;
        box-shadow: 0 4px 20px rgba(212, 175, 55, 0.15);
      " autoFocus>
      <button id="btnCloseSearch" style="
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        margin-left: 20px;
      ">✕</button>
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
        transition: transform 0.2s ease, border-color 0.2s ease;
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

// Observador de Estado de Autenticación
onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  conectarMenuDrawer();
  
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
 * Renderiza la pantalla de Login y Registro
 */
function renderAuthScreen(container) {
  container.innerHTML = `
    <div style="
      max-width: 380px;
      margin: 80px auto;
      background: #141414;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid #282828;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #d4af37; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">LUMERA</h2>
        <p style="color: #777; font-size: 14px; margin-top: 5px;">Bienvenido a la plataforma</p>
      </div>

      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="
          padding: 12px 16px;
          background: #222;
          border: 1px solid #333;
          color: white;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
        ">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="
          padding: 12px 16px;
          background: #222;
          border: 1px solid #333;
          color: white;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
        ">
        <button type="submit" id="btnLoginSubmit" style="
          padding: 14px;
          background: #d4af37;
          border: none;
          color: black;
          font-weight: bold;
          cursor: pointer;
          border-radius: 8px;
          font-size: 15px;
          margin-top: 10px;
          transition: background 0.2s ease;
        ">Iniciar Sesión</button>
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
async function renderProfileSelection(container) {
  const text = i18n[currentLang] || i18n.es;

  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      font-family: system-ui, -apple-system, sans-serif;
      color: white;
    ">
      <h1 style="font-size: 32px; font-weight: 600; margin-bottom: 40px; color: #fff;">${text.whoIsWatching}</h1>
      
      <div id="profilesGrid" style="
        display: flex;
        gap: 25px;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 40px;
      ">
        <!-- Perfil Principal -->
        <div class="profile-card-item" data-kids="false" style="cursor: pointer; text-align: center;">
          <div style="
            width: 120px;
            height: 120px;
            border-radius: 16px;
            overflow: hidden;
            border: 3px solid transparent;
            transition: border-color 0.2s ease;
            background: #222;
          ">
            <img src="https://i.imgur.com/83p1XbT.png" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <p style="margin-top: 12px; color: #ccc; font-weight: 500;">Usuario</p>
        </div>

        <!-- Perfil Kids -->
        <div class="profile-card-item" data-kids="true" style="cursor: pointer; text-align: center;">
          <div style="
            width: 120px;
            height: 120px;
            border-radius: 16px;
            overflow: hidden;
            border: 3px solid transparent;
            transition: border-color 0.2s ease;
            background: #222;
          ">
            <img src="https://i.imgur.com/3G3Yx1c.png" style="width:100%; height:100%; object-fit:cover;">
          </div>
          <p style="margin-top: 12px; color: #ccc; font-weight: 500;">${text.kidsName}</p>
        </div>
      </div>

      <button id="btnSignOutApp" style="
        background: transparent;
        border: 1px solid #444;
        color: #888;
        padding: 10px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      ">${text.signOut}</button>
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
 * Carga e Inicia el Catálogo Principal de la Plataforma
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
      heroImages = ["https://i.imgur.com/9rarmsD.png"];
    }

    container.innerHTML = `
      <div style="padding: 20px 40px; max-width: 1300px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
        <!-- BANNER HERO -->
        <div style="
          width: 100%;
          height: 260px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #282828;
          margin-bottom: 35px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
          position: relative;
        ">
          <img src="${heroImages[0]}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>

        <!-- TÍTULO SECCIÓN -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="color: #d4af37; margin: 0; font-size: 22px; font-weight: 600;">
            ${isKids ? text.catalogKids : text.catalogHome}
          </h2>
        </div>

        <!-- CONTENEDOR GRID DE CONTENIDOS -->
        <div id="catalogArea" style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 20px;
        "></div>
      </div>
    `;

    const area = document.getElementById('catalogArea');
    
    // Filtrado de contenido según perfil (Kids/Adultos) y tipo (Película/Serie)
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
        transition: transform 0.2s ease, border-color 0.2s ease;
      ">
        <img src="${item.poster || ''}" style="width: 100%; height: 220px; object-fit: cover; display: block;">
        <div style="padding: 12px;">
          <h4 style="color: white; font-size: 13px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
          <span style="color: #d4af37; font-size: 11px; text-transform: uppercase; margin-top: 4px; display: block;">${item.type}</span>
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
 * Modal de Detalles de Película o Serie
 */
function abrirModalDetalles(item) {
  const modal = document.createElement('div');
  modal.id = 'lumeraModalDetalles';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10,10,10,0.95);
    z-index: 9999;
    overflow-y: auto;
    color: white;
    padding: 40px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const text = i18n[currentLang] || i18n.es;

  modal.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; position: relative;">
      <button id="btnCloseDet" style="
        position: absolute;
        top: 0;
        right: 0;
        background: transparent;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
      ">✕</button>

      <div style="display: flex; gap: 30px; margin-top: 20px; flex-wrap: wrap;">
        <img src="${item.poster || ''}" style="width: 200px; height: 290px; object-fit: cover; border-radius: 12px; border: 1px solid #333;">
        <div style="flex: 1; min-width: 280px;">
          <h1 style="margin-top: 0; color: #d4af37; font-size: 32px;">${item.title}</h1>
          <p style="color: #ccc; font-size: 14px; line-height: 1.6;">${item.description || 'Sin descripción disponible.'}</p>
          
          <button id="btnPlayMain" style="
            padding: 14px 32px;
            background: #d4af37;
            border: none;
            border-radius: 30px;
            font-weight: bold;
            color: black;
            cursor: pointer;
            font-size: 16px;
            margin-top: 15px;
            box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
          ">▶ ${text.play}</button>
        </div>
      </div>

      <div id="episodesArea" style="margin-top: 40px;"></div>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('btnCloseDet').onclick = () => modal.remove();

  // Si es Serie, renderizar las temporadas y episodios
  if (item.type === 'serie' && item.seasons && item.seasons.length > 0) {
    const area = document.getElementById('episodesArea');
    area.innerHTML = `<h3 style="color: #d4af37; border-bottom: 1px solid #333; padding-bottom: 10px;">${text.seasons}</h3>`;
    
    item.seasons.forEach((s, sIdx) => {
      area.innerHTML += `<h4 style="color: #fff; margin-top: 20px;">${s.name || `${text.season} ${sIdx + 1}`}</h4>`;
      
      const epContainer = document.createElement('div');
      epContainer.style.cssText = "display: flex; flex-direction: column; gap: 8px; margin-top: 10px;";

      (s.episodes || []).forEach((ep, eIdx) => {
        const epBtn = document.createElement('div');
        epBtn.style.cssText = "padding: 12px 16px; background: #181818; border: 1px solid #282828; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;";
        epBtn.innerHTML = `
          <span>E${eIdx + 1}: ${ep.title || 'Episodio'}</span>
          <span style="color: #d4af37; font-size: 12px;">▶ Play</span>
        `;
        epBtn.onclick = () => {
          modal.remove();
          renderPlayer(document.getElementById('appContainer'), { 
            videoUrl: ep.videoUrl, 
            title: `${item.title} - ${ep.title || 'Episodio'}`,
            tracks: ep.subtitles || item.subtitles || {}
          });
        };
        epContainer.appendChild(epBtn);
      });

      area.appendChild(epContainer);
    });
  }

  // Botón Principal Reproducir
  document.getElementById('btnPlayMain').onclick = () => {
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

function conectarMenuDrawer() {
  // Manejador del Menú Lateral
  const btnInicio = document.getElementById('navInicio');
  const btnPeliculas = document.getElementById('navPeliculas');
  const btnSeries = document.getElementById('navSeries');
  const btnKids = document.getElementById('navKids');

  if (btnInicio) btnInicio.onclick = () => { cerrarDrawerGlobal(); entrarPlataforma({ isKids: false, filtroTipo: 'todos' }); };
  if (btnPeliculas) btnPeliculas.onclick = () => { cerrarDrawerGlobal(); entrarPlataforma({ isKids: false, filtroTipo: 'pelicula' }); };
  if (btnSeries) btnSeries.onclick = () => { cerrarDrawerGlobal(); entrarPlataforma({ isKids: false, filtroTipo: 'serie' }); };
  if (btnKids) btnKids.onclick = () => { cerrarDrawerGlobal(); entrarPlataforma({ isKids: true, filtroTipo: 'todos' }); };
}

function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btn = document.createElement('button');
    btn.id = 'btnAdminSecret';
    btn.style.cssText = "background: transparent; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;";
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    btn.onclick = () => renderAdminPanel(document.getElementById('appContainer'));
    navRight.prepend(btn);
  }
}
