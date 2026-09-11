// auth.js - Sistema Completo con Perfiles Estilo Netflix, Categorías, Continuar Viendo e Idiomas
import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs } from './firebase.js';
import { renderAdminPanel } from './admin.js';
import { renderPlayer } from './player.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

export let currentLang = localStorage.getItem('lumera_lang') || 'es';
let currentPerfil = JSON.parse(localStorage.getItem('lumera_current_profile')) || null;
let cachedContents = [];

const LANG_MAP = {
  es: { who: "¿Quién está viendo?", add: "Añadir", edit: "Editar Perfiles", continue: "Continuar Viendo", signout: "Cerrar Sesión", search: "Buscar películas, series...", noRes: "Sin resultados", play: "▶ Reproducir", seasons: "Temporadas" },
  en: { who: "Who's watching?", add: "Add", edit: "Edit Profiles", continue: "Continue Watching", signout: "Sign Out", search: "Search movies, series...", noRes: "No results", play: "▶ Play", seasons: "Seasons" },
  ja: { who: "閲覧しているのは誰ですか？", add: "追加", edit: "プロフィールの編集", continue: "視聴を続ける", signout: "サインアウト", search: "検索...", noRes: "結果がありません", play: "▶ 再生", seasons: "シーズン" },
  pt: { who: "Quem está assistindo?", add: "Adicionar", edit: "Editar Perfis", continue: "Continuar Assistindo", signout: "Sair", search: "Buscar...", noRes: "Sem resultados", play: "▶ Assistir", seasons: "Temporadas" },
  de: { who: "Wer schaut zu?", add: "Hinzufügen", edit: "Profile bearbeiten", continue: "Weiter ansehen", signout: "Abmelden", search: "Suchen...", noRes: "Keine Ergebnisse", play: "▶ Abspielen", seasons: "Staffeln" },
  fr: { who: "Qui regarde ?", add: "Ajouter", edit: "Gérer les profils", continue: "Reprendre con la lecture", signout: "Se déconnecter", search: "Rechercher...", noRes: "Aucun résultat", play: "▶ Lecture", seasons: "Saisons" }
};

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);
  if (auth.currentUser) {
    if (currentPerfil) entrarPlataforma(currentPerfil);
    else renderProfileSelection(document.getElementById('appContainer'));
  }
}

// ENGANAGE CON LOS 6 IDIOMAS
export function abrirModalIdioma() {
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);`;
  modal.innerHTML = `
    <div style="background: #111; border: 1px solid #333; padding: 25px; border-radius: 16px; width: 320px; text-align: center; color: white;">
      <h3 style="margin-top: 0;">Idioma / Language</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
        <button class="lang-btn" data-lang="es" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">Español</button>
        <button class="lang-btn" data-lang="en" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">English</button>
        <button class="lang-btn" data-lang="ja" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">日本語</button>
        <button class="lang-btn" data-lang="pt" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">Português</button>
        <button class="lang-btn" data-lang="de" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">Deutsch</button>
        <button class="lang-btn" data-lang="fr" style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">Français</button>
      </div>
      <button id="btnCloseLang" style="background: transparent; border: none; color: #888; cursor: pointer;">Cerrar</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
      setLanguage(btn.getAttribute('data-lang'));
      modal.remove();
    };
  });
  document.getElementById('btnCloseLang').onclick = () => modal.remove();
}

