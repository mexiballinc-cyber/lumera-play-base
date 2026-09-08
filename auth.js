// auth.js - Sistema Completo Lumera (Perfiles Glassmorphism, Hero 10s, Filas y Drawer)
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, doc, deleteDoc } from './firebase.js';
import { renderAdminPanel } from './admin.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let isRegistering = false;
let currentPerfilKids = false;
let heroInterval = null;

const defaultAvatars = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png",
  "https://i.imgur.com/n7hvMwp.png",
  "https://i.imgur.com/L48WRuk.png"
];

onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  if (user) {
    if (user.email === ADMIN_EMAIL) inyectarBotonAdmin();
    conectarMenuDrawer();
    renderProfileSelection(container);
  } else {
    quitarBotonAdmin();
    renderAuthScreen(container);
  }
});

// PANTALLA DE LOGIN / REGISTRO
function renderAuthScreen(container) {
  if (heroInterval) clearInterval(heroInterval);
  container.innerHTML = `
    <div style="max-width: 400px; margin: 80px auto; background: rgba(20,20,20,0.9); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; backdrop-filter: blur(12px);">
      <img src="https://i.imgur.com/9rarmsD.png" alt="Lumera" style="height: 60px; margin-bottom: 20px;">
      <h2 id="authTitle" style="color: #fff; margin-bottom: 20px;">${isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      
      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" id="btnSubmitAuth" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
          ${isRegistering ? 'Registrarse' : 'Entrar a Lumera'}
        </button>
      </form>

      <p style="margin-top: 20px; color: #aaa; font-size: 14px;">
        ${isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <span id="btnToggleAuth" style="color: #d4af37; cursor: pointer; font-weight: bold;">
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

// SELECCIÓN DE PERFILES (REDONDOS, LÁPIZ Y BOTÓN MÁS)
async function renderProfileSelection(container) {
  if (heroInterval) clearInterval(heroInterval);
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:50px;">Cargando perfiles...</h2>`;

  // Cargar perfiles de Firestore
  let perfiles = [];
  try {
    const snap = await getDocs(collection(db, "profiles"));
    snap.forEach(d => perfiles.push({ id: d.id, ...d.data() }));
  } catch (e) {}

  // Si no hay perfiles, agregamos los dos iniciales
  if (perfiles.length === 0) {
    perfiles = [
      { id: 'p1', name: 'Principal', isKids: false, avatar: defaultAvatars[0] },
      { id: 'p2', name: 'Niños', isKids: true, avatar: defaultAvatars[1] }
    ];
  }

  let html = `
    <div style="text-align: center; margin-top: 50px; position: relative;">
      
      <button id="btnEditarPerfilesMode" title="Editar Perfiles" style="position: absolute; top: 0; right: 20px; background: transparent; border: 1px solid #d4af37; color: #d4af37; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
      </button>

      <h1 style="color: #fff; font-size: 2.2rem; margin-bottom: 35px;">¿Quién está viendo?</h1>
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 30px; flex-wrap: wrap;">
  `;

  perfiles.forEach(p => {
    const borderClass = p.isKids ? 'kids-avatar-active' : '';
    const staticBorder = p.isKids ? '' : 'border: 3px solid white;';

    html += `
      <div class="card-perfil-item" data-id="${p.id}" data-kids="${p.isKids}" style="cursor: pointer; text-align: center; position: relative;">
        <img src="${p.avatar}" class="${borderClass}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; ${staticBorder} transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <p style="color: #fff; margin-top: 12px; font-weight: bold; font-size: 16px;">${p.name}</p>
        <button class="btn-edit-single-profile" data-json='${JSON.stringify(p)}' style="display:none; position:absolute; top:0; right:0; background:rgba(0,0,0,0.8); border:1px solid #d4af37; color:#d4af37; border-radius:50%; width:32px; height:32px; cursor:pointer;">✎</button>
      </div>
    `;
  });

  // Botón + Añadir
  html += `
        <div style="cursor: pointer; text-align: center;" id="btnCrearPerfilModal">
          <div style="width: 120px; height: 120px; border-radius: 50%; border: 2px dashed rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            <span style="font-size: 40px; color: #aaa;">+</span>
          </div>
          <p style="color: #aaa; margin-top: 12px; font-weight: bold; font-size: 16px;">Añadir</p>
        </div>

      </div>
      
      <button id="btnSignOut" style="margin-top: 50px; padding: 10px 24px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 8px; cursor: pointer; font-size: 14px;">Cerrar Sesión</button>
    </div>
  `;

  container.innerHTML = html;

  // Clics para entrar
  document.querySelectorAll('.card-perfil-item').forEach(elem => {
    elem.onclick = (e) => {
      if (e.target.classList.contains('btn-edit-single-profile')) return;
      const isKids = elem.getAttribute('data-kids') === 'true';
      entrarPlataforma({ isKids, filtroTipo: 'todos' });
    };
  });

  // Modo Editar Perfiles (Lápiz)
  let editModeActive = false;
  document.getElementById('btnEditarPerfilesMode').onclick = () => {
    editModeActive = !editModeActive;
    document.querySelectorAll('.btn-edit-single-profile').forEach(b => {
      b.style.display = editModeActive ? 'block' : 'none';
    });
  };

  // Clics para editar perfil individual
  document.querySelectorAll('.btn-edit-single-profile').forEach(btn => {
    btn.onclick = () => {
      const pData = JSON.parse(btn.getAttribute('data-json'));
      abrirModalGestionPerfil(pData);
    };
  });

  // Botón Crear Perfil
  document.getElementById('btnCrearPerfilModal').onclick = () => abrirModalGestionPerfil(null);
  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

// MODAL GLASSMORPHISM PARA CREAR / EDITAR / BORRAR PERFIL
async function abrirModalGestionPerfil(perfilExistente = null) {
  // Cargar avatares guardados de Firestore + por defecto
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
      <img src="${url}" class="opt-avatar-img" data-url="${url}" style="width:65px; height:65px; border-radius:50%; object-fit:cover; cursor:pointer; border: 3px solid ${url === avatarSeleccionado ? '#d4af37' : 'transparent'};">
    `;
  });
  optionsAvataresHtml += `</div>`;

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:420px; color:white;">
      <h3 style="color:#d4af37; margin-bottom:20px; text-align:center;">${perfilExistente ? 'Editar Perfil' : 'Crear Nuevo Perfil'}</h3>
      
      <div style="display:flex; flex-direction:column; gap:15px;">
        <!-- Nombre -->
        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Nombre del Perfil</label>
          <input type="text" id="profNameInput" value="${perfilExistente ? perfilExistente.name : ''}" placeholder="Ej. Alex" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px; box-sizing:border-box;">
        </div>

        <!-- Tipo (Normal / Kids) -->
        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Tipo de Perfil</label>
          <select id="profTypeSelect" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px;">
            <option value="normal" ${perfilExistente && !perfilExistente.isKids ? 'selected' : ''}>Normal (Borde Blanco)</option>
            <option value="kids" ${perfilExistente && perfilExistente.isKids ? 'selected' : ''}>Niños (Borde Arcoíris)</option>
          </select>
        </div>

        <!-- Elección de Avatares -->
        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">Selecciona una Foto</label>
          ${optionsAvataresHtml}
        </div>

        <!-- Botones Guardar, Cancelar y Borrar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          ${perfilExistente ? `<button id="btnBorrarProf" type="button" style="padding:10px 15px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:8px; font-weight:bold; cursor:pointer;">Borrar</button>` : '<div></div>'}
          
          <div style="display:flex; gap:10px;">
            <button id="btnCancelProf" type="button" style="padding:10px 15px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">Cancelar</button>
            <button id="btnSaveProf" type="button" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer;">Guardar</button>
          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Selección visual de Avatar
  modal.querySelectorAll('.opt-avatar-img').forEach(img => {
    img.onclick = () => {
      modal.querySelectorAll('.opt-avatar-img').forEach(i => i.style.border = '3px solid transparent');
      img.style.border = '3px solid #d4af37';
      avatarSeleccionado = img.getAttribute('data-url');
    };
  });

  document.getElementById('btnCancelProf').onclick = () => modal.remove();

  // Guardar
  document.getElementById('btnSaveProf').onclick = async () => {
    const name = document.getElementById('profNameInput').value.trim();
    const isKids = document.getElementById('profTypeSelect').value === 'kids';

    if (!name) return alert("Por favor escribe un nombre para el perfil.");

    const payload = { name, isKids, avatar: avatarSeleccionado };

    if (perfilExistente && perfilExistente.id.length > 5) {
      // Si ya existía en Firestore, lo borramos y re-creamos con los nuevos datos
      await deleteDoc(doc(db, "profiles", perfilExistente.id));
    }
    await addDoc(collection(db, "profiles"), payload);

    modal.remove();
    renderProfileSelection(document.getElementById('appContainer'));
  };

  // Borrar
  if (perfilExistente) {
    document.getElementById('btnBorrarProf').onclick = async () => {
      if (confirm("¿Seguro que deseas eliminar este perfil?")) {
        if (perfilExistente.id.length > 5) {
          await deleteDoc(doc(db, "profiles", perfilExistente.id));
        }
        modal.remove();
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  }
}

// CARGA DEL CATÁLOGO EN FILAS Y HERO DINÁMICO CADA 10 SEGUNDOS
export async function entrarPlataforma({ isKids = false, filtroTipo = 'todos' } = {}) {
  currentPerfilKids = isKids;
  const container = document.getElementById('appContainer');
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:40px;">Cargando Lumera...</h2>`;

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
      <div style="padding: 10px 20px 40px 20px; max-width: 1200px; margin: 0 auto;">
        
        <!-- HERO PRINCIPAL (CAMBIO CADA 10S) -->
        <div id="heroBannerContainer" style="width: 100%; height: 230px; border-radius: 24px; overflow: hidden; position: relative; border: 1px solid rgba(212,175,55,0.3); margin-bottom: 30px; background: #111;">
          <img id="imgHeroActive" src="${heroImages[0]}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.8s ease-in-out;">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
        </div>

        <h2 style="color:#d4af37; margin-bottom: 20px; font-size: 1.6rem; text-transform: capitalize;">
          ${filtroTipo === 'todos' ? (isKids ? 'Sección Infantil' : 'Inicio') : (filtroTipo === 'pelicula' ? 'Películas' : 'Series')}
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
            <div style="flex: 0 0 140px; background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">
              <img src="${item.poster}" style="width: 100%; height: 190px; object-fit: cover;">
              <div style="padding: 8px;">
                <h4 style="color: #fff; font-size: 13px; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h4>
                <span style="color: #d4af37; font-size: 11px; font-weight: bold;">${(item.type || 'CONTENIDO').toUpperCase()}</span>
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

    // Timer Hero (10 segundos)
    if (heroImages.length > 1) {
      let currentHeroIdx = 0;
      const imgElem = document.getElementById('imgHeroActive');

      heroInterval = setInterval(() => {
        currentHeroIdx = (currentHeroIdx + 1) % heroImages.length;
        if (imgElem) {
          imgElem.style.opacity = '0.3';
          setTimeout(() => {
            imgElem.src = heroImages[currentHeroIdx];
            imgElem.style.opacity = '1';
          }, 400);
        }
      }, 10000);
    }

  } catch (err) {
    container.innerHTML = `<p style="text-align:center; color:#ff5555; margin-top:50px;">Error al cargar la plataforma.</p>`;
  }
}

