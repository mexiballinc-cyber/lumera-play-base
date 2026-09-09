// app.js - Gestión de Interfaz y Navegación
import { translations } from './i18n.js';
import { currentLang, setLanguage, entrarPlataforma, renderProfileSelection } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initUIEvents();
});

// EVENTOS DE LA INTERFAZ
export function initUIEvents() {
  const btnMenu = document.getElementById('btnMenu');
  const btnConfig = document.getElementById('btnConfig');
  const btnSearch = document.getElementById('btnSearch');
  const overlay = document.getElementById('overlay');

  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      toggleDrawer(true);
    };
  }

  if (overlay) {
    overlay.onclick = () => toggleDrawer(false);
  }

  if (btnConfig) {
    btnConfig.onclick = () => abrirModalConfiguracionGlobal();
  }

  if (btnSearch) {
    btnSearch.onclick = () => alert("Buscador próximamente en Lumera");
  }

  conectarNavegacionDrawer();
}

// ABRIR Y CERRAR MENÚ LATERAL
export function toggleDrawer(abrir) {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  
  if (drawer && overlay) {
    if (abrir) {
      drawer.classList.add('open');
      overlay.classList.add('active');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('active');
    }
  }
}

// NAVEGACIÓN DESDE EL MENÚ
function conectarNavegacionDrawer() {
  document.querySelectorAll('.drawer-links .nav-item').forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      toggleDrawer(false); // Cierra el menú al hacer clic
      
      const texto = link.innerText.toLowerCase();
      if (texto.includes('inicio') || texto.includes('home')) {
        entrarPlataforma({ filtroTipo: 'todos' });
      } else if (texto.includes('película') || texto.includes('movies')) {
        entrarPlataforma({ filtroTipo: 'pelicula' });
      } else if (texto.includes('serie')) {
        entrarPlataforma({ filtroTipo: 'serie' });
      } else if (texto.includes('niño') || texto.includes('kids')) {
        entrarPlataforma({ isKids: true, filtroTipo: 'todos' });
      } else if (texto.includes('perfil')) {
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  });
}

// MODAL CONFIGURACIÓN DE IDIOMA (TUERCA)
function abrirModalConfiguracionGlobal() {
  const modalExistente = document.getElementById('modalConfigGlobal');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalConfigGlobal';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(8px); padding:20px;";

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:320px; color:white; text-align:center; background:rgba(20,20,20,0.95);">
      <h3 style="color:#d4af37; margin-bottom:15px; font-size:1.2rem;">🌐 Idioma / Language</h3>
      
      <select id="selectLangModal" style="width:100%; padding:12px; background:#222; border:1px solid #d4af37; color:#d4af37; border-radius:10px; font-weight:bold; font-size:14px; margin-bottom:20px; cursor:pointer;">
        <option value="es" ${currentLang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
        <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>🇯🇵 日本語</option>
        <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
        <option value="pt" ${currentLang === 'pt' ? 'selected' : ''}>🇧🇷 Português</option>
        <option value="de" ${currentLang === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
      </select>

      <button id="btnCerrarConfig" style="padding:10px 25px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer; width:100%;">Aceptar</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('selectLangModal').onchange = (e) => {
    setLanguage(e.target.value);
  };

  document.getElementById('btnCerrarConfig').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
