// admin.js - Módulo de Administración Completo
import { db, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from './firebase.js';

let adminContents = [];
let adminProfiles = [];

/**
 * Renderiza el Panel Administrativo Principal
 */
export async function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="max-width: 1100px; margin: 0 auto; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 25px;">
        <h2 style="color: var(--gold-accent); margin: 0;">Panel de Control Lumera</h2>
        <div style="display: flex; gap: 10px;">
          <button id="btnTabContents" style="padding: 10px 18px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 8px; cursor: pointer;">Contenidos</button>
          <button id="btnTabProfiles" style="padding: 10px 18px; background: #222; border: 1px solid #444; color: white; font-weight: bold; border-radius: 8px; cursor: pointer;">Perfiles</button>
        </div>
      </div>

      <div id="adminTabArea"></div>
    </div>
  `;

  document.getElementById('btnTabContents').onclick = () => {
    activarTab('contents');
    renderContentsTab();
  };

  document.getElementById('btnTabProfiles').onclick = () => {
    activarTab('profiles');
    renderProfilesTab();
  };

  // Cargar pestaña por defecto
  renderContentsTab();
}

function activarTab(tab) {
  const btnC = document.getElementById('btnTabContents');
  const btnP = document.getElementById('btnTabProfiles');
  if (tab === 'contents') {
    btnC.style.background = 'var(--gold-accent)';
    btnC.style.color = 'black';
    btnP.style.background = '#222';
    btnP.style.color = 'white';
  } else {
    btnP.style.background = 'var(--gold-accent)';
    btnP.style.color = 'black';
    btnC.style.background = '#222';
    btnC.style.color = 'white';
  }
}

// ==========================================
// SECCIÓN 1: GESTIÓN DE CONTENIDOS (PELÍCULAS / SERIES)
// ==========================================

async function renderContentsTab() {
  const area = document.getElementById('adminTabArea');
  area.innerHTML = `<p style="color: #aaa;">Cargando catálogo...</p>`;

  try {
    const snap = await getDocs(collection(db, "contents"));
    adminContents = [];
    snap.forEach(d => adminContents.push({ id: d.id, ...d.data() }));

    area.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <h3>Lista de Películas y Series</h3>
        <button id="btnNewContent" style="padding: 10px 20px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); font-weight: bold; border-radius: 8px; cursor: pointer;">+ Nuevo Contenido</button>
      </div>
      
      <div id="contentsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;"></div>
    `;

    document.getElementById('btnNewContent').onclick = () => abrirModalCrearEditarContenido();

    const grid = document.getElementById('contentsGrid');
    grid.innerHTML = adminContents.map(item => `
      <div style="background: #151515; border: 1px solid #282828; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 10px;">
        <img src="${item.poster || ''}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
        <h4 style="margin: 0; color: white;">${item.title}</h4>
        <span style="color: var(--gold-accent); font-size: 12px; text-transform: uppercase;">${item.type}</span>
        
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto;">
          <button class="btn-edit-item" data-id="${item.id}" style="flex: 1; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; cursor: pointer; font-size: 12px;">Editar</button>
          ${item.type === 'serie' ? `<button class="btn-manage-episodes" data-id="${item.id}" style="flex: 1; padding: 8px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); border-radius: 6px; cursor: pointer; font-size: 12px;">Episodios</button>` : ''}
          <button class="btn-delete-item" data-id="${item.id}" style="padding: 8px; background: #300; border: 1px solid #600; color: #ff8888; border-radius: 6px; cursor: pointer; font-size: 12px;">✕</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.onclick = () => {
        const item = adminContents.find(c => c.id === btn.getAttribute('data-id'));
        abrirModalCrearEditarContenido(item);
      };
    });

    grid.querySelectorAll('.btn-manage-episodes').forEach(btn => {
      btn.onclick = () => {
        const item = adminContents.find(c => c.id === btn.getAttribute('data-id'));
        abrirModalGestionEpisodios(item);
      };
    });

    grid.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Estás seguro de eliminar este contenido?")) {
          await deleteDoc(doc(db, "contents", btn.getAttribute('data-id')));
          renderContentsTab();
        }
      };
    });

  } catch (e) {
    area.innerHTML = `<p style="color: red;">Error al cargar contenidos: ${e.message}</p>`;
  }
}

/**
 * Modal Crear / Editar Contenido Principal
 */
function abrirModalCrearEditarContenido(item = null) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;`;

  modal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 16px; width: 100%; max-width: 500px; padding: 25px; color: white;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">${item ? 'Editar Contenido' : 'Nuevo Contenido'}</h3>
      <form id="formContent" style="display: flex; flex-direction: column; gap: 12px;">
        <label style="font-size: 12px; color: #aaa;">Título</label>
        <input type="text" id="cTitle" value="${item?.title || ''}" required style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">

        <label style="font-size: 12px; color: #aaa;">Tipo</label>
        <select id="cType" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
          <option value="pelicula" ${item?.type === 'pelicula' ? 'selected' : ''}>Película</option>
          <option value="serie" ${item?.type === 'serie' ? 'selected' : ''}>Serie</option>
        </select>

        <label style="font-size: 12px; color: #aaa;">URL del Poster (Portada)</label>
        <input type="text" id="cPoster" value="${item?.poster || ''}" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">

        <label style="font-size: 12px; color: #aaa;">URL de Imagen de Descripción (Fondo Banner)</label>
        <input type="text" id="cBanner" value="${item?.banner || ''}" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">

        <label style="font-size: 12px; color: #aaa;">Descripción</label>
        <textarea id="cDesc" rows="3" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">${item?.description || ''}</textarea>

        <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
          <input type="checkbox" id="cIsKids" ${item?.isKids ? 'checked' : ''}>
          <label for="cIsKids" style="font-size: 14px;">¿Es para la Sección Infantil (Niños)?</label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
          <button type="button" id="btnCloseContentModal" style="padding: 10px 18px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button type="submit" style="padding: 10px 18px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Guardar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('btnCloseContentModal').onclick = () => modal.remove();

  document.getElementById('formContent').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('cTitle').value.trim(),
      type: document.getElementById('cType').value,
      poster: document.getElementById('cPoster').value.trim(),
      banner: document.getElementById('cBanner').value.trim(),
      description: document.getElementById('cDesc').value.trim(),
      isKids: document.getElementById('cIsKids').checked,
      seasons: item?.seasons || []
    };

    if (item?.id) {
      await updateDoc(doc(db, "contents", item.id), data);
    } else {
      await addDoc(collection(db, "contents"), data);
    }

    modal.remove();
    renderContentsTab();
  };
}

