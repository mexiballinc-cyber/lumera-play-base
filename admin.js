// admin.js - Panel de Control con 12 Opciones en Películas y Series + Hero e Avatares con Imgur + Categoría por Sección
import { db, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from './firebase.js';

let adminContents = [];

export async function renderAdminPanel(container) {
  container.innerHTML = `
    <div style="max-width: 1000px; margin: 0 auto; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: var(--gold-accent); margin: 0;">Panel de Control Lumera</h2>
        <div style="display: flex; gap: 8px;">
          <button id="tabContents" style="padding: 8px 14px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Catálogo</button>
          <button id="tabProfiles" style="padding: 8px 14px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; cursor: pointer;">Avatares</button>
          <button id="tabHeroes" style="padding: 8px 14px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; cursor: pointer;">Imágenes Hero</button>
        </div>
      </div>
      <div id="adminTabArea"></div>
    </div>
  `;

  document.getElementById('tabContents').onclick = () => renderContentsTab();
  document.getElementById('tabProfiles').onclick = () => renderAvatarsTab();
  document.getElementById('tabHeroes').onclick = () => renderHeroesTab();

  renderContentsTab();
}

// ----------------------------------------------------
// PESTAÑA 1: CATÁLOGO DE PELÍCULAS Y SERIES
// ----------------------------------------------------
async function renderContentsTab() {
  const area = document.getElementById('adminTabArea');
  area.innerHTML = `<p style="color: #aaa;">Cargando catálogo...</p>`;

  const snap = await getDocs(collection(db, "contents"));
  adminContents = [];
  snap.forEach(d => adminContents.push({ id: d.id, ...d.data() }));

  area.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <h3>Lista de Contenidos</h3>
      <button id="btnNewContent" style="padding: 8px 16px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">+ Nuevo Contenido</button>
    </div>
    <div id="contentsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;"></div>
  `;

  document.getElementById('btnNewContent').onclick = () => abrirModalCrearEditarContenido();

  const grid = document.getElementById('contentsGrid');
  grid.innerHTML = adminContents.map(item => `
    <div style="background: #151515; border: 1px solid #282828; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
      <img src="${item.poster || ''}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 6px;">
      <h4 style="margin: 0; color: white;">${item.title}</h4>
      <span style="color: #888; font-size: 11px;">[${item.category || 'Sin Categoría'}]</span>
      <span style="color: var(--gold-accent); font-size: 11px; text-transform: uppercase;">${item.type}</span>
      <div style="display: flex; gap: 4px; margin-top: auto; flex-wrap: wrap;">
        <button class="btn-edit" data-id="${item.id}" style="flex: 1; padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">Editar</button>
        ${item.type === 'pelicula' ? `<button class="btn-movie-opts" data-id="${item.id}" style="flex: 1; padding: 6px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); border-radius: 4px; font-size: 11px; cursor: pointer;">12 Opciones</button>` : ''}
        ${item.type === 'serie' ? `<button class="btn-episodes" data-id="${item.id}" style="flex: 1; padding: 6px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); border-radius: 4px; font-size: 11px; cursor: pointer;">Episodios</button>` : ''}
        <button class="btn-del" data-id="${item.id}" style="padding: 6px; background: #300; border: none; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">✕</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-edit').forEach(b => b.onclick = () => abrirModalCrearEditarContenido(adminContents.find(c => c.id === b.getAttribute('data-id'))));
  grid.querySelectorAll('.btn-movie-opts').forEach(b => b.onclick = () => abrirFormulario12OpcionesPelicula(adminContents.find(c => c.id === b.getAttribute('data-id'))));
  grid.querySelectorAll('.btn-episodes').forEach(b => b.onclick = () => abrirModalGestionEpisodios(adminContents.find(c => c.id === b.getAttribute('data-id'))));
  grid.querySelectorAll('.btn-del').forEach(b => b.onclick = async () => { if (confirm("¿Eliminar?")) { await deleteDoc(doc(db, "contents", b.getAttribute('data-id'))); renderContentsTab(); } });
}

function abrirModalCrearEditarContenido(item = null) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;`;

  modal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 12px; width: 100%; max-width: 450px; padding: 20px; color: white;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">${item ? 'Editar Contenido' : 'Nuevo Contenido'}</h3>
      <form id="formContent" style="display: flex; flex-direction: column; gap: 10px;">
        <input type="text" id="cTitle" value="${item?.title || ''}" placeholder="Título" required style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
        
        <!-- CAMPO DE CATEGORÍA / SECCIÓN -->
        <input type="text" id="cCategory" value="${item?.category || ''}" placeholder="Sección / Categoría (ej: Tendencias, Acción, Anime)" required style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
        
        <select id="cType" style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
          <option value="pelicula" ${item?.type === 'pelicula' ? 'selected' : ''}>Película</option>
          <option value="serie" ${item?.type === 'serie' ? 'selected' : ''}>Serie</option>
        </select>
        <input type="text" id="cPoster" value="${item?.poster || ''}" placeholder="URL Poster Imgur" style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
        <input type="text" id="cBanner" value="${item?.banner || ''}" placeholder="URL Banner Imgur" style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
        <textarea id="cDesc" placeholder="Descripción" style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">${item?.description || ''}</textarea>
        <div>
          <input type="checkbox" id="cIsKids" ${item?.isKids ? 'checked' : ''}>
          <label for="cIsKids">Contenido Infantil</label>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
          <button type="button" id="btnClose" style="padding: 8px 12px; background: transparent; border: 1px solid #555; color: white; border-radius: 4px;">Cancelar</button>
          <button type="submit" style="padding: 8px 12px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 4px;">Guardar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btnClose').onclick = () => modal.remove();

  document.getElementById('formContent').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('cTitle').value.trim(),
      category: document.getElementById('cCategory').value.trim() || 'General',
      type: document.getElementById('cType').value,
      poster: document.getElementById('cPoster').value.trim(),
      banner: document.getElementById('cBanner').value.trim(),
      description: document.getElementById('cDesc').value.trim(),
      isKids: document.getElementById('cIsKids').checked,
      subtitles: item?.subtitles || {},
      doblajes: item?.doblajes || {},
      seasons: item?.seasons || []
    };

    if (item?.id) await updateDoc(doc(db, "contents", item.id), data);
    else await addDoc(collection(db, "contents"), data);

    modal.remove();
    renderContentsTab();
  };
}

// 12 OPCIONES (SUBTÍTULOS + DOBLAJES) PARA PELÍCULAS
function abrirFormulario12OpcionesPelicula(movie) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px; overflow-y: auto; color: white;`;

  const subs = movie.subtitles || {};
  const dubs = movie.doblajes || {};

  modal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 12px; width: 100%; max-width: 650px; padding: 20px;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">Idiomas de Película: ${movie.title}</h3>
      <form id="formMovieOpts" style="display: flex; flex-direction: column; gap: 12px;">
        <input type="text" id="mVideoUrl" value="${movie.videoUrl || ''}" placeholder="URL Video Principal" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">

        <div style="border: 1px solid #333; padding: 10px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--gold-accent); font-size: 13px;">6 Enlaces Subtítulos</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" id="sub_es" value="${subs.es || ''}" placeholder="Sub Español" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_en" value="${subs.en || ''}" placeholder="Sub Inglés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_de" value="${subs.de || ''}" placeholder="Sub Alemán" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_pt" value="${subs.pt || ''}" placeholder="Sub Portugués" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_fr" value="${subs.fr || ''}" placeholder="Sub Francés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_ja" value="${subs.ja || ''}" placeholder="Sub Japonés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
          </div>
        </div>

        <div style="border: 1px solid #333; padding: 10px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--gold-accent); font-size: 13px;">6 Enlaces Doblajes</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" id="dub_es" value="${dubs.es || ''}" placeholder="Audio Español" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_en" value="${dubs.en || ''}" placeholder="Audio Inglés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_de" value="${dubs.de || ''}" placeholder="Audio Alemán" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_pt" value="${dubs.pt || ''}" placeholder="Audio Portugués" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_fr" value="${dubs.fr || ''}" placeholder="Audio Francés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_ja" value="${dubs.ja || ''}" placeholder="Audio Japonés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" id="btnCloseM" style="padding: 8px 12px; background: transparent; border: 1px solid #555; color: white; border-radius: 4px;">Cancelar</button>
          <button type="submit" style="padding: 8px 12px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 4px;">Guardar Opciones</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btnCloseM').onclick = () => modal.remove();

  document.getElementById('formMovieOpts').onsubmit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "contents", movie.id), {
      videoUrl: document.getElementById('mVideoUrl').value.trim(),
      subtitles: {
        es: document.getElementById('sub_es').value.trim(), en: document.getElementById('sub_en').value.trim(), de: document.getElementById('sub_de').value.trim(), pt: document.getElementById('sub_pt').value.trim(), fr: document.getElementById('sub_fr').value.trim(), ja: document.getElementById('sub_ja').value.trim()
      },
      doblajes: {
        es: document.getElementById('dub_es').value.trim(), en: document.getElementById('dub_en').value.trim(), de: document.getElementById('dub_de').value.trim(), pt: document.getElementById('dub_pt').value.trim(), fr: document.getElementById('dub_fr').value.trim(), ja: document.getElementById('dub_ja').value.trim()
      }
    });
    modal.remove();
    renderContentsTab();
  };
}

