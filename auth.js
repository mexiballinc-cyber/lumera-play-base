// auth.js - Flujo de Autenticación, Perfiles, Traducción e Interfaz Responsive
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, doc, deleteDoc } from './firebase.js';
import { renderAdminPanel } from './admin.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let isRegistering = false;
let currentPerfilKids = false;
let heroInterval = null;
export let currentLang = 'es';

// DICCIONARIO CON LOS 6 IDIOMAS
const i18n = {
  es: {
    whoIsWatching: "¿Quién está viendo?",
    addProfile: "Añadir",
    signOut: "Cerrar Sesión",
    editProfiles: "Editar Perfiles",
    createProfile: "Crear Nuevo Perfil",
    profileName: "Nombre del Perfil",
    profileType: "Tipo de Perfil",
    normalType: "Normal (Borde Blanco)",
    kidsType: "Niños (Borde Arcoíris)",
    selectAvatar: "Selecciona una Foto",
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Borrar",
    catalogKids: "Sección Infantil",
    catalogHome: "Inicio",
    movies: "Películas",
    series: "Series",
    noContent: "No hay contenido disponible en esta sección.",
    loading: "Cargando Lumera...",
    profiles: "Perfiles"
  },
  en: {
    whoIsWatching: "Who's watching?",
    addProfile: "Add Profile",
    signOut: "Sign Out",
    editProfiles: "Edit Profiles",
    createProfile: "Create New Profile",
    profileName: "Profile Name",
    profileType: "Profile Type",
    normalType: "Normal (White Border)",
    kidsType: "Kids (Rainbow Border)",
    selectAvatar: "Select an Avatar",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    catalogKids: "Kids Section",
    catalogHome: "Home",
    movies: "Movies",
    series: "Series",
    noContent: "No content available in this section.",
    loading: "Loading Lumera...",
    profiles: "Profiles"
  },
  ja: {
    whoIsWatching: "誰が観ていますか？",
    addProfile: "プロフィールを追加",
    signOut: "ログアウト",
    editProfiles: "プロフィールを編集",
    createProfile: "新しいプロフィールを作成",
    profileName: "プロフィール名",
    profileType: "プロフィールの種類",
    normalType: "通常（白枠）",
    kidsType: "キッズ（レインボー枠）",
    selectAvatar: "アバターを選択",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    catalogKids: "キッズコーナー",
    catalogHome: "ホーム",
    movies: "映画",
    series: "シリーズ",
    noContent: "このセクションにはコンテンツがありません。",
    loading: "読み込み中...",
    profiles: "プロフィール"
  },
  fr: {
    whoIsWatching: "Qui regarde ?",
    addProfile: "Ajouter",
    signOut: "Déconnexion",
    editProfiles: "Gérer les profils",
    createProfile: "Créer un profil",
    profileName: "Nom du profil",
    profileType: "Type de profil",
    normalType: "Normal (Bord blanc)",
    kidsType: "Enfants (Bord arc-en-ciel)",
    selectAvatar: "Choisir un avatar",
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    catalogKids: "Section Enfants",
    catalogHome: "Accueil",
    movies: "Films",
    series: "Séries",
    noContent: "Aucun contenu disponible dans cette section.",
    loading: "Chargement de Lumera...",
    profiles: "Profils"
  },
  pt: {
    whoIsWatching: "Quem está assistindo?",
    addProfile: "Adicionar",
    signOut: "Sair",
    editProfiles: "Editar Perfis",
    createProfile: "Criar Novo Perfil",
    profileName: "Nome do Perfil",
    profileType: "Tipo de Perfil",
    normalType: "Normal (Borda Branca)",
    kidsType: "Infantil (Borda Arco-íris)",
    selectAvatar: "Selecione uma Foto",
    cancel: "Cancelar",
    save: "Salvar",
    delete: "Excluir",
    catalogKids: "Seção Infantil",
    catalogHome: "Início",
    movies: "Filmes",
    series: "Séries",
    noContent: "Nenhum conteúdo disponível nesta seção.",
    loading: "Carregando Lumera...",
    profiles: "Perfis"
  },
  de: {
    whoIsWatching: "Wer schaut gerade?",
    addProfile: "Hinzufügen",
    signOut: "Abmelden",
    editProfiles: "Profile bearbeiten",
    createProfile: "Neues Profil erstellen",
    profileName: "Profilname",
    profileType: "Profiltyp",
    normalType: "Normal (Weißer Rand)",
    kidsType: "Kinder (Regenbogenrand)",
    selectAvatar: "Avatar auswählen",
    cancel: "Abbrechen",
    save: "Speichern",
    delete: "Löschen",
    catalogKids: "Kinderbereich",
    catalogHome: "Startseite",
    movies: "Filme",
    series: "Serien",
    noContent: "In diesem Bereich ist kein Inhalt verfügbar.",
    loading: "Lumera wird geladen...",
    profiles: "Profile"
  }
};

const defaultAvatars = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png"
];

