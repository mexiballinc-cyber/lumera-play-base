// admin.js - Panel Maestro de Administración Completo
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from './firebase.js';
import { entrarPlataforma } from './auth.js';

/**
 * Renderiza el Panel Maestro con sus 3 secciones principales
 */
export async function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="
      padding: 30px;
      max-width: 1000px;
      margin: 0 auto;
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        border-bottom: 1px solid #282828;
        padding-bottom: 15px;
      ">
        <h2 style="color: #d4af37; margin: 0; font-size: 24px; font-weight: 600;">🛠 Panel Maestro de Administración</h2>
        <button id="btnExitAdmin" style="
          padding: 8px 18px;
          background: transparent;
          border: 1px solid #555;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        ">Volver al Catálogo</button>
      </div>

      <!-- NAVEGACIÓN SUPERIOR POR PESTAÑAS -->
      <div style="display: flex; gap: 12px; margin-bottom: 25px;">
        <button id="tabContent" class="admin-tab-btn" style="
          padding: 12px 24px;
          background: #d4af37;
          border: none;
          color: black;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Contenido</button>
        <button id="tabHero" class="admin-tab-btn" style="
          padding: 12px 24px;
          background: #1c1c1c;
          border: 1px solid #333;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Imágenes Hero</button>
        <button id="tabAvatars" class="admin-tab-btn" style="
          padding: 12px 24px;
          background: #1c1c1c;
          border: 1px solid #333;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Fotos Perfil</button>
      </div>

      <!-- CONTENEDOR DINÁMICO DE LA SECCIÓN SELECCIONADA -->
      <div id="adminSectionBody"></div>
    </div>
  `;

  document.getElementById('btnExitAdmin').onclick = () => entrarPlataforma();

  const tabContent = document.getElementById('tabContent');
  const tabHero = document.getElementById('tabHero');
  const tabAvatars = document.getElementById('tabAvatars');

  const setTabActive = (activeBtn) => {
    [tabContent, tabHero, tabAvatars].forEach(btn => {
      btn.style.background = '#1c1c1c';
      btn.style.color = 'white';
      btn.style.border = '1px solid #333';
      btn.style.fontWeight = 'normal';
    });
    activeBtn.style.background = '#d4af37';
    activeBtn.style.color = 'black';
    activeBtn.style.border = 'none';
    activeBtn.style.fontWeight = 'bold';
  };

  tabContent.onclick = () => { setTabActive(tabContent); renderSectionContent(); };
  tabHero.onclick = () => { setTabActive(tabHero); renderSectionHero(); };
  tabAvatars.onclick = () => { setTabActive(tabAvatars); renderSectionAvatars(); };

  // Carga inicial en la pestaña de Contenido
  renderSectionContent();
}

/* ==========================================================================
   1. SECCIÓN CONTENIDO (PELÍCULAS Y SERIES)
   ========================================================================== */
async function renderSectionContent() {
  const body = document.getElementById('adminSectionBody');
  body.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0; color: #ccc;">Gestión de Películas y Series</h3>
      <button id="btnNewContent" style="
        padding: 10px 20px;
        background: #d4af37;
        border: none;
        font-weight: bold;
        color: black;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">+ Nuevo Contenido</button>
    </div>
    <div id="contentList" style="display: flex; flex-direction: column; gap: 12px;">Cargando catálogo...</div>
  `;

  document.getElementById('btnNewContent').onclick = () => abrirModalFormContenido();

  try {
    const snap = await getDocs(collection(db, "contents"));
    const list = document.getElementById('contentList');
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<p style="color: #666;">No hay contenidos registrados.</p>`;
      return;
    }

    snap.forEach(d => {
      const item = { id: d.id, ...d.data() };
      list.innerHTML += `
        <div style="
          background: #141414;
          padding: 16px 20px;
          border-radius: 10px;
          border: 1px solid #282828;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${item.poster || ''}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px; background: #222;">
            <div>
              <strong style="color: white; font-size: 16px;">${item.title}</strong>
              <div style="margin-top: 4px;">
                <span style="color: #d4af37; font-size: 12px; text-transform: uppercase; font-weight: bold;">${item.type}</span>
                ${item.isKids ? '<span style="color: #4caf50; font-size: 12px; margin-left: 10px;">• Infantil</span>' : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn-edit-item" data-json='${JSON.stringify(item).replace(/'/g, "&apos;")}' style="
              padding: 8px 16px;
              background: #222;
              border: 1px solid #444;
              color: white;
              border-radius: 6px;
              cursor: pointer;
            ">Editar</button>
            <button class="btn-del-item" data-id="${item.id}" style="
              padding: 8px 16px;
              background: rgba(255, 68, 68, 0.15);
              border: 1px solid #ff4444;
              color: #ff4444;
              border-radius: 6px;
              cursor: pointer;
            ">Borrar</button>
          </div>
        </div>
      `;
    });

    list.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.onclick = () => abrirModalFormContenido(JSON.parse(btn.getAttribute('data-json')));
    });

    list.querySelectorAll('.btn-del-item').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Estás seguro de borrar este contenido?")) {
          await deleteDoc(doc(db, "contents", btn.getAttribute('data-id')));
          renderSectionContent();
        }
      };
    });

  } catch (err) {
    console.error("Error al cargar lista de contenidos:", err);
  }
}

/**
 * Modal para Crear / Editar Contenido (Película o Serie) con Subtítulos y Doblajes
 */
function abrirModalFormContenido(item = null) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    overflow-y: auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const subs = item?.subtitles || {};
  const dubs = item?.dubs || {};

  modal.innerHTML = `
    <div style="
      background: #151515;
      border: 1px solid #d4af37;
      padding: 30px;
      border-radius: 14px;
      width: 100%;
      max-width: 650px;
      color: white;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    ">
      <h3 style="color: #d4af37; margin-top: 0; margin-bottom: 20px; font-size: 20px;">
        ${item ? 'Editar Contenido' : 'Añadir Nuevo Contenido'}
      </h3>

      <form id="formSaveContent" style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">Título</label>
          <input type="text" id="cTitle" value="${item?.title || ''}" required style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">Tipo</label>
            <select id="cType" style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; box-sizing: border-box;">
              <option value="pelicula" ${item?.type === 'pelicula' ? 'selected' : ''}>Película</option>
              <option value="serie" ${item?.type === 'serie' ? 'selected' : ''}>Serie</option>
            </select>
          </div>
          <div style="flex: 1; display: flex; align-items: center; margin-top: 18px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;">
              <input type="checkbox" id="cIsKids" ${item?.isKids ? 'checked' : ''}> ¿Sección Infantil?
            </label>
          </div>
        </div>

        <div>
          <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">URL del Poster / Carátula</label>
          <input type="text" id="cPoster" value="${item?.poster || ''}" required style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div>
          <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">URL del Video Principal (MP4 / Direct Link)</label>
          <input type="text" id="cVideoUrl" value="${item?.videoUrl || ''}" style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div>
          <label style="font-size: 12px; color: #aaa; display: block; margin-bottom: 4px;">Descripción</label>
          <textarea id="cDescription" rows="3" style="width: 100%; padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; box-sizing: border-box; resize: vertical;">${item?.description || ''}</textarea>
        </div>

        <!-- SUBTÍTULOS -->
        <div style="border-top: 1px solid #282828; padding-top: 15px; margin-top: 5px;">
          <h4 style="color: #d4af37; margin: 0 0 10px 0; font-size: 15px;">💬 Pistas de Subtítulos (.vtt)</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" id="subEs" placeholder="Subtítulo Español (URL .vtt)" value="${subs.es || ''}" style="padding: 8px 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
            <input type="text" id="subEn" placeholder="Subtítulo Inglés (URL .vtt)" value="${subs.en || ''}" style="padding: 8px 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
          </div>
        </div>

        <!-- DOBLAJES -->
        <div style="border-top: 1px solid #282828; padding-top: 15px;">
          <h4 style="color: #d4af37; margin: 0 0 10px 0; font-size: 15px;">🎙 Pistas de Doblaje / Audio</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <input type="text" id="dubEs" placeholder="Video con Audio Español (URL)" value="${dubs.es || ''}" style="padding: 8px 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
            <input type="text" id="dubEn" placeholder="Video con Audio Inglés (URL)" value="${dubs.en || ''}" style="padding: 8px 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; border-top: 1px solid #282828; padding-top: 15px;">
          <button type="button" id="btnCancelC" style="padding: 10px 20px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button type="submit" style="padding: 10px 24px; background: #d4af37; border: none; font-weight: bold; color: black; border-radius: 6px; cursor: pointer;">Guardar Contenido</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('btnCancelC').onclick = () => modal.remove();

  document.getElementById('formSaveContent').onsubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: document.getElementById('cTitle').value.trim(),
      type: document.getElementById('cType').value,
      isKids: document.getElementById('cIsKids').checked,
      poster: document.getElementById('cPoster').value.trim(),
      videoUrl: document.getElementById('cVideoUrl').value.trim(),
      description: document.getElementById('cDescription').value.trim(),
      subtitles: {
        es: document.getElementById('subEs').value.trim(),
        en: document.getElementById('subEn').value.trim()
      },
      dubs: {
        es: document.getElementById('dubEs').value.trim(),
        en: document.getElementById('dubEn').value.trim()
      }
    };

    try {
      if (item?.id) {
        await updateDoc(doc(db, "contents", item.id), payload);
      } else {
        await addDoc(collection(db, "contents"), payload);
      }
      modal.remove();
      renderSectionContent();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };
}

