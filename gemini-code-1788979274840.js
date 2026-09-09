// admin.js - Panel Maestro Lumera con 6 Idiomas y Edición
import { db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from './firebase.js';

let episodiosTemporadaActual = [];
let editandoId = null;

const IDIOMAS = [
  { code: 'ja', label: 'Japonés 🇯🇵' },
  { code: 'es', label: 'Español 🇲🇽' },
  { code: 'fr', label: 'Francés 🇫🇷' },
  { code: 'en', label: 'Inglés 🇺🇸' },
  { code: 'pt', label: 'Portugués 🇧🇷' },
  { code: 'de', label: 'Alemán 🇩🇪' }
];

export function renderAdminPanel(container) {
  container.innerHTML = `
    <div class="admin-panel" style="position: relative; padding: 25px; color: #fff; max-width: 950px; margin: 20px auto; background: rgba(15, 15, 15, 0.95); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.3);">
      
      <button id="btnCloseAdmin" class="svg-btn" style="position: absolute; top: 20px; right: 20px; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <h1 style="color: #d4af37; margin-bottom: 20px; font-size: 1.8rem;">Panel Maestro Lumera</h1>
      
      <div style="display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <button class="admin-tab active" data-target="seccion-contenido" style="padding: 8px 16px; background: transparent; border: none; color: #d4af37; font-weight: bold; cursor: pointer;">Contenido & Categorías</button>
        <button class="admin-tab" data-target="seccion-hero" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Hero</button>
        <button class="admin-tab" data-target="seccion-avatares" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Avatares</button>
        <button class="admin-tab" data-target="seccion-spark" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Spark</button>
      </div>

      <div id="seccion-contenido" class="admin-section">
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
          <button id="btnNuevaCategoria" type="button" style="padding: 10px 18px; background: rgba(212,175,55,0.2); border: 1px solid #d4af37; color: #d4af37; border-radius: 8px; font-weight: bold; cursor: pointer;">+ Crear Categoría</button>
          <button id="btnNuevoContenido" type="button" style="padding: 10px 18px; background: #d4af37; border: none; color: #000; border-radius: 8px; font-weight: bold; cursor: pointer;">+ Añadir Contenido</button>
        </div>

        <h3 style="color:#d4af37; margin: 15px 0 10px 0;">Categorías Creadas</h3>
        <div id="listaCategoriasAdmin" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 25px;"></div>

        <h3 style="color:#d4af37; margin: 15px 0 10px 0;">Catálogo de Películas y Series</h3>
        <div id="listaContenidoAdmin" style="display: flex; flex-direction: column; gap: 12px;"></div>
      </div>

      <div id="seccion-hero" class="admin-section" style="display: none;">
        <h3>Imágenes del Hero</h3>
        <div style="display: flex; gap: 10px; margin: 15px 0;">
          <input type="url" id="heroImgUrl" placeholder="URL Imagen Hero (Imgur)" style="flex: 1; padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button id="btnGuardarHero" type="button" style="padding: 10px 20px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Añadir Hero</button>
        </div>
        <div id="listaHeroesAdmin" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
      </div>

      <div id="seccion-avatares" class="admin-section" style="display: none;">
        <h3>Avatares de Perfil</h3>
        <div style="display: flex; gap: 10px; margin: 15px 0;">
          <input type="url" id="avatarImgUrl" placeholder="URL Avatar (Imgur)" style="flex: 1; padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button id="btnGuardarAvatar" type="button" style="padding: 10px 20px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Añadir Avatar</button>
        </div>
        <div id="listaAvataresAdmin" style="display: flex; flex-wrap: wrap; gap: 10px;"></div>
      </div>

      <div id="seccion-spark" class="admin-section" style="display: none;">
        <h3>Añadir Video a Spark</h3>
        <form id="formSpark" style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
          <input type="text" id="sparkNombre" placeholder="Título del Video" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <input type="text" id="sparkCategoria" placeholder="Categoría" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <input type="url" id="sparkUrl" placeholder="URL Video (Internet Archive)" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button type="submit" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Publicar en Spark</button>
        </form>
      </div>

    </div>
  `;

  document.getElementById('btnCloseAdmin').onclick = () => location.reload();

  const tabs = container.querySelectorAll('.admin-tab');
  const sections = container.querySelectorAll('.admin-section');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.style.color = '#aaa');
      sections.forEach(s => s.style.display = 'none');
      tab.style.color = '#d4af37';
      container.querySelector(`#${tab.getAttribute('data-target')}`).style.display = 'block';
    };
  });

  document.getElementById('btnNuevaCategoria').onclick = () => abrirModalCategoria();
  document.getElementById('btnNuevoContenido').onclick = () => abrirModalContenido(null);

  document.getElementById('btnGuardarHero').onclick = async () => {
    const url = document.getElementById('heroImgUrl').value.trim();
    if (url) {
      await addDoc(collection(db, "heroes"), { url });
      document.getElementById('heroImgUrl').value = '';
      cargarHeroes();
    }
  };

  document.getElementById('btnGuardarAvatar').onclick = async () => {
    const url = document.getElementById('avatarImgUrl').value.trim();
    if (url) {
      await addDoc(collection(db, "avatars"), { url });
      document.getElementById('avatarImgUrl').value = '';
      cargarAvatares();
    }
  };

  cargarCategorias();
  cargarListaAdmin();
  cargarHeroes();
  cargarAvatares();
}

