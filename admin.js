// admin.js - Panel de Administración Lumera 3.0 (4 Categorías + 14 Tracks)
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } 
  from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const LANG_KEYS = ['es', 'en', 'fr', 'it', 'de', 'ja', 'pt'];
const LANG_LABELS = { es: 'Español', en: 'Inglés', fr: 'Francés', it: 'Italiano', de: 'Alemán', ja: 'Japonés', pt: 'Portugués' };

export async function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="padding: 30px; max-width: 1100px; margin: 0 auto; color: #fff;">
      <h1 style="font-size: 2rem; margin-bottom: 20px;">Panel de Control Admin</h1>
      
      <!-- PESTAÑAS PRINCIPALES -->
      <div style="display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; flex-wrap: wrap;">
        <button class="tab-btn active" data-tab="content" style="padding: 10px 20px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; color: #fff; font-weight: bold;">Contenido</button>
        <button class="tab-btn" data-tab="spark" style="padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer; color: #fff;">Spark Shorts</button>
        <button class="tab-btn" data-tab="hero" style="padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer; color: #fff;">Hero Banner</button>
        <button class="tab-btn" data-tab="avatars" style="padding: 10px 20px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer; color: #fff;">Fotos de Perfil</button>
      </div>

      <!-- VISTA DE CONTENIDO DE PESTAÑAS -->
      <div id="adminTabContent"></div>
    </div>
  `;

  const tabs = container.querySelectorAll('.tab-btn');
  const contentArea = document.getElementById('adminTabContent');

  const switchTab = (tabName) => {
    tabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.style.background = 'var(--accent-color)';
        t.style.border = 'none';
      } else {
        t.style.background = 'rgba(255,255,255,0.05)';
        t.style.border = '1px solid var(--glass-border)';
      }
    });

    if (tabName === 'content') renderContentTab(contentArea);
    if (tabName === 'spark') renderSparkTab(contentArea);
    if (tabName === 'hero') renderSimpleImageTab(contentArea, 'hero', 'Hero Banners');
    if (tabName === 'avatars') renderSimpleImageTab(contentArea, 'avatars', 'Fotos de Perfil');
  };

  tabs.forEach(t => t.onclick = () => switchTab(t.dataset.tab));
  switchTab('content');
}

// 1. PESTAÑA: CONTENIDO (PELÍCULAS / SERIES)
async function renderContentTab(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Catálogo de Películas y Series</h2>
      <button id="btnAddContent" style="padding: 10px 18px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; font-weight: bold; color: #fff;">+ Añadir Contenido</button>
    </div>
    <div id="contentList" style="display: flex; flex-direction: column; gap: 12px;">Cargando catálogo...</div>
  `;

  const db = getFirestore();
  const listEl = document.getElementById('contentList');

  const loadList = async () => {
    const snap = await getDocs(collection(db, "content"));
    if (snap.empty) {
      listEl.innerHTML = `<p style="color: var(--text-muted);">No hay contenido registrado.</p>`;
      return;
    }
    listEl.innerHTML = snap.docs.map(docSnap => {
      const d = docSnap.data();
      return `
        <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-radius: 8px;">
          <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${d.cover}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;">
            <div>
              <strong>${d.title}</strong> (${d.type === 'series' ? 'Serie' : 'Película'})
              <p style="font-size: 12px; color: var(--text-muted);">${d.isForMinorsOver7 ? '+7 Años' : 'Kids (Para Todos)'}</p>
            </div>
          </div>
          <button class="btn-del" data-id="${docSnap.id}" style="padding: 8px 12px; background: rgba(229,9,20,0.3); border: 1px solid var(--accent-color); color: #fff; border-radius: 6px; cursor: pointer;">Borrar</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-del').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar este contenido?")) {
          await deleteDoc(doc(db, "content", btn.dataset.id));
          loadList();
        }
      };
    });
  };

  document.getElementById('btnAddContent').onclick = () => openContentFormModal(null, () => loadList());
  loadList();
}

// FORMULARIO MODAL DE CONTENIDO (+14 IDIOMAS Y SERIES/PELICULA)
function openContentFormModal(existingData, onSave) {
  const modal = document.createElement('div');
  modal.className = 'modal glass-modal';
  
  modal.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 25px; border-radius: 12px; position: relative; color: #fff;">
      <button id="btnCloseModal" class="icon-btn" style="position: absolute; top: 15px; right: 15px;">✕</button>
      <h2 style="margin-bottom: 20px;">Añadir Nuevo Contenido</h2>

      <form id="formContent" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="text" id="cTitle" placeholder="Título" required style="padding: 10px; background: #1a1c23; border: 1px solid var(--glass-border); color: #fff; border-radius: 6px;">
        <input type="url" id="cCover" placeholder="Link de Portada (Imgur)" required style="padding: 10px; background: #1a1c23; border: 1px solid var(--glass-border); color: #fff; border-radius: 6px;">
        <input type="url" id="cBanner" placeholder="Link de Banner (Imgur)" style="padding: 10px; background: #1a1c23; border: 1px solid var(--glass-border); color: #fff; border-radius: 6px;">
        <textarea id="cDesc" placeholder="Descripción / Sinopsis" style="padding: 10px; background: #1a1c23; border: 1px solid var(--glass-border); color: #fff; border-radius: 6px; height: 70px;"></textarea>

        <div style="display: flex; gap: 20px; align-items: center;">
          <label><input type="radio" name="cType" value="movie" checked> Película</label>
          <label><input type="radio" name="cType" value="series"> Serie</label>
          <label style="margin-left: auto;"><input type="checkbox" id="cAgeLimit"> Es para mayores de 7 años (+7)</label>
        </div>

        <!-- ÁREA PELÍCULA -->
        <div id="movieSection" style="border-top: 1px solid var(--glass-border); padding-top: 15px;">
          <input type="url" id="cVideoUrl" placeholder="Link Video Principal (Internet Archive MP4)" style="width: 100%; padding: 10px; background: #1a1c23; border: 1px solid var(--glass-border); color: #fff; border-radius: 6px; margin-bottom: 15px;">
          
          <h4>14 Secciones de Idiomas (7 Doblajes / 7 Subtítulos)</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
            <div>
              <h5 style="color: var(--accent-color);">7 Doblajes (Audio - Links)</h5>
              ${LANG_KEYS.map(k => `<input type="url" class="audio-input" data-lang="${k}" placeholder="Audio ${LANG_LABELS[k]}" style="width:100%; padding: 6px; margin-top:5px; background: #1a1c23; border: 1px solid var(--glass-border); color:#fff; border-radius:4px; font-size:12px;">`).join('')}
            </div>
            <div>
              <h5 style="color: var(--accent-color);">7 Subtítulos (.vtt / .srt)</h5>
              ${LANG_KEYS.map(k => `<input type="url" class="sub-input" data-lang="${k}" placeholder="Sub ${LANG_LABELS[k]}" style="width:100%; padding: 6px; margin-top:5px; background: #1a1c23; border: 1px solid var(--glass-border); color:#fff; border-radius:4px; font-size:12px;">`).join('')}
            </div>
          </div>
        </div>

        <button type="submit" style="padding: 12px; background: var(--accent-color); border: none; border-radius: 6px; font-weight: bold; color: #fff; cursor: pointer; margin-top: 15px;">Guardar Contenido</button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCloseModal').onclick = () => modal.remove();

  document.getElementById('formContent').onsubmit = async (e) => {
    e.preventDefault();
    const db = getFirestore();
    
    const audios = {};
    modal.querySelectorAll('.audio-input').forEach(inp => { if(inp.value) audios[inp.dataset.lang] = inp.value; });
    
    const subtitles = {};
    modal.querySelectorAll('.sub-input').forEach(inp => { if(inp.value) subtitles[inp.dataset.lang] = inp.value; });

    const newDoc = {
      title: document.getElementById('cTitle').value,
      cover: document.getElementById('cCover').value,
      banner: document.getElementById('cBanner').value,
      description: document.getElementById('cDesc').value,
      type: document.querySelector('input[name="cType"]:checked').value,
      isForMinorsOver7: document.getElementById('cAgeLimit').checked,
      videoUrl: document.getElementById('cVideoUrl').value,
      audios,
      subtitles,
      seasons: []
    };

    await addDoc(collection(db, "content"), newDoc);
    modal.remove();
    if (onSave) onSave();
  };
}

// 2. PESTAÑA: SPARK SHORTS
async function renderSparkTab(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>Gestión de Spark Shorts</h2>
      <button id="btnAddSpark" style="padding: 10px 18px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; font-weight: bold; color: #fff;">+ Añadir Spark</button>
    </div>
    <div id="sparkList" style="display: flex; flex-direction: column; gap: 12px;">Cargando Spark Shorts...</div>
  `;

  const db = getFirestore();
  const listEl = document.getElementById('sparkList');

  const loadList = async () => {
    const snap = await getDocs(collection(db, "sparks"));
    if (snap.empty) {
      listEl.innerHTML = `<p style="color: var(--text-muted);">No hay Shorts de Spark registrados.</p>`;
      return;
    }
    listEl.innerHTML = snap.docs.map(docSnap => {
      const d = docSnap.data();
      return `
        <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-radius: 8px;">
          <div>
            <strong>${d.title}</strong>
            <p style="font-size: 12px; color: var(--text-muted);">Categoría: ${d.category || 'General'}</p>
          </div>
          <button class="btn-del-spark" data-id="${docSnap.id}" style="padding: 8px 12px; background: rgba(229,9,20,0.3); border: 1px solid var(--accent-color); color: #fff; border-radius: 6px; cursor: pointer;">Borrar</button>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-del-spark').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar este Spark?")) {
          await deleteDoc(doc(db, "sparks", btn.dataset.id));
          loadList();
        }
      };
    });
  };

  document.getElementById('btnAddSpark').onclick = async () => {
    const title = prompt("Nombre del Spark Short:");
    if (!title) return;
    const videoUrl = prompt("Link de vídeo (Internet Archive o Imgur):");
    if (!videoUrl) return;
    const category = prompt("Categoría (Ej. accion, comedia, drama):") || "general";

    await addDoc(collection(db, "sparks"), { title, videoUrl, category });
    loadList();
  };

  loadList();
}

// 3 Y 4. PESTAÑAS SIMPLES: HERO Y FOTOS DE PERFIL
async function renderSimpleImageTab(container, collectionName, title) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>${title}</h2>
      <button id="btnAddImg" style="padding: 10px 18px; background: var(--accent-color); border: none; border-radius: 6px; cursor: pointer; font-weight: bold; color: #fff;">+ Agregar Imagen</button>
    </div>
    <div id="imgGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">Cargando imágenes...</div>
  `;

  const db = getFirestore();
  const grid = document.getElementById('imgGrid');

  const loadGrid = async () => {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) {
      grid.innerHTML = `<p style="color: var(--text-muted);">No hay imágenes guardadas.</p>`;
      return;
    }
    grid.innerHTML = snap.docs.map(docSnap => `
      <div class="glass-panel" style="padding: 10px; border-radius: 8px; text-align: center;">
        <img src="${docSnap.data().url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
        <button class="btn-del-img" data-id="${docSnap.id}" style="width: 100%; padding: 6px; background: rgba(229,9,20,0.3); border: 1px solid var(--accent-color); color: #fff; border-radius: 4px; cursor: pointer;">Quitar</button>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-del-img').forEach(btn => {
      btn.onclick = async () => {
        await deleteDoc(doc(db, collectionName, btn.dataset.id));
        loadGrid();
      };
    });
  };

  document.getElementById('btnAddImg').onclick = async () => {
    const url = prompt("Ingresa el link de Imgur o URL de la imagen:");
    if (url) {
      await addDoc(collection(db, collectionName), { url });
      loadGrid();
    }
  };

  loadGrid();
}