// GESTIÓN DE EPISODIOS
function abrirModalGestionEpisodios(serie) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; display: flex; justify-content: center; padding: 20px; overflow-y: auto; color: white;`;

  let seasons = serie.seasons || [];

  const refresh = () => {
    modal.innerHTML = `
      <div style="background: #111; border: 1px solid var(--gold-accent); border-radius: 12px; width: 100%; max-width: 750px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 10px;">
          <h3 style="color: var(--gold-accent); margin: 0;">Episodios: ${serie.title}</h3>
          <button id="btnCloseEp" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
        </div>
        <button id="btnAddSeason" style="margin: 15px 0; padding: 8px 14px; background: #222; border: 1px solid var(--gold-accent); color: var(--gold-accent); border-radius: 6px; cursor: pointer;">+ Añadir Temporada</button>
        
        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${seasons.map((s, sIdx) => `
            <div style="background: #181818; border: 1px solid #333; border-radius: 8px; padding: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0;">${s.name || `Temporada ${sIdx + 1}`}</h4>
                <div>
                  <button class="btn-add-ep" data-sidx="${sIdx}" style="padding: 4px 8px; background: var(--gold-accent); border: none; color: black; border-radius: 4px; font-size: 11px; cursor: pointer;">+ Episodio</button>
                  <button class="btn-del-s" data-sidx="${sIdx}" style="padding: 4px 8px; background: #300; border: none; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">✕ Temp</button>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${(s.episodes || []).map((ep, eIdx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: #222; padding: 6px 10px; border-radius: 4px;">
                    <span style="font-size: 12px;">E${eIdx + 1}: ${ep.title}</span>
                    <button class="btn-edit-ep" data-sidx="${sIdx}" data-eidx="${eIdx}" style="padding: 4px 8px; background: #333; border: 1px solid #555; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">Editar (12 Opciones)</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btnCloseEp').onclick = () => modal.remove();
    document.getElementById('btnAddSeason').onclick = async () => {
      seasons.push({ name: `Temporada ${seasons.length + 1}`, episodes: [] });
      await updateDoc(doc(db, "contents", serie.id), { seasons });
      refresh();
    };

    modal.querySelectorAll('.btn-add-ep').forEach(b => b.onclick = () => abrirFormularioEpisodio(serie.id, seasons, parseInt(b.getAttribute('data-sidx')), null, refresh));
    modal.querySelectorAll('.btn-edit-ep').forEach(b => b.onclick = () => abrirFormularioEpisodio(serie.id, seasons, parseInt(b.getAttribute('data-sidx')), parseInt(b.getAttribute('data-eidx')), refresh));
    modal.querySelectorAll('.btn-del-s').forEach(b => b.onclick = async () => {
      seasons.splice(parseInt(b.getAttribute('data-sidx')), 1);
      await updateDoc(doc(db, "contents", serie.id), { seasons });
      refresh();
    });
  };

  document.body.appendChild(modal);
  refresh();
}

function abrirFormularioEpisodio(serieId, seasons, sIdx, eIdx = null, callbackRefresh) {
  const modal = document.createElement('div');
  modal.className = 'glass-modal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 10000; display: flex; justify-content: center; align-items: center; padding: 20px; color: white;`;

  const ep = eIdx !== null ? seasons[sIdx].episodes[eIdx] : { title: '', videoUrl: '', subtitles: {}, doblajes: {} };
  const subs = ep.subtitles || {};
  const dubs = ep.doblajes || {};

  modal.innerHTML = `
    <div style="background: #141414; border: 1px solid var(--gold-accent); border-radius: 12px; width: 100%; max-width: 650px; padding: 20px; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin-top: 0; color: var(--gold-accent);">${eIdx !== null ? 'Editar Episodio' : 'Añadir Episodio'}</h3>
      <form id="formEp" style="display: flex; flex-direction: column; gap: 10px;">
        <input type="text" id="epTitle" value="${ep.title || ''}" placeholder="Título del Episodio" required style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
        <input type="text" id="epVideoUrl" value="${ep.videoUrl || ''}" placeholder="URL Video Principal" style="padding: 8px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">

        <div style="border: 1px solid #333; padding: 10px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--gold-accent); font-size: 13px;">6 Enlaces Subtítulos</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" id="sub_es" value="${subs.es || ''}" placeholder="Sub Español" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_en" value="${subs.en || ''}" placeholder="Sub Inglés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_de" value="${subs.de || ''}" placeholder="Sub Alemán" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_pt" value="${subs.pt || ''}" placeholder="Sub Portugués" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_fr" value="${subs.fr || ''}" placeholder="Sub Francés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="sub_ja" value="${subs.ja || ''}" placeholder="Sub Japonés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
          </div>
        </div>

        <div style="border: 1px solid #333; padding: 10px; border-radius: 6px;">
          <h4 style="margin: 0 0 8px 0; color: var(--gold-accent); font-size: 13px;">6 Enlaces Doblajes</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" id="dub_es" value="${dubs.es || ''}" placeholder="Audio Español" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_en" value="${dubs.en || ''}" placeholder="Audio Inglés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_de" value="${dubs.de || ''}" placeholder="Audio Alemán" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_pt" value="${dubs.pt || ''}" placeholder="Audio Portugués" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_fr" value="${dubs.fr || ''}" placeholder="Audio Francés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
            <input type="text" id="dub_ja" value="${dubs.ja || ''}" placeholder="Audio Japonés" style="padding: 6px; background: #222; border: 1px solid #444; color: white; border-radius: 4px;">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" id="btnCloseEpForm" style="padding: 8px 12px; background: transparent; border: 1px solid #555; color: white; border-radius: 4px;">Cancelar</button>
          <button type="submit" style="padding: 8px 12px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 4px;">Guardar Episodio</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btnCloseEpForm').onclick = () => modal.remove();

  document.getElementById('formEp').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('epTitle').value.trim(),
      videoUrl: document.getElementById('epVideoUrl').value.trim(),
      subtitles: {
        es: document.getElementById('sub_es').value.trim(), en: document.getElementById('sub_en').value.trim(), de: document.getElementById('sub_de').value.trim(), pt: document.getElementById('sub_pt').value.trim(), fr: document.getElementById('sub_fr').value.trim(), ja: document.getElementById('sub_ja').value.trim()
      },
      doblajes: {
        es: document.getElementById('dub_es').value.trim(), en: document.getElementById('dub_en').value.trim(), de: document.getElementById('dub_de').value.trim(), pt: document.getElementById('dub_pt').value.trim(), fr: document.getElementById('dub_fr').value.trim(), ja: document.getElementById('dub_ja').value.trim()
      }
    };

    if (eIdx !== null) seasons[sIdx].episodes[eIdx] = data;
    else seasons[sIdx].episodes.push(data);

    await updateDoc(doc(db, "contents", serieId), { seasons });
    modal.remove();
    callbackRefresh();
  };
}

// ----------------------------------------------------
// PESTAÑA 2: GESTIÓN DE AVATARES DE PERFIL (LINK IMGUR)
// ----------------------------------------------------
async function renderAvatarsTab() {
  const area = document.getElementById('adminTabArea');
  area.innerHTML = `<p style="color: #aaa;">Cargando avatares...</p>`;

  const snap = await getDocs(collection(db, "avatars"));
  let avatars = [];
  snap.forEach(d => avatars.push({ id: d.id, ...d.data() }));

  area.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <h3>Lista de Avatares Globales</h3>
      <button id="btnNewAvatar" style="padding: 8px 16px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">+ Añadir Link Imgur</button>
    </div>
    <div id="avatarsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 15px;"></div>
  `;

  document.getElementById('btnNewAvatar').onclick = async () => {
    const url = prompt("Introduce el enlace directo de Imgur de la imagen de Avatar:");
    if (url) {
      await addDoc(collection(db, "avatars"), { url: url.trim() });
      renderAvatarsTab();
    }
  };

  const grid = document.getElementById('avatarsGrid');
  grid.innerHTML = avatars.map(a => `
    <div style="background: #151515; border: 1px solid #282828; border-radius: 8px; padding: 10px; text-align: center;">
      <img src="${a.url}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; margin-bottom: 8px;">
      <button class="btn-del-av" data-id="${a.id}" style="width: 100%; padding: 4px; background: #300; border: none; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">Borrar</button>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-del-av').forEach(b => b.onclick = async () => {
    if (confirm("¿Eliminar este avatar?")) {
      await deleteDoc(doc(db, "avatars", b.getAttribute('data-id')));
      renderAvatarsTab();
    }
  });
}

// ----------------------------------------------------
// PESTAÑA 3: SECCIÓN HERO / BANNERS (LINK IMGUR)
// ----------------------------------------------------
async function renderHeroesTab() {
  const area = document.getElementById('adminTabArea');
  area.innerHTML = `<p style="color: #aaa;">Cargando imágenes Hero...</p>`;

  const snap = await getDocs(collection(db, "heroes"));
  let heroes = [];
  snap.forEach(d => heroes.push({ id: d.id, ...d.data() }));

  area.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <h3>Imágenes de la Sección Hero</h3>
      <button id="btnNewHero" style="padding: 8px 16px; background: var(--gold-accent); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">+ Añadir Banner Imgur</button>
    </div>
    <div id="heroesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;"></div>
  `;

  document.getElementById('btnNewHero').onclick = async () => {
    const url = prompt("Introduce el enlace directo de Imgur del Banner Hero:");
    if (url) {
      await addDoc(collection(db, "heroes"), { url: url.trim() });
      renderHeroesTab();
    }
  };

  const grid = document.getElementById('heroesGrid');
  grid.innerHTML = heroes.map(h => `
    <div style="background: #151515; border: 1px solid #282828; border-radius: 8px; padding: 10px;">
      <img src="${h.url}" style="width: 100%; height: 120px; border-radius: 6px; object-fit: cover; margin-bottom: 8px;">
      <button class="btn-del-hero" data-id="${h.id}" style="width: 100%; padding: 6px; background: #300; border: none; color: white; border-radius: 4px; font-size: 11px; cursor: pointer;">Borrar Banner</button>
    </div>
  `).join('');

  grid.querySelectorAll('.btn-del-hero').forEach(b => b.onclick = async () => {
    if (confirm("¿Eliminar este banner?")) {
      await deleteDoc(doc(db, "heroes", b.getAttribute('data-id')));
      renderHeroesTab();
    }
  });
}
