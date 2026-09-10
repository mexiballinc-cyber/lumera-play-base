// admin.js - Panel Maestro para Gestión de Contenidos, Episodios y Pistas de Idioma
import { IDIOMAS_DISPONIBLES } from './i18n.js';
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from './firebase.js';

export async function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="padding: 20px; max-width: 900px; margin: 0 auto; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 15px;">
        <h2 style="color: #d4af37; margin: 0;">🛠️ Panel Maestro de Administración</h2>
        <button id="btnCrearNuevoContenido" style="padding: 10px 20px; background: #d4af37; border: none; color: black; font-weight: bold; border-radius: 8px; cursor: pointer;">+ Nuevo Contenido</button>
      </div>

      <div id="adminContentArea">Cargando contenidos...</div>
    </div>
  `;

  document.getElementById('btnCrearNuevoContenido').onclick = () => abrirModalCrearEditarContenido(null);
  cargarListaContenidos();
}

async function cargarListaContenidos() {
  const area = document.getElementById('adminContentArea');
  if (!area) return;

  try {
    const snap = await getDocs(collection(db, "contents"));
    if (snap.empty) {
      area.innerHTML = `<p style="color:#aaa; text-align:center;">No hay contenidos registrados en la base de datos.</p>`;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 15px;">`;

    snap.forEach(documento => {
      const item = documento.data();
      const id = documento.id;

      html += `
        <div style="background: #1c1c1c; border: 1px solid rgba(255,255,255,0.1); padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 15px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${item.poster || 'https://via.placeholder.com/50x75'}" style="width: 50px; height: 75px; object-fit: cover; border-radius: 6px;">
            <div>
              <h4 style="margin: 0 0 5px 0; color: #fff; font-size: 16px;">${item.title} <span style="font-size: 12px; color: #d4af37; font-weight: normal;">(${item.type ? item.type.toUpperCase() : 'CONTENIDO'})</span></h4>
              <p style="margin: 0; color: #aaa; font-size: 13px;">Categoría: ${item.category || 'General'} ${item.is7Plus ? ' | <span style="color:#ffbb33;">+7 Niños</span>' : ''}</p>
            </div>
          </div>

          <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
            ${item.type === 'serie' ? `<button class="btn-gestionar-eps" data-id="${id}" data-json='${JSON.stringify(item)}' style="padding: 8px 14px; background: #d4af37; border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">🎬 Episodios</button>` : ''}
            <button class="btn-editar-item" data-id="${id}" data-json='${JSON.stringify(item)}' style="padding: 8px 14px; background: #333; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer;">✏️ Editar</button>
            <button class="btn-borrar-item" data-id="${id}" style="padding: 8px 14px; background: rgba(255,0,0,0.2); border: 1px solid #ff4444; color: #ff4444; border-radius: 6px; cursor: pointer;">🗑️ Borrar</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    area.innerHTML = html;

    // Eventos
    document.querySelectorAll('.btn-borrar-item').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Estás seguro de eliminar este contenido? Esta acción no se puede deshacer.")) {
          await deleteDoc(doc(db, "contents", btn.getAttribute('data-id')));
          cargarListaContenidos();
        }
      };
    });

    document.querySelectorAll('.btn-editar-item').forEach(btn => {
      btn.onclick = () => {
        const item = JSON.parse(btn.getAttribute('data-json'));
        abrirModalCrearEditarContenido(btn.getAttribute('data-id'), item);
      };
    });

    document.querySelectorAll('.btn-gestionar-eps').forEach(btn => {
      btn.onclick = () => {
        const item = JSON.parse(btn.getAttribute('data-json'));
        abrirModalGestionEpisodios(btn.getAttribute('data-id'), item);
      };
    });

  } catch (e) {
    area.innerHTML = `<p style="color:red; text-align:center;">Error al cargar la lista de contenidos.</p>`;
  }
}

// MODAL PARA CREAR / EDITAR PELÍCULA O SERIE
function abrirModalCrearEditarContenido(docId = null, itemExistente = null) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px; overflow-y:auto;";

  modal.innerHTML = `
    <div style="background:#151515; border:1px solid #d4af37; padding:25px; border-radius:16px; max-width:550px; width:100%; color:white; max-height:90vh; overflow-y:auto;">
      <h3 style="color:#d4af37; margin-top:0;">${docId ? 'Editar Contenido' : 'Añadir Nuevo Contenido'}</h3>
      
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="font-size:12px; color:#aaa;">Título</label>
          <input type="text" id="admTitle" value="${itemExistente ? itemExistente.title || '' : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:12px; color:#aaa;">Tipo</label>
            <select id="admType" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
              <option value="pelicula" ${itemExistente && itemExistente.type === 'pelicula' ? 'selected' : ''}>Película</option>
              <option value="serie" ${itemExistente && itemExistente.type === 'serie' ? 'selected' : ''}>Serie</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; color:#aaa;">Categoría</label>
            <input type="text" id="admCategory" value="${itemExistente ? itemExistente.category || '' : ''}" placeholder="Ej: Acción, Drama..." style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
        </div>

        <div>
          <label style="font-size:12px; color:#aaa;">Descripción</label>
          <textarea id="admDescription" style="width:100%; height:70px; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">${itemExistente ? itemExistente.description || '' : ''}</textarea>
        </div>

        <div>
          <label style="font-size:12px; color:#aaa;">URL del Poster (Vertical)</label>
          <input type="text" id="admPoster" value="${itemExistente ? itemExistente.poster || '' : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div>
          <label style="font-size:12px; color:#aaa;">URL del Banner (Horizontal)</label>
          <input type="text" id="admBanner" value="${itemExistente ? itemExistente.banner || '' : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div id="admVideoUrlContainer" style="display:${itemExistente && itemExistente.type === 'serie' ? 'none' : 'block'};">
          <label style="font-size:12px; color:#aaa;">URL del Video MP4 (Para Películas)</label>
          <input type="text" id="admVideoUrl" value="${itemExistente ? itemExistente.videoUrl || '' : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
          <input type="checkbox" id="admIs7Plus" ${itemExistente && itemExistente.is7Plus ? 'checked' : ''}>
          <label for="admIs7Plus" style="font-size:13px; color:#aaa;">Apto para +7 (Sección Niños)</label>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
          <button id="btnCancelAdmModal" style="padding:10px 18px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
          <button id="btnSaveAdmModal" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar Contenido</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('admType').onchange = (e) => {
    document.getElementById('admVideoUrlContainer').style.display = e.target.value === 'serie' ? 'none' : 'block';
  };

  document.getElementById('btnCancelAdmModal').onclick = () => modal.remove();

  document.getElementById('btnSaveAdmModal').onclick = async () => {
    const title = document.getElementById('admTitle').value.trim();
    const type = document.getElementById('admType').value;
    const category = document.getElementById('admCategory').value.trim();
    const description = document.getElementById('admDescription').value.trim();
    const poster = document.getElementById('admPoster').value.trim();
    const banner = document.getElementById('admBanner').value.trim();
    const videoUrl = document.getElementById('admVideoUrl').value.trim();
    const is7Plus = document.getElementById('admIs7Plus').checked;

    if (!title || !poster) {
      alert("Por favor completa al menos el título y el póster.");
      return;
    }

    const payload = { title, type, category, description, poster, banner, is7Plus };
    if (type === 'pelicula') payload.videoUrl = videoUrl;

    if (docId) {
      await updateDoc(doc(db, "contents", docId), payload);
    } else {
      payload.seasons = type === 'serie' ? [{ seasonNumber: 1, episodes: [] }] : [];
      await addDoc(collection(db, "contents"), payload);
    }

    modal.remove();
    cargarListaContenidos();
  };
}

// MODAL PARA GESTIONAR EPISODIOS DE UNA SERIE
function abrirModalGestionEpisodios(docId, item) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px;";

  let temporadas = item.seasons && item.seasons.length > 0 ? item.seasons : [{ seasonNumber: 1, episodes: [] }];

  const renderEpisodiosList = () => {
    let listHtml = '';
    temporadas.forEach((s, sIdx) => {
      listHtml += `
        <div style="margin-bottom:20px;">
          <h4 style="color:#d4af37; margin:10px 0; border-bottom:1px solid #333; padding-bottom:5px;">Temporada ${s.seasonNumber || sIdx + 1}</h4>
      `;
      
      if (!s.episodes || s.episodes.length === 0) {
        listHtml += `<p style="color:#666; font-size:12px; margin:5px 0;">No hay episodios agregados en esta temporada.</p>`;
      } else {
        s.episodes.forEach((ep, eIdx) => {
          listHtml += `
            <div style="background:#222; border:1px solid #444; padding:10px 14px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:13px; color:white; font-weight:bold;">${eIdx + 1}. ${ep.title || 'Episodio ' + (eIdx + 1)}</span>
                <p style="margin:2px 0 0 0; font-size:11px; color:#888;">URL: ${ep.videoUrl ? ep.videoUrl.substring(0, 35) + '...' : 'Sin video'}</p>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="btn-editar-ep-pistas" data-sidx="${sIdx}" data-eidx="${eIdx}" style="padding:6px 12px; background:#d4af37; border:none; color:black; font-size:12px; font-weight:bold; border-radius:6px; cursor:pointer;">✎ Editar Pistas</button>
                <button class="btn-borrar-ep" data-sidx="${sIdx}" data-eidx="${eIdx}" style="padding:6px 10px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; font-size:12px; border-radius:6px; cursor:pointer;">🗑️</button>
              </div>
            </div>
          `;
        });
      }

      listHtml += `</div>`;
    });
    return listHtml;
  };

  modal.innerHTML = `
    <div style="background:#151515; border:1px solid #d4af37; padding:25px; border-radius:16px; max-width:650px; width:100%; color:white; max-height:85vh; overflow-y:auto;">
      <h3 style="color:#d4af37; margin-top:0;">Gestionar Episodios: ${item.title}</h3>
      
      <div id="contenedorListaEpisodiosAdmin">
        ${renderEpisodiosList()}
      </div>

      <div style="margin-top:20px; border-top:1px solid #333; padding-top:15px; display:flex; justify-content:space-between; gap:10px;">
        <button id="btnAñadirNuevoEpisodio" style="padding:10px 16px; background:#333; border:1px solid #d4af37; color:#d4af37; border-radius:8px; cursor:pointer; font-weight:bold;">+ Añadir Episodio</button>
        <button id="btnCloseEpModal" style="padding:10px 18px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const reasignarEventos = () => {
    modal.querySelectorAll('.btn-editar-ep-pistas').forEach(btn => {
      btn.onclick = () => {
        const sIdx = parseInt(btn.getAttribute('data-sidx'));
        const eIdx = parseInt(btn.getAttribute('data-eidx'));
        const epActual = temporadas[sIdx].episodes[eIdx];

        abrirSubModalEdicionPistas(epActual, async (epEditado) => {
          temporadas[sIdx].episodes[eIdx] = epEditado;
          await updateDoc(doc(db, "contents", docId), { seasons: temporadas });
          document.getElementById('contenedorListaEpisodiosAdmin').innerHTML = renderEpisodiosList();
          reasignarEventos();
        });
      };
    });

    modal.querySelectorAll('.btn-borrar-ep').forEach(btn => {
      btn.onclick = async () => {
        if (confirm("¿Borrar este episodio?")) {
          const sIdx = parseInt(btn.getAttribute('data-sidx'));
          const eIdx = parseInt(btn.getAttribute('data-eidx'));
          temporadas[sIdx].episodes.splice(eIdx, 1);
          await updateDoc(doc(db, "contents", docId), { seasons: temporadas });
          document.getElementById('contenedorListaEpisodiosAdmin').innerHTML = renderEpisodiosList();
          reasignarEventos();
        }
      };
    });
  };

  reasignarEventos();

  document.getElementById('btnCloseEpModal').onclick = () => modal.remove();

  document.getElementById('btnAñadirNuevoEpisodio').onclick = async () => {
    const titulo = prompt("Título del episodio:");
    const url = prompt("URL del video MP4:");
    if (titulo && url) {
      if (!temporadas[0]) temporadas[0] = { seasonNumber: 1, episodes: [] };
      temporadas[0].episodes.push({ title: titulo, videoUrl: url, subtitles: {}, dubbings: {} });
      await updateDoc(doc(db, "contents", docId), { seasons: temporadas });
      document.getElementById('contenedorListaEpisodiosAdmin').innerHTML = renderEpisodiosList();
      reasignarEventos();
    }
  };
}

// SUBMODAL CON LAS 6 CASILLAS DE SUBTÍTULOS Y 6 CASILLAS DE DOBLAJES (INTERNET ARCHIVE)
function abrirSubModalEdicionPistas(episode, onSave) {
  const subModal = document.createElement('div');
  subModal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.92); display:flex; align-items:center; justify-content:center; z-index:10000; padding:20px; overflow-y:auto;";

  let subsInputs = IDIOMAS_DISPONIBLES.map(l => `
    <div>
      <label style="font-size:11px; color:#aaa; display:block; margin-bottom:2px;">💬 Subtítulo ${l.name}</label>
      <input type="text" id="sub_${l.code}" value="${episode.subtitles?.[l.code] || ''}" placeholder="URL VTT/SRT" style="width:100%; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box; font-size:12px;">
    </div>
  `).join('');

  let dubsInputs = IDIOMAS_DISPONIBLES.map(l => `
    <div>
      <label style="font-size:11px; color:#aaa; display:block; margin-bottom:2px;">🔊 Doblaje Archive ${l.name}</label>
      <input type="text" id="dub_${l.code}" value="${episode.dubbings?.[l.code] || ''}" placeholder="URL Internet Archive Video" style="width:100%; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box; font-size:12px;">
    </div>
  `).join('');

  subModal.innerHTML = `
    <div style="background:#151515; border:1px solid #d4af37; padding:25px; border-radius:16px; max-width:650px; width:100%; color:white;">
      <h3 style="color:#d4af37; margin-top:0;">Editar Pistas de Idioma: ${episode.title || 'Episodio'}</h3>
      
      <h4 style="color:#fff; margin-top:15px; font-size:14px; border-bottom:1px solid #333; padding-bottom:5px;">💬 Subtítulos (6 Idiomas)</h4>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">${subsInputs}</div>

      <h4 style="color:#fff; margin-top:20px; font-size:14px; border-bottom:1px solid #333; padding-bottom:5px;">🔊 Doblajes / Video Internet Archive (6 Idiomas)</h4>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">${dubsInputs}</div>

      <div style="margin-top:25px; display:flex; justify-content:flex-end; gap:10px;">
        <button id="btnCancelSubModal" style="padding:10px 18px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">Cancelar</button>
        <button id="btnSaveSubModal" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer;">Guardar Pistas</button>
      </div>
    </div>
  `;

  document.body.appendChild(subModal);

  document.getElementById('btnCancelSubModal').onclick = () => subModal.remove();

  document.getElementById('btnSaveSubModal').onclick = () => {
    const subtitles = {};
    const dubbings = {};

    IDIOMAS_DISPONIBLES.forEach(l => {
      const subVal = document.getElementById(`sub_${l.code}`).value.trim();
      const dubVal = document.getElementById(`dub_${l.code}`).value.trim();
      if (subVal) subtitles[l.code] = subVal;
      if (dubVal) dubbings[l.code] = dubVal;
    });

    episode.subtitles = subtitles;
    episode.dubbings = dubbings;

    onSave(episode);
    subModal.remove();
  };
}
