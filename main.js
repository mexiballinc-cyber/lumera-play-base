// main.js - Punto de Entrada y Ruteador Principal de Lumera
import { state, subscribeState } from './state.js';
import { renderAuth } from './auth.js';
import { renderProfiles } from './profiles.js';
import { renderHome } from './home.js';
import { renderDetails } from './details.js';
import { renderPlayer } from './player.js';
import { renderAdminPanel } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('appContainer') || document.body;

  function routeView(view) {
    container.innerHTML = '';
    switch (view) {
      case 'auth':
        renderAuth(container);
        break;
      case 'profiles':
        renderProfiles(container);
        break;
      case 'home':
        renderHome(container);
        break;
      case 'details':
        renderDetails(container);
        break;
      case 'player':
        renderPlayer(container);
        break;
      case 'admin':
        renderAdminPanel(container);
        break;
      default:
        renderAuth(container);
        break;
    }
  }

  // Suscribir al cambio de vista global
  subscribeState('currentView', (newView) => {
    routeView(newView);
  });

  // Render inicial
  routeView(state.currentView);
});
