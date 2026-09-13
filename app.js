import './firebase.js';
import { initAuthObserver, getUserRole, getActiveProfile, logout, loginUser } from './auth.js';
import { applyTranslations, setLanguage } from './i18n.js';
import { openDetailsModal, openPlayer } from './details.js';
import { renderSparkFeed } from './spark.js';
import { renderAdminPanel } from './admin.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initAuthObserver((user, profile, role) => {
    const navAdmin = document.getElementById('navAdmin');
    if (navAdmin) {
      role === 'admin' ? navAdmin.classList.remove('hidden') : navAdmin.classList.add('hidden');
    }
    loadMainCatalog();
  });
});

function setupNavigation() {
  const drawer = document.getElementById('drawerMenu');
  const overlay = document.getElementById('drawerOverlay');

  document.getElementById('btnOpenDrawer').onclick = () => {
    drawer.classList.add('open');
    overlay.classList.add('active');
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  };

  document.getElementById('btnCloseDrawer').onclick = closeDrawer;
  overlay.onclick = closeDrawer;

  document.getElementById('btnLang').onclick = () => {
    document.getElementById('langModal').classList.remove('hidden');
  };

  document.getElementById('btnCloseLang').onclick = () => {
    document.getElementById('langModal').classList.add('hidden');
  };

  document.getElementById('navAdmin').onclick = () => {
    closeDrawer();
    renderAdminPanel(document.getElementById('appContainer'));
  };

  document.getElementById('navSparks').onclick = () => {
    closeDrawer();
    renderSparkFeed(document.getElementById('appContainer'), []);
  };
}

async function loadMainCatalog() {
  const container = document.getElementById('appContainer');
  container.innerHTML = `<div style="padding: 100px 20px; text-align: center;"><h2>Cargando Lumera...</h2></div>`;

  try {
    const snap = await getDocs(collection(window.db, "content"));
    const items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    if (items.length === 0) {
      container.innerHTML = `<div style="padding: 100px 20px; text-align: center;"><h2>No hay contenido aún. ¡Agrega uno desde el Panel Admin!</h2></div>`;
      return;
    }

    container.innerHTML = `
      <div style="padding: 80px 20px 20px 20px;">
        <h3>Catálogo Principal</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
          ${items.map(item => `
            <div class="media-card" data-id="${item.id}" style="cursor: pointer;">
              <img src="${item.cover}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 8px;">
              <p style="margin-top: 5px; font-weight: bold;">${item.title}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.media-card').forEach(card => {
      card.onclick = () => {
        const item = items.find(i => i.id === card.dataset.id);
        openDetailsModal(item, null, (selectedMedia) => openPlayer(selectedMedia));
      };
    });
  } catch (err) {
    container.innerHTML = `<div style="padding: 100px; text-align: center;"><h2>Error al cargar datos.</h2></div>`;
  }
}z
