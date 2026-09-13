export function openPlayer(mediaItem) {
  const playerOverlay = document.createElement('div');
  playerOverlay.style.cssText = 'position: fixed; inset: 0; background: #000; z-index: 1000; display: flex; flex-direction: column;';
  
  playerOverlay.innerHTML = `
    <div style="padding: 15px; display: flex; justify-content: space-between; background: rgba(0,0,0,0.8); align-items: center;">
      <h3>${mediaItem.title}</h3>
      <button id="btnClosePlayer" class="icon-btn">✕ Salir</button>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
      <video id="lumeraVideo" controls autoplay style="width: 100%; max-height: 80vh;">
        <source src="${mediaItem.videoUrl || ''}" type="video/mp4">
      </video>
    </div>
  `;

  document.body.appendChild(playerOverlay);
  document.getElementById('btnClosePlayer').onclick = () => playerOverlay.remove();
}