// FUNCIÓN PARA CAMBIAR IDIOMA DESDE LA TUERCA
export function setLanguage(lang) {
  currentLang = lang;
  traducirDrawerHTML();
  const container = document.getElementById('appContainer');
  if (document.getElementById('btnEditarPerfilesMode')) {
    renderProfileSelection(container);
  } else {
    entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
  }
}

function traducirDrawerHTML() {
  const t = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    if (t[key]) elem.innerText = t[key];
  });
}

onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  conectarMenuDrawer();
  if (user) {
    if (user.email === ADMIN_EMAIL) inyectarBotonAdmin();
    renderProfileSelection(container);
  } else {
    quitarBotonAdmin();
    renderAuthScreen(container);
  }
});

// PANTALLA DE LOGIN
function renderAuthScreen(container) {
  if (heroInterval) clearInterval(heroInterval);
  container.innerHTML = `
    <div style="max-width: 400px; margin: 80px auto; background: rgba(20,20,20,0.9); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; backdrop-filter: blur(12px);">
      <img src="https://i.imgur.com/9rarmsD.png" alt="Lumera" style="height: 60px; margin-bottom: 20px;">
      <h2 style="color: #fff; margin-bottom: 20px;">${isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      
      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
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

// SELECCIÓN DE PERFILES (LÁPIZ Y ENCABEZADO ALINEADOS)
async function renderProfileSelection(container) {
  if (heroInterval) clearInterval(heroInterval);
  const t = i18n[currentLang];
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:50px;">${t.loading}</h2>`;

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
    <div style="padding: 20px 10px; text-align: center; max-width: 800px; margin: 10px auto;">
      
      <!-- CONTENEDOR FLEXIBLE PARA EVITAR DESCUADRES -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 30px;">
        <h1 style="color: #fff; font-size: 1.8rem; margin: 0;">${t.whoIsWatching}</h1>

        <button id="btnEditarPerfilesMode" title="${t.editProfiles}" style="background: transparent; border: 1px solid #d4af37; color: #d4af37; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.2s;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
      
      <!-- LISTA DE PERFILES REDONDOS -->
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
  `;

  perfiles.forEach(p => {
    const borderClass = p.isKids ? 'kids-avatar-active' : '';
    const staticBorder = p.isKids ? '' : 'border: 3px solid white;';

    html += `
      <div class="card-perfil-item" data-id="${p.id}" data-kids="${p.isKids}" style="cursor: pointer; text-align: center; position: relative;">
        <img src="${p.avatar}" class="${borderClass}" style="width: 105px; height: 105px; border-radius: 50%; object-fit: cover; ${staticBorder} transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <p style="color: #fff; margin-top: 10px; font-weight: bold; font-size: 15px;">${p.name}</p>
        <button class="btn-edit-single-profile" data-json='${JSON.stringify(p)}' style="display:none; position:absolute; top:0; right:0; background:rgba(0,0,0,0.9); border:1px solid #d4af37; color:#d4af37; border-radius:50%; width:32px; height:32px; cursor:pointer;">✎</button>
      </div>
    `;
  });

  html += `
        <div style="cursor: pointer; text-align: center;" id="btnCrearPerfilModal">
          <div style="width: 105px; height: 105px; border-radius: 50%; border: 2px dashed rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(212,175,55,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
            <span style="font-size: 36px; color: #aaa;">+</span>
          </div>
          <p style="color: #aaa; margin-top: 10px; font-weight: bold; font-size: 15px;">${t.addProfile}</p>
        </div>

      </div>
      
      <button id="btnSignOut" style="margin-top: 40px; padding: 10px 24px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 8px; cursor: pointer; font-size: 14px;">${t.signOut}</button>
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
    btn.onclick = () => {
      const pData = JSON.parse(btn.getAttribute('data-json'));
      abrirModalGestionPerfil(pData);
    };
  });

  document.getElementById('btnCrearPerfilModal').onclick = () => abrirModalGestionPerfil(null);
  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

