import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

export function renderAdminPanel(container) {
  container.innerHTML = `
    <div class="glass-panel" style="padding: 25px; max-width: 800px; margin: 20px auto;">
      <h2>Panel de Administración</h2>
      <div style="display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap;">
        <button id="btnTabContent" class="btn-secondary">Contenido</button>
        <button id="btnTabSpark" class="btn-secondary">Spark Shorts</button>
        <button id="btnTabHero" class="btn-secondary">Hero</button>
      </div>
      <div id="adminFormArea"></div>
    </div>
  `;

  document.getElementById('btnTabContent').onclick = () => renderAddContentForm();
}

function renderAddContentForm() {
  const area = document.getElementById('adminFormArea');
  area.innerHTML = `
    <form id="formAddMedia" style="display: flex; flex-direction: column; gap: 12px;">
      <input type="text" id="mTitle" placeholder="Título" required style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;">
      <input type="text" id="mCover" placeholder="URL Portada (Imgur)" required style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;">
      <input type="text" id="mBanner" placeholder="URL Banner" style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;">
      <textarea id="mDesc" placeholder="Descripción" style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;"></textarea>
      <select id="mType" style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;">
        <option value="movie">Película</option>
        <option value="series">Serie</option>
      </select>
      <input type="text" id="mVideo" placeholder="Link Video / Internet Archive" style="padding: 10px; background: #222; border: 1px solid #444; color: #fff;">
      <button type="submit" style="padding: 12px; background: var(--accent-color); border: none; font-weight: bold; cursor: pointer;">Guardar Contenido</button>
    </form>
  `;

  document.getElementById('formAddMedia').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(window.db, "content"), {
        title: document.getElementById('mTitle').value,
        cover: document.getElementById('mCover').value,
        banner: document.getElementById('mBanner').value,
        description: document.getElementById('mDesc').value,
        type: document.getElementById('mType').value,
        videoUrl: document.getElementById('mVideo').value,
        createdAt: new Date().toISOString()
      });
      alert('¡Contenido agregado con éxito!');
      e.target.reset();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };
}
