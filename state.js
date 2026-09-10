// state.js - Gestor de Estado Global y Reactividad de Lumera

const listeners = {};

export const state = {
  currentView: 'auth', // Vistas: 'auth' | 'profiles' | 'home' | 'details' | 'player' | 'admin'
  currentUser: null,
  activeProfile: null,
  selectedMedia: null,
  searchQuery: '',
  categories: ['Acción', 'Drama', 'Comedia', 'Ciencia Ficción', 'Terror', 'Documental'],
  player: {
    currentMedia: null,
    currentIndex: 0,
    episodesList: [],
    selectedAudio: 'es',
    selectedSubtitle: 'off'
  }
};

/**
 * Actualiza una propiedad del estado global y notifica a los suscriptores.
 * @param {string} key - Clave del estado a actualizar.
 * @param {*} value - Nuevo valor.
 */
export function updateState(key, value) {
  state[key] = value;
  if (listeners[key]) {
    listeners[key].forEach(callback => callback(value));
  }
}

/**
 * Suscribe una función a los cambios de una clave específica del estado.
 * @param {string} key - Clave del estado a escuchar.
 * @param {Function} callback - Función a ejecutar cuando cambie el estado.
 */
export function subscribeState(key, callback) {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(callback);
}
