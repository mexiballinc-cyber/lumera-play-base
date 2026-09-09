import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs, addDoc, doc, setDoc, deleteDoc } from './firebase.js';
import { renderAdminPanel } from './admin.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let isRegistering = false;
let currentPerfilKids = false;
let heroInterval = null;
export let currentLang = 'es';

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
    noContent: "No hay contenido disponible.",
    loading: "Cargando Lumera...",
    profiles: "Perfiles"
  },
  en: {
    whoIsWatching: "Who's watching?",
    addProfile: "Add Profile",
    signOut: "Sign Out",
    editProfiles: "Edit Profiles",
    createProfile: "Create Profile",
    profileName: "Profile Name",
    profileType: "Profile Type",
    normalType: "Normal",
    kidsType: "Kids",
    selectAvatar: "Select Avatar",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    catalogKids: "Kids Section",
    catalogHome: "Home",
    movies: "Movies",
    series: "Series",
    noContent: "No content available.",
    loading: "Loading Lumera...",
    profiles: "Profiles"
  }
};

const defaultAvatars = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png"
];

// FUNCIÓN CONECTAR MENU DRAWER
export function conectarMenuDrawer() {
  const drawer = document.getElementById('drawer');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.getElementById('btnMenu');

  if (btnMenu) {
    btnMenu.onclick = (e) => {
      e.stopPropagation();
      if (drawer) drawer.classList.toggle('active');
      if (overlay) overlay.classList.toggle('active');
    };
  }

  if (overlay) {
    overlay.onclick = () => {
      if (drawer) drawer.classList.remove('active');
      overlay.classList.remove('active');
    };
  }
}

export function setLanguage(lang) {
  currentLang = lang;
  const container = document.getElementById('appContainer');
  if (container) renderProfileSelection(container);
}

// DECLARACIÓN DE RENDER PROFILE SELECTION (EXPORTADA DE PRIMERAS)
export async function renderProfileSelection(container) {
  if (!container) return;
  if (heroInterval) clearInterval(heroInterval);
  const t = i18n[currentLang] || i18n.es;
  
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:50px;">${t.loading}</h2>`;

  let perfiles = [];
  try {
    const snap = await getDocs(collection(db, "profiles"));
    snap.forEach(d => perfiles.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn("Error leyendo perfiles:", e);
  }

  if (perfiles.length === 0) {
    perfiles = [
      { id: 'p1', name: 'Principal', isKids: false, avatar: defaultAvatars[0] },
      { id: 'p2', name: 'Niños', isKids: true, avatar: defaultAvatars[1] }
    ];
  }

  let html = `
    <div style="padding: 20px 10px; text-align: center; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #fff; font-size: 1.8rem; margin-bottom: 30px;">${t.whoIsWatching}</h1>
      <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
  `;

  perfiles.forEach(p => {
    const avatarClass = p.isKids ? 'kids-avatar-active' : '';
    const staticStyle = p.isKids ? '' : 'border: 3px solid white;';

    html += `
      <div class="card-perfil-item" data-kids="${p.isKids}" style="cursor: pointer; text-align: center;">
        <img src="${p.avatar}" class="${avatarClass}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; ${staticStyle}">
        <p style="color: #fff; margin-top: 10px; font-weight: bold;">${p.name}</p>
      </div>
    `;
  });

  html += `
      </div>
      <button id="btnSignOut" style="margin-top: 40px; padding: 10px 20px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 8px; cursor: pointer;">${t.signOut}</button>
    </div>
  `;

  container.innerHTML = html;

  document.querySelectorAll('.card-perfil-item').forEach(elem => {
    elem.onclick = () => {
      const isKids = elem.getAttribute('data-kids') === 'true';
      entrarPlataforma({ isKids, filtroTipo: 'todos' });
    };
  });

  const btnSignOut = document.getElementById('btnSignOut');
  if (btnSignOut) btnSignOut.onclick = () => signOut(auth);
}

function renderAuthScreen(container) {
  if (!container) return;
  container.innerHTML = `
    <div style="max-width: 350px; margin: 60px auto; background: rgba(20,20,20,0.9); padding: 25px; border-radius: 12px; text-align: center;">
      <h2 style="color: #fff; margin-bottom: 20px;">${isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      <form id="authForm" style="display: flex; flex-direction: column; gap: 12px;">
        <input type="email" id="emailInput" placeholder="Correo" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" style="padding: 10px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Entrar</button>
      </form>
    </div>
  `;

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

export async function entrarPlataforma({ isKids = false } = {}) {
  const container = document.getElementById('appContainer');
  if (!container) return;
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:40px;">¡Bienvenido a Lumera!</h2>`;
}

// OBSERVA EL ESTADO DE AUTENTICACIÓN
onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  conectarMenuDrawer();
  if (user) {
    renderProfileSelection(container);
  } else {
    renderAuthScreen(container);
  }
});
