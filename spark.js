let sparkList = [];
let currentIndex = 0;

export function renderSparkFeed(container, sparks) {
  sparkList = sparks || [];
  if (sparkList.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 100px;"><h3>No hay Spark Shorts disponibles</h3></div>`;
    return;
  }

  container.innerHTML = `
    <div id="sparkFeed" style="height: calc(100vh - 65px); width: 100%; max-width: 420px; margin: 0 auto; position: relative; overflow: hidden;">
      <div id="sparkCard" class="glass-panel" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; position: relative;">
        <video id="sparkVideo" loop autoplay style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;"></video>
        <div style="z-index: 1; display: flex; justify-content: space-between; align-items: flex-start;">
          <h4 id="sparkTitle"></h4>
        </div>
        <div style="z-index: 1; display: flex; flex-direction: column; gap: 15px; align-self: flex-end;">
          <button id="btnLikeSpark" class="icon-btn" style="background: rgba(0,0,0,0.5); border-radius: 50%; width: 45px; height: 45px;">❤️</button>
          <button id="btnShareSpark" class="icon-btn" style="background: rgba(0,0,0,0.5); border-radius: 50%; width: 45px; height: 45px;">🔗</button>
        </div>
      </div>
    </div>
  `;

  loadCurrentSpark();

  document.getElementById('sparkFeed').addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && currentIndex < sparkList.length - 1) {
      currentIndex++;
      loadCurrentSpark();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      currentIndex--;
      loadCurrentSpark();
    }
  });
}

function loadCurrentSpark() {
  const spark = sparkList[currentIndex];
  if (!spark) return;
  const video = document.getElementById('sparkVideo');
  const title = document.getElementById('sparkTitle');
  if (video) video.src = spark.videoUrl || '';
  if (title) title.textContent = spark.title || '';
}
