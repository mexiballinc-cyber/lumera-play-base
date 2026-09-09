// app.js - Control Global de Interfaz y Configuración
import { setLanguage, currentLang } from './auth.js';

// Cierra el menú lateral y el fondo oscuro
export function cerrarDrawerGlobal() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');

  if (drawer) {
    drawer.classList.remove('active', 'open');
  }
  if (overlay) {
    overlay.classList.remove('active', 'open');
  }
}

// Abre el menú lateral y el fondo oscuro
export function abrirDrawerGlobal() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');

  if (drawer) {
    drawer.classList.add('active', 'open');
  }
  if (overlay) {
    overlay.classList.add('active', 'open');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnMenu = document.getElementById('btnMenu');
  const btnConfig = document.getElementById('btnConfig');
  const overlay = document.getElementById('overlay');
  const drawer = document.getElementById('drawer');

  // Botón Hamburguesa: Abre o Cierra
  if (btnMenu) {
    btnMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer && (drawer.classList.contains('active') || drawer.classList.contains('open'));
      if (isOpen) {
        cerrarDrawerGlobal();
      } else {
        abrirDrawerGlobal();
      }
    });
  }

  // Clic en la pantalla/overlay oscuro para cerrar
  if (overlay) {
    overlay.addEventListener('click', () => {
      cerrarDrawerGlobal();
    });
  }

  // Cerrar al presionar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarDrawerGlobal();
  });

  // Modal de Configuración (Tuerca)
  if (btnConfig) {
    btnConfig.onclick = () => abrirModalConfiguracion();
  }
});

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

  document.getElementById('selectLangModal').onchange = (e) => setLanguage(e.target.value);
  document.getElementById('btnCerrarConfig').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
