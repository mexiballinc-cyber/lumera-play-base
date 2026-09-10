// admin.js - Panel de Administración Completo (Gestión, Edición, Temporadas y Avatares)
import { 
  db, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc 
} from './firebase.js';

export function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="background:#141414; color:#fff; padding:20px; min-height:100vh; font-family:sans-serif;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2>Panel de Administración - Lumera</h2>
        <button id="btnExitAdmin" style="background:#333; color:#fff; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Cerrar Panel</button>
      </div>
      <hr style="border-color:#333; margin-bottom:20px;">

      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        
        <!-- FORMULARIO PRINCIPAL: CREAR / EDITAR CONTENIDO -->
        <div style="flex:2; min-width:320px; background:#1f1f1f; padding:20px; border-radius:8px;">
          <h3 id="formTitle">Añadir Nuevo Contenido</h3>
          <form id="adminForm">
            <input type="hidden" id="editDocId" value="">

            <label style="font-size:12px; color:#aaa;">Título del Contenido:</label>
            <input type="text" id="inputTitle" placeholder="Ej: Stranger Things" required style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">

            <div style="display:flex; gap:10px;">
              <div style="flex:1;">
                <label style="font-size:12px; color:#aaa;">Tipo de Contenido:</label>
                <select id="inputType" style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">
                  <option value="movie">Película</option>
                  <option value="series">Serie</option>
                </select>
              </div>
              <div style="flex:1;">
                <label style="font-size:12px; color:#aaa;">Tags (separados por coma):</label>
                <input type="text" id="inputTags" placeholder="acción, drama, 4k" style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">
              </div>
            </div>

            <label style="font-size:12px; color:#aaa;">URL del Póster (Vertical):</label>
            <input type="text" id="inputPoster" placeholder="https://..." required style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">

            <label style="font-size:12px; color:#aaa;">URL Imagen Hero (Panorámica para carrusel):</label>
            <input type="text" id="inputHeroImg" placeholder="https://..." style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">

            <label style="font-size:12px; color:#aaa;">Descripción / SINOPSIS:</label>
            <textarea id="inputDesc" rows="3" placeholder="Resumen del contenido..." style="width:100%; margin:5px 0 15px 0; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;"></textarea>

            <!-- GESTOR DE TEMPORADAS Y EPISODIOS -->
            <div id="seasonsSection" style="margin-top:15px; border-top:1px solid #333; padding-top:15px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4>Estructura de Temporadas</h4>
                <button type="button" id="btnAddSeason" style="background:#28a745; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">+ Nueva Temporada</button>
              </div>
              <div id="seasonsList"></div>
            </div>

            <div style="display:flex; gap:10px; margin-top:20px;">
              <button type="submit" id="btnSave" style="flex:1; background:#e50914; color:#fff; border:none; padding:12px; font-size:16px; font-weight:bold; border-radius:4px; cursor:pointer;">Guardar Contenido</button>
              <button type="button" id="btnCancelEdit" style="background:#555; color:#fff; border:none; padding:12px; border-radius:4px; cursor:pointer; display:none;">Cancelar Edición</button>
            </div>
          </form>
        </div>

        <!-- SECCIÓN DE GESTIÓN DE AVATARES DE PERFIL -->
        <div style="flex:1; min-width:280px; background:#1f1f1f; padding:20px; border-radius:8px;">
          <h3>Avatares de Perfil</h3>
          <p style="font-size:12px; color:#aaa; margin-bottom:15px;">Agrega o elimina imágenes disponibles para selección de avatar.</p>
          
          <form id="avatarForm">
            <input type="text" id="inputAvatarUrl" placeholder="URL de la imagen de avatar" required style="width:100%; margin-bottom:10px; padding:10px; background:#2b2b2b; border:1px solid #444; color:#fff; border-radius:4px;">
            <button type="submit" style="width:100%; background:#007bff; color:#fff; border:none; padding:10px; font-weight:bold; border-radius:4px; cursor:pointer;">Guardar Avatar en Firebase</button>
          </form>

          <h4 style="margin-top:20px; margin-bottom:10px;">Avatares Guardados:</h4>
          <div id="avatarsList" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap:10px; max-height:300px; overflow-y:auto; padding-right:5px;"></div>
        </div>

      </div>

      <!-- VISTA DEL CATÁLOGO EXISTENTE -->
      <div style="margin-top:40px; background:#1f1f1f; padding:20px; border-radius:8px;">
        <h3>Catálogo Registrado en Firebase</h3>
        <div id="adminCatalogList" style="display:flex; flex-wrap:wrap; gap:15px; margin-top:15px;"></div>
      </div>

    </div>
  `;

  let currentSeasons = [];
  const seasonsList = document.getElementById('seasonsList');
  const btnAddSeason = document.getElementById('btnAddSeason');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const formTitle = document.getElementById('formTitle');
  const btnSave = document.getElementById('btnSave');

  // FUNCIONES DE TEMPORADAS Y EPISODIOS
  function renderSeasonsUI() {
    seasonsList.innerHTML = '';
    currentSeasons.forEach((season, sIdx) => {
      const sDiv = document.createElement('div');
      sDiv.style.cssText = 'background:#2b2b2b; padding:12px; margin-bottom:10px; border-radius:6px; border:1px solid #333;';
      sDiv.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
          <input type="text" value="${season.name || ''}" placeholder="Nombre (ej: Temporada 1)" onchange="window.updateSeasonName(${sIdx}, this.value)" style="flex:1; padding:6px; background:#1f1f1f; border:1px solid #444; color:#fff; border-radius:4px;">
          <button type="button" onclick="window.removeSeason(${sIdx})" style="background:#dc3545; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">Eliminar Temporada</button>
        </div>
        <div style="margin-left:15px; margin-top:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <small style="color:#aaa;">Episodios de esta temporada:</small>
            <button type="button" onclick="window.addEpisode(${sIdx})" style="background:#17a2b8; color:#fff; border:none; padding:3px 8px; font-size:12px; border-radius:3px; cursor:pointer;">+ Episodio</button>
          </div>
          <div id="episodes_${sIdx}"></div>
        </div>
      `;
      seasonsList.appendChild(sDiv);

      const epDiv = sDiv.querySelector(`#episodes_${sIdx}`);
      (season.episodes || []).forEach((ep, eIdx) => {
        const epRow = document.createElement('div');
        epRow.style.cssText = 'display:flex; gap:5px; margin-top:6px;';
        epRow.innerHTML = `
          <input type="text" placeholder="Título Episodio" value="${ep.title || ''}" onchange="window.updateEp(${sIdx}, ${eIdx}, 'title', this.value)" style="flex:1; padding:5px; background:#1f1f1f; border:1px solid #444; color:#fff; border-radius:3px;">
          <input type="text" placeholder="URL Video" value="${ep.url || ''}" onchange="window.updateEp(${sIdx}, ${eIdx}, 'url', this.value)" style="flex:2; padding:5px; background:#1f1f1f; border:1px solid #444; color:#fff; border-radius:3px;">
          <button type="button" onclick="window.removeEpisode(${sIdx}, ${eIdx})" style="background:#6c757d; color:#fff; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">X</button>
        `;
        epDiv.appendChild(epRow);
      });
    });
  }

  window.updateSeasonName = (idx, val) => { currentSeasons[idx].name = val; };
  window.removeSeason = (idx) => { currentSeasons.splice(idx, 1); renderSeasonsUI(); };
  window.addEpisode = (sIdx) => {
    if (!currentSeasons[sIdx].episodes) currentSeasons[sIdx].episodes = [];
    currentSeasons[sIdx].episodes.push({ title: '', url: '' });
    renderSeasonsUI();
  };
  window.updateEp = (sIdx, eIdx, field, val) => {
    currentSeasons[sIdx].episodes[eIdx][field] = val;
  };
  window.removeEpisode = (sIdx, eIdx) => {
    currentSeasons[sIdx].episodes.splice(eIdx, 1);
    renderSeasonsUI();
  };

  btnAddSeason.onclick = () => {
    currentSeasons.push({ name: `Temporada ${currentSeasons.length + 1}`, episodes: [] });
    renderSeasonsUI();
  };

  // LIMPIAR Y REINICIAR FORMULARIO
  function resetForm() {
    document.getElementById('adminForm').reset();
    document.getElementById('editDocId').value = '';
    currentSeasons = [];
    renderSeasonsUI();
    formTitle.innerText = "Añadir Nuevo Contenido";
    btnSave.innerText = "Guardar Contenido";
    btnCancelEdit.style.display = 'none';
  }

  btnCancelEdit.onclick = () => resetForm();

  // GUARDAR / ACTUALIZAR CONTENIDO
  document.getElementById('adminForm').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('editDocId').value;
    const title = document.getElementById('inputTitle').value;
    const type = document.getElementById('inputType').value;
    const poster = document.getElementById('inputPoster').value;
    const heroImg = document.getElementById('inputHeroImg').value;
    const desc = document.getElementById('inputDesc').value;
    const tags = document.getElementById('inputTags').value.split(',').map(t => t.trim()).filter(Boolean);

    const payload = { title, type, poster, heroImg, description: desc, tags, seasons: currentSeasons };

    try {
      if (id) {
        await updateDoc(doc(db, "movies", id), payload);
        alert("Contenido actualizado exitosamente.");
      } else {
        await addDoc(collection(db, "movies"), payload);
        alert("Contenido registrado exitosamente.");
      }
      resetForm();
      cargarCatalogoAdmin();
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Ocurrió un error al guardar en Firebase.");
    }
  };

  // EDITAR ITEM DEL CATÁLOGO
  window.editItem = async (itemDataJson) => {
    const item = JSON.parse(decodeURIComponent(itemDataJson));
    document.getElementById('editDocId').value = item.id;
    document.getElementById('inputTitle').value = item.title || '';
    document.getElementById('inputType').value = item.type || 'movie';
    document.getElementById('inputPoster').value = item.poster || '';
    document.getElementById('inputHeroImg').value = item.heroImg || '';
    document.getElementById('inputDesc').value = item.description || '';
    document.getElementById('inputTags').value = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');

    currentSeasons = item.seasons || [];
    renderSeasonsUI();

    formTitle.innerText = "Editando: " + item.title;
    btnSave.innerText = "Actualizar Contenido";
    btnCancelEdit.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // BORRAR ITEM DEL CATÁLOGO
  window.deleteItem = async (id) => {
    if (confirm("¿Seguro que deseas eliminar este contenido permanentemente?")) {
      try {
        await deleteDoc(doc(db, "movies", id));
        cargarCatalogoAdmin();
      } catch (e) {
        console.error("Error al borrar:", e);
      }
    }
  };

  // GESTIÓN DE AVATARES
  document.getElementById('avatarForm').onsubmit = async (e) => {
    e.preventDefault();
    const url = document.getElementById('inputAvatarUrl').value;
    try {
      await addDoc(collection(db, "avatars"), { url });
      document.getElementById('inputAvatarUrl').value = '';
      cargarAvataresAdmin();
    } catch (err) {
      console.error(err);
    }
  };

  async function cargarAvataresAdmin() {
    const avatarsList = document.getElementById('avatarsList');
    if (!avatarsList) return;
    avatarsList.innerHTML = '';
    const snap = await getDocs(collection(db, "avatars"));
    snap.forEach(d => {
      const div = document.createElement('div');
      div.style.cssText = 'position:relative; display:inline-block;';
      div.innerHTML = `
        <img src="${d.data().url}" style="width:100%; height:60px; border-radius:6px; object-fit:cover;">
        <button style="position:absolute; top:-5px; right:-5px; background:#dc3545; color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;" onclick="window.deleteAvatar('${d.id}')">X</button>
      `;
      avatarsList.appendChild(div);
    });
  }

  window.deleteAvatar = async (id) => {
    if (confirm("¿Borrar este avatar?")) {
      await deleteDoc(doc(db, "avatars", id));
      cargarAvataresAdmin();
    }
  };

  // CARGAR CATÁLOGO COMPLETO
  async function cargarCatalogoAdmin() {
    const list = document.getElementById('adminCatalogList');
    if (!list) return;
    list.innerHTML = '';
    const snap = await getDocs(collection(db, "movies"));
    snap.forEach(d => {
      const item = { id: d.id, ...d.data() };
      const itemJson = encodeURIComponent(JSON.stringify(item));
      const div = document.createElement('div');
      div.style.cssText = 'background:#2b2b2b; padding:10px; border-radius:6px; width:160px; text-align:center; border:1px solid #333;';
      div.innerHTML = `
        <img src="${item.poster || 'https://via.placeholder.com/150'}" style="width:100%; height:200px; object-fit:cover; border-radius:4px;">
        <h5 style="font-size:13px; margin:8px 0; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title || 'Sin Título'}</h5>
        <div style="display:flex; gap:5px; justify-content:center;">
          <button style="background:#ffc107; color:#000; border:none; padding:4px 8px; border-radius:3px; font-size:11px; cursor:pointer; font-weight:bold;" onclick="window.editItem('${itemJson}')">Editar</button>
          <button style="background:#dc3545; color:#fff; border:none; padding:4px 8px; border-radius:3px; font-size:11px; cursor:pointer;" onclick="window.deleteItem('${d.id}')">Borrar</button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  const btnExit = document.getElementById('btnExitAdmin');
  if (btnExit) {
    btnExit.onclick = () => window.location.reload();
  }

  cargarCatalogoAdmin();
  cargarAvataresAdmin();
}
