// app.js - Control Global, Drawer Lateral, Menú Responsive e Idiomas
import { setLanguage, entrarPlataforma, currentLang } from './auth.js';

export function cerrarDrawerGlobal() {
  const drawer = document.getElementById('mainDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.classList.remove('active');
  }
  if (overlay) {
    overlay.classList.remove('open');
    overlay.classList.remove('active');
  }
}

export function abrirDrawerGlobal() {
  const drawer = document.getElementById('mainDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) {
    drawer.classList.add('open');
    drawer.classList.add('active');
  }
  if (overlay) {
    overlay.classList.add('open');
    overlay.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const langSelect = document.getElementById('langSelect');

  // Control de Apertura/Cierre de Menú Lateral
  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      abrirDrawerGlobal();
    };
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.onclick = () => cerrarDrawerGlobal();
  }

  if (overlay) {
    overlay.onclick = () => cerrarDrawerGlobal();
  }

  // Cambio de Idioma Global
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => {
      setLanguage(e.target.value);
    };
  }

  // Cierre de Drawer al presionar la tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarDrawerGlobal();
    }
  });
});
