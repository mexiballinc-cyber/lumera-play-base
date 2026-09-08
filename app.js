// app.js - Lógica Principal del Cascarón
import { translations, currentLang, setLanguage } from './i18n.js';

// Seleccionar elementos del DOM
const btnMenu = document.getElementById('btnMenu');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const btnSearch = document.getElementById('btnSearch');
const btnConfig = document.getElementById('btnConfig');

// Lógica del Menú Lateral (Drawer)
function toggleMenu() {
  if (drawer && overlay) {
    drawer.classList.toggle('open');
    overlay.classList.toggle('active');
  }
}

if (btnMenu) btnMenu.addEventListener('click', toggleMenu);
if (overlay) overlay.addEventListener('click', toggleMenu);

// Función para traducir la interfaz mediante data-i18n
export function translateUI(lang) {
  setLanguage(lang);
}

// Inicializar idioma guardado al cargar
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});

// Escuchar evento del Buscador
if (btnSearch) {
  btnSearch.addEventListener('click', () => {
    console.log("Abrir buscador...");
  });
}

// Escuchar evento del botón Configuración (Icono de la tuerca)
if (btnConfig) {
  btnConfig.addEventListener('click', () => {
    renderConfigModal();
  });
}

// Modal de Configuración e Idioma
function renderConfigModal() {
  let modal = document.getElementById('configModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'configModal';
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:500; backdrop-filter:blur(8px);";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:16px; border:1px solid rgba(212,175,55,0.4); width:320px; color:white; text-align:center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <h3 data-i18n="config" style="color:#d4af37; margin-bottom:15px;">Configuración</h3>
      <div style="margin:20px 0; text-align:left;">
        <label data-i18n="lang" style="display:block; margin-bottom:8px; color:#aaa; font-size:14px;">Idioma</label>
        <select id="langSelect" style="width:100%; padding:10px; background:#222; color:white; border:1px solid #444; border-radius:8px; outline:none;">
          <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
          <option value="pt" ${currentLang === 'pt' ? 'selected' : ''}>Português</option>
          <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
          <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
          <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語</option>
        </select>
      </div>
      <button id="closeConfig" style="padding:10px 20px; background:#d4af37; border:none; color:black; border-radius:8px; font-weight:bold; cursor:pointer; width:100%;">OK</button>
    </div>
  `;

  document.getElementById('langSelect').addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.getElementById('closeConfig').addEventListener('click', () => {
    modal.remove();
  });
}