// BUSCADOR CORREGIDO QUE BUSCA EN TIEMPO REAL
export function abrirModalBusqueda() {
  const t = LANG_MAP[currentLang] || LANG_MAP.es;
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; inset: 0; background: rgba(10,10,10,0.95); z-index: 10000; padding: 30px 20px; color: white; overflow-y: auto;`;
  modal.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="display: flex; gap: 15px; align-items: center;">
        <input type="text" id="mSearchInput" placeholder="${t.search}" style="flex: 1; padding: 14px 20px; background: #1a1a1a; border: 1px solid #333; border-radius: 30px; color: white; font-size: 16px; outline: none;">
        <button id="mCloseS" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
      </div>
      <div id="mResultsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px; margin-top: 25px;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('mSearchInput');
  const grid = document.getElementById('mResultsGrid');

  const ejecutarBusqueda = (q) => {
    if (!q) { grid.innerHTML = ''; return; }
    const res = cachedContents.filter(item => {
      const match = item.title?.toLowerCase().includes(q.toLowerCase());
      return currentPerfil?.isKids ? (match && item.isKids) : match;
    });

    if (res.length === 0) {
      grid.innerHTML = `<p style="color: #666; grid-column: 1/-1; text-align: center;">${t.noRes}</p>`;
      return;
    }

    grid.innerHTML = res.map(i => `
      <div class="s-item" data-id="${i.id}" style="cursor: pointer; text-align: center;">
        <img src="${i.poster || ''}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px;">
        <p style="font-size: 12px; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ccc;">${i.title}</p>
      </div>
    `).join('');

    grid.querySelectorAll('.s-item').forEach(card => {
      card.onclick = () => {
        modal.remove();
        abrirModalDetalles(cachedContents.find(c => c.id === card.getAttribute('data-id')));
      };
    });
  };

  input.oninput = (e) => ejecutarBusqueda(e.target.value.trim());
  document.getElementById('mCloseS').onclick = () => modal.remove();
  
  // Vincular input nav si existe
  const navSearch = document.getElementById('navSearchInput');
  if (navSearch && navSearch.value) {
    input.value = navSearch.value;
    ejecutarBusqueda(navSearch.value);
  }
}

onAuthStateChanged(auth, async (user) => {
  const container = document.getElementById('appContainer');
  if (user) {
    if (user.email === ADMIN_EMAIL) inyectarBotonAdmin();
    else removerBotonAdmin();
    await cargarContenidosFirebase();
    if (currentPerfil) entrarPlataforma(currentPerfil);
    else renderProfileSelection(container);
  } else {
    removerBotonAdmin();
    renderAuthScreen(container);
  }
});

async function cargarContenidosFirebase() {
  try {
    const snap = await getDocs(collection(db, "contents"));
    cachedContents = [];
    snap.forEach(d => cachedContents.push({ id: d.id, ...d.data() }));
  } catch (e) { console.error("Error al cargar Firebase:", e); }
}

function renderAuthScreen(container) {
  container.innerHTML = `
    <div style="max-width: 350px; margin: 80px auto; background: #111; padding: 30px; border-radius: 12px; border: 1px solid #222; text-align: center; color: white;">
      <h2>LUMERA</h2>
      <form id="authForm" style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
        <input type="email" id="emailInput" value="${ADMIN_EMAIL}" required style="padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 10px; background: #222; border: 1px solid #333; color: white; border-radius: 6px;">
        <button type="submit" style="padding: 12px; background: white; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Entrar</button>
      </form>
    </div>
  `;
  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, document.getElementById('emailInput').value.trim(), document.getElementById('passwordInput').value.trim());
    } catch (err) { alert("Error de credenciales: " + err.message); }
  };
}

// PERFILES REDONDOS COMO EN LA IMAGEN DE REFERENCIA
function getProfiles() {
  const stored = localStorage.getItem('lumera_profiles');
  if (stored) return JSON.parse(stored);
  // Lista vacía por defecto para que solo esté el botón "+" y Niños si se desea
  return [];
}

function saveProfiles(profiles) {
  localStorage.setItem('lumera_profiles', JSON.stringify(profiles));
}

function renderProfileSelection(container) {
  currentPerfil = null;
  localStorage.removeItem('lumera_current_profile');
  const t = LANG_MAP[currentLang] || LANG_MAP.es;
  const profiles = getProfiles();

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; color: white;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 40px;">
        <h1 style="font-size: 32px; font-weight: 600; margin: 0;">${t.who}</h1>
        <button id="btnEditProfilesToggle" style="background: transparent; border: 1px solid #555; width: 34px; height: 34px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>

      <div id="profilesGrid" style="display: flex; gap: 25px; flex-wrap: wrap; justify-content: center; align-items: center;">
        ${profiles.map((p, index) => `
          <div class="p-item" data-index="${index}" style="cursor: pointer; text-align: center;">
            <div style="width: 100px; height: 100px; border-radius: 50%; border: 2px solid #555; padding: 3px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              <img src="${p.avatar || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png'}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
            </div>
            <p style="margin-top: 10px; font-size: 14px; color: #ccc;">${p.name}</p>
          </div>
        `).join('')}

        <!-- BOTÓN DE AÑADIR (+) CIRCULAR CON BORDE PUNTEADO -->
        <div id="btnAddProfile" style="cursor: pointer; text-align: center;">
          <div style="width: 100px; height: 100px; border-radius: 50%; border: 2px dashed #666; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 30px; color: #aaa;">
            +
          </div>
          <p style="margin-top: 10px; font-size: 14px; color: #888;">${t.add}</p>
        </div>
      </div>

      <button id="btnSignOut" style="margin-top: 50px; background: transparent; border: 1px solid #333; color: #888; padding: 10px 24px; border-radius: 8px; cursor: pointer;">${t.signout}</button>
    </div>
  `;

  // Click en perfil
  container.querySelectorAll('.p-item').forEach(card => {
    card.onclick = () => {
      const idx = card.getAttribute('data-index');
      const perfil = profiles[idx];
      currentPerfil = perfil;
      localStorage.setItem('lumera_current_profile', JSON.stringify(perfil));
      entrarPlataforma(perfil);
    };
  });

  // Crear Perfil
  document.getElementById('btnAddProfile').onclick = () => abrirModalCrearPerfil();
  document.getElementById('btnEditProfilesToggle').onclick = () => abrirModalCrearPerfil(true);
  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

function abrirModalCrearPerfil(modoEditar = false) {
  const profiles = getProfiles();
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center;`;
  modal.innerHTML = `
    <div style="background: #111; border: 1px solid #333; padding: 25px; border-radius: 12px; width: 320px; color: white;">
      <h3 style="margin-top: 0;">${modoEditar ? 'Gestionar Perfiles' : 'Crear Perfil'}</h3>
      ${!modoEditar ? `
        <input type="text" id="pNameInput" placeholder="Nombre del perfil" style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; margin-bottom: 12px; box-sizing: border-box;">
        <input type="text" id="pAvatarInput" placeholder="URL Imagen (Opcional)" style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; margin-bottom: 12px; box-sizing: border-box;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 20px;">
          <input type="checkbox" id="pKidsCheck"> ¿Es perfil Infantil / Niños?
        </label>
        <button id="pSaveBtn" style="width: 100%; padding: 10px; background: white; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Guardar</button>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
          ${profiles.map((p, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #222; border-radius: 6px;">
              <span>${p.name}</span>
              <button class="del-p" data-i="${i}" style="background: red; border: none; color: white; border-radius: 4px; padding: 4px 8px; cursor: pointer;">Eliminar</button>
            </div>
          `).join('')}
        </div>
      `}
      <button id="pCloseBtn" style="width: 100%; margin-top: 10px; background: transparent; border: none; color: #888; cursor: pointer;">Cerrar</button>
    </div>
  `;
  document.body.appendChild(modal);

  if (!modoEditar) {
    document.getElementById('pSaveBtn').onclick = () => {
      const name = document.getElementById('pNameInput').value.trim();
      const avatar = document.getElementById('pAvatarInput').value.trim() || 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
      const isKids = document.getElementById('pKidsCheck').checked;

      if (name) {
        profiles.push({ name, avatar, isKids });
        saveProfiles(profiles);
        modal.remove();
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  } else {
    modal.querySelectorAll('.del-p').forEach(btn => {
      btn.onclick = () => {
        const i = btn.getAttribute('data-i');
        profiles.splice(i, 1);
        saveProfiles(profiles);
        modal.remove();
        renderProfileSelection(document.getElementById('appContainer'));
      };
    });
  }

  document.getElementById('pCloseBtn').onclick = () => modal.remove();
}

// CATÁLOGO ORGANIZADO EN FILAS POR SECCIONES/CATEGORÍAS Y CONTINUAR VIENDO
export function entrarPlataforma(perfil) {
  currentPerfil = perfil;
  const container = document.getElementById('appContainer');
  const t = LANG_MAP[currentLang] || LANG_MAP.es;

  // Filtrar si es perfil kids
  const filtrados = cachedContents.filter(i => perfil.isKids ? i.isKids : true);

  // Obtener Continuar Viendo de localStorage
  const continueList = JSON.parse(localStorage.getItem('lumera_continue_watching') || '[]');

  // Agrupar contenidos por su propiedad "category" (asignada en el admin)
  const categoriasMap = {};
  filtrados.forEach(item => {
    const cat = item.category || (item.type === 'serie' ? 'Series' : 'Películas');
    if (!categoriasMap[cat]) categoriasMap[cat] = [];
    categoriasMap[cat].push(item);
  });

  container.innerHTML = `
    <div style="max-width: 1250px; margin: 0 auto; color: white; padding: 0 15px;">
      
      <!-- SECCIÓN: CONTINUAR VIENDO -->
      ${continueList.length > 0 ? `
        <div style="margin-bottom: 30px;">
          <h3 style="margin-bottom: 12px; font-size: 18px; color: white;">${t.continue}</h3>
          <div style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px;">
            ${continueList.map(item => `
              <div class="c-cw-card" data-id="${item.id}" style="min-width: 160px; width: 160px; cursor: pointer; flex-shrink: 0;">
                <div style="position: relative; width: 100%; height: 100px;">
                  <img src="${item.poster || ''}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
                  <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: red; width: ${item.progress || 50}%;"></div>
                </div>
                <p style="font-size: 11px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ccc;">${item.title}</p>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- FILAS DINÁMICAS POR CATEGORÍA -->
      ${Object.keys(categoriasMap).map(catName => renderFilaHorizontal(catName, categoriasMap[catName])).join('')}

    </div>
  `;

  // Clics para abrir modal de detalles
  container.querySelectorAll('.c-card, .c-cw-card').forEach(card => {
    card.onclick = () => abrirModalDetalles(cachedContents.find(c => c.id === card.getAttribute('data-id')));
  });
}

function renderFilaHorizontal(titulo, items) {
  return `
    <div style="margin-bottom: 35px;">
      <h3 style="margin-bottom: 12px; font-size: 18px; color: white; font-weight: 600;">${titulo}</h3>
      <div style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: thin;">
        ${items.map(item => `
          <div class="c-card" data-id="${item.id}" style="min-width: 140px; width: 140px; cursor: pointer; flex-shrink: 0;">
            <img src="${item.poster || ''}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
            <p style="font-size: 12px; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #ccc;">${item.title}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function abrirModalDetalles(item) {
  if (!item) return;
  const t = LANG_MAP[currentLang] || LANG_MAP.es;
  const modal = document.createElement('div');
  modal.style.cssText = `position: fixed; inset: 0; z-index: 9999; background: #0a0a0a linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, #0a0a0a 100%), url('${item.banner || item.poster || ''}'); background-size: cover; background-position: center top; overflow-y: auto; color: white; padding: 40px 20px;`;

  modal.innerHTML = `
    <div style="max-width: 850px; margin: 0 auto; position: relative;">
      <button id="btnCloseDet" style="position: absolute; top: 0; right: 0; background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;">✕</button>
      <div style="margin-top: 100px; max-width: 550px;">
        <span style="color: #aaa; text-transform: uppercase; font-size: 12px;">${item.category || item.type}</span>
        <h1 style="font-size: 40px; margin: 10px 0;">${item.title}</h1>
        <p style="color: #ddd; font-size: 14px; margin-bottom: 25px; line-height: 1.5;">${item.description || ''}</p>
        <button id="btnPlayMain" style="padding: 12px 30px; background: white; border: none; border-radius: 20px; font-weight: bold; color: black; cursor: pointer; font-size: 15px;">${t.play}</button>
      </div>
      <div id="epArea" style="margin-top: 40px;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCloseDet').onclick = () => modal.remove();

  if (item.type === 'serie' && item.seasons?.length > 0) {
    const area = document.getElementById('epArea');
    area.innerHTML = `<h3 style="border-bottom: 1px solid #333; padding-bottom: 8px;">${t.seasons}</h3>`;
    item.seasons.forEach((s, sIdx) => {
      area.innerHTML += `<h4 style="margin-top: 15px; color: #aaa;">${s.name || `Temporada ${sIdx + 1}`}</h4>`;
      const epGrid = document.createElement('div');
      epGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 8px;";
      (s.episodes || []).forEach((ep, eIdx) => {
        const epCard = document.createElement('div');
        epCard.style.cssText = "padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; cursor: pointer;";
        epCard.innerHTML = `<span style="font-size: 13px;">E${eIdx + 1}: ${ep.title}</span>`;
        epCard.onclick = () => {
          modal.remove();
          guardarContinuarViendo(item);
          renderPlayer(document.getElementById('appContainer'), { item, selectedEp: ep, title: `${item.title} - ${ep.title}` });
        };
        epGrid.appendChild(epCard);
      });
      area.appendChild(epGrid);
    });
  }

  document.getElementById('btnPlayMain').onclick = () => {
    modal.remove();
    guardarContinuarViendo(item);
    let selectedEp = null;
    if (item.type === 'serie' && item.seasons?.[0]?.episodes?.[0]) selectedEp = item.seasons[0].episodes[0];
    renderPlayer(document.getElementById('appContainer'), { item, selectedEp, title: item.title });
  };
}

function guardarContinuarViendo(item) {
  let list = JSON.parse(localStorage.getItem('lumera_continue_watching') || '[]');
  list = list.filter(i => i.id !== item.id);
  list.unshift({ id: item.id, title: item.title, poster: item.poster, progress: 30 });
  if (list.length > 10) list.pop();
  localStorage.setItem('lumera_continue_watching', JSON.stringify(list));
}

function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btn = document.createElement('button');
    btn.id = 'btnAdminSecret';
    btn.className = 'svg-btn';
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    btn.onclick = () => renderAdminPanel(document.getElementById('appContainer'));
    navRight.prepend(btn);
  }
}

function removerBotonAdmin() {
  document.getElementById('btnAdminSecret')?.remove();
}
