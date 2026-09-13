// spark.js - Shorts Feed con Algoritmo del 40% de recomendaciones
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let sparkList = [];
let currentIndex = 0;

export async function renderSparkFeed(container) {
  container.innerHTML = `<div style="padding: 100px; text-align: center;"><h2>Cargando Spark Shorts...</h2></div>`;

  try {
    const snap = await getDocs(collection(window.db, "sparks"));
    let rawSparks = [];
    snap.forEach(doc => rawSparks.push({ id: doc.id, ...doc.data() }));

    if (rawSparks.length === 0) {
      // Cascarón por si no hay videos subidos aún desde Admin
      rawSparks = [
        { id: 'demo1', title: 'Spark Demo 1', category: 'action', videoUrl: '' },
        { id: 'demo2', title: 'Spark Demo 2', category: 'comedy', videoUrl: '' }
      ];
    }

    // APLICACIÓN DEL ALGORITMO DEL 40%
    sparkList = applySparkAlgorithm(rawSparks);

    container.innerHTML = `
      <div id="sparkFeedContainer" style="height: calc(100vh - 65px); width: 100%; max-width: 450px; margin: 0 auto; position: relative; overflow: hidden; background: #000;">
        <div id="sparkCard" class="glass-panel" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; position: relative; border-radius: 0;">
          
          <video id="sparkVideo" loop autoplay playsinline style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;"></video>
          
          <!-- Gradiente para lecturas -->
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, rgba(0,0,0,0.5) 100%); z-index: 1; pointer-events: none;"></div>

          <!-- Header Spark -->
          <div style="z-index: 2; display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
            <span style="background: rgba(229, 9, 20, 0.8); padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Spark</span>
            <span id="sparkCategoryBadge" style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 12px; font-size: 12px;">Categoría</span>
          </div>

          <!-- Controles laterales y datos de abajo -->
          <div style="z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-bottom: 20px;">
            <div style="flex: 1; padding-right: 15px;">
              <h3 id="sparkTitle" style="font-size: 1.2rem; margin-bottom: 5px;">Título del Short</h3>
              <p id="sparkAuthor" style="font-size: 0.85rem; color: var(--text-muted);">@lumera_official</p>
            </div>

            <!-- Botones Corazón y Compartir -->
            <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
              <button id="btnLikeSpark" class="icon-btn" style="background: rgba(0,0,0,0.6); border: 1px solid var(--glass-border); border-radius: 50%; width: 50px; height: 50px; font-size: 22px; cursor: pointer; transition: transform 0.2s;">❤️</button>
              <button id="btnShareSpark" class="icon-btn" style="background: rgba(0,0,0,0.6); border: 1px solid var(--glass-border); border-radius: 50%; width: 50px; height: 50px; font-size: 22px; cursor: pointer; transition: transform 0.2s;">🔗</button>
            </div>
          </div>

        </div>
      </div>
    `;

    currentIndex = 0;
    loadCurrentSpark();
    setupSwipeAndEvents();

  } catch (err) {
    container.innerHTML = `<div style="padding: 100px; text-align: center;"><h2>Error al cargar los Spark Shorts.</h2></div>`;
  }
}

// ALGORITMO 40%
function applySparkAlgorithm(allSparks) {
  const likesHistory = JSON.parse(localStorage.getItem('lumera_spark_likes') || '{}');
  
  // Buscar categoría favorita
  let topCategory = null;
  let maxLikes = 0;
  for (const [cat, count] of Object.entries(likesHistory)) {
    if (count > maxLikes) {
      maxLikes = count;
      topCategory = cat;
    }
  }

  if (!topCategory || allSparks.length < 3) {
    return shuffleArray([...allSparks]);
  }

  const preferredSparks = allSparks.filter(s => s.category === topCategory);
  const otherSparks = allSparks.filter(s => s.category !== topCategory);

  const target40PercentCount = Math.ceil(allSparks.length * 0.4);
  const selectedPreferred = preferredSparks.slice(0, target40PercentCount);
  const selectedOthers = shuffleArray([...otherSparks]);

  // Mezclar respetando la ponderación
  return shuffleArray([...selectedPreferred, ...selectedOthers]);
}

function loadCurrentSpark() {
  const current = sparkList[currentIndex];
  if (!current) return;

  const video = document.getElementById('sparkVideo');
  const title = document.getElementById('sparkTitle');
  const badge = document.getElementById('sparkCategoryBadge');
  const btnLike = document.getElementById('btnLikeSpark');

  if (video) video.src = current.videoUrl || '';
  if (title) title.textContent = current.title || 'Spark Short';
  if (badge) badge.textContent = current.category || 'General';

  // Verificar estado del Like
  const likesHistory = JSON.parse(localStorage.getItem('lumera_spark_likes') || '{}');
  const likedItems = JSON.parse(localStorage.getItem('lumera_spark_liked_ids') || '[]');
  
  if (likedItems.includes(current.id)) {
    btnLike.style.transform = 'scale(1.2)';
    btnLike.style.background = 'var(--accent-color)';
  } else {
    btnLike.style.transform = 'scale(1)';
    btnLike.style.background = 'rgba(0,0,0,0.6)';
  }
}

function setupSwipeAndEvents() {
  const container = document.getElementById('sparkFeedContainer');
  const btnLike = document.getElementById('btnLikeSpark');
  const btnShare = document.getElementById('btnShareSpark');

  // Evento Like (Corazón) -> Alimenta el algoritmo
  btnLike.onclick = () => {
    const current = sparkList[currentIndex];
    if (!current) return;

    let likesHistory = JSON.parse(localStorage.getItem('lumera_spark_likes') || '{}');
    let likedItems = JSON.parse(localStorage.getItem('lumera_spark_liked_ids') || '[]');

    const cat = current.category || 'general';

    if (!likedItems.includes(current.id)) {
      likedItems.push(current.id);
      likesHistory[cat] = (likesHistory[cat] || 0) + 1;
    } else {
      likedItems = likedItems.filter(id => id !== current.id);
      likesHistory[cat] = Math.max(0, (likesHistory[cat] || 1) - 1);
    }

    localStorage.setItem('lumera_spark_likes', JSON.stringify(likesHistory));
    localStorage.setItem('lumera_spark_liked_ids', JSON.stringify(likedItems));

    loadCurrentSpark();
  };

  // Evento Compartir
  btnShare.onclick = () => {
    const current = sparkList[currentIndex];
    if (navigator.share) {
      navigator.share({ title: current.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de Spark copiado al portapapeles!');
    }
  };

  // Swipe / Scroll táctil y con rueda de mouse
  let startY = 0;
  container.addEventListener('touchstart', (e) => startY = e.touches[0].clientY);
  container.addEventListener('touchend', (e) => {
    const endY = e.changedTouches[0].clientY;
    if (startY - endY > 50 && currentIndex < sparkList.length - 1) {
      currentIndex++;
      loadCurrentSpark();
    } else if (endY - startY > 50 && currentIndex > 0) {
      currentIndex--;
      loadCurrentSpark();
    }
  });

  container.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && currentIndex < sparkList.length - 1) {
      currentIndex++;
      loadCurrentSpark();
    } else if (e.deltaY < 0 && currentIndex > 0) {
      currentIndex--;
      loadCurrentSpark();
    }
  });
}

function shuffleArray(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
