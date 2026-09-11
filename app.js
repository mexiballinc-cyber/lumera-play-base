// app.js - Gestión de Eventos Globales y Menú Lateral
import { abrirModalBusqueda, abrirModalIdioma, entrarPlataforma, setLanguage, currentLang } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elementos de la Interfaz
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  const btnSearch = document.getElementById('btnSearch');
  const btnConfig = document.getElementById('btnConfig');
  const langSelect = document.getElementById('langSelect');

  // 1. Control del Menú Lateral (Abrir / Cerrar)
  if (btnMenu) {
    btnMenu.onclick = () => {
      drawerOverlay?.classList.add('open', 'active');
      mainDrawer?.classList.add('open', 'active');
    };
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.onclick = cerrarDrawerGlobal;
  }

  if (drawerOverlay) {
    drawerOverlay.onclick = cerrarDrawerGlobal;
  }

  // 2. Control de Botones del Header
  if (btnSearch) {
    btnSearch.onclick = () => abrirModalBusqueda();
  }

  if (btnConfig) {
    btnConfig.onclick = () => abrirModalIdioma();
  }

  // 3. Control del Selector de Idioma en el Drawer
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => {
      setLanguage(e.target.value);
    };
  }

  // 4. Navegación del Menú Lateral
  const navItems = document.querySelectorAll('.drawer-links .nav-item');
  navItems.forEach((item, index) => {
    item.onclick = (e) => {
      e.preventDefault();
      cerrarDrawerGlobal();

      // Mapeo por índice según el HTML actual
      switch (index) {
        case 0: // Inicio
          entrarPlataforma({ isKids: false, filtroTipo: 'todos' });
          break;
        case 1: // Series
          entrarPlataforma({ isKids: false, filtroTipo: 'serie' });
          break;
        case 2: // Películas
          entrarPlataforma({ isKids: false, filtroTipo: 'pelicula' });
          break;
        case 3: // Niños
          entrarPlataforma({ isKids: true, filtroTipo: 'todos' });
          break;
        case 4: // Perfiles
          location.reload();
          break;
        case 5: // Spark
          alert("Próximamente Lumera Spark AI ✨");
          break;
      }
    };
  });
});

/**
 * Cierra el menú lateral desplegable
 */
export function cerrarDrawerGlobal() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  if (drawerOverlay) drawerOverlay.classList.remove('open', 'active');
  if (mainDrawer) mainDrawer.classList.remove('open', 'active');
}