// MODAL PARA PERFILES
async function abrirModalGestionPerfil(perfilExistente = null) {
  const t = i18n[currentLang];
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
      <img src="${url}" class="opt-avatar-img" data-url="${url}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; cursor:pointer; border: 3px solid ${url === avatarSeleccionado ? '#d4af37' : 'transparent'};">
    `;
  });
  optionsAvataresHtml += `</div>`;

  modal.innerHTML = `
    <div class="glass-modal" style="padding:25px; border-radius:20px; width:100%; max-width:400px; color:white;">
      <h3 style="color:#d4af37; margin-bottom:20px; text-align:center;">${perfilExistente ? t.editProfiles : t.createProfile}</h3>
      
      <div style="display:flex; flex-direction:column; gap:15px;">
        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">${t.profileName}</label>
          <input type="text" id="profNameInput" value="${perfilExistente ? perfilExistente.name : ''}" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px; box-sizing:border-box;">
        </div>

        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">${t.profileType}</label>
          <select id="profTypeSelect" style="width:100%; padding:10px; background:#222; border:1px solid #444; color:white; border-radius:8px;">
            <option value="normal" ${perfilExistente && !perfilExistente.isKids ? 'selected' : ''}>${t.normalType}</option>
            <option value="kids" ${perfilExistente && perfilExistente.isKids ? 'selected' : ''}>${t.kidsType}</option>
          </select>
        </div>

        <div>
          <label style="font-size:13px; color:#aaa; display:block; margin-bottom:5px;">${t.selectAvatar}</label>
          ${optionsAvataresHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          ${perfilExistente ? `<button id="btnBorrarProf" type="button" style="padding:10px 15px; background:rgba(255,0,0,0.2); border:1px solid #ff4444; color:#ff4444; border-radius:8px; font-weight:bold; cursor:pointer;">${t.delete}</button>` : '<div></div>'}
          
          <div style="display:flex; gap:10px;">
            <button id="btnCancelProf" type="button" style="padding:10px 15px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">${t.cancel}</button>
            <button id="btnSaveProf" type="button" style="padding:10px 20px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer;">${t.save}</button>
          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('.opt-avatar-img').forEach(img => {
    img.onclick = () => {
      modal.querySelectorAll('.opt-avatar-img').forEach(i => i.style.border = '3px solid transparent');
      img.style.border = '3px solid #d4af37';
      avatarSeleccionado = img.getAttribute('data-url');
    };
  });

  document.getElementById('btnCancelProf').onclick = () => modal.remove();

  document.getElementById('btnSaveProf').onclick = async () => {
    const name = document.getElementById('profNameInput').value.trim();
    const isKids = document.getElementById('profTypeSelect').value === 'kids';

    if (!name) return alert("Escribe un nombre.");

    const payload = { name, isKids, avatar: avatarSeleccionado };

    if (perfilExistente && perfilExistente.id.length > 5) {
      await deleteDoc(doc(db, "profiles", perfilExistente.id));
    }
    await addDoc(collection(db, "profiles"), payload);

    modal.remove();
    renderProfileSelection(document.getElementById('appContainer'));
  };

  if (perfilExistente) {
    document.getElementById('btnBorrarProf').onclick = async () => {
      if (confirm("¿Eliminar perfil?")) {
        if (perfilExistente.id.length > 5) {
          await deleteDoc(doc(db, "profiles", perfilExistente.id));
        }
        modal.remove();
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  }
}

// FEED Y CATÁLOGO
export async function entrarPlataforma({ isKids = false, filtroTipo = 'todos' } = {}) {
  currentPerfilKids = isKids;
  const t = i18n[currentLang];
  const container = document.getElementById('appContainer');
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:40px;">${t.loading}</h2>`;

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
        
        <div id="heroBannerContainer" style="width: 100%; height: 220px; border-radius: 24px; overflow: hidden; position: relative; border: 1px solid rgba(212,175,55,0.3); margin-bottom: 30px; background: #111;">
          <img id="imgHeroActive" src="${heroImages[0]}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.8s ease-in-out;">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
        </div>

        <h2 style="color:#d4af37; margin-bottom: 20px; font-size: 1.6rem; text-transform: capitalize;">
          ${filtroTipo === 'todos' ? (isKids ? t.catalogKids : t.catalogHome) : (filtroTipo === 'pelicula' ? t.movies : t.series)}
        </h2>
    `;

    if (todosLosContenidos.length === 0) {
      mainHtml += `<p style="color:#888; text-align:center; margin-top:30px;">${t.noContent}</p>`;
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

// CONTROL ROBUSTO Y COMPLETO DEL MENU LATERAL Y OVERLAY
function conectarMenuDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.querySelector('.btn-menu, #btnMenu, .menu-toggle'); // Detecta tu botón de menú
  const drawerLinks = document.querySelectorAll('.drawer-links .nav-item, #drawer a');

  const abrirMenu = () => {
    if (drawer) drawer.classList.add('active');
    if (overlay) overlay.classList.add('active');
  };

  const cerrarMenu = () => {
    if (drawer) drawer.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  };

  // Conectar botón para ABRIR menú
  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      if (drawer && drawer.classList.contains('active')) {
        cerrarMenu();
      } else {
        abrirMenu();
      }
    };
  }

  // Conectar fondo oscuro para CERRAR menú
  if (overlay) {
    overlay.onclick = cerrarMenu;
  }

  // Conectar enlaces del menú para CERRAR y NAVEGAR
  drawerLinks.forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      cerrarMenu();

      const spanText = link.querySelector('span');
      const key = spanText ? spanText.getAttribute('data-i18n') : '';
      const texto = link.innerText.toLowerCase();

      if (key === 'home' || texto.includes('inicio')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'todos' });
      } else if (key === 'movies' || texto.includes('película') || texto.includes('movies')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'pelicula' });
      } else if (key === 'series' || texto.includes('serie')) {
        entrarPlataforma({ isKids: currentPerfilKids, filtroTipo: 'serie' });
      } else if (key === 'kids' || texto.includes('niño') || texto.includes('kids')) {
        entrarPlataforma({ isKids: true, filtroTipo: 'todos' });
      } else if (key === 'profiles' || texto.includes('perfil')) {
        renderProfileSelection(document.getElementById('appContainer'));
      }
    };
  });
}

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
