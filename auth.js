// auth.js - Control Maestro de Lumera
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, doc, setDoc, deleteDoc } from './firebase.js';
import { renderAdminPanel } from './admin.js';
import { translations } from './i18n.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let isRegistering = false;
let currentPerfilKids = false;
let heroInterval = null;
export let currentLang = localStorage.getItem('lumera_lang') || 'es';

const defaultAvatars = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png"
];

export function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lumera_lang', lang);
  if (document.getElementById('btnEditarPerfilesMode')) {
    renderProfileSelection(document.getElementById('appContainer'));
  } else {
    entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
  }
}

// ESCUCHADORES GLOBALES AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
  conectarBotonesHeader();
  conectarMenuDrawer();
});

// ESTADO DE AUTENTICACIÓN
onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  conectarBotonesHeader();
  conectarMenuDrawer();

  if (user) {
    if (user.email === ADMIN_EMAIL) inyectarBotonAdmin();
    renderProfileSelection(container);
  } else {
    quitarBotonAdmin();
    renderAuthScreen(container);
  }
});

// CONTROL DE BOTONES SUPERIORES (HEADER)
function conectarBotonesHeader() {
  const btnMenu = document.getElementById('btnMenu');
  const btnConfig = document.getElementById('btnConfig');
  const btnSearch = document.getElementById('btnSearch');

  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      const drawer = document.getElementById('drawer');
      const overlay = document.getElementById('overlay');
      if (drawer && overlay) {
        drawer.classList.toggle('open');
        overlay.classList.toggle('active');
      }
    };
  }

  if (btnConfig) {
    btnConfig.onclick = () => abrirModalConfiguracionGlobal();
  }

  if (btnSearch) {
    btnSearch.onclick = () => alert("Buscador próximamente disponible.");
  }
}

// CONTROL Y CIERRE DEL MENÚ LATERAL (DRAWER)
function conectarMenuDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');

  const cerrarMenu = () => {
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  };

  if (overlay) overlay.onclick = cerrarMenu;

  document.querySelectorAll('.drawer-links .nav-item').forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      cerrarMenu();
      const texto = link.innerText.toLowerCase();

      if (texto.includes('inicio') || texto.includes('home')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
      } else if (texto.includes('película') || texto.includes('movies')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'pelicula' });
      } else if (texto.includes('serie')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'serie' });
      } else if (texto.includes('niño') || texto.includes('kids')) {
        entrarPlataforma({ isKids: true, filtroTipo: 'todos' });
      } else if (texto.includes('perfil')) {
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  });
}

