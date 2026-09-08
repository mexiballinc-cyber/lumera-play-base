// app.js - Control Global de Interfaz y Configuración (Tuerca)
import { setLanguage, currentLang } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenu');
  const btnConfig = document.getElementById('btnConfig');
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');

  // Abrir / Cerrar Drawer Lateral
  if (btnMenu && drawer && overlay) {
    btnMenu.onclick = () => {
      drawer.classList.add('active');
      overlay.classList.add('active');
    };
  }

  // Modal de la Tuerca (Configuración de Idioma)
  if (btnConfig) {
    btnConfig.onclick = () => {
      abrirModalConfiguracion();
    };
  }
});

// Modal Flotante de Configuración
function abrirModalConfiguracion() {
  const modalExistente = document.getElementById('modalConfigGlobal');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalConfigGlobal';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(8px); padding:20px;";

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:320px; color:white; text-align:center; border:1px solid rgba(212,175,55,0.4); background:rgba(20,20,20,0.95);">
      <h3 style="color:#d4af37; margin-bottom:15px; font-size:1.2rem;">🌐 Idioma / Language</h3>
      <p style="color:#aaa; font-size:13px; margin-bottom:20px;">Selecciona tu idioma preferido:</p>
      
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

  document.getElementById('btnCerrarConfig').onclick = () => {
    modal.remove();
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}
