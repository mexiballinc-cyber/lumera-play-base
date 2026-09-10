// player.js - Reproductor de Video con Controles Automáticos
export function renderPlayer(container, options = {}) {
  const { videoUrl, title, onBack } = options;
  let controlsTimeout;

  container.innerHTML = `
    <div id="playerWrapper" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#000; z-index:9999;">
      <video id="mainVideo" src="${videoUrl}" style="width:100%; height:100%; object-fit:contain;" autoplay></video>
      
      <div id="playerControls" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-space-between; background:rgba(0,0,0,0.5); transition:opacity 0.3s ease; opacity:1;">
        <div style="padding:20px; display:flex; align-items:center;">
          <button id="btnPlayerBack" style="background:none; border:none; color:#fff; font-size:28px; cursor:pointer;">←</button>
          <h3 style="color:#fff; margin-left:15px; font-family:sans-serif;">${title || ''}</h3>
        </div>

        <div style="padding:20px; display:flex; align-items:center; justify-content:center;">
          <button id="btnPlayPause" style="background:#fff; border:none; padding:12px 24px; border-radius:50%; font-size:22px; cursor:pointer;">⏸</button>
        </div>

        <div style="padding:20px;">
          <input type="range" id="videoProgress" value="0" min="0" max="100" style="width:100%; cursor:pointer;">
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('mainVideo');
  const controls = document.getElementById('playerControls');
  const btnBack = document.getElementById('btnPlayerBack');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const progress = document.getElementById('videoProgress');

  function resetControlsTimer() {
    controls.style.opacity = '1';
    controls.style.pointerEvents = 'auto';
    clearTimeout(controlsTimeout);

    if (!video.paused) {
      controlsTimeout = setTimeout(() => {
        controls.style.opacity = '0';
        controls.style.pointerEvents = 'none';
      }, 3000);
    }
  }

  const wrapper = document.getElementById('playerWrapper');
  wrapper.addEventListener('mousemove', resetControlsTimer);
  wrapper.addEventListener('click', resetControlsTimer);
  wrapper.addEventListener('touchstart', resetControlsTimer);

  btnPlayPause.onclick = (e) => {
    e.stopPropagation();
    if (video.paused) {
      video.play();
      btnPlayPause.innerText = '⏸';
    } else {
      video.pause();
      btnPlayPause.innerText = '▶';
    }
    resetControlsTimer();
  };

  btnBack.onclick = (e) => {
    e.stopPropagation();
    video.pause();
    if (onBack) onBack();
  };

  video.ontimeupdate = () => {
    if (video.duration) {
      progress.value = (video.currentTime / video.duration) * 100;
    }
  };

  progress.oninput = (e) => {
    if (video.duration) {
      video.currentTime = (e.target.value / 100) * video.duration;
    }
  };

  resetControlsTimer();
}
