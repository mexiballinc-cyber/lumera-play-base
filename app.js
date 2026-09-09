import { setLanguage, currentLang, conectarMenuDrawer } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar menú drawer
  conectarMenuDrawer();

  // Configuración
  const btnConfig = document.getElementById('btnConfig');
  if (btnConfig) {
    btnConfig.onclick = () => {
      abrirModalConfiguracion();
    };
  }
});

function abrirModalConfiguracion() {
  const modalExistente = document.getElementById('modalConfigGlobal');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalConfigGlobal';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;";

  modal.innerHTML = `
    <div style="padding:25px; border-radius:15px; width:100%; max-width:300px; color:white; text-align:center; background:#181818; border:1px solid #d4af37;">
      <h3 style="color:#d4af37; margin-bottom:15px;">🌐 Idioma</h3>
      <select id="selectLangModal" style="width:100%; padding:10px; background:#222; border:1px solid #d4af37; color:#d4af37; border-radius:8px; margin-bottom:15px;">
        <option value="es" ${currentLang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
      </select>
      <button id="btnCerrarConfig" style="padding:10px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; width:100%; cursor:pointer;">Aceptar</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('selectLangModal').onchange = (e) => {
    setLanguage(e.target.value);
  };

  document.getElementById('btnCerrarConfig').onclick = () => {
    modal.remove();
  };
}
