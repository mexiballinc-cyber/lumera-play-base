import { translations, currentLang, setLanguage } from './i18n.js';
// app.js - Lógica Principal del Cascarón

// Seleccionar elementos del DOM
const btnMenu = document.getElementById('btnMenu');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const appContainer = document.getElementById('appContainer');

// Lógica del Menú Lateral (Drawer)
function toggleMenu() {
  drawer.classList.toggle('open');
  overlay.classList.toggle('active');
}

btnMenu.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);

// Diccionario de Traducción (6 idiomas base)
const translations = {
  es: { home: "Inicio", series: "Series", movies: "Películas", kids: "Niños" },
  en: { home: "Home", series: "Series", movies: "Movies", kids: "Kids" },
  pt: { home: "Início", series: "Séries", movies: "Filmes", kids: "Infantil" },
  fr: { home: "Accueil", series: "Séries", movies: "Films", kids: "Enfants" },
  de: { home: "Start", series: "Serien", movies: "Filme", kids: "Kinder" },
  ja: { home: "ホーム", series: "シリーズ", movies: "映画", kids: "キッズ" }
};

let currentLang = 'es'; // Idioma por defecto

// Función para traducir la interfaz
export function translateUI(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
}

// Escuchar botones de la barra superior
document.getElementById('btnSearch').addEventListener('click', () => {
  console.log("Abrir buscador...");
  // Aquí inyectaremos la lógica de búsqueda en Firebase más adelante
});

document.getElementById('btnConfig').addEventListener('click', () => {
  console.log("Abrir configuración (Cuenta, Idioma, Colores)...");
  // Aquí llamaremos al modal de configuración
});

// Al cargar, aplicamos el idioma por defecto
translateUI(currentLang);
import { translations, currentLang, setLanguage } from './i18n.js';

// Inicializar idioma guardado al cargar
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
});

// Evento del botón Configuración (Icono de la tuerca)
document.getElementById('btnConfig').addEventListener('click', () => {
  renderConfigModal();
});

function renderConfigModal() {
  // Modal de ajustes de idioma y perfil
  let modal = document.getElementById('configModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'configModal';
    modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:300;";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:12px; border:1px solid rgba(212,175,55,0.4); width:300px; color:white; text-align:center;">
      <h3 data-i18n="config">Configuración</h3>
      <div style="margin:20px 0; text-align:left;">
        <label data-i18n="lang" style="display:block; margin-bottom:8px; color:#aaa;">Idioma</label>
        <select id="langSelect" style="width:100%; padding:10px; background:#222; color:white; border:1px solid #444; border-radius:6px;">
          <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
          <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
          <option value="pt" ${currentLang === 'pt' ? 'selected' : ''}>Português</option>
          <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
          <option value="de" ${currentLang === 'de' ? 'selected' : ''}>Deutsch</option>
          <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>日本語</option>
        </select>
      </div>
      <button id="closeConfig" style="padding:8px 16px; background:#d4af37; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">OK</button>
    </div>
  `;

  document.getElementById('langSelect').addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  document.getElementById('closeConfig').addEventListener('click', () => {
    modal.remove();
  });
}
