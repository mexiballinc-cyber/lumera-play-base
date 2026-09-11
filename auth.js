// ============================================================================
// auth.js - Módulo Principal de Autenticación, Catálogo e Interfaz
// ============================================================================

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

// Correo único autorizado con privilegios de Administrador (Lápiz)
const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

// Estados globales de la aplicación
let currentPerfilKids = false;
export let currentLang = localStorage.getItem('lumera_lang') || 'es';
let cachedContents = [];
let cachedHeroes = [];
let cachedAvatars = [];

// Diccionario de traducciones (i18n)
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
    moviesTitle: "Películas Destacadas",
    seriesTitle: "Series Recomendadas",
    allTitle: "Todo el Catálogo",
    loginTitle: "LUMERA STREAM",
    loginBtn: "Iniciar Sesión",
    emailPlaceholder: "Correo Electrónico",
    passwordPlaceholder: "Contraseña",
    userProfile: "Usuario Principal",
    episodes: "Episodios",
    epShort: "E"
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
    moviesTitle: "Featured Movies",
    seriesTitle: "Recommended Series",
    allTitle: "Full Catalog",
    loginTitle: "LUMERA STREAM",
    loginBtn: "Sign In",
    emailPlaceholder: "Email Address",
    passwordPlaceholder: "Password",
    userProfile: "Main User",
    episodes: "Episodes",
    epShort: "E"
  }
};

// ============================================================================
// FUNCIONES DE IDIOMA E INTERNACIONALIZACIÓN (i18n)
// ============================================================================

export function aplicarTraduccionesDOM() {
  const text = i18n[currentLang] || i18n.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (text[key]) {
      el.textContent = text[key];
    }
  });
}

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);
  aplicarTraduccionesDOM();
  if (auth.currentUser) {
    entrarPlataforma({ isKids: currentPerfilKids });
  }
}

export function abrirModalIdioma() {
  const text = i18n[currentLang] || i18n.es;
  const modal = document.createElement('div');
  modal.id = 'modalIdiomaOverlay';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(5px);
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background: #121212; border: 1px solid rgba(255, 255, 255, 0.2); padding: 30px; border-radius: 16px; width: 100%; max-width: 320px; text-align: center; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
      <h3 style="margin-top: 0; font-size: 20px; margin-bottom: 20px;">${text.selectLangTitle}</h3>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
        <button id="btnLangEs" style="padding: 12px; background: ${currentLang === 'es' ? 'white' : '#222'}; color: ${currentLang === 'es' ? 'black' : 'white'}; border: 1px solid #444; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.2s;">Español</button>
        <button id="btnLangEn" style="padding: 12px; background: ${currentLang === 'en' ? 'white' : '#222'}; color: ${currentLang === 'en' ? 'black' : 'white'}; border: 1px solid #444; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.2s;">English</button>
      </div>
      <button id="btnCloseLangModal" style="background: transparent; border: none; color: #888; cursor: pointer; font-size: 14px;">${text.close}</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnLangEs').onclick = () => {
    setLanguage('es');
    modal.remove();
  };

  document.getElementById('btnLangEn').onclick = () => {
    setLanguage('en');
    modal.remove();
  };

  document.getElementById('btnCloseLangModal').onclick = () => {
    modal.remove();
  };
}

// ============================================================================
// MODAL DE BÚSQUEDA INTERACTIVA
// ============================================================================