function abrirModalCategoria() {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999; backdrop-filter:blur(5px);";
  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:12px; border:1px solid #d4af37; width:320px; color:white;">
      <h3 style="color:#d4af37;">Crear Categoría</h3>
      <input type="text" id="nombreCatInput" placeholder="Nombre (Ej. Acción, Anime)" style="width:100%; padding:10px; margin:15px 0; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button id="btnCancelarCat" type="button" style="padding:8px 15px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
        <button id="btnGuardarCat" type="button" style="padding:8px 15px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarCat').onclick = () => modal.remove();
  document.getElementById('btnGuardarCat').onclick = async () => {
    const name = document.getElementById('nombreCatInput').value.trim();
    if (name) {
      await addDoc(collection(db, "categories"), { name });
      modal.remove();
      cargarCategorias();
    }
  };
}

async function abrirModalContenido(itemEditar = null) {
  editandoId = itemEditar ? itemEditar.id : null;
  episodiosTemporadaActual = itemEditar && itemEditar.seasons && itemEditar.seasons[0] ? itemEditar.seasons[0].episodes : [];

  const catSnapshot = await getDocs(collection(db, "categories"));
  let catOptions = `<option value="">Sin Categoría</option>`;
  catSnapshot.forEach(doc => {
    const selected = itemEditar && itemEditar.category === doc.data().name ? 'selected' : '';
    catOptions += `<option value="${doc.data().name}" ${selected}>${doc.data().name}</option>`;
  });

  let langTabsHeader = `<div style="display:flex; gap:5px; margin-bottom:10px; overflow-x:auto;">`;
  let langTabsContent = ``;

  IDIOMAS.forEach((lang, idx) => {
    const active = idx === 0 ? 'border-color:#d4af37; color:#d4af37;' : 'border-color:#444; color:#aaa;';
    const display = idx === 0 ? 'display:flex;' : 'display:none;';
    
    const audioVal = (itemEditar && itemEditar.audios && itemEditar.audios[lang.code]) || '';
    const subVal = (itemEditar && itemEditar.subtitles && itemEditar.subtitles[lang.code]) || '';

    langTabsHeader += `<button type="button" class="btn-lang-tab" data-lang="${lang.code}" style="padding:6px 10px; background:#222; border:1px solid; border-radius:6px; font-size:12px; cursor:pointer; ${active}">${lang.label}</button>`;

    langTabsContent += `
      <div class="panel-lang-content" id="lang-panel-${lang.code}" style="flex-direction:column; gap:8px; ${display}">
        <input type="url" id="audio-${lang.code}" value="${audioVal}" placeholder="URL Audio Doblaje ${lang.label} (Opcional)" style="padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; font-size:13px;">
        <input type="url" id="sub-${lang.code}" value="${subVal}" placeholder="URL Subtítulo .VTT ${lang.label} (Opcional)" style="padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; font-size:13px;">
      </div>
    `;
  });
  langTabsHeader += `</div>`;

  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999; backdrop-filter:blur(5px); overflow-y:auto; padding:20px 0;";
  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:16px; border:1px solid #d4af37; width:90%; max-width:650px; color:white; margin:auto;">
      <h3 style="color:#d4af37; margin-bottom:15px;">${itemEditar ? 'Editar Contenido' : 'Añadir Contenido'}</h3>
      <form id="formModalContenido" style="display:flex; flex-direction:column; gap:12px;">
        <input type="text" id="cntTitulo" value="${itemEditar ? itemEditar.title : ''}" placeholder="Título" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        
        <div style="display:flex; gap:10px;">
          <select id="cntCategory" style="flex:1; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
            ${catOptions}
          </select>
          <select id="cntTipo" style="flex:1; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
            <option value="pelicula" ${itemEditar && itemEditar.type === 'pelicula' ? 'selected' : ''}>Película</option>
            <option value="serie" ${itemEditar && itemEditar.type === 'serie' ? 'selected' : ''}>Serie</option>
          </select>
        </div>

        <input type="url" id="cntPortada" value="${itemEditar ? itemEditar.poster : ''}" placeholder="URL Portada (Imgur)" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        <input type="url" id="cntBanner" value="${itemEditar ? itemEditar.banner : ''}" placeholder="URL Banner / Foto Descripción (Imgur)" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        <textarea id="cntDesc" placeholder="Descripción breve" rows="2" style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">${itemEditar ? itemEditar.description : ''}</textarea>
        
        <label style="display:flex; align-items:center; gap:10px; color:#ff5555; font-size:14px; cursor:pointer;">
          <input type="checkbox" id="cntMayor7" ${itemEditar && itemEditar.is7Plus ? 'checked' : ''}> Mayor de 7 años (Ocultar en Kids)
        </label>

        <!-- SECCIÓN IDIOMAS -->
        <div style="border-top:1px solid #333; padding-top:10px;">
          <h4 style="color:#d4af37; margin-bottom:8px; font-size:14px;">Audios y Subtítulos por Idioma (IJN)</h4>
          ${langTabsHeader}
          ${langTabsContent}
        </div>

        <!-- SECCIÓN PELÍCULA -->
        <div id="seccionPeliculaForm" style="display:${!itemEditar || itemEditar.type === 'pelicula' ? 'flex' : 'none'}; flex-direction:column; gap:10px; border-top:1px solid #333; padding-top:10px;">
          <input type="url" id="cntVideoUrl" value="${itemEditar ? (itemEditar.videoUrl || '') : ''}" placeholder="URL Video Película MP4 Principal" style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        </div>

        <!-- SECCIÓN SERIE -->
        <div id="seccionSerieForm" style="display:${itemEditar && itemEditar.type === 'serie' ? 'flex' : 'none'}; flex-direction:column; gap:10px; border-top:1px solid #333; padding-top:10px;">
          <h4 style="color:#d4af37; margin:0;">Gestión de Episodios (Temporada 1)</h4>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
            <input type="text" id="epTitulo" placeholder="Nombre Episodio" style="padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
            <input type="url" id="epVideoUrl" placeholder="URL Video MP4 Principal" style="padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
          </div>
          <button type="button" id="btnAgregarEpisodio" style="padding:8px; background:rgba(212,175,55,0.3); border:1px solid #d4af37; color:#d4af37; border-radius:6px; cursor:pointer;">+ Agregar Episodio</button>
          <ul id="listaEpisodiosAgregados" style="color:#aaa; font-size:13px; padding-left:20px; margin:5px 0;"></ul>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
          <button type="button" id="btnCancelCnt" style="padding:10px 20px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
          <button type="submit" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar en Firebase</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  const renderEpList = () => {
    const ul = document.getElementById('listaEpisodiosAgregados');
    ul.innerHTML = '';
    episodiosTemporadaActual.forEach((ep, i) => {
      ul.innerHTML += `<li>${ep.title} <button type="button" onclick="eliminarEpisodioTemp(${i})" style="background:none; border:none; color:red; cursor:pointer; font-weight:bold;">×</button></li>`;
    });
  };

  window.eliminarEpisodioTemp = (index) => {
    episodiosTemporadaActual.splice(index, 1);
    renderEpList();
  };

  renderEpList();

  modal.querySelectorAll('.btn-lang-tab').forEach(btn => {
    btn.onclick = () => {
      const targetLang = btn.getAttribute('data-lang');
      modal.querySelectorAll('.btn-lang-tab').forEach(b => {
        b.style.borderColor = '#444';
        b.style.color = '#aaa';
      });
      modal.querySelectorAll('.panel-lang-content').forEach(p => p.style.display = 'none');

      btn.style.borderColor = '#d4af37';
      btn.style.color = '#d4af37';
      modal.querySelector(`#lang-panel-${targetLang}`).style.display = 'flex';
    };
  });

  const selectTipo = document.getElementById('cntTipo');
  const secPel = document.getElementById('seccionPeliculaForm');
  const secSer = document.getElementById('seccionSerieForm');

  selectTipo.onchange = () => {
    if (selectTipo.value === 'serie') {
      secPel.style.display = 'none';
      secSer.style.display = 'flex';
    } else {
      secPel.style.display = 'flex';
      secSer.style.display = 'none';
    }
  };

  document.getElementById('btnAgregarEpisodio').onclick = () => {
    const title = document.getElementById('epTitulo').value.trim();
    const videoUrl = document.getElementById('epVideoUrl').value.trim();

    if (title && videoUrl) {
      episodiosTemporadaActual.push({ title, videoUrl });
      renderEpList();
      document.getElementById('epTitulo').value = '';
      document.getElementById('epVideoUrl').value = '';
    } else {
      alert("Escribe al menos el título y URL del episodio.");
    }
  };

  document.getElementById('btnCancelCnt').onclick = () => modal.remove();

  document.getElementById('formModalContenido').onsubmit = async (e) => {
    e.preventDefault();

    const audios = {};
    const subtitles = {};
    IDIOMAS.forEach(l => {
      const a = document.getElementById(`audio-${l.code}`).value.trim();
      const s = document.getElementById(`sub-${l.code}`).value.trim();
      if (a) audios[l.code] = a;
      if (s) subtitles[l.code] = s;
    });

    const data = {
      title: document.getElementById('cntTitulo').value,
      category: document.getElementById('cntCategory').value,
      type: selectTipo.value,
      poster: document.getElementById('cntPortada').value,
      banner: document.getElementById('cntBanner').value,
      description: document.getElementById('cntDesc').value,
      is7Plus: document.getElementById('cntMayor7').checked,
      audios,
      subtitles,
      updatedAt: new Date()
    };

    if (selectTipo.value === 'pelicula') {
      data.videoUrl = document.getElementById('cntVideoUrl').value;
    } else {
      data.seasons = [{ seasonNumber: 1, episodes: episodiosTemporadaActual }];
    }

    if (editandoId) {
      await updateDoc(doc(db, "contents", editandoId), data);
    } else {
      data.createdAt = new Date();
      await addDoc(collection(db, "contents"), data);
    }

    modal.remove();
    cargarListaAdmin();
  };
}