/* ==========================================================================
   2. SECCIÓN IMÁGENES HERO
   ========================================================================== */
async function renderSectionHero() {
  const body = document.getElementById('adminSectionBody');
  body.innerHTML = `
    <h3 style="margin-top: 0; color: #ccc;">Gestión de Banners del Hero</h3>
    <div style="display: flex; gap: 12px; margin-bottom: 25px;">
      <input type="text" id="inputHeroUrl" placeholder="URL de la nueva imagen Hero" style="flex: 1; padding: 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; outline: none;">
      <button id="btnAddHero" style="padding: 12px 24px; background: #d4af37; border: none; font-weight: bold; color: black; border-radius: 6px; cursor: pointer;">+ Añadir Hero</button>
    </div>
    <div id="heroList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">Cargando imágenes...</div>
  `;

  const list = document.getElementById('heroList');

  try {
    const snap = await getDocs(collection(db, "heroes"));
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<p style="color: #666; grid-column: 1/-1;">No hay imágenes cargadas en el Hero.</p>`;
    }

    snap.forEach(d => {
      const data = d.data();
      list.innerHTML += `
        <div style="
          background: #141414;
          border: 1px solid #282828;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        ">
          <img src="${data.url}" style="width: 100%; height: 120px; object-fit: cover; display: block;">
          <button class="btn-del-hero" data-id="${d.id}" style="
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255, 0, 0, 0.85);
            border: none;
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-weight: bold;
          ">✕</button>
        </div>
      `;
    });

    document.getElementById('btnAddHero').onclick = async () => {
      const url = document.getElementById('inputHeroUrl').value.trim();
      if (url) {
        await addDoc(collection(db, "heroes"), { url });
        renderSectionHero();
      }
    };

    list.querySelectorAll('.btn-del-hero').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Borrar esta imagen del Hero?")) {
          await deleteDoc(doc(db, "heroes", btn.getAttribute('data-id')));
          renderSectionHero();
        }
      };
    });

  } catch (err) {
    console.error("Error al cargar banners Hero:", err);
  }
}

/* ==========================================================================
   3. SECCIÓN FOTOS DE PERFIL (AVATARES)
   ========================================================================== */
async function renderSectionAvatars() {
  const body = document.getElementById('adminSectionBody');
  body.innerHTML = `
    <h3 style="margin-top: 0; color: #ccc;">Gestión de Avatares / Fotos de Perfil</h3>
    <div style="display: flex; gap: 12px; margin-bottom: 25px;">
      <input type="text" id="inputAvatarUrl" placeholder="URL de la nueva foto de perfil" style="flex: 1; padding: 12px; background: #222; border: 1px solid #333; color: white; border-radius: 6px; outline: none;">
      <button id="btnAddAvatar" style="padding: 12px 24px; background: #d4af37; border: none; font-weight: bold; color: black; border-radius: 6px; cursor: pointer;">+ Añadir Foto</button>
    </div>
    <div id="avatarList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 20px;">Cargando avatares...</div>
  `;

  const list = document.getElementById('avatarList');

  try {
    const snap = await getDocs(collection(db, "avatars"));
    list.innerHTML = '';

    if (snap.empty) {
      list.innerHTML = `<p style="color: #666; grid-column: 1/-1;">No hay avatares registrados.</p>`;
    }

    snap.forEach(d => {
      const data = d.data();
      list.innerHTML += `
        <div style="
          background: #141414;
          border: 1px solid #282828;
          border-radius: 50%;
          width: 100px;
          height: 100px;
          overflow: hidden;
          position: relative;
          margin: 0 auto;
        ">
          <img src="${data.url}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
          <button class="btn-del-avatar" data-id="${d.id}" style="
            position: absolute;
            top: 2px;
            right: 2px;
            background: rgba(255, 0, 0, 0.85);
            border: none;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 12px;
          ">✕</button>
        </div>
      `;
    });

    document.getElementById('btnAddAvatar').onclick = async () => {
      const url = document.getElementById('inputAvatarUrl').value.trim();
      if (url) {
        await addDoc(collection(db, "avatars"), { url });
        renderSectionAvatars();
      }
    };

    list.querySelectorAll('.btn-del-avatar').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Borrar este avatar?")) {
          await deleteDoc(doc(db, "avatars", btn.getAttribute('data-id')));
          renderSectionAvatars();
        }
      };
    });

  } catch (err) {
    console.error("Error al cargar avatares:", err);
  }
}
