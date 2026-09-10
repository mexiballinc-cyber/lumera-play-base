// app.js - Control Global, Drawer Lateral, Menú Responsive e Idiomas
import { setLanguage, currentLang } from './auth.js';

export function cerrarDrawerGlobal() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
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
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
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
  const overlay = document.getElementById('overlay');
  const btnConfig = document.getElementById('btnConfig');

  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      abrirDrawerGlobal();
    };
  }

  if (overlay) {
    overlay.onclick = () => cerrarDrawerGlobal();
  }

  if (btnConfig) {
    btnConfig.onclick = () => {
      const nuevoIdioma = currentLang === 'es' ? 'en' : 'es';
      setLanguage(nuevoIdioma);
      alert(`Idioma cambiado a: ${nuevoIdioma.toUpperCase()}`);
    };
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cerrarDrawerGlobal();
    }
  });
});