// CONEXIÓN DEL MENU DRAWER LATERAL
function conectarMenuDrawer() {
  const drawerLinks = document.querySelectorAll('.drawer-links .nav-item');
  if (!drawerLinks.length) return;

  drawerLinks.forEach((link) => {
    const texto = link.innerText.trim().toLowerCase();

    link.onclick = (e) => {
      e.preventDefault();
      
      const drawer = document.getElementById('drawer');
      const overlay = document.getElementById('overlay');
      if (drawer) drawer.classList.remove('active');
      if (overlay) overlay.classList.remove('active');

      if (texto.includes('inicio')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
      } else if (texto.includes('película') || texto.includes('peliculas')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'pelicula' });
      } else if (texto.includes('serie')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'serie' });
      } else if (texto.includes('niño') || texto.includes('kids')) {
        entrarPlataforma({ isKids: true, filtroTipo: 'todos' });
      } else if (texto.includes('perfil') || texto.includes('perfiles')) {
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  });
}

// INYECCIÓN DEL LÁPIZ MAESTRO DE ADMIN
function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'btnAdminSecret';
    btnAdmin.className = 'svg-btn';
    btnAdmin.title = 'Panel Maestro';
    btnAdmin.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    
    btnAdmin.onclick = () => {
      const container = document.getElementById('appContainer');
      renderAdminPanel(container);
    };

    navRight.prepend(btnAdmin);
  }
}

function quitarBotonAdmin() {
  const btn = document.getElementById('btnAdminSecret');
  if (btn) btn.remove();
        }
