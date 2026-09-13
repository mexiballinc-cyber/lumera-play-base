export const IDIOMAS = {
  es: { home: "Inicio", series: "Series", movies: "Películas", kids: "Kids", sparks: "Spark Shorts", admin: "Admin", selectLang: "Seleccionar Idioma" },
  en: { home: "Home", series: "Series", movies: "Movies", kids: "Kids", sparks: "Spark Shorts", admin: "Admin", selectLang: "Select Language" },
  fr: { home: "Accueil", series: "Séries", movies: "Films", kids: "Enfants", sparks: "Spark Shorts", admin: "Admin", selectLang: "Choisir la langue" },
  it: { home: "Inizio", series: "Serie", movies: "Film", kids: "Bambini", sparks: "Spark Shorts", admin: "Admin", selectLang: "Seleziona Lingua" },
  de: { home: "Startseite", series: "Serien", movies: "Filme", kids: "Kinder", sparks: "Spark Shorts", admin: "Admin", selectLang: "Sprache wählen" },
  ja: { home: "ホーム", series: "シリーズ", movies: "映画", kids: "キッズ", sparks: "スパーク", admin: "管理", selectLang: "言語を選択" },
  pt: { home: "Início", series: "Séries", movies: "Filmes", kids: "Crianças", sparks: "Spark Shorts", admin: "Admin", selectLang: "Selecionar Idioma" }
};

let currentLang = localStorage.getItem('lumera_lang') || 'es';

export function setLanguage(langCode) {
  if (IDIOMAS[langCode]) {
    currentLang = langCode;
    localStorage.setItem('lumera_lang', langCode);
    applyTranslations();
  }
}

export function getCurrentLang() {
  return currentLang;
}

export function t(key) {
  return IDIOMAS[currentLang][key] || key;
}

export function applyTranslations() {
  document.getElementById('navHome').textContent = t('home');
  document.getElementById('navSeries').textContent = t('series');
  document.getElementById('navMovies').textContent = t('movies');
  document.getElementById('navKids').textContent = t('kids');
  document.getElementById('navSparks').textContent = t('sparks');
  const txtLangTitle = document.getElementById('txtLangTitle');
  if (txtLangTitle) txtLangTitle.textContent = t('selectLang');
}
