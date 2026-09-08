import { setLanguage, applyTranslations } from './i18n.js';
import { renderProfilesView } from './profiles.js';
import { renderAdminView } from './admin.js';

const appContainer = document.getElementById('appContainer');
const sideDrawer = document.getElementById('sideDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');

// Control de Drawer
document.getElementById('btnOpenDrawer').onclick = () => {
  sideDrawer.classList.add('open');
  drawerOverlay.classList.add('active');
};

const closeDrawer = () => {
  sideDrawer.classList.remove('open');
  drawerOverlay.classList.remove('active');
};

document.getElementById('btnCloseDrawer').onclick = closeDrawer;
drawerOverlay.onclick = closeDrawer;

// Cambiar Idioma Global
document.getElementById('langSelector').onchange = (e) => {
  setLanguage(e.target.value);
};

// Navegación Básica
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.onclick = () => {
    const view = btn.getAttribute('data-view');
    closeDrawer();
    loadView(view);
  };
});

function loadView(view) {
  if (view === 'kids') {
    document.body.classList.add('kids-theme-active');
  } else if (view !== 'kids') {
    document.body.classList.remove('kids-theme-active');
  }

  if (view === 'admin') {
    renderAdminView(appContainer);
  } else if (view === 'home' || view === 'kids') {
    renderCatalog(view === 'kids');
  }
  applyTranslations();
}

function renderCatalog(isKidsOnly = false) {
  appContainer.innerHTML = `<div class="grid-container" id="mediaGrid"></div>`;
  const grid = document.getElementById('mediaGrid');

  // Datos Mock de ejemplo
  const mockItems = [
    { title: "Contenido 1", isKids: true, poster: "https://i.imgur.com/9rDtCyZ.png" },
    { title: "Contenido 2", isKids: false, poster: "https://i.imgur.com/9W9C2TC.png" }
  ];

  const filtered = isKidsOnly ? mockItems.filter(i => i.isKids) : mockItems;

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.innerHTML = `
      ${item.isKids ? '<div class="kids-badge"></div>' : ''}
      <img src="${item.poster}" alt="${item.title}">
    `;
    grid.appendChild(card);
  });
}

// Inicialización: Cargar Vista de Perfiles
renderProfilesView(appContainer, (selectedView) => loadView(selectedView));
