import { 
  setLanguage, 
  currentLang, 
  abrirModalBusqueda, 
  abrirModalIdioma 
} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenu');
  const drawer = document.getElementById('drawerMenu');
  const overlay = document.getElementById('drawerOverlay');
  const btnClose = document.getElementById('btnCloseDrawer');

  // Control de apertura y cierre del menú lateral (Drawer)
  if (btnMenu && drawer && overlay) {
    btnMenu.onclick = () => {
      drawer.classList.add('open');
      overlay.classList.add('open');
    };

    const closeAll = () => {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    };

    if (btnClose) btnClose.onclick = closeAll;
    overlay.onclick = closeAll;
  }

  // BOTÓN BÚSQUEDA (Lupa en el Header)
  const btnSearch = document.getElementById('btnSearchHeader');
  if (btnSearch) {
    btnSearch.onclick = () => {
      abrirModalBusqueda();
    };
  }

  // BOTÓN CONFIGURACIÓN (Engranaje en el Header)
  const btnConfig = document.getElementById('btnConfigHeader');
  if (btnConfig) {
    btnConfig.onclick = () => {
      abrirModalIdioma();
    };
  }
});

/**
 * Cierra manualmente el menú lateral desde cualquier parte del código
 */
export function cerrarDrawerGlobal() {
  const drawer = document.getElementById('drawerMenu');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}
