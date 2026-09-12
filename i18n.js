// i18n.js - Diccionario Local y Consultas de Traducción en Firebase Firestore
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const IDIOMAS_DISPONIBLES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' }
];

let currentLang = localStorage.getItem('lumera_lang') || 'es';

const DICTIONARY = {
  es: {
    searchPlaceholder: "Buscar películas, series...",
    emptyCatalog: "Aún no hay contenidos disponibles.",
    home: "Inicio",
    series: "Series",
    movies: "Películas",
    kids: "Infantil",
    categories: { accion: "Acción", comedia: "Comedia", drama: "Drama", terror: "Terror" }
  },
  en: {
    searchPlaceholder: "Search movies, series...",
    emptyCatalog: "No content available yet.",
    home: "Home",
    series: "Series",
    movies: "Movies",
    kids: "Kids",
    categories: { accion: "Action", comedia: "Comedy", drama: "Drama", terror: "Horror" }
  },
  pt: {
    searchPlaceholder: "Pesquisar filmes, séries...",
    emptyCatalog: "Nenhum conteúdo disponível.",
    home: "Início",
    series: "Séries",
    movies: "Filmes",
    kids: "Kids",
    categories: { accion: "Ação", comedia: "Comédia", drama: "Drama", terror: "Terror" }
  },
  fr: {
    searchPlaceholder: "Rechercher des films, séries...",
    emptyCatalog: "Aucun contenu disponible.",
    home: "Accueil",
    series: "Séries",
    movies: "Films",
    kids: "Enfants",
    categories: { accion: "Action", comedia: "Comédie", drama: "Drame", terror: "Horreur" }
  },
  de: {
    searchPlaceholder: "Filme, Serien suchen...",
    emptyCatalog: "Noch keine Inhalte verfügbar.",
    home: "Startseite",
    series: "Serien",
    movies: "Filme",
    kids: "Kinder",
    categories: { accion: "Action", comedia: "Komödie", drama: "Drama", terror: "Horror" }
  },
  ja: {
    searchPlaceholder: "映画、ドラマを検索...",
    emptyCatalog: "コンテンツがありません。",
    home: "ホーム",
    series: "ドラマ",
    movies: "映画",
    kids: "キッズ",
    categories: { accion: "アクション", comedia: "コメディ", drama: "ドラマ", terror: "ホラー" }
  }
};

export function getCurrentLang() {
  return currentLang;
}

export function setLanguage(langCode) {
  if (IDIOMAS_DISPONIBLES.some(l => l.code === langCode)) {
    currentLang = langCode;
    localStorage.setItem('lumera_lang', langCode);
  }
}

export function getTranslation(key) {
  const langData = DICTIONARY[currentLang] || DICTIONARY.es;
  return langData[key] || DICTIONARY.es[key] || key;
}

/**
 * Consulta en Firebase Firestore las traducciones de un contenido específico
 * @param {string} contentId - ID del documento en Firestore
 * @returns {Promise<Object>} Datos traducidos o los datos originales si no hay traducción disponible
 */
export async function fetchTranslationFromFirebase(contentId) {
  const db = window.db;
  if (!db || !contentId) return null;

  try {
    const lang = getCurrentLang();
    // Consulta la subcolección o documento de traducciones en Firestore
    const translationDocRef = doc(db, "contents", contentId, "translations", lang);
    const translationSnap = await getDoc(translationDocRef);

    if (translationSnap.exists()) {
      return translationSnap.data();
    }
  } catch (error) {
    console.warn(`[i18n] No se pudo obtener la traducción para ${contentId}:`, error);
  }

  return null;
}

/**
 * Mapea y traduce un objeto de contenido combinando la base local o los datos de Firebase
 * @param {Object} item - Documento de contenido
 * @returns {Object} Objeto con título, descripción y género procesados
 */
export function translateContentLocal(item) {
  if (!item) return item;

  const targetLang = getCurrentLang();

  // Si el documento ya trae embebido el mapa de idiomas (ej: item.translations.en)
  if (item.translations && item.translations[targetLang]) {
    const t = item.translations[targetLang];
    return {
      ...item,
      title: t.title || item.title,
      description: t.description || item.description,
      genre: t.genre || item.genre
    };
  }

  // Traducción de categoría común
  if (item.genre) {
    const catMap = DICTIONARY[targetLang]?.categories;
    const cleanGenre = item.genre.toLowerCase();
    if (catMap && catMap[cleanGenre]) {
      item.genreTranslated = catMap[cleanGenre];
    }
  }

  return item;
}
