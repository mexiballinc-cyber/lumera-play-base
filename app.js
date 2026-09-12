// app.js - Gestión de Interfaz, Catálogo, Búsqueda y Navegación (v12.19.0)
import { 
  initAuth, 
  showAuthModal, 
  showProfileSelectorModal, 
  getUserRole, 
  getActiveProfile,
  logoutUser
} from './auth.js';
import { renderAdminPanel } from './admin.js';
import { abrirModalDetalles } from './details.js';
import { renderPlayer } from './player.js';
import { getTranslation, getCurrentLang, setLanguage, IDIOMAS_DISPONIBLES } from './i18n.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

let allContentCache = [];

document.addEventListener('DOMContentLoaded', () => {
  setupUIEventListeners();

  // Inicializar Autenticación y flujo principal
  initAuth((user, activeProfile, role) => {
    actualizarHeaderUI(user, activeProfile, role);

    if (!user) {
      showAuthModal(() => {
        showProfileSelectorModal(() => cargarContenidoPrincipal());
      });
    } else if (!activeProfile) {
      showProfileSelectorModal(() => cargarContenidoPrincipal());
    } else {
      cargarContenidoPrincipal();
    }
  });
});

// Vinculación de eventos con la interfaz
function setupUIEventListeners() {
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const btnSearchHeader = document.getElementById('btnSearchHeader');
  const langSelect = document.getElementById('langSelect');

  // Menú Lateral (Drawer)
  if (btnMenu) btnMenu.onclick = abrirDrawerGlobal;
  if (btnCloseDrawer) btnCloseDrawer.onclick = cerrarDrawerGlobal;
  if (drawerOverlay) drawerOverlay.onclick = cerrarDrawerGlobal;

  // Búsqueda
  if (btnSearchHeader) btnSearchHeader.onclick = abrirModalBusqueda;

  // Idioma
  if (langSelect) {
    poblarSelectorIdiomas(langSelect);
    langSelect.value = getCurrentLang();
    langSelect.onchange = (e) => {
      setLanguage(e.target.value);
      cargarContenidoPrincipal();
    };
  }

  // Navegación por categorías
  document.getElementById('navInicio')?.addEventListener('click', (e) => { e.preventDefault(); cerrarDrawerGlobal(); cargarContenidoPrincipal(); });
  document.getElementById('navSeries')?.addEventListener('click', (e) => { e.preventDefault(); cerrarDrawerGlobal(); cargarContenidoPorTipo('serie'); });
  document.getElementById('navPeliculas')?.addEventListener('click', (e) => { e.preventDefault(); cerrarDrawerGlobal(); cargarContenidoPorTipo('pelicula'); });
  document.getElementById('navKids')?.addEventListener('click', (e) => { e.preventDefault(); cerrarDrawerGlobal(); cargarContenidoKids(); });

  // Perfil y Logout desde Header
  document.getElementById('profileAvatarHeader')?.addEventListener('click', () => {
    showProfileSelectorModal(() => cargarContenidoPrincipal());
  });

  document.getElementById('btnLogoutHeader')?.addEventListener('click', async () => {
    await logoutUser();
    window.location.reload();
  });
}

export function abrirDrawerGlobal() {
  document.getElementById('drawerOverlay')?.classList.add('open', 'active');
  document.getElementById('drawerMenu')?.classList.add('open', 'active');
}

export function cerrarDrawerGlobal() {
  document.getElementById('drawerOverlay')?.classList.remove('open', 'active');
  document.getElementById('drawerMenu')?.classList.remove('open', 'active');
}

function poblarSelectorIdiomas(selectElement) {
  selectElement.innerHTML = IDIOMAS_DISPONIBLES.map(lang => `
    <option value="${lang.code}">${lang.name}</option>
  `).join('');
}

function actualizarHeaderUI(user, profile, role) {
  const avatarImg = document.getElementById('profileAvatarHeader');
  const btnAdmin = document.getElementById('btnAdminHeader');

  if (avatarImg && profile) {
    avatarImg.src = profile.avatar;
    avatarImg.style.display = 'block';
  }

  if (btnAdmin) {
    if (role === 'admin') {
      btnAdmin.style.display = 'inline-block';
      btnAdmin.onclick = () => renderAdminPanel(document.getElementById('appContainer'));
    } else {
      btnAdmin.style.display = 'none';
    }
  }
}