async function cargarCategorias() {
  const cont = document.getElementById('listaCategoriasAdmin');
  if (!cont) return;
  cont.innerHTML = "";
  const snap = await getDocs(collection(db, "categories"));
  snap.forEach(d => {
    const item = d.data();
    cont.innerHTML += `
      <div style="background:#222; border:1px solid #444; padding:6px 12px; border-radius:20px; display:flex; align-items:center; gap:8px;">
        <span>${item.name}</span>
        <button onclick="borrarDoc('categories', '${d.id}')" style="background:none; border:none; color:#ff5555; cursor:pointer; font-weight:bold;">×</button>
      </div>
    `;
  });
}

async function cargarListaAdmin() {
  const cont = document.getElementById('listaContenidoAdmin');
  if (!cont) return;
  cont.innerHTML = "<p style='color:#aaa;'>Cargando lista...</p>";
  
  const snap = await getDocs(collection(db, "contents"));
  if (snap.empty) {
    cont.innerHTML = "<p style='color:#888;'>No hay nada subido aún.</p>";
    return;
  }
  cont.innerHTML = "";
  snap.forEach(d => {
    const item = d.data();
    item.id = d.id;
    cont.innerHTML += `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 15px; background:rgba(255,255,255,0.05); border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${item.poster}" style="width:40px; height:55px; object-fit:cover; border-radius:4px;">
          <div>
            <h4 style="margin:0; color:#fff;">${item.title} ${item.is7Plus ? '<span style="color:#ff5555; font-size:11px;">[+7]</span>' : ''}</h4>
            <small style="color:#aaa;">${(item.type || 'contenido').toUpperCase()} | Categoría: ${item.category || 'Sin categoría'}</small>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="editarContenidoAdmin('${d.id}')" style="padding:6px 12px; background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:#d4af37; border-radius:6px; cursor:pointer;">Editar</button>
          <button onclick="borrarDoc('contents', '${d.id}')" style="padding:6px 12px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:6px; cursor:pointer;">Borrar</button>
        </div>
      </div>
    `;
  });
}

