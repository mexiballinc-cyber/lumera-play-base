export function openDetailsModal(item, onClose, onPlay) {
  const modal = document.createElement('div');
  modal.className = 'modal glass-modal';
  modal.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: 700px; position: relative;">
      <button id="btnCloseDetails" class="icon-btn" style="position: absolute; top: 15px; right: 15px;">✕</button>
      <div style="height: 250px; background: url('${item.banner || item.cover}') center/cover; border-radius: 8px; margin-bottom: 20px;"></div>
      <h2>${item.title}</h2>
      <p style="color: var(--text-muted); margin: 10px 0;">${item.description || 'Sin descripción disponible.'}</p>
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="btnPlayMedia" style="padding: 10px 20px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">▶ Reproducir</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCloseDetails').onclick = () => {
    modal.remove();
    if (onClose) onClose();
  };

  document.getElementById('btnPlayMedia').onclick = () => {
    modal.remove();
    if (onPlay) onPlay(item);
  };
}