// Búsqueda flotante en tiempo real
function abrirModalBusqueda() {
  const existing = document.getElementById('searchModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.style.cssText = `position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.92); backdrop-filter:blur(10px); padding:40px 20px; display:flex; flex-direction:column; align-items:center;`;

  const placeholderText = getTranslation('searchPlaceholder') || 'Buscar películas, series...';

  modal.innerHTML = `
    <div style="width:100%; max-width:600px; position:relative;">
      <input type="text" id="searchInputModal" placeholder="${placeholderText}" style="width:100%; padding:15px; background:#181818; border:1px solid #333; border-radius:8px; color:white; font-size:16px; outline:none;">
      <button id="closeSearchModal" style="position:absolute; right:15px; top:12px; background:none; border:none; color:white; font-size:22px; cursor:pointer;">✕</button>
    </div>
    <div id="searchResults" style="width:100%; max-width:800px; margin-top:25px; display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:15px; overflow-y:auto; max-height:calc(100vh - 160px);"></div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('searchInputModal');
  const resultsContainer = document.getElementById('searchResults');

  input.focus();
  document.getElementById('closeSearchModal').onclick = () => modal.remove();

  input.oninput = (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      resultsContainer.innerHTML = '';
      return;
    }

    const filtered = allContentCache.filter(item => item.title && item.title.toLowerCase().includes(query));
    resultsContainer.innerHTML = filtered.map(item => `
      <div class="search-card" data-id="${item.id}" style="cursor:pointer; text-align:center;">
        <img src="${item.poster}" style="width:100%; height:180px; object-fit:cover; border-radius:6px;">
        <p style="color:white; font-size:12px; margin-top:5px; font-weight:500;">${item.title}</p>
      </div>
    `).join('');

    resultsContainer.querySelectorAll('.search-card').forEach(card => {
      card.onclick = () => {
        const item = filtered.find(i => i.id === card.getAttribute('data-id'));
        modal.remove();
        abrirModalDetalles(item, () => cargarContenidoPrincipal());
      };
    });
  };
}

// Carga y filtrado de contenidos
export async function cargarContenidoPrincipal() {
  const container = document.getElementById('appContainer');
  if (!container) return;

  container.innerHTML = `<p style="color:#888; text-align:center; margin-top:50px;">Cargando catálogo...</p>`;

  try {
    const snap = await getDocs(collection(window.db, "contents"));
    allContentCache = [];
    snap.forEach(d => allContentCache.push({ id: d.id, ...d.data() }));

    const activeProfile = getActiveProfile();
    let displayList = allContentCache;

    if (activeProfile && activeProfile.isKids) {
      displayList = allContentCache.filter(item => item.isKids === true);
    }

    if (displayList.length === 0) {
      const msg = getTranslation('emptyCatalog') || 'Aún no hay contenidos disponibles.';
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px;">
          <h2 style="color:white; margin-bottom:10px;">Lumera</h2>
          <p style="color:#aaa;">${msg}</p>
          ${getUserRole() === 'admin' ? `<button id="btnOpenAdminEmpty" style="padding:10px 20px; background:white; color:black; border:none; border-radius:6px; font-weight:bold; cursor:pointer; margin-top:15px;">Ir al Panel Admin</button>` : ''}
        </div>
      `;
      const btnAdmin = document.getElementById('btnOpenAdminEmpty');
      if (btnAdmin) btnAdmin.onclick = () => renderAdminPanel(container);
      return;
    }

    renderGridContenidos(displayList, "Catálogo Principal");
  } catch (error) {
    container.innerHTML = `<p style="color:#ff4d4d; text-align:center; margin-top:50px;">Error al cargar catálogo: ${error.message}</p>`;
  }
}

async function cargarContenidoPorTipo(tipo) {
  const filtered = allContentCache.filter(item => item.type === tipo);
  renderGridContenidos(filtered, tipo === 'serie' ? 'Series' : 'Películas');
}

async function cargarContenidoKids() {
  const filtered = allContentCache.filter(item => item.isKids === true);
  renderGridContenidos(filtered, 'Sección Infantil');
}

function renderGridContenidos(lista, titulo) {
  const container = document.getElementById('appContainer');
  container.innerHTML = `
    <h2 style="color: white; margin-bottom: 20px; font-size: 22px;">${titulo}</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px;">
      ${lista.map(item => `
        <div class="content-card" data-id="${item.id}" style="cursor: pointer; transition: transform 0.2s;">
          <img src="${item.poster}" style="width: 100%; height: 230px; object-fit: cover; border-radius: 8px;">
          <h4 style="margin: 8px 0 0 0; color: white; font-size: 14px;">${item.title}</h4>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('.content-card').forEach(card => {
    card.onclick = () => {
      const item = lista.find(c => c.id === card.getAttribute('data-id'));
      
      // Si el elemento se puede reproducir directamente, llama al player personalizado
      if (item.type === 'pelicula' && item.videoUrl) {
        renderPlayer(document.body, { item, title: item.title });
      } else {
        abrirModalDetalles(item, () => cargarContenidoPrincipal());
      }
    };
  });
}
