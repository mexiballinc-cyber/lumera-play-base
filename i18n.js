// i18n.js - Diccionario y Motor de Idiomas

export const translations = {
  es: { home: "Inicio", series: "Series", movies: "Películas", kids: "Niños", config: "Configuración", lang: "Idioma", logout: "Cerrar Sesión" },
  en: { home: "Home", series: "Series", movies: "Movies", kids: "Kids", config: "Settings", lang: "Language", logout: "Log Out" },
  pt: { home: "Início", series: "Séries", movies: "Filmes", kids: "Infantil", config: "Configurações", lang: "Idioma", logout: "Sair" },
  fr: { home: "Accueil", series: "Séries", movies: "Films", kids: "Enfants", config: "Paramètres", lang: "Langue", logout: "Déconnexion" },
  de: { home: "Start", series: "Serien", movies: "Filme", kids: "Kinder", config: "Einstellungen", lang: "Sprache", logout: "Abmelden" },
  ja: { home: "ホーム", series: "シリーズ", movies: "映画", kids: "キッズ", config: "設定", lang: "言語", logout: "ログアウト" }
};

export let currentLang = localStorage.getItem('lumera_lang') || 'es';

export function setLanguage(lang, playerElement = null) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);

  // Traducir texto visible con etiquetas data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  // Forzar cambio de audio y subtítulo en el reproductor si está abierto
  if (playerElement) {
    aplicarIdiomaReproductor(playerElement, lang);
  }
}

function aplicarIdiomaReproductor(player, lang) {
  // Ajusta la pista de audio y subtítulo coincidente con el idioma activo
  const audioTracks = player.querySelectorAll('audio source, video track');
  audioTracks.forEach(track => {
    if (track.srclang === lang || track.dataset.lang === lang) {
      track.track.mode = 'showing';
    }
  });
}
