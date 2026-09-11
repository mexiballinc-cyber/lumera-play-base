/**
 * Renderiza el reproductor de video en una capa superior independiente
 * sin recargar la interfaz principal ni reiniciar el catálogo.
 */
export function renderPlayer(container, { 
  videoUrl, 
  title, 
  tracks = {}, 
  dubs = {}, 
  seasons = [], 
  currentSeasonIdx = 0, 
  currentEpisodeIdx = 0, 
  onBack 
}) {
  
  // Limpia cualquier reproductor previo abierto
  let playerModal = document.getElementById('lumeraPlayerModal');
  if (playerModal) {
    playerModal.remove();
  }

  // Crea la capa modal a pantalla completa
  playerModal = document.createElement('div');
  playerModal.id = 'lumeraPlayerModal';
  playerModal.style.cssText = `
    position: fixed;
    inset: 0;
    background: #000000;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  `;

  let activeVideoUrl = videoUrl;

  // Generación dinámica de la lista de subtítulos VTT
  let tracksHtml = '';
  if (tracks && typeof tracks === 'object') {
    Object.keys(tracks).forEach((lang) => {
      if (tracks[lang]) {
        const isDefault = lang === 'es' ? 'default' : '';
        tracksHtml += `<track kind="subtitles" src="${tracks[lang]}" srclang="${lang}" label="${lang.toUpperCase()}" ${isDefault}>`;
      }
    });
  }

  playerModal.innerHTML = `
    <!-- HEADER Y CONTROLES SUPERIORES -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 20px 30px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0));
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10001;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="display: flex; align-items: center; gap: 20px;">
        <button id="btnPlayerBack" style="
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 20px;
          cursor: pointer;
          border-radius: 50%;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        ">←</button>
        <div>
          <h3 style="margin: 0; font-size: 18px; color: #d4af37; font-weight: 600;">${title || 'Reproduciendo'}</h3>
        </div>
      </div>
    </div>

    <!-- ELEMENTO DE VIDEO HTML5 NATIVO -->
    <video 
      id="lumeraVideoElement" 
      controls 
      autoplay 
      controlsList="nodownload" 
      style="width: 100%; height: 100%; object-fit: contain; outline: none;"
    >
      <source src="${activeVideoUrl}" type="video/mp4">
      ${tracksHtml}
      Tu navegador no soporta la reproducción de este video.
    </video>
  `;

  document.body.appendChild(playerModal);

  // Botón para salir del reproductor
  const btnBack = document.getElementById('btnPlayerBack');
  btnBack.onclick = () => {
    const videoEl = document.getElementById('lumeraVideoElement');
    if (videoEl) {
      videoEl.pause();
      videoEl.src = "";
    }
    playerModal.remove();
    if (typeof onBack === 'function') {
      onBack();
    }
  };
}