// ==========================================
// SECCIÓN 2: GESTIÓN DE TEMPORADAS Y EPISODIOS (LAS 12 OPCIONES)
// ==========================================

function abrirModalGestionEpisodios(serie) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; padding: 30px; overflow-y: auto; color: white;`;

  let seasons = serie.seasons || [];

  const renderModalBody = () => {
    modal.innerHTML = `
      <div style="background: #111; border: 1px solid var(--gold-accent); border-radius: 16px; width: 100%; max-width: 850px; padding: 30px; height: fit-content;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: var(--gold-accent); margin: 0;">Temporadas y Episodios: ${serie.title}</h2>
          <button id="btnCloseEpModal" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
        </div>

        <button id="btnAddSeason" style="padding: 10px 16px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); border-radius: 8px; cursor: pointer; font-weight: bold; margin-bottom: 20px;">+ Añadir Temporada</button>

        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${seasons.length === 0 ? '<p style="color: #777;">No hay temporadas aún.</p>' : ''}
          ${seasons.map((season, sIdx) => `
            <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="margin: 0; color: white;">${season.name || `Temporada ${sIdx + 1}`}</h4>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-add-ep" data-sidx="${sIdx}" style="padding: 6px 12px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 12px;">+ Episodio</button>
                  <button class="btn-del-season" data-sidx="${sIdx}" style="padding: 6px 12px; background: #300; border: 1px solid #600; color: #ff8888; border-radius: 6px; cursor: pointer; font-size: 12px;">Eliminar Temp.</button>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${(season.episodes || []).map((ep, eIdx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 10px 14px; border-radius: 6px;">
                    <span style="font-size: 14px;">E${eIdx + 1}: ${ep.title}</span>
                    <div style="display: flex; gap: 6px;">
                      <button class="btn-edit-ep" data-sidx="${sIdx}" data-eidx="${eIdx}" style="padding: 4px 10px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">Editar (12 Opciones)</button>
                      <button class="btn-del-ep" data-sidx="${sIdx}" data-eidx="${eIdx}" style="padding: 4px 10px; background: #400; border: none; color: white; border-radius: 4px; cursor: pointer; font-size: 12px;">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btnCloseEpModal').onclick = () => modal.remove();

    document.getElementById('btnAddSeason').onclick = () => {
      seasons.push({ name: `Temporada ${seasons.length + 1}`, episodes: [] });
      guardarCambiosSerie(serie.id, seasons, renderModalBody);
    };

    modal.querySelectorAll('.btn-del-season').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        seasons.splice(sIdx, 1);
        guardarCambiosSerie(serie.id, seasons, renderModalBody);
      };
    });

    modal.querySelectorAll('.btn-add-ep').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        abrirFormularioEpisodio(serie.id, seasons, sIdx, null, renderModalBody);
      };
    });

    modal.querySelectorAll('.btn-edit-ep').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        abrirFormularioEpisodio(serie.id, seasons, sIdx, eIdx, renderModalBody);
      };
    });

    modal.querySelectorAll('.btn-del-ep').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        seasons[sIdx].episodes.splice(eIdx, 1);
        guardarCambiosSerie(serie.id, seasons, renderModalBody);
      };
    });
  };

  document.body.appendChild(modal);
  renderModalBody();
}

async function guardarCambiosSerie(id, seasons, cb) {
  await updateDoc(doc(db, "contents", id), { seasons });
  cb();
}

/**
 * Formulario del Episodio con las 12 Opciones (6 Subtítulos + 6 Doblajes)
 */
function abrirFormularioEpisodio(serieId, seasons, sIdx, eIdx = null, callbackRefresh) {
  const epModal = document.createElement('div');
  epModal.className = 'glass-modal';
  epModal.style.cssText = `position: fixed; inset: 0; z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px; overflow-y: auto; color: white;`;

  const ep = eIdx !== null ? seasons[sIdx].episodes[eIdx] : {
    title: '',
    videoUrl: '',
    subtitles: {},
    doblajes: {}
  };

  const subs = ep.subtitles || {};
  const dubs = ep.doblajes || {};

  epModal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 16px; width: 100%; max-width: 750px; padding: 25px; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">${eIdx !== null ? 'Editar Episodio' : 'Añadir Episodio'}</h3>
      
      <form id="formEpisodio" style="display: flex; flex-direction: column; gap: 15px;">
        <div>
          <label style="font-size: 12px; color: #aaa;">Nombre del Episodio</label>
          <input type="text" id="epTitle" value="${ep.title || ''}" required style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
        </div>

        <div>
          <label style="font-size: 12px; color: #aaa;">URL Video Principal (Por defecto)</label>
          <input type="text" id="epVideoUrl" value="${ep.videoUrl || ''}" style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
        </div>

        <!-- 6 OPCIONES DE SUBTÍTULOS -->
        <div style="border: 1px solid #333; padding: 15px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: var(--gold-accent); font-size: 14px;">Enlaces de Subtítulos (6 Idiomas)</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><label style="font-size: 11px;">Español</label><input type="text" id="sub_es" value="${subs.es || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Inglés</label><input type="text" id="sub_en" value="${subs.en || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Alemán</label><input type="text" id="sub_de" value="${subs.de || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Portugués</label><input type="text" id="sub_pt" value="${subs.pt || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Francés</label><input type="text" id="sub_fr" value="${subs.fr || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Japonés</label><input type="text" id="sub_ja" value="${subs.ja || ''}" placeholder="URL VTT / SRT" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
          </div>
        </div>

        <!-- 6 OPCIONES DE DOBLAJE / AUDIO -->
        <div style="border: 1px solid #333; padding: 15px; border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: var(--gold-accent); font-size: 14px;">Enlaces de Doblaje / Audio (6 Idiomas)</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><label style="font-size: 11px;">Español</label><input type="text" id="dub_es" value="${dubs.es || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Inglés</label><input type="text" id="dub_en" value="${dubs.en || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Alemán</label><input type="text" id="dub_de" value="${dubs.de || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Portugués</label><input type="text" id="dub_pt" value="${dubs.pt || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Francés</label><input type="text" id="dub_fr" value="${dubs.fr || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
            <div><label style="font-size: 11px;">Japonés</label><input type="text" id="dub_ja" value="${dubs.ja || ''}" placeholder="URL Audio / MP4" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button type="button" id="btnCloseEpForm" style="padding: 10px 18px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button type="submit" style="padding: 10px 18px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Guardar Episodio</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(epModal);
  document.getElementById('btnCloseEpForm').onclick = () => epModal.remove();

  document.getElementById('formEpisodio').onsubmit = async (e) => {
    e.preventDefault();

    const newEpData = {
      title: document.getElementById('epTitle').value.trim(),
      videoUrl: document.getElementById('epVideoUrl').value.trim(),
      subtitles: {
        es: document.getElementById('sub_es').value.trim(),
        en: document.getElementById('sub_en').value.trim(),
        de: document.getElementById('sub_de').value.trim(),
        pt: document.getElementById('sub_pt').value.trim(),
        fr: document.getElementById('sub_fr').value.trim(),
        ja: document.getElementById('sub_ja').value.trim()
      },
      doblajes: {
        es: document.getElementById('dub_es').value.trim(),
        en: document.getElementById('dub_en').value.trim(),
        de: document.getElementById('dub_de').value.trim(),
        pt: document.getElementById('dub_pt').value.trim(),
        fr: document.getElementById('dub_fr').value.trim(),
        ja: document.getElementById('dub_ja').value.trim()
      }
    };

    if (eIdx !== null) {
      seasons[sIdx].episodes[eIdx] = newEpData;
    } else {
      seasons[sIdx].episodes.push(newEpData);
    }

    await guardarCambiosSerie(serieId, seasons, () => {
      epModal.remove();
      callbackRefresh();
    });
  };
}

// ==========================================
// SECCIÓN 3: GESTIÓN Y RENDERIZADO DE PERFILES
// ==========================================

async function renderProfilesTab() {
  const area = document.getElementById('adminTabArea');
  area.innerHTML = `<p style="color: #aaa;">Cargando perfiles...</p>`;

  try {
    const snap = await getDocs(collection(db, "profiles"));
    adminProfiles = [];
    snap.forEach(d => adminProfiles.push({ id: d.id, ...d.data() }));

    area.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <h3>Perfiles de Usuario</h3>
        <button id="btnNewProfile" style="padding: 10px 20px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); font-weight: bold; border-radius: 8px; cursor: pointer;">+ Crear Perfil</button>
      </div>

      <div id="profilesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 20px;"></div>
    `;

    document.getElementById('btnNewProfile').onclick = () => abrirModalCrearEditarPerfil();

    const grid = document.getElementById('profilesGrid');
    grid.innerHTML = adminProfiles.map(p => `
      <div style="background: #151515; border: 1px solid #282828; border-radius: 12px; padding: 15px; text-align: center; display: flex; flex-direction: column; align-items: center;">
        <img src="${p.avatar || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}" style="width: 90px; height: 90px; border-radius: 12px; object-fit: cover; margin-bottom: 10px;">
        <h4 style="margin: 0; color: white;">${p.name}</h4>
        <span style="font-size: 12px; color: ${p.isKids ? '#00ff7f' : '#aaa'}; margin-top: 4px;">${p.isKids ? 'Infantil' : 'Estándar'}</span>
        
        <div style="display: flex; gap: 8px; margin-top: 15px; width: 100%;">
          <button class="btn-edit-prof" data-id="${p.id}" style="flex: 1; padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; cursor: pointer; font-size: 12px;">Editar</button>
          <button class="btn-del-prof" data-id="${p.id}" style="padding: 6px 10px; background: #300; border: 1px solid #600; color: #ff8888; border-radius: 6px; cursor: pointer; font-size: 12px;">✕</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-edit-prof').forEach(btn => {
      btn.onclick = () => {
        const p = adminProfiles.find(item => item.id === btn.getAttribute('data-id'));
        abrirModalCrearEditarPerfil(p);
      };
    });

    grid.querySelectorAll('.btn-del-prof').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Eliminar este perfil?")) {
          await deleteDoc(doc(db, "profiles", btn.getAttribute('data-id')));
          renderProfilesTab();
        }
      };
    });

  } catch (e) {
    area.innerHTML = `<p style="color: red;">Error al cargar perfiles: ${e.message}</p>`;
  }
}

function abrirModalCrearEditarPerfil(perfil = null) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; color: white;`;

  modal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 16px; width: 100%; max-width: 400px; padding: 25px;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">${perfil ? 'Editar Perfil' : 'Crear Perfil'}</h3>
      <form id="formPerfil" style="display: flex; flex-direction: column; gap: 12px;">
        <label style="font-size: 12px; color: #aaa;">Nombre del Perfil</label>
        <input type="text" id="pName" value="${perfil?.name || ''}" required style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">

        <label style="font-size: 12px; color: #aaa;">URL de Imagen de Perfil (Avatar)</label>
        <input type="text" id="pAvatar" value="${perfil?.avatar || ''}" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">

        <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
          <input type="checkbox" id="pIsKids" ${perfil?.isKids ? 'checked' : ''}>
          <label for="pIsKids" style="font-size: 14px;">Perfil Infantil (Modo Niños)</label>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
          <button type="button" id="btnCloseProfModal" style="padding: 10px 18px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
          <button type="submit" style="padding: 10px 18px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Guardar</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById('btnCloseProfModal').onclick = () => modal.remove();

  document.getElementById('formPerfil').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('pName').value.trim(),
      avatar: document.getElementById('pAvatar').value.trim(),
      isKids: document.getElementById('pIsKids').checked
    };

    if (perfil?.id) {
      await updateDoc(doc(db, "profiles", perfil.id), data);
    } else {
      await addDoc(collection(db, "profiles"), data);
    }

    modal.remove();
    renderProfilesTab();
  };
}
