// admin.js - Panel Maestro Completo (Creación, Edición, Héroes, Avatares, Temporadas y Episodios)
import { db, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from './firebase.js';
import { entrarPlataforma } from './auth.js';

export async function renderAdminPanel(container) {
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:40px;">Cargando Panel Maestro...</h2>`;

  let contenidos = [];
  try {
    const snap = await getDocs(collection(db, "contents"));
    snap.forEach(d => contenidos.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  let html = `
    <div style="max-width: 900px; margin: 20px auto; padding: 20px; color: white;">
      
      <!-- ENCABEZADO -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom:15px; margin-bottom:20px;">
        <h1 style="color:#d4af37; margin:0; font-size:1.8rem;">Panel Maestro de Control</h1>
        <button id="btnVolverCat" style="padding:8px 16px; background:transparent; border:1px solid #d4af37; color:#d4af37; border-radius:8px; cursor:pointer; font-weight:bold;">← Volver al Catálogo</button>
      </div>

      <!-- SECCIÓN HÉROES Y AVATARES -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:30px;">
        
        <div style="background:#151515; padding:15px; border-radius:12px; border:1px solid #333;">
          <h3 style="color:#d4af37; margin-top:0;">Gestionar Banner Hero</h3>
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="url" id="inputHeroUrl" placeholder="URL de imagen Hero" style="flex:1; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
            <button id="btnAddHero" style="padding:8px 12px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Añadir</button>
          </div>
          <div id="heroListAdmin" style="display:flex; gap:10px; overflow-x:auto; padding:5px 0;"></div>
        </div>

        <div style="background:#151515; padding:15px; border-radius:12px; border:1px solid #333;">
          <h3 style="color:#d4af37; margin-top:0;">Gestionar Avatares de Perfil</h3>
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input type="url" id="inputAvatarUrl" placeholder="URL de imagen Avatar" style="flex:1; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
            <button id="btnAddAvatar" style="padding:8px 12px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Añadir</button>
          </div>
          <div id="avatarListAdmin" style="display:flex; gap:10px; overflow-x:auto; padding:5px 0;"></div>
        </div>

      </div>

      <!-- BOTÓN AGREGAR CONTENIDO NUEVO -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2 style="margin:0;">Contenido en Catálogo</h2>
        <button id="btnNuevoContenido" style="padding:10px 20px; background:#d4af37; color:black; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">+ Nuevo Contenido</button>
      </div>

      <!-- LISTA DE CONTENIDOS (TABLA DE EDICIÓN Y BORRADO) -->
      <div style="background:#151515; border-radius:12px; border:1px solid #333; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
          <thead>
            <tr style="background:#222; color:#d4af37; border-bottom:1px solid #333;">
              <th style="padding:12px;">Poster</th>
              <th style="padding:12px;">Título</th>
              <th style="padding:12px;">Tipo</th>
              <th style="padding:12px;">Categoría</th>
              <th style="padding:12px; text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbodyAdminContents"></tbody>
        </table>
      </div>

    </div>
  `;

  container.innerHTML = html;

  document.getElementById('btnVolverCat').onclick = () => entrarPlataforma();
  document.getElementById('btnNuevoContenido').onclick = () => abrirModalFormularioContenido(null, renderAdminPanel);

  cargarListasHeroYAvatares();
  renderTablaContenidos(contenidos, container);
}

// Cargar héroes y avatares existentes
async function cargarListasHeroYAvatares() {
  const heroList = document.getElementById('heroListAdmin');
  const avatarList = document.getElementById('avatarListAdmin');

  if (heroList) {
    const snapH = await getDocs(collection(db, "heroes"));
    heroList.innerHTML = '';
    snapH.forEach(d => {
      const data = d.data();
      heroList.innerHTML += `
        <div style="position:relative; flex: 0 0 60px;">
          <img src="${data.url}" style="width:60px; height:35px; object-fit:cover; border-radius:4px;">
          <button onclick="window.borrarHeroDoc('${d.id}')" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">✕</button>
        </div>
      `;
    });
  }

  if (avatarList) {
    const snapA = await getDocs(collection(db, "avatars"));
    avatarList.innerHTML = '';
    snapA.forEach(d => {
      const data = d.data();
      avatarList.innerHTML += `
        <div style="position:relative; flex: 0 0 40px;">
          <img src="${data.url}" style="width:40px; height:40px; object-fit:cover; border-radius:50%;">
          <button onclick="window.borrarAvatarDoc('${d.id}')" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">✕</button>
        </div>
      `;
    });
  }

  document.getElementById('btnAddHero').onclick = async () => {
    const url = document.getElementById('inputHeroUrl').value.trim();
    if (url) {
      await addDoc(collection(db, "heroes"), { url });
      cargarListasHeroYAvatares();
    }
  };

  document.getElementById('btnAddAvatar').onclick = async () => {
    const url = document.getElementById('inputAvatarUrl').value.trim();
    if (url) {
      await addDoc(collection(db, "avatars"), { url });
      cargarListasHeroYAvatares();
    }
  };
}

window.borrarHeroDoc = async (id) => {
  await deleteDoc(doc(db, "heroes", id));
  cargarListasHeroYAvatares();
};

window.borrarAvatarDoc = async (id) => {
  await deleteDoc(doc(db, "avatars", id));
  cargarListasHeroYAvatares();
};

// TABLA CON EVENTOS DE EDICIÓN Y BORRADO
function renderTablaContenidos(lista, container) {
  const tbody = document.getElementById('tbodyAdminContents');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:20px; text-align:center; color:#aaa;">No hay contenidos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  lista.forEach(item => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #222';
    tr.innerHTML = `
      <td style="padding:10px;"><img src="${item.poster}" style="width:40px; height:55px; object-fit:cover; border-radius:4px;"></td>
      <td style="padding:10px; font-weight:bold;">${item.title}</td>
      <td style="padding:10px; text-transform:uppercase; font-size:12px; color:#d4af37;">${item.type}</td>
      <td style="padding:10px; color:#aaa;">${item.category || 'Sin categoría'}</td>
      <td style="padding:10px; text-align:right;">
        <button class="btn-edit-item" style="padding:6px 12px; background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:#d4af37; border-radius:6px; cursor:pointer; margin-right:5px;">Editar</button>
        <button class="btn-delete-item" style="padding:6px 12px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:6px; cursor:pointer;">Borrar</button>
      </td>
    `;

    tr.querySelector('.btn-edit-item').onclick = () => abrirModalFormularioContenido(item, () => renderAdminPanel(container));
    tr.querySelector('.btn-delete-item').onclick = async () => {
      if (confirm(`¿Eliminar "${item.title}"?`)) {
        await deleteDoc(doc(db, "contents", item.id));
        renderAdminPanel(container);
      }
    };

    tbody.appendChild(tr);
  });
}

// MODAL PARA CREAR Y EDITAR CONTENIDO (PELÍCULAS Y SERIES CON EPISODIOS/TEMPORADAS)
function abrirModalFormularioContenido(itemEditar = null, onComplete) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.9); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px; overflow-y:auto;";

  let temporadasState = itemEditar && itemEditar.seasons ? JSON.parse(JSON.stringify(itemEditar.seasons)) : [
    { seasonNumber: 1, episodes: [{ title: 'Episodio 1', videoUrl: '', audios: [], subtitles: [] }] }
  ];

  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:16px; border:1px solid #d4af37; width:100%; max-width:650px; color:white; max-height:90vh; overflow-y:auto;">
      <h2 style="color:#d4af37; margin-top:0;">${itemEditar ? 'Editar Contenido' : 'Añadir Nuevo Contenido'}</h2>

      <div style="display:flex; flex-direction:column; gap:12px;">
        
        <div>
          <label style="font-size:12px; color:#aaa;">Título</label>
          <input type="text" id="formTitle" value="${itemEditar ? itemEditar.title : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:12px; color:#aaa;">Tipo</label>
            <select id="formType" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
              <option value="pelicula" ${itemEditar && itemEditar.type === 'pelicula' ? 'selected' : ''}>Película</option>
              <option value="serie" ${itemEditar && itemEditar.type === 'serie' ? 'selected' : ''}>Serie</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; color:#aaa;">Categoría</label>
            <input type="text" id="formCategory" value="${itemEditar ? (itemEditar.category || '') : 'Acción'}" placeholder="Ej. Acción, Comedia" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:12px; color:#aaa;">URL Poster Vertical</label>
            <input type="url" id="formPoster" value="${itemEditar ? itemEditar.poster : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:12px; color:#aaa;">URL Banner Horizontal (Opcional)</label>
            <input type="url" id="formBanner" value="${itemEditar ? (itemEditar.banner || '') : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
        </div>

        <div>
          <label style="font-size:12px; color:#aaa;">Descripción</label>
          <textarea id="formDescription" style="width:100%; height:60px; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">${itemEditar ? (itemEditar.description || '') : ''}</textarea>
        </div>

        <div style="display:flex; align-items:center; gap:10px;">
          <input type="checkbox" id="formIs7Plus" ${itemEditar && itemEditar.is7Plus ? 'checked' : ''} style="width:18px; height:18px;">
          <label for="formIs7Plus" style="font-size:14px; color:#aaa;">¿Es clasificación +7 / Adultos? (Ocultar en Infantil)</label>
        </div>

        <!-- SECCIÓN DINÁMICA PELÍCULA VS SERIE -->
        <div id="sectionPelicula" style="display:${!itemEditar || itemEditar.type === 'pelicula' ? 'block' : 'none'}; border-top:1px solid #333; padding-top:12px;">
          <label style="font-size:12px; color:#aaa;">URL Video (MP4 / HLS / M3U8)</label>
          <input type="url" id="formVideoUrl" value="${itemEditar ? (itemEditar.videoUrl || '') : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div id="sectionSerie" style="display:${itemEditar && itemEditar.type === 'serie' ? 'block' : 'none'}; border-top:1px solid #333; padding-top:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="margin:0; color:#d4af37;">Temporadas y Episodios</h4>
            <button id="btnAddSeason" type="button" style="padding:4px 10px; background:#333; color:white; border:1px solid #666; border-radius:4px; cursor:pointer;">+ Añadir Temporada</button>
          </div>
          <div id="seasonsContainerArea"></div>
        </div>

        <!-- ACCIONES -->
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px; border-top:1px solid #333; padding-top:15px;">
          <button id="btnCancelForm" type="button" style="padding:10px 18px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
          <button id="btnSaveForm" type="button" style="padding:10px 24px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar Contenido</button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const selectType = document.getElementById('formType');
  const secPel = document.getElementById('sectionPelicula');
  const secSer = document.getElementById('sectionSerie');

  selectType.onchange = () => {
    if (selectType.value === 'pelicula') {
      secPel.style.display = 'block';
      secSer.style.display = 'none';
    } else {
      secPel.style.display = 'none';
      secSer.style.display = 'block';
      renderTemporadasUI();
    }
  };

  function renderTemporadasUI() {
    const area = document.getElementById('seasonsContainerArea');
    if (!area) return;

    area.innerHTML = '';
    temporadasState.forEach((s, sIdx) => {
      let epHtml = '';
      s.episodes.forEach((ep, eIdx) => {
        epHtml += `
          <div style="background:#222; padding:10px; border-radius:6px; margin-bottom:8px; border:1px solid #333;">
            <div style="display:flex; gap:8px; margin-bottom:5px;">
              <input type="text" placeholder="Título Episodio" value="${ep.title || ''}" class="ep-title" data-s="${sIdx}" data-e="${eIdx}" style="flex:1; padding:6px; background:#111; border:1px solid #444; color:white; border-radius:4px;">
              <input type="url" placeholder="URL Video" value="${ep.videoUrl || ''}" class="ep-url" data-s="${sIdx}" data-e="${eIdx}" style="flex:2; padding:6px; background:#111; border:1px solid #444; color:white; border-radius:4px;">
              <button type="button" onclick="window.removeEp(${sIdx}, ${eIdx})" style="background:red; color:white; border:none; border-radius:4px; padding:0 8px; cursor:pointer;">✕</button>
            </div>
          </div>
        `;
      });

      area.innerHTML += `
        <div style="background:#1a1a1a; padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid rgba(212,175,55,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <strong style="color:#d4af37;">Temporada ${s.seasonNumber || sIdx + 1}</strong>
            <div>
              <button type="button" onclick="window.addEp(${sIdx})" style="padding:3px 8px; background:#d4af37; color:black; border:none; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">+ Episodio</button>
              ${temporadasState.length > 1 ? `<button type="button" onclick="window.removeSeason(${sIdx})" style="padding:3px 8px; background:red; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px; margin-left:5px;">Eliminar T.</button>` : ''}
            </div>
          </div>
          ${epHtml}
        </div>
      `;
    });

    // Escuchar inputs
    area.querySelectorAll('.ep-title').forEach(inp => {
      inp.oninput = (e) => {
        const s = e.target.getAttribute('data-s');
        const ep = e.target.getAttribute('data-e');
        temporadasState[s].episodes[ep].title = e.target.value;
      };
    });
    area.querySelectorAll('.ep-url').forEach(inp => {
      inp.oninput = (e) => {
        const s = e.target.getAttribute('data-s');
        const ep = e.target.getAttribute('data-e');
        temporadasState[s].episodes[ep].videoUrl = e.target.value;
      };
    });
  }

  window.addEp = (sIdx) => {
    temporadasState[sIdx].episodes.push({ title: `Episodio ${temporadasState[sIdx].episodes.length + 1}`, videoUrl: '' });
    renderTemporadasUI();
  };

  window.removeEp = (sIdx, eIdx) => {
    temporadasState[sIdx].episodes.splice(eIdx, 1);
    renderTemporadasUI();
  };

  window.removeSeason = (sIdx) => {
    temporadasState.splice(sIdx, 1);
    renderTemporadasUI();
  };

  document.getElementById('btnAddSeason').onclick = () => {
    temporadasState.push({ seasonNumber: temporadasState.length + 1, episodes: [{ title: 'Episodio 1', videoUrl: '' }] });
    renderTemporadasUI();
  };

  if (itemEditar && itemEditar.type === 'serie') renderTemporadasUI();

  document.getElementById('btnCancelForm').onclick = () => modal.remove();

  document.getElementById('btnSaveForm').onclick = async () => {
    const title = document.getElementById('formTitle').value.trim();
    const type = selectType.value;
    const category = document.getElementById('formCategory').value.trim();
    const poster = document.getElementById('formPoster').value.trim();
    const banner = document.getElementById('formBanner').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    const is7Plus = document.getElementById('formIs7Plus').checked;

    if (!title || !poster) return alert("Completa el título y la URL del poster.");

    const payload = {
      title,
      type,
      category,
      poster,
      banner,
      description,
      is7Plus
    };

    if (type === 'pelicula') {
      payload.videoUrl = document.getElementById('formVideoUrl').value.trim();
    } else {
      payload.seasons = temporadasState;
    }

    if (itemEditar) {
      await updateDoc(doc(db, "contents", itemEditar.id), payload);
    } else {
      await addDoc(collection(db, "contents"), payload);
    }

    modal.remove();
    onComplete();
  };
}