window.editarContenidoAdmin = async (id) => {
  const docRef = doc(db, "contents", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const item = { id: docSnap.id, ...docSnap.data() };
    abrirModalContenido(item);
  }
};

async function cargarHeroes() {
  const cont = document.getElementById('listaHeroesAdmin');
  if (!cont) return;
  cont.innerHTML = "";
  const snap = await getDocs(collection(db, "heroes"));
  snap.forEach(d => {
    cont.innerHTML += `
      <div style="position:relative;">
        <img src="${d.data().url}" style="width:120px; height:70px; object-fit:cover; border-radius:6px;">
        <button onclick="borrarDoc('heroes', '${d.id}')" style="position:absolute; top:2px; right:2px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
      </div>
    `;
  });
}

async function cargarAvatares() {
  const cont = document.getElementById('listaAvataresAdmin');
  if (!cont) return;
  cont.innerHTML = "";
  const snap = await getDocs(collection(db, "avatars"));
  snap.forEach(d => {
    cont.innerHTML += `
      <div style="position:relative;">
        <img src="${d.data().url}" style="width:60px; height:60px; object-fit:cover; border-radius:50%;">
        <button onclick="borrarDoc('avatars', '${d.id}')" style="position:absolute; top:0; right:0; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; cursor:pointer;">×</button>
      </div>
    `;
  });
}

window.borrarDoc = async (coleccion, id) => {
  if (confirm("¿Seguro que deseas eliminar este elemento?")) {
    await deleteDoc(doc(db, coleccion, id));
    if (coleccion === 'categories') cargarCategorias();
    if (coleccion === 'contents') cargarListaAdmin();
    if (coleccion === 'heroes') cargarHeroes();
    if (coleccion === 'avatars') cargarAvatares();
  }
};