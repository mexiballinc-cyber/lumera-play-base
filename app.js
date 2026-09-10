// app.js - Shell y Navegación Lateral
import { setLanguage, entrarPlataforma, currentLang } from './auth.js';

export function cerrarDrawerGlobal() {
  const drawer = document.getElementById('mainDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenu');
  const drawer = document.getElementById('mainDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const langSelect = document.getElementById('langSelect');

  if (btnMenu && drawer && overlay) {
    btnMenu.onclick = () => {
      drawer.classList.add('open');
      overlay.classList.add('open');
    };

    overlay.onclick = () => cerrarDrawerGlobal();
  }

  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => {
      setLanguage(e.target.value);
    };
  }
});
