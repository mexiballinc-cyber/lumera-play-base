// admin.js - Panel Maestro de Lumera (Conectado a Firebase)

import { db, collection, addDoc, getDocs } from './firebase.js';

export function renderAdminPanel(container) {
  container.innerHTML = `
    <div class="admin-panel" style="position: relative; padding: 25px; color: #fff; max-width: 950px; margin: 20px auto; background: rgba(15, 15, 15, 0.85); backdrop-filter: blur(16px); border-radius: 20px; border: 1px solid rgba(212, 175, 55, 0.3);">
      
      <!-- BOTÓN SALIR -->
      <button id="btnCloseAdmin" class="svg-btn" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <h1 style="color: #d4af37; margin-bottom: 20px; font-size: 1.8rem;">Panel Maestro Lumera</h1>
      
      <!-- Pestañas de Navegación -->
      <div style="display: flex; gap: 10px; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <button class="admin-tab active" data-target="seccion-contenido" style="padding: 8px 16px; background: transparent; border: none; color: #d4af37; font-weight: bold; cursor: pointer;">Contenido</button>
        <button class="admin-tab" data-target="seccion-hero" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Hero</button>
        <button class="admin-tab" data-target="seccion-avatares" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Imágenes de Perfil</button>
        <button class="admin-tab" data-target="seccion-spark" style="padding: 8px 16px; background: transparent; border: none; color: #aaa; cursor: pointer;">Spark</button>
      </div>

      <!-- SECCIÓN CONTENIDO -->
      <div id="seccion-contenido" class="admin-section">
        <div style="display: flex; gap: 15px; margin-bottom: 20px;">
          <button id="btnNuevaCategoria" style="padding: 10px 18px; background: rgba(212,175,55,0.2); border: 1px solid #d4af37; color: #d4af37; border-radius: 8px; font-weight: bold; cursor: pointer;">+ Crear Categoría</button>
          <button id="btnNuevoContenido" style="padding: 10px 18px; background: #d4af37; border: none; color: #000; border-radius: 8px; font-weight: bold; cursor: pointer;">+ Añadir Contenido</button>
        </div>

        <!-- LISTA DE CATEGORÍAS Y CONTENIDOS -->
        <div id="listaContenidoAdmin" style="display: flex; flex-direction: column; gap: 15px;">
          <p style="color: #aaa;">Cargando categorías e ítems...</p>
        </div>
      </div>

      <!-- SECCIÓN HERO -->
      <div id="seccion-hero" class="admin-section" style="display: none;">
        <h3>Imágenes del Hero</h3>
        <div style="display: flex; gap: 10px; margin: 15px 0;">
          <input type="url" id="heroImgUrl" placeholder="URL Imagen Hero (Imgur)" style="flex: 1; padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button id="btnGuardarHero" style="padding: 10px 20px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Añadir</button>
        </div>
      </div>

      <!-- SECCIÓN AVATARES -->
      <div id="seccion-avatares" class="admin-section" style="display: none;">
        <h3>Avatares de Perfil</h3>
        <div style="display: flex; gap: 10px; margin: 15px 0;">
          <input type="url" id="avatarImgUrl" placeholder="URL Avatar (Imgur)" style="flex: 1; padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button id="btnGuardarAvatar" style="padding: 10px 20px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Añadir</button>
        </div>
      </div>

      <!-- SECCIÓN SPARK -->
      <div id="seccion-spark" class="admin-section" style="display: none;">
        <h3>Añadir Video a Spark</h3>
        <form id="formSpark" style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
          <input type="text" id="sparkNombre" placeholder="Título del Video" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <input type="text" id="sparkCategoria" placeholder="Categoría (Para Algoritmo)" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <input type="url" id="sparkUrl" placeholder="URL Video (Internet Archive)" required style="padding: 10px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
          <button type="submit" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">Publicar en Spark</button>
        </form>
      </div>

    </div>
  `;

  // BOTÓN CERRAR PANEL
  document.getElementById('btnCloseAdmin').addEventListener('click', () => {
    location.reload(); // Recarga limpia para regresar a la vista de perfiles
  });

  // CAMBIO DE PESTAÑAS
  const tabs = container.querySelectorAll('.admin-tab');
  const sections = container.querySelectorAll('.admin-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.style.color = '#aaa');
      sections.forEach(s => s.style.display = 'none');
      
      tab.style.color = '#d4af37';
      const target = tab.getAttribute('data-target');
      container.querySelector(`#${target}`).style.display = 'block';
    });
  });

  // ABRIR MODAL COMÚN
  document.getElementById('btnNuevaCategoria').addEventListener('click', () => abrirModalCategoria());
  document.getElementById('btnNuevoContenido').addEventListener('click', () => abrirModalContenido());

  cargarListaAdmin();
}

