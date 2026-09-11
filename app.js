// app.js - Punto de Entrada Principal y Gestión del Menú Drawer/Header
import { abrirModalBusqueda, abrirModalIdioma } from './auth.js';

// Inicialización de Eventos de la Interfaz Global
document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenuToggle');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  const btnSearch = document.getElementById('btnHeaderSearch');
  const btnSettings = document.getElementById('btnHeaderSettings');

  // 1. Abrir / Cerrar Menú Lateral (Hamburguesa)
  if (btnMenu) {
    btnMenu.onclick = () => {
      drawerOverlay?.classList.add('active');
      mainDrawer?.classList.add('active');
    };
  }

  if (drawerOverlay) {
    drawerOverlay.onclick = cerrarDrawerGlobal;
  }

  // 2. Abrir Modal de Búsqueda (Lupa)
  if (btnSearch) {
    btnSearch.onclick = () => abrirModalBusqueda();
  }

  // 3. Abrir Modal de Idioma / Ajustes (Engranaje)
  if (btnSettings) {
    btnSettings.onclick = () => abrirModalIdioma();
  }
});

/**
 * Cierra la barra lateral deslizante
 */
export function cerrarDrawerGlobal() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  if (drawerOverlay) drawerOverlay.classList.remove('active');
  if (mainDrawer) mainDrawer.classList.remove('active');
}