export function abrirModalBusqueda() {
  const text = i18n[currentLang] || i18n.es;
  const modal = document.createElement('div');
  modal.id = 'modalBusquedaOverlay';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 10, 0.96);
    backdrop-filter: blur(10px);
    z-index: 9999;
    padding: 30px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  `;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; width: 100%;">
      <input type="text" id="modalSearchInput" placeholder="${text.searchPlaceholder}" style="width: 100%; padding: 14px 22px; border-radius: 30px; background: #1c1c1c; border: 1px solid #333; color: white; font-size: 16px; outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);" autoFocus>
      <button id="btnCloseSearchModal" style="background: transparent; border: none; color: white; font-size: 28px; cursor: pointer; margin-left: 15px;">✕</button>
    </div>
    <div id="modalSearchResults" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 18px; max-width: 900px; margin: 20px auto 0 auto; width: 100%;"></div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('modalSearchInput');
  const results = document.getElementById('modalSearchResults');

  input.oninput = (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      results.innerHTML = '';
      return;
    }

    const filtrados = cachedContents.filter(i => {
      const matchTitle = i.title?.toLowerCase().includes(q);
      return currentPerfilKids ? (matchTitle && i.isKids) : matchTitle;
    });

    if (filtrados.length === 0) {
      results.innerHTML = `<p style="color: #888; grid-column: 1/-1; text-align: center; font-size: 14px; margin-top: 30px;">${text.noResults}</p>`;
      return;
    }

    results.innerHTML = filtrados.map(item => `
      <div class="search-card" data-id="${item.id}" style="cursor: pointer; background: #151515; border-radius: 8px; overflow: hidden; border: 1px solid #252525; transition: transform 0.2s;">
        <img src="${item.poster || ''}" style="width: 100%; height: 190px; object-fit: cover;">
        <p style="color: white; font-size: 12px; margin: 8px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</p>
      </div>
    `).join('');

    results.querySelectorAll('.search-card').forEach(card => {
      card.onclick = () => {
        modal.remove();
        const selected = cachedContents.find(c => c.id === card.getAttribute('data-id'));
        if (selected) abrirModalDetalles(selected);
      };
    });
  };

  document.getElementById('btnCloseSearchModal').onclick = () => {
    modal.remove();
  };
}

// ============================================================================
// OBSERVADOR DE AUTENTICACIÓN FIREBASE
// ============================================================================

onAuthStateChanged(auth, async (user) => {
  const container = document.getElementById('appContainer');
  aplicarTraduccionesDOM();

  if (user) {
    // Verificación estricta de correo de Administrador para inyectar botón Lápiz
    if (user.email === ADMIN_EMAIL) {
      inyectarBotonAdmin();
    } else {
      removerBotonAdmin();
    }
    await precargarRecursosGlobales();
    renderProfileSelection(container);
  } else {
    removerBotonAdmin();
    renderAuthScreen(container);
  }
});

async function precargarRecursosGlobales() {
  try {
    const snapContents = await getDocs(collection(db, "contents"));
    cachedContents = [];
    snapContents.forEach(d => cachedContents.push({ id: d.id, ...d.data() }));

    const snapHeroes = await getDocs(collection(db, "heroes"));
    cachedHeroes = [];
    snapHeroes.forEach(d => cachedHeroes.push(d.data().url));

    const snapAvatars = await getDocs(collection(db, "avatars"));
    cachedAvatars = [];
    snapAvatars.forEach(d => cachedAvatars.push(d.data().url));
  } catch (err) {
    console.error("Error precargando base de datos:", err);
  }
}

// ============================================================================
// PANTALLA 1: LOGIN / AUTENTICACIÓN
// ============================================================================

function renderAuthScreen(container) {
  const text = i18n[currentLang] || i18n.es;
  container.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 75vh;">
      <div style="width: 100%; max-width: 360px; background: #121212; padding: 40px 30px; border-radius: 12px; border: 1px solid #222; box-shadow: 0 8px 24px rgba(0,0,0,0.8); text-align: center;">
        <h2 style="color: white; margin: 0 0 25px 0; font-size: 24px; letter-spacing: 2px;">${text.loginTitle}</h2>
        <form id="authForm" style="display: flex; flex-direction: column; gap: 14px;">
          <input type="email" id="emailInput" placeholder="${text.emailPlaceholder}" value="${ADMIN_EMAIL}" required style="padding: 12px 15px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px; font-size: 14px; outline: none;">
          <input type="password" id="passwordInput" placeholder="${text.passwordPlaceholder}" required style="padding: 12px 15px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px; font-size: 14px; outline: none;">
          <button type="submit" style="padding: 12px; background: white; border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 10px; transition: background 0.2s;">${text.loginBtn}</button>
        </form>
      </div>
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

// ============================================================================
// PANTALLA 2: SELECCIÓN DE PERFIL
// ============================================================================

function renderProfileSelection(container) {
  const text = i18n[currentLang] || i18n.es;
  
  const avatarUser = cachedAvatars[0] || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png";
  const avatarKids = cachedAvatars[1] || "https://wallpapers.com/images/hd/netflix-profile-pictures-1000-x-1000-qd9iat32key2ges8.jpg";

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 65vh; color: white;">
      <h2 style="font-size: 28px; margin-bottom: 35px; font-weight: 500;">${text.whoIsWatching}</h2>
      
      <div style="display: flex; gap: 30px; margin-bottom: 40px; flex-wrap: wrap; justify-content: center;">
        <div class="profile-card" data-kids="false" style="cursor: pointer; text-align: center; transition: transform 0.2s;">
          <img src="${avatarUser}" style="width: 110px; height: 110px; border-radius: 10px; object-fit: cover; border: 2px solid transparent;">
          <p style="margin-top: 12px; color: #ccc; font-size: 14px;">${text.userProfile}</p>
        </div>
        
        <div class="profile-card" data-kids="true" style="cursor: pointer; text-align: center; transition: transform 0.2s;">
          <img src="${avatarKids}" style="width: 110px; height: 110px; border-radius: 10px; object-fit: cover; border: 2px solid transparent;">
          <p style="margin-top: 12px; color: #ccc; font-size: 14px;">${text.kidsName}</p>
        </div>
      </div>

      <button id="btnSignOut" style="background: transparent; border: 1px solid #444; color: #888; padding: 10px 22px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: all 0.2s;">${text.signOut}</button>
    </div>
  `;

  container.querySelectorAll('.profile-card').forEach(card => {
    card.onclick = () => {
      const isKids = card.getAttribute('data-kids') === 'true';
      entrarPlataforma({ isKids });
    };
  });

  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