// MODAL PARA CREAR CATEGORÍA
function abrirModalCategoria() {
  const modal = document.createElement('div');
  modal.id = 'modalAdmin';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:400;";
  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:12px; border:1px solid #d4af37; width:320px; color:white;">
      <h3>Crear Categoría</h3>
      <input type="text" id="nombreCatInput" placeholder="Nombre (Ej. Acción, Terror)" style="width:100%; padding:10px; margin:15px 0; background:#222; border:1px solid #444; color:white; border-radius:6px;">
      <div style="display:flex; justify-end; gap:10px;">
        <button id="btnCancelarCat" style="padding:8px 15px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
        <button id="btnGuardarCat" style="padding:8px 15px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar</button>
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
      cargarListaAdmin();
    }
  };
}

// MODAL PARA AÑADIR CONTENIDO
function abrirModalContenido() {
  const modal = document.createElement('div');
  modal.id = 'modalAdmin';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:400; overflow-y:auto; padding:20px 0;";
  modal.innerHTML = `
    <div style="background:#151515; padding:25px; border-radius:16px; border:1px solid #d4af37; width:90%; max-width:600px; color:white; margin:auto;">
      <h3 style="color:#d4af37; margin-bottom:15px;">Añadir Película o Serie</h3>
      <form id="formModalContenido" style="display:flex; flex-direction:column; gap:12px;">
        <input type="text" id="cntTitulo" placeholder="Título" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        <input type="url" id="cntPortada" placeholder="URL Portada (Imgur)" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        <input type="url" id="cntBanner" placeholder="URL Foto Descripción (Imgur)" required style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
        <textarea id="cntDesc" placeholder="Descripción" rows="3" style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;"></textarea>
        
        <label style="display:flex; align-items:center; gap:10px; color:#ff5555; font-size:14px;">
          <input type="checkbox" id="cntMayor7"> Es para mayores de 7 años (Ocultar en Kids)
        </label>

        <select id="cntTipo" style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
          <option value="pelicula">Película</option>
          <option value="serie">Serie</option>
        </select>

        <input type="url" id="cntVideoUrl" placeholder="URL Video Principal (Internet Archive)" style="padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
          <button type="button" id="btnCancelCnt" style="padding:10px 20px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
          <button type="submit" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar en Firebase</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelCnt').onclick = () => modal.remove();
  
  document.getElementById('formModalContenido').onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('cntTitulo').value,
      poster: document.getElementById('cntPortada').value,
      banner: document.getElementById('cntBanner').value,
      description: document.getElementById('cntDesc').value,
      is7Plus: document.getElementById('cntMayor7').checked,
      type: document.getElementById('cntTipo').value,
      videoUrl: document.getElementById('cntVideoUrl').value,
      createdAt: new Date()
    };

    await addDoc(collection(db, "contents"), data);
    modal.remove();
    cargarListaAdmin();
  };
}

// LEER CONTENIDOS Y CATEGORÍAS DE FIREBASE
async function cargarListaAdmin() {
  const contenedor = document.getElementById('listaContenidoAdmin');
  if (!contenedor) return;

  contenedor.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "contents"));

  if (querySnapshot.empty) {
    contenedor.innerHTML = "<p style='color:#888;'>No hay nada publicado aún.</p>";
    return;
  }

  querySnapshot.forEach((doc) => {
    const item = doc.data();
    const card = document.createElement('div');
    card.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:12px 18px; background:rgba(255,255,255,0.05); border-radius:10px; border:1px solid rgba(255,255,255,0.1);";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:15px;">
        <img src="${item.poster}" style="width:45px; height:60px; object-fit:cover; border-radius:6px;">
        <div>
          <h4 style="margin:0; color:#fff;">${item.title} ${item.is7Plus ? '<span style="color:#ff5555; font-size:11px;">[+7]</span>' : ''}</h4>
          <small style="color:#aaa;">${item.type.toUpperCase()}</small>
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <button style="padding:6px 12px; background:transparent; border:1px solid #d4af37; color:#d4af37; border-radius:6px; cursor:pointer;">Editar</button>
        <button style="padding:6px 12px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:6px; cursor:pointer;">Borrar</button>
      </div>
    `;
    contenedor.appendChild(card);
  });
}
