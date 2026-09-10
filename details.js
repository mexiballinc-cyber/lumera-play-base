// details.js - Vista Modal de Detalles del Contenido
import { renderPlayer } from './player.js';

export function abrirModalDetalles(item, onBackCallback) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px;";

  modal.innerHTML = `
    <div style="background:#151515; border-radius:16px; border:1px solid #d4af37; width:100%; max-width:600px; color:white; overflow:hidden; position:relative;">
      
      <button id="btnCloseDetails" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.6); border:none; color:white; border-radius:50%; width:32px; height:32px; font-size:18px; cursor:pointer; z-index:2;">✕</button>

      <div style="width:100%; height:240px; position:relative;">
        <img src="${item.banner || item.poster}" style="width:100%; height:100%; object-fit:cover;">
        <div style="position:absolute; inset:0; background:linear-gradient(to top, #151515, transparent);"></div>
      </div>

      <div style="padding:20px;">
        <h2 style="margin:0 0 10px 0; color:#fff;">${item.title}</h2>
        <p style="color:#aaa; font-size:14px; margin-bottom:20px; line-height:1.4;">${item.description || 'Sin descripción disponible.'}</p>

        <button id="btnPlayMediaModal" style="padding:12px 30px; background:#d4af37; color:black; border:none; border-radius:25px; font-weight:bold; font-size:16px; cursor:pointer; display:flex; align-items:center; gap:8px;">
          ▶ Reproducir
        </button>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseDetails').onclick = () => modal.remove();

  document.getElementById('btnPlayMediaModal').onclick = () => {
    modal.remove();
    renderPlayer(document.getElementById('appContainer'), {
      item,
      onBack: onBackCallback
    });
  };
}