// ============================================================================
// PANTALLA 3: CATÁLOGO PRINCIPAL CON FILAS CATEGORIZADAS
// ============================================================================

export async function entrarPlataforma({ isKids = false } = {}) {
  currentPerfilKids = isKids;
  const container = document.getElementById('appContainer');
  const text = i18n[currentLang] || i18n.es;

  try {
    if (cachedContents.length === 0) {
      await precargarRecursosGlobales();
    }

    const itemsFiltrados = cachedContents.filter(i => isKids ? i.isKids : true);
    const listaPeliculas = itemsFiltrados.filter(i => i.type === 'pelicula');
    const listaSeries = itemsFiltrados.filter(i => i.type === 'serie');

    container.innerHTML = `
      <div style="max-width: 1250px; margin: 0 auto; color: white; padding: 0 10px;">
        ${cachedHeroes.length > 0 ? `
          <div style="width: 100%; height: 280px; border-radius: 14px; overflow: hidden; margin-bottom: 35px; box-shadow: 0 10px 25px rgba(0,0,0,0.7);">
            <img src="${cachedHeroes[0]}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        ` : ''}

        ${listaPeliculas.length > 0 ? renderFilaHorizontal(text.moviesTitle, listaPeliculas) : ''}
        ${listaSeries.length > 0 ? renderFilaHorizontal(text.seriesTitle, listaSeries) : ''}
        ${renderFilaHorizontal(isKids ? text.catalogKids : text.allTitle, itemsFiltrados)}
      </div>
    `;

    container.querySelectorAll('.content-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-id');
        const selected = cachedContents.find(c => c.id === id);
        if (selected) abrirModalDetalles(selected);
      };
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color: white; text-align: center; margin-top: 50px;">Error al cargar catálogo.</p>`;
  }
}

