// state.js - Manejo del estado global centralizado para Lumera

export const state = {
  // Idioma y Navegación
  currentLang: localStorage.getItem('lumera_lang') || 'es',
  currentView: 'home', // 'home', 'search', 'details', 'player', 'admin', 'settings'
  isDrawerOpen: false,

  // Usuario y Perfiles
  currentUser: JSON.parse(localStorage.getItem('lumera_user')) || null,
  activeProfile: JSON.parse(localStorage.getItem('lumera_profile')) || null,

  // Categorías dinámicas (Punto 6)
  categories: [
    'Tendencias',
    'Acción',
    'Drama',
    'Comedia',
    'Ciencia Ficción',
    'Niños'
  ],

  // Estado de Búsqueda Dedicada (Punto 3)
  search: {
    query: '',
    results: []
  },

  // Estado del Reproductor - Exclusivo para reproducción (Punto 1 y 5)
  player: {
    currentMedia: null,       // Película o Episodio actual
    episodesList: [],         // Lista de episodios si es serie (para siguiente episodio)
    currentIndex: 0,          // Índice del episodio actual
    selectedAudio: 'es',      // Idioma de audio actual
    selectedSubtitle: 'off',   // Subtítulo activo ('off', 'es', 'en', 'ja', 'fr', 'pt', 'de')
    availableAudios: [],      // Audios disponibles para esta película/episodio
    availableSubtitles: []    // Subtítulos disponibles
  },

  // Detalle Seleccionado (Punto 1: separado del reproductor)
  selectedDetailMedia: null
};

/**
 * Actualiza una propiedad del estado y emite un evento global para actualizar la interfaz.
 */
export function updateState(key, value) {
  state[key] = value;
  
  if (key === 'currentLang') {
    localStorage.setItem('lumera_lang', value);
  }
  if (key === 'activeProfile') {
    localStorage.setItem('lumera_profile', JSON.stringify(value));
  }
  if (key === 'currentUser') {
    localStorage.setItem('lumera_user', JSON.stringify(value));
  }

  window.dispatchEvent(new CustomEvent('stateChanged', { detail: { key, value } }));
}