// PANTALLA LOGIN
function renderAuthScreen(container) {
  if (heroInterval) clearInterval(heroInterval);
  container.innerHTML = `
    <div style="max-width: 400px; margin: 40px auto; background: rgba(20,20,20,0.9); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; backdrop-filter: blur(12px);">
      <img src="https://i.imgur.com/9rarmsD.png" alt="Lumera" style="height: 50px; margin-bottom: 20px;">
      <h2 style="color: #fff; margin-bottom: 20px;">${isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      
      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" style="padding: 12px; background: var(--gold-accent); color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
          ${isRegistering ? 'Registrarse' : 'Entrar a Lumera'}
        </button>
      </form>

      <p style="margin-top: 20px; color: #aaa; font-size: 14px;">
        ${isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <span id="btnToggleAuth" style="color: var(--gold-accent); cursor: pointer; font-weight: bold;">
          ${isRegistering ? ' Inicia Sesión' : ' Regístrate gratis'}
        </span>
      </p>
    </div>
  `;

  document.getElementById('btnToggleAuth').onclick = () => {
    isRegistering = !isRegistering;
    renderAuthScreen(container);
  };

  document.getElementById('authForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, pass);
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
}

// SELECCIÓN DE PERFILES
async function renderProfileSelection(container) {
  if (heroInterval) clearInterval(heroInterval);
  const t = translations[currentLang] || translations.es;
  container.innerHTML = `<h2 style="color:var(--gold-accent); text-align:center; margin-top:50px;">Cargando Lumera...</h2>`;

  let perfiles = [];
  try {
    const snap = await getDocs(collection(db, "profiles"));
    snap.forEach(d => perfiles.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  if (perfiles.length === 0) {
    perfiles = [
      { id: 'p1', name: 'Principal', isKids: false, avatar: defaultAvatars[0] },
      { id: 'p2', name: 'Niños', isKids: true, avatar: defaultAvatars[1] }
    ];
  }

  let html = `
    <div style="padding: 20px 10px; text-align: center; max-width: 800px; margin: 0 auto;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px;">
        <h1 style="color: #fff; font-size: 1.8rem; margin: 0;">¿Quién está viendo?</h1>
        <button id="btnEditarPerfilesMode" class="svg-btn" title="Editar Perfiles">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
  `;

  perfiles.forEach(p => {
    const avatarClass = p.isKids ? 'kids-avatar-active' : '';
    const staticStyle = p.isKids ? '' : 'border: 3px solid white;';

    html += `
      <div class="card-perfil-item" data-id="${p.id}" data-kids="${p.isKids}" style="cursor: pointer; text-align: center; position: relative;">
        <img src="${p.avatar}" class="${avatarClass}" style="width: 105px; height: 105px; border-radius: 50%; object-fit: cover; ${staticStyle}">
        <p style="color: #fff; margin-top: 10px; font-weight: bold; font-size: 15px;">${p.name}</p>
        <button class="btn-edit-single-profile" data-json='${JSON.stringify(p)}' style="display:none; position:absolute; top:0; right:0; background:rgba(0,0,0,0.9); border:1px solid var(--gold-accent); color:var(--gold-accent); border-radius:50%; width:32px; height:32px; cursor:pointer;">✎</button>
      </div>
    `;
  });

  html += `
        <div style="cursor: pointer; text-align: center;" id="btnCrearPerfilModal">
          <div style="width: 105px; height: 105px; border-radius: 50%; border: 2px dashed rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05);">
            <span style="font-size: 36px; color: #aaa;">+</span>
          </div>
          <p style="color: #aaa; margin-top: 10px; font-weight: bold; font-size: 15px;">Añadir</p>
        </div>
      </div>
      
      <button id="btnSignOut" style="margin-top: 40px; padding: 10px 24px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 8px; cursor: pointer;">${t.logout || 'Cerrar Sesión'}</button>
    </div>
  `;

  container.innerHTML = html;

  document.querySelectorAll('.card-perfil-item').forEach(elem => {
    elem.onclick = (e) => {
      if (e.target.classList.contains('btn-edit-single-profile')) return;
      const isKids = elem.getAttribute('data-kids') === 'true';
      entrarPlataforma({ isKids, filtroTipo: 'todos' });
    };
  });

  let editModeActive = false;
  document.getElementById('btnEditarPerfilesMode').onclick = () => {
    editModeActive = !editModeActive;
    document.querySelectorAll('.btn-edit-single-profile').forEach(b => {
      b.style.display = editModeActive ? 'block' : 'none';
    });
  };

  document.querySelectorAll('.btn-edit-single-profile').forEach(btn => {
    btn.onclick = () => abrirModalGestionPerfil(JSON.parse(btn.getAttribute('data-json')));
  });

  document.getElementById('btnCrearPerfilModal').onclick = () => abrirModalGestionPerfil(null);
  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

// MODAL PARA EDITAR Y CREAR PERFILES
async function abrirModalGestionPerfil(perfilExistente = null) {
  let listaAvatares = [...defaultAvatars];
  try {
    const snap = await getDocs(collection(db, "avatars"));
    snap.forEach(d => listaAvatares.push(d.data().url));
  } catch (e) {}

  let avatarSeleccionado = perfilExistente ? perfilExistente.avatar : listaAvatares[0];

  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:999; backdrop-filter:blur(8px); padding:20px;";
  
  let optionsAvataresHtml = `<div style="display:flex; gap:12px; overflow-x:auto; padding:10px 0; margin-bottom:15px;">`;
  listaAvatares.forEach(url => {
    optionsAvataresHtml += `
      <img src="${url}" class="opt-avatar-img" data-url="${url}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; cursor:pointer; border: 3px solid ${url === avatarSeleccionado ? 'var(--gold-accent)' : 'transparent'};">
    `;
  });
  optionsAvataresHtml += `</div>`;

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:400px; color:white;">
      <h3 style="color:var(--gold-accent); margin-bottom:20px; text-align:center;">${perfilExistente ? 'Editar Perfil' : 'Crear Nuevo Perfil'}</h3>
      
      <div style="display:flex; flex-direction:column; gap:15px;">
        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Nombre del Perfil</label>
          <input type="text" id="profNameInput" value="${perfilExistente ? perfilExistente.name : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px;">
        </div>

        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Tipo de Perfil</label>
          <select id="profTypeSelect" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px;">
            <option value="normal" ${perfilExistente && !perfilExistente.isKids ? 'selected' : ''}>Normal (Borde Blanco)</option>
            <option value="kids" ${perfilExistente && perfilExistente.isKids ? 'selected' : ''}>Niños (Borde Arcoíris)</option>
          </select>
        </div>

        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Selecciona una Foto</label>
          ${optionsAvataresHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          ${perfilExistente ? `<button id="btnBorrarProf" type="button" style="padding:10px 15px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:8px; font-weight:bold; cursor:pointer;">Borrar</button>` : '<div></div>'}
          
          <div style="display:flex; gap:10px;">
            <button id="btnCancelProf" type="button" style="padding:10px 15px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">Cancelar</button>
            <button id="btnSaveProf" type="button" style="padding:10px 20px; background:var(--gold-accent); border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer;">Guardar</button>
          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('.opt-avatar-img').forEach(img => {
    img.onclick = () => {
      modal.querySelectorAll('.opt-avatar-img').forEach(i => i.style.border = '3px solid transparent');
      img.style.border = '3px solid var(--gold-accent)';
      avatarSeleccionado = img.getAttribute('data-url');
    };
  });

  document.getElementById('btnCancelProf').onclick = () => modal.remove();

  document.getElementById('btnSaveProf').onclick = async () => {
    const name = document.getElementById('profNameInput').value.trim();
    const isKids = document.getElementById('profTypeSelect').value === 'kids';
    if (!name) return alert("Escribe un nombre.");

    const payload = { name, isKids, avatar: avatarSeleccionado };
    if (perfilExistente && perfilExistente.id) {
      await setDoc(doc(db, "profiles", perfilExistente.id), payload, { merge: true });
    } else {
      await addDoc(collection(db, "profiles"), payload);
    }
    modal.remove();
    renderProfileSelection(document.getElementById('appContainer'));
  };

  if (perfilExistente) {
    document.getElementById('btnBorrarProf').onclick = async () => {
      if (confirm("¿Eliminar perfil?")) {
        if (perfilExistente.id) await deleteDoc(doc(db, "profiles", perfilExistente.id));
        modal.remove();
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  }
}

// CATÁLOGO PRINCIPAL
export async function entrarPlataforma({ isKids = false, filtroTipo = 'todos' } = {}) {
  currentPerfilKids = isKids;
  const t = translations[currentLang] || translations.es;
  const container = document.getElementById('appContainer');
  container.innerHTML = `<h2 style="color:var(--gold-accent); text-align:center; margin-top:40px;">Cargando...</h2>`;

  if (heroInterval) clearInterval(heroInterval);

  try {
    const heroSnap = await getDocs(collection(db, "heroes"));
    let heroImages = [];
    heroSnap.forEach(d => heroImages.push(d.data().url));
    if (heroImages.length === 0) heroImages = ["https://i.imgur.com/9rarmsD.png"];

    const contentsSnap = await getDocs(collection(db, "contents"));
    let todosLosContenidos = [];

    contentsSnap.forEach(d => {
      const item = d.data();
      item.id = d.id;
      if (isKids && item.is7Plus) return;
      if (filtroTipo === 'pelicula' && item.type !== 'pelicula') return;
      if (filtroTipo === 'serie' && item.type !== 'serie') return;
      todosLosContenidos.push(item);
    });

    let mainHtml = `
      <div style="padding: 10px 0 40px 0; max-width: 1200px; margin: 0 auto;">
        
        <div id="heroBannerContainer" style="width: 100%; height: 220px; border-radius: 24px; overflow: hidden; position: relative; border: 1px solid rgba(212,175,55,0.3); margin-bottom: 30px; background: #111;">
          <img id="imgHeroActive" src="${heroImages[0]}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.8s ease-in-out;">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
        </div>

        <h2 style="color:var(--gold-accent); margin-bottom: 20px; font-size: 1.6rem; text-transform: capitalize;">
          ${filtroTipo === 'todos' ? (isKids ? (t.kids || 'Niños') : (t.home || 'Inicio')) : (filtroTipo === 'pelicula' ? (t.movies || 'Películas') : (t.series || 'Series'))}
        </h2>
    `;

    if (todosLosContenidos.length === 0) {
      mainHtml += `<p style="color:#888; text-align:center; margin-top:30px;">No hay contenido disponible en esta sección.</p>`;
    } else {
      const agrupados = {};
      todosLosContenidos.forEach(item => {
        const cat = item.category || 'Destacados';
        if (!agrupados[cat]) agrupados[cat] = [];
        agrupados[cat].push(item);
      });

      Object.keys(agrupados).forEach(catNombre => {
        mainHtml += `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #fff; font-size: 1.2rem; margin-bottom: 12px; font-weight: bold;">${catNombre}</h3>
            <div class="fila-scroll">
        `;

        agrupados[catNombre].forEach(item => {
          mainHtml += `
            <div class="card-item-media" data-json='${JSON.stringify(item)}' style="flex: 0 0 140px; background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: transform 0.2s;">
              <img src="${item.poster}" style="width: 100%; height: 190px; object-fit: cover;">
              <div style="padding: 8px;">
                <h4 style="color: #fff; font-size: 13px; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                <span style="color: var(--gold-accent); font-size: 11px; font-weight: bold;">${(item.type || 'CONTENIDO').toUpperCase()}</span>
              </div>
            </div>
          `;
        });

        mainHtml += `
            </div>
          </div>
        `;
      });
    }

    mainHtml += `</div>`;
    container.innerHTML = mainHtml;

    document.querySelectorAll('.card-item-media').forEach(card => {
      card.onclick = () => reproducirContenido(JSON.parse(card.getAttribute('data-json')));
    });

  } catch (err) {
    container.innerHTML = `<p style="text-align:center; color:#ff5555; margin-top:50px;">Error al cargar la plataforma.</p>`;
  }
}

// REPRODUCTOR DE VIDEO
function reproducirContenido(item) {
  if (heroInterval) clearInterval(heroInterval);
  const container = document.getElementById('appContainer');

  container.innerHTML = `
    <div style="max-width: 900px; margin: 0 auto; padding: 10px; color: white;">
      <button id="btnVolverFeed" style="background: transparent; border: 1px solid var(--gold-accent); color: var(--gold-accent); padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 20px;">
        ← Volver al catálogo
      </button>

      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 16px; border: 1px solid rgba(212,175,55,0.3); background: #000;">
        <iframe src="${item.videoUrl || ''}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>
      </div>

      <div style="margin-top: 20px;">
        <h1 style="color: #fff; margin-bottom: 8px;">${item.title}</h1>
        <p style="color: var(--gold-accent); font-size: 14px; font-weight: bold;">${(item.type || 'CONTENIDO').toUpperCase()} • ${item.category || 'General'}</p>
        <p style="color: #ccc; margin-top: 12px; line-height: 1.5;">${item.description || 'Sin descripción disponible.'}</p>
      </div>
    </div>
  `;

  document.getElementById('btnVolverFeed').onclick = () => {
    entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
  };
}

// MODAL CONFIGURACIÓN DE IDIOMA (TUERCA)
function abrirModalConfiguracionGlobal() {
  const modalExistente = document.getElementById('modalConfigGlobal');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modalConfigGlobal';
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(8px); padding:20px;";

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:320px; color:white; text-align:center; background:rgba(20,20,20,0.95);">
      <h3 style="color:#d4af37; margin-bottom:15px; font-size:1.2rem;">🌐 Idioma / Language</h3>
      
      <select id="selectLangModal" style="width:100%; padding:12px; background:#222; border:1px solid #d4af37; color:#d4af37; border-radius:10px; font-weight:bold; font-size:14px; margin-bottom:20px; cursor:pointer;">
        <option value="es" ${currentLang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇺🇸 English</option>
        <option value="ja" ${currentLang === 'ja' ? 'selected' : ''}>🇯🇵 日本語</option>
        <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
        <option value="pt" ${currentLang === 'pt' ? 'selected' : ''}>🇧🇷 Português</option>
        <option value="de" ${currentLang === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
      </select>

      <button id="btnCerrarConfig" style="padding:10px 25px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer; width:100%;">Aceptar</button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('selectLangModal').onchange = (e) => {
    setLanguage(e.target.value);
  };

  document.getElementById('btnCerrarConfig').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// INYECCIÓN BOTÓN ADMIN
function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'btnAdminSecret';
    btnAdmin.className = 'svg-btn';
    btnAdmin.title = 'Panel Maestro';
    btnAdmin.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    
    btnAdmin.onclick = () => {
      renderAdminPanel(document.getElementById('appContainer'));
    };

    navRight.prepend(btnAdmin);
  }
}

function quitarBotonAdmin() {
  const btn = document.getElementById('btnAdminSecret');
  if (btn) btn.remove();
}
