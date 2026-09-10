// admin.js - Panel Maestro de Administración Completo
// Gestión de Hero Banners, Avatares, Categorías, Películas y Series con Multiaudio y Subtítulos

import { db } from './db.js';
import { state, updateState } from './state.js';

export async function renderAdminPanel(container) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; padding-top:50px;">Cargando Panel Maestro de Lumera...</h2>`;

  let mediaList = [];
  let heroList = [];
  let avatarList = [];

  try {
    mediaList = (await db.getAll('media')) || [];
    heroList = (await db.getAll('heroes')) || [];
    avatarList = (await db.getAll('avatars')) || [];
  } catch (err) {
    console.warn('Error al cargar datos en el admin panel:', err);
  }

  container.innerHTML = `
    <div class="admin-panel-wrapper" style="max-width: 1000px; margin: 20px auto; padding: 20px; color: white;">
      
      <!-- ENCABEZADO -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom:15px; margin-bottom:25px;">
        <h1 style="color:#d4af37; margin:0; font-size:1.8rem;">Panel Maestro de Control</h1>
        <button id="btnVolverHome" style="padding:8px 16px; background:transparent; border:1px solid #d4af37; color:#d4af37; border-radius:8px; cursor:pointer; font-weight:bold;">← Volver al Inicio</button>
      </div>

      <!-- SECCIÓN 1: HÉROES, AVATARES Y CATEGORÍAS -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:30px;">
        
        <!-- BANNERS HERO -->
        <div style="background:#151518; padding:18px; border-radius:12px; border:1px solid #2a2a30;">
          <h3 style="color:#d4af37; margin-top:0; margin-bottom:12px; font-size:1.1rem;">Banners Hero</h3>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <input type="url" id="inputHeroUrl" placeholder="URL de imagen Hero" style="flex:1; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; outline:none;">
            <button id="btnAddHero" style="padding:8px 14px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold; color:#000;">Añadir</button>
          </div>
          <div id="heroListContainer" style="display:flex; gap:10px; overflow-x:auto; padding:5px 0;">
            ${heroList.map(h => `
              <div style="position:relative; flex: 0 0 70px;">
                <img src="${h.url}" style="width:70px; height:40px; object-fit:cover; border-radius:4px; border:1px solid #444;">
                <button class="btn-del-hero" data-id="${h.id}" style="position:absolute; top:-6px; right:-6px; background:#ff4444; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">✕</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- AVATARES DE PERFIL -->
        <div style="background:#151518; padding:18px; border-radius:12px; border:1px solid #2a2a30;">
          <h3 style="color:#d4af37; margin-top:0; margin-bottom:12px; font-size:1.1rem;">Avatares de Perfil</h3>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <input type="url" id="inputAvatarUrl" placeholder="URL de Avatar" style="flex:1; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; outline:none;">
            <button id="btnAddAvatar" style="padding:8px 14px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold; color:#000;">Añadir</button>
          </div>
          <div id="avatarListContainer" style="display:flex; gap:10px; overflow-x:auto; padding:5px 0;">
            ${avatarList.map(a => `
              <div style="position:relative; flex: 0 0 45px;">
                <img src="${a.url}" style="width:45px; height:45px; object-fit:cover; border-radius:50%; border:1px solid #d4af37;">
                <button class="btn-del-avatar" data-id="${a.id}" style="position:absolute; top:-4px; right:-4px; background:#ff4444; color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer;">✕</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- CATEGORÍAS DINÁMICAS (PUNTO 6) -->
        <div style="background:#151518; padding:18px; border-radius:12px; border:1px solid #2a2a30;">
          <h3 style="color:#d4af37; margin-top:0; margin-bottom:12px; font-size:1.1rem;">Gestión de Categorías</h3>
          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <input type="text" id="inputCategoryName" placeholder="Nueva Categoría" style="flex:1; padding:8px; background:#222; border:1px solid #444; color:white; border-radius:6px; outline:none;">
            <button id="btnAddCategory" style="padding:8px 14px; background:#d4af37; border:none; border-radius:6px; cursor:pointer; font-weight:bold; color:#000;">+ Crear</button>
          </div>
          <div id="categoryChipsContainer" style="display:flex; flex-wrap:wrap; gap:6px;">
            ${state.categories.map(cat => `
              <span style="background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.4); color:#fff; padding:4px 10px; border-radius:12px; font-size:12px;">${cat}</span>
            `).join('')}
          </div>
        </div>

      </div>

      <!-- SECCIÓN 2: TABLA DE CONTENIDOS -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2 style="margin:0; font-size:1.4rem;">Catálogo de Películas y Series</h2>
        <button id="btnCreateNewMedia" style="padding:10px 20px; background:#d4af37; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer;">+ Nuevo Contenido</button>
      </div>

      <div style="background:#151518; border-radius:12px; border:1px solid #2a2a30; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
          <thead>
            <tr style="background:#1e1e24; color:#d4af37; border-bottom:1px solid #2a2a30;">
              <th style="padding:12px;">Poster</th>
              <th style="padding:12px;">Título</th>
              <th style="padding:12px;">Tipo</th>
              <th style="padding:12px;">Categoría</th>
              <th style="padding:12px; text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody id="tbodyMediaList">
            ${mediaList.length === 0 ? `
              <tr><td colspan="5" style="padding:20px; text-align:center; color:#888;">No hay contenidos registrados en la base de datos.</td></tr>
            ` : mediaList.map(item => `
              <tr style="border-bottom:1px solid #222;">
                <td style="padding:10px;"><img src="${item.poster || 'https://via.placeholder.com/40x55'}" style="width:40px; height:55px; object-fit:cover; border-radius:4px;"></td>
                <td style="padding:10px; font-weight:bold;">${item.title}</td>
                <td style="padding:10px; text-transform:uppercase; font-size:12px; color:#d4af37;">${item.type}</td>
                <td style="padding:10px; color:#aaa;">${item.category || 'General'}</td>
                <td style="padding:10px; text-align:right;">
                  <button class="btn-edit-media" data-id="${item.id}" style="padding:6px 12px; background:rgba(212,175,55,0.2); border:1px solid #d4af37; color:#d4af37; border-radius:6px; cursor:pointer; margin-right:5px;">Editar</button>
                  <button class="btn-del-media" data-id="${item.id}" style="padding:6px 12px; background:rgba(255,68,68,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:6px; cursor:pointer;">Borrar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

    </div>
  `;

  // EVENT LISTENERS DEL PANEL
  document.getElementById('btnVolverHome')?.addEventListener('click', () => {
    updateState('currentView', 'home');
  });

  // Agregar Hero
  document.getElementById('btnAddHero')?.addEventListener('click', async () => {
    const input = document.getElementById('inputHeroUrl');
    const url = input?.value.trim();
    if (url) {
      await db.add('heroes', { url });
      renderAdminPanel(container);
    }
  });

  // Eliminar Hero
  container.querySelectorAll('.btn-del-hero').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      await db.delete('heroes', id);
      renderAdminPanel(container);
    });
  });

  // Agregar Avatar
  document.getElementById('btnAddAvatar')?.addEventListener('click', async () => {
    const input = document.getElementById('inputAvatarUrl');
    const url = input?.value.trim();
    if (url) {
      await db.add('avatars', { url });
      renderAdminPanel(container);
    }
  });

  // Eliminar Avatar
  container.querySelectorAll('.btn-del-avatar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      await db.delete('avatars', id);
      renderAdminPanel(container);
    });
  });

  // Agregar Categoría (Punto 6)
  document.getElementById('btnAddCategory')?.addEventListener('click', () => {
    const input = document.getElementById('inputCategoryName');
    const name = input?.value.trim();
    if (name && !state.categories.includes(name)) {
      state.categories.push(name);
      renderAdminPanel(container);
    }
  });

  // Crear o Editar Contenido
  document.getElementById('btnCreateNewMedia')?.addEventListener('click', () => {
    openMediaModal(null, () => renderAdminPanel(container));
  });

  container.querySelectorAll('.btn-edit-media').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const itemToEdit = mediaList.find(m => String(m.id) === String(id));
      if (itemToEdit) {
        openMediaModal(itemToEdit, () => renderAdminPanel(container));
      }
    });
  });

  container.querySelectorAll('.btn-del-media').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id, 10);
      if (confirm('¿Deseas eliminar permanentemente este contenido?')) {
        await db.delete('media', id);
        renderAdminPanel(container);
      }
    });
  });
}

// MODAL PARA AÑADIR / EDITAR CONTENIDO (PELÍCULAS, SERIES, AUDIOS Y SUBTÍTULOS - PUNTO 4)
function openMediaModal(itemToEdit = null, onSaveSuccess) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px;";

  const languagesList = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'Inglés' },
    { code: 'ja', label: 'Japonés' },
    { code: 'fr', label: 'Francés' },
    { code: 'pt', label: 'Portugués' },
    { code: 'de', label: 'Alemán' }
  ];

  let episodesState = itemToEdit?.episodes ? JSON.parse(JSON.stringify(itemToEdit.episodes)) : [
    { title: 'Episodio 1', videoUrl: '', availableAudios: ['es'], availableSubtitles: ['off'] }
  ];

  modal.innerHTML = `
    <div style="background:#151518; padding:25px; border-radius:16px; border:1px solid #d4af37; width:100%; max-width:700px; color:white; max-height:90vh; overflow-y:auto;">
      <h2 style="color:#d4af37; margin-top:0;">${itemToEdit ? 'Editar Contenido' : 'Nuevo Contenido'}</h2>

      <div style="display:flex; flex-direction:column; gap:14px;">
        
        <div>
          <label style="font-size:12px; color:#aaa;">Título del Contenido</label>
          <input type="text" id="formTitle" value="${itemToEdit?.title || ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:12px; color:#aaa;">Tipo</label>
            <select id="formType" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
              <option value="movie" ${itemToEdit?.type === 'movie' ? 'selected' : ''}>Película</option>
              <option value="series" ${itemToEdit?.type === 'series' ? 'selected' : ''}>Serie</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px; color:#aaa;">Categoría</label>
            <select id="formCategory" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px;">
              ${state.categories.map(c => `<option value="${c}" ${itemToEdit?.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <div>
            <label style="font-size:12px; color:#aaa;">URL Poster Vertical</label>
            <input type="url" id="formPoster" value="${itemToEdit?.poster || ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
          <div>
            <label style="font-size:12px; color:#aaa;">URL Banner Horizontal</label>
            <input type="url" id="formBanner" value="${itemToEdit?.banner || ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">
          </div>
        </div>

        <div>
          <label style="font-size:12px; color:#aaa;">Sinopsis / Descripción</label>
          <textarea id="formDescription" style="width:100%; height:70px; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box;">${itemToEdit?.description || ''}</textarea>
        </div>

        <!-- CONFIGURACIÓN DE AUDIOS Y SUBTÍTULOS PARA PELÍCULAS (PUNTO 4) -->
        <div id="sectionMovie" style="display:${!itemToEdit || itemToEdit.type === 'movie' ? 'block' : 'none'}; border-top:1px solid #333; padding-top:12px;">
          <label style="font-size:12px; color:#aaa;">URL del Video (MP4/HLS)</label>
          <input type="url" id="formVideoUrl" value="${itemToEdit?.videoUrl || ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:6px; box-sizing:border-box; margin-bottom:10px;">

          <label style="font-size:12px; color:#d4af37;">Idiomas de Audio Disponibles:</label>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px; margin-bottom:10px;">
            ${languagesList.map(l => `
              <label style="font-size:13px; cursor:pointer;">
                <input type="checkbox" class="chk-movie-audio" value="${l.code}" ${itemToEdit?.availableAudios?.includes(l.code) ? 'checked' : ''}> ${l.label}
              </label>
            `).join('')}
          </div>

          <label style="font-size:12px; color:#d4af37;">Subtítulos Disponibles:</label>
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:5px;">
            ${languagesList.map(l => `
              <label style="font-size:13px; cursor:pointer;">
                <input type="checkbox" class="chk-movie-sub" value="${l.code}" ${itemToEdit?.availableSubtitles?.includes(l.code) ? 'checked' : ''}> ${l.label}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- CONFIGURACIÓN DE EPISODIOS PARA SERIES (PUNTO 4) -->
        <div id="sectionSeries" style="display:${itemToEdit?.type === 'series' ? 'block' : 'none'}; border-top:1px solid #333; padding-top:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="margin:0; color:#d4af37;">Lista de Episodios</h4>
            <button id="btnAddEpisode" type="button" style="padding:6px 12px; background:#d4af37; color:#000; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">+ Añadir Episodio</button>
          </div>
          <div id="episodesFormContainer"></div>
        </div>

        <!-- BOTONES DE ACCIÓN -->
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px; border-top:1px solid #333; padding-top:15px;">
          <button id="btnCancelModal" type="button" style="padding:10px 18px; background:transparent; border:1px solid #666; color:white; border-radius:6px; cursor:pointer;">Cancelar</button>
          <button id="btnSaveMedia" type="button" style="padding:10px 24px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:6px; cursor:pointer;">Guardar en Catálogo</button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const selectType = document.getElementById('formType');
  const secMovie = document.getElementById('sectionMovie');
  const secSeries = document.getElementById('sectionSeries');

  selectType.onchange = () => {
    if (selectType.value === 'movie') {
      secMovie.style.display = 'block';
      secSeries.style.display = 'none';
    } else {
      secMovie.style.display = 'none';
      secSeries.style.display = 'block';
      renderEpisodesUI();
    }
  };

  function renderEpisodesUI() {
    const container = document.getElementById('episodesFormContainer');
    if (!container) return;

    container.innerHTML = episodesState.map((ep, idx) => `
      <div style="background:#1e1e24; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #333;">
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" placeholder="Título Episodio" value="${ep.title || ''}" class="ep-title-input" data-idx="${idx}" style="flex:1; padding:6px; background:#111; border:1px solid #444; color:white; border-radius:4px;">
          <input type="url" placeholder="URL Video" value="${ep.videoUrl || ''}" class="ep-url-input" data-idx="${idx}" style="flex:2; padding:6px; background:#111; border:1px solid #444; color:white; border-radius:4px;">
          <button type="button" class="btn-remove-ep" data-idx="${idx}" style="background:#ff4444; color:white; border:none; border-radius:4px; padding:0 10px; cursor:pointer;">✕</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.ep-title-input').forEach(inp => {
      inp.oninput = (e) => { episodesState[e.target.dataset.idx].title = e.target.value; };
    });
    container.querySelectorAll('.ep-url-input').forEach(inp => {
      inp.oninput = (e) => { episodesState[e.target.dataset.idx].videoUrl = e.target.value; };
    });
    container.querySelectorAll('.btn-remove-ep').forEach(btn => {
      btn.onclick = (e) => {
        episodesState.splice(e.target.dataset.idx, 1);
        renderEpisodesUI();
      };
    });
  }

  document.getElementById('btnAddEpisode')?.addEventListener('click', () => {
    episodesState.push({ title: `Episodio ${episodesState.length + 1}`, videoUrl: '', availableAudios: ['es'], availableSubtitles: ['off'] });
    renderEpisodesUI();
  });

  if (itemToEdit?.type === 'series') renderEpisodesUI();

  document.getElementById('btnCancelModal').onclick = () => modal.remove();

  document.getElementById('btnSaveMedia').onclick = async () => {
    const title = document.getElementById('formTitle').value.trim();
    const type = selectType.value;
    const category = document.getElementById('formCategory').value;
    const poster = document.getElementById('formPoster').value.trim();
    const banner = document.getElementById('formBanner').value.trim();
    const description = document.getElementById('formDescription').value.trim();

    if (!title || !poster) {
      alert('Debes ingresar al menos un título y la URL del poster.');
      return;
    }

    const mediaData = {
      title,
      type,
      category,
      poster,
      banner,
      description
    };

    if (itemToEdit?.id) mediaData.id = itemToEdit.id;

    if (type === 'movie') {
      mediaData.videoUrl = document.getElementById('formVideoUrl').value.trim();
      mediaData.availableAudios = Array.from(document.querySelectorAll('.chk-movie-audio:checked')).map(cb => cb.value);
      mediaData.availableSubtitles = Array.from(document.querySelectorAll('.chk-movie-sub:checked')).map(cb => cb.value);
    } else {
      mediaData.episodes = episodesState;
    }

    if (itemToEdit?.id) {
      await db.put('media', mediaData);
    } else {
      await db.add('media', mediaData);
    }

    modal.remove();
    onSaveSuccess();
  };
}
