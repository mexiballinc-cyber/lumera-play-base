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