function renderFilaHorizontal(titulo, items) {
  return `
    <div style="margin-bottom: 35px;">
      <h3 style="margin-bottom: 14px; font-size: 18px; color: #fff; font-weight: 600; padding-left: 5px;">${titulo}</h3>
      <div style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: thin; scrollbar-color: #333 transparent;">
        ${items.map(item => `
          <div class="content-card" data-id="${item.id}" style="min-width: 145px; width: 145px; cursor: pointer; flex-shrink: 0; transition: transform 0.2s;">
            <img src="${item.poster || ''}" style="width: 100%; height: 210px; object-fit: cover; border-radius: 8px; border: 1px solid #222;">
            <p style="font-size: 12px; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ccc; text-align: center;">${item.title}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================================
// MODAL DETALLES FULLSCREEN
// ============================================================================

function abrirModalDetalles(item) {
  const text = i18n[currentLang] || i18n.es;
  const modal = document.createElement('div');
  modal.id = 'modalDetallesOverlay';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #0a0a0a linear-gradient(to bottom, rgba(10,10,10,0.2) 0%, #0a0a0a 100%), url('${item.banner || item.poster || ''}');
    background-size: cover;
    background-position: center top;
    overflow-y: auto;
    color: white;
    padding: 40px 20px;
  `;

  modal.innerHTML = `
    <div style="max-width: 850px; margin: 0 auto; position: relative;">
      <button id="btnCloseDetailsModal" style="position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.15); border: none; color: white; width: 38px; height: 38px; border-radius: 50%; cursor: pointer; font-size: 18px;">✕</button>
      
      <div style="margin-top: 90px; max-width: 580px;">
        <span style="color: #aaa; text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">${item.type}</span>
        <h1 style="font-size: 38px; margin: 8px 0 16px 0; font-weight: 700;">${item.title}</h1>
        <p style="color: #ddd; font-size: 14px; margin-bottom: 28px; line-height: 1.5; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${item.description || 'Sin descripción disponible.'}</p>
        <button id="btnPlayMainContent" style="padding: 12px 32px; background: white; border: none; border-radius: 24px; font-weight: bold; color: black; cursor: pointer; font-size: 15px; box-shadow: 0 4px 15px rgba(255,255,255,0.2);">▶ ${text.play}</button>
      </div>

      <div id="episodesAreaSection" style="margin-top: 50px;"></div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseDetailsModal').onclick = () => modal.remove();

  if (item.type === 'serie' && item.seasons?.length > 0) {
    const epArea = document.getElementById('episodesAreaSection');
    epArea.innerHTML = `<h3 style="border-bottom: 1px solid #333; padding-bottom: 10px; font-size: 18px;">${text.seasons}</h3>`;
    
    item.seasons.forEach((s, sIdx) => {
      epArea.innerHTML += `<h4 style="margin-top: 20px; color: #888; font-size: 14px;">${s.name || `${text.season} ${sIdx + 1}`}</h4>`;
      const epGrid = document.createElement('div');
      epGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; margin-top: 10px;";
      
      (s.episodes || []).forEach((ep, eIdx) => {
        const epCard = document.createElement('div');
        epCard.style.cssText = "padding: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; cursor: pointer; transition: background 0.2s;";
        epCard.innerHTML = `<span style="font-size: 13px; color: #fff;">${text.epShort}${eIdx + 1}: ${ep.title}</span>`;
        
        epCard.onclick = () => {
          modal.remove();
          renderPlayer(document.getElementById('appContainer'), {
            item,
            selectedEp: ep,
            title: `${item.title} - ${ep.title}`
          });
        };
        epGrid.appendChild(epCard);
      });
      epArea.appendChild(epGrid);
    });
  }

  document.getElementById('btnPlayMainContent').onclick = () => {
    modal.remove();
    let selectedEp = null;
    if (item.type === 'serie' && item.seasons?.[0]?.episodes?.[0]) {
      selectedEp = item.seasons[0].episodes[0];
    }
    renderPlayer(document.getElementById('appContainer'), {
      item,
      selectedEp,
      title: item.title
    });
  };
}

// ============================================================================
// INYECCIÓN DEL BOTÓN ADMINISTRADOR (LÁPIZ)
// ============================================================================

function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btn = document.createElement('button');
    btn.id = 'btnAdminSecret';
    btn.className = 'svg-btn';
    btn.title = "Panel de Control Admin";
    btn.style.cssText = "background: transparent; border: none; color: white; cursor: pointer; padding: 6px; display: flex; align-items: center;";
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    
    btn.onclick = () => renderAdminPanel(document.getElementById('appContainer'));
    navRight.prepend(btn);
  }
}

function removerBotonAdmin() {
  const btn = document.getElementById('btnAdminSecret');
  if (btn) btn.remove();
}
