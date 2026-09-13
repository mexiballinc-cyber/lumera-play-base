import './firebase.js';
import { initAuthObserver, getUserRole, getActiveProfile, loginUser, logout } from './auth.js';
import { renderMainView } from './main.js';
import { renderSparkFeed } from './spark.js';
import { renderAdminPanel } from './admin.js';
import { applyTranslations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initAuthObserver((user, profile, role) => {
    const navAdmin = document.getElementById('navAdmin');
    if (navAdmin) {
      role === 'admin' ? navAdmin.classList.remove('hidden') : navAdmin.classList.add('hidden');
    }
    
    // Si no hay perfil activo o es la primera carga, renderiza Home
    const currentProfile = getActiveProfile();
    renderMainView(
      document.getElementById('appContainer'), 
      'all', 
      currentProfile ? currentProfile.isKids : false
    );
  });
});

function setupNavigation() {
  const drawer = document.getElementById('drawerMenu');
  const overlay = document.getElementById('drawerOverlay');
  const container = document.getElementById('appContainer');

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  };

  document.getElementById('btnOpenDrawer').onclick = () => {
    drawer.classList.add('open');
    overlay.classList.add('active');
  };

  document.getElementById('btnCloseDrawer').onclick = closeDrawer;
  overlay.onclick = closeDrawer;

  // Navegación del Cascarón
  document.getElementById('navHome').onclick = () => {
    closeDrawer();
    renderMainView(container, 'all', getActiveProfile()?.isKids);
  };

  document.getElementById('navSeries').onclick = () => {
    closeDrawer();
    renderMainView(container, 'series', getActiveProfile()?.isKids);
  };

  document.getElementById('navMovies').onclick = () => {
    closeDrawer();
    renderMainView(container, 'movies', getActiveProfile()?.isKids);
  };

  document.getElementById('navKids').onclick = () => {
    closeDrawer();
    renderMainView(container, 'all', true);
  };

  document.getElementById('navSparks').onclick = () => {
    closeDrawer();
    renderSparkFeed(container, []);
  };

  document.getElementById('navAdmin').onclick = () => {
    closeDrawer();
    renderAdminPanel(container);
  };
}
