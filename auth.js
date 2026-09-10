// auth.js - Autenticación Completa, Perfiles, Catálogo, Buscador y Hero Carousel
import { 
  db, 
  auth, 
  collection, 
  getDocs, 
  addDoc, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from './firebase.js';
import { renderDetailsScreen } from './details.js';

export let currentLang = 'es';
let allContent = [];
let heroInterval = null;
let currentHeroIndex = 0;
let usuarioActual = null;

export function setLanguage(lang) {
  currentLang = lang;
  renderCatalog(allContent);
}

// 1. GESTIÓN DE AUTENTICACIÓN REAL CON FIREBASE
export function inicializarAuth(onUserLogged) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      usuarioActual = user;
      await cargarPerfilesUsuario(user.uid, onUserLogged);
    } else {
      usuarioActual = null;
      renderLoginScreen();
    }
  });
}

export function renderLoginScreen() {
  const container = document.getElementById('authContainer');
  const mainCont = document.getElementById('mainAppContainer');
  if (mainCont) mainCont.classList.add('hidden');
  if (!container) return;
  container.classList.remove('hidden');

  container.innerHTML = `
    <div style="max-width:400px; margin:80px auto; padding:30px; background:#141414; border-radius:8px; color:#fff; font-family:sans-serif; text-align:center;">
      <h2 id="authTitle" style="margin-bottom:20px;">Iniciar Sesión</h2>
      <form id="authForm">
        <input type="email" id="authEmail" placeholder="Correo electrónico" required style="width:100%; padding:10px; margin-bottom:10px; border-radius:4px; border:1px solid #333; background:#222; color:#fff;">
        <input type="password" id="authPassword" placeholder="Contraseña" required style="width:100%; padding:10px; margin-bottom:20px; border-radius:4px; border:1px solid #333; background:#222; color:#fff;">
        <button type="submit" id="btnSubmitAuth" style="width:100%; padding:10px; background:#e50914; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Ingresar</button>
      </form>
      <p style="margin-top:15px; font-size:14px; color:#aaa;">
        <span id="toggleAuthText">¿No tienes cuenta?</span> 
        <a href="#" id="toggleAuthLink" style="color:#fff; text-decoration:underline;">Regístrate aquí</a>
      </p>
    </div>
  `;

  let isRegister = false;
  const form = document.getElementById('authForm');
  const toggleLink = document.getElementById('toggleAuthLink');
  const authTitle = document.getElementById('authTitle');
  const btnSubmit = document.getElementById('btnSubmitAuth');
  const toggleText = document.getElementById('toggleAuthText');

  toggleLink.onclick = (e) => {
    e.preventDefault();
    isRegister = !isRegister;
    authTitle.innerText = isRegister ? 'Crear Cuenta' : 'Iniciar Sesión';
    btnSubmit.innerText = isRegister ? 'Registrarse' : 'Ingresar';
    toggleText.innerText = isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?';
    toggleLink.innerText = isRegister ? 'Inicia sesión' : 'Regístrate aquí';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Cuenta creada con éxito.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      alert("Error de autenticación: " + err.message);
    }
  };
}

export async function cerrarSesion() {
  await signOut(auth);
  window.location.reload();
}

// 2. CARGA Y SELECCIÓN DE PERFILES
async function cargarPerfilesUsuario(uid, onSelectProfileCallback) {
  let firebaseAvatars = [];
  try {
    const avatarSnap = await getDocs(collection(db, "avatars"));
    avatarSnap.forEach(doc => firebaseAvatars.push(doc.data().url));
  } catch (e) {
    console.warn("No se cargaron avatares:", e);
  }

  let profiles = [];
  try {
    const pSnap = await getDocs(collection(db, `users/${uid}/profiles`));
    pSnap.forEach(d => profiles.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Error al cargar perfiles:", e);
  }

  if (profiles.length === 0) {
    profiles = [{ id: 'default', name: 'Principal', avatar: firebaseAvatars[0] || 'https://via.placeholder.com/100' }];
  }

  renderProfileSelection(profiles, firebaseAvatars, async (selectedProfile) => {
    entrarPlataforma();
    if (onSelectProfileCallback) onSelectProfileCallback(selectedProfile);
  }, async (newProfileData) => {
    try {
      const docRef = await addDoc(collection(db, `users/${uid}/profiles`), newProfileData);
      profiles.push({ id: docRef.id, ...newProfileData });
      cargarPerfilesUsuario(uid, onSelectProfileCallback);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    }
  });
}

export function renderProfileSelection(profiles, avatarsList, onSelectProfile, onCreateProfile) {
  const container = document.getElementById('authContainer');
  if (!container) return;

  let profilesHTML = profiles.map(p => `
    <div class="profile-card" data-id="${p.id}" style="display:inline-block; text-align:center; margin:15px; cursor:pointer;">
      <img src="${p.avatar || 'https://via.placeholder.com/100'}" style="width:100px; height:100px; border-radius:10px; object-fit:cover;">
      <p style="color:#fff; margin-top:8px;">${p.name}</p>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="text-align:center; padding:40px; color:#fff; font-family:sans-serif;">
      <h2>¿Quién está viendo ahora?</h2>
      <div style="margin:20px 0;">${profilesHTML}</div>
      <button id="btnAddProfile" style="padding:10px 20px; background:#e50914; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Añadir Perfil</button>
      <div style="margin-top:20px;">
        <button id="btnLogout" style="background:transparent; color:#aaa; border:none; text-decoration:underline; cursor:pointer;">Cerrar Sesión</button>
      </div>
    </div>
  `;

  container.querySelectorAll('.profile-card').forEach(card => {
    card.onclick = () => {
      const pId = card.getAttribute('data-id');
      const selected = profiles.find(p => p.id === pId);
      onSelectProfile(selected);
    };
  });

  const btnAdd = document.getElementById('btnAddProfile');
  if (btnAdd) {
    btnAdd.onclick = () => {
      mostrarModalCrearPerfil(avatarsList, onCreateProfile);
    };
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.onclick = () => cerrarSesion();
}

function mostrarModalCrearPerfil(avatars, onCreateProfile) {
  const name = prompt("Nombre del nuevo perfil:");
  if (!name) return;

  let selectedAvatar = avatars[0] || '';
  if (avatars.length > 0) {
    const avatarChoice = prompt(`Selecciona el número de avatar (1 a ${avatars.length}) o pega una URL directa:\n` + avatars.map((a, i) => `${i + 1}: ${a}`).join('\n'));
    if (avatarChoice) {
      const index = parseInt(avatarChoice) - 1;
      if (!isNaN(index) && avatars[index]) {
        selectedAvatar = avatars[index];
      } else if (avatarChoice.startsWith('http')) {
        selectedAvatar = avatarChoice;
      }
    }
  } else {
    selectedAvatar = prompt("Introduce la URL de la imagen de perfil:") || '';
  }

  onCreateProfile({ name, avatar: selectedAvatar || 'https://via.placeholder.com/100' });
}

// 3. ENTRADA Y NAVEGACIÓN DE LA PLATAFORMA
export function entrarPlataforma() {
  const authCont = document.getElementById('authContainer');
  const mainCont = document.getElementById('mainAppContainer');
  if (authCont) authCont.classList.add('hidden');
  if (mainCont) mainCont.classList.remove('hidden');
  cargarContenido();
  setupHeader();
}

async function cargarContenido() {
  try {
    const querySnapshot = await getDocs(collection(db, "movies"));
    allContent = [];
    querySnapshot.forEach((doc) => {
      allContent.push({ id: doc.id, ...doc.data() });
    });
    renderHeroSlider(allContent);
    renderCatalog(allContent);
  } catch (e) {
    console.error("Error al cargar contenido:", e);
  }
}

function setupHeader() {
  const btnInicio = document.getElementById('btnNavInicio');
  const btnPelis = document.getElementById('btnNavPelis');
  const btnSeries = document.getElementById('btnNavSeries');
  const searchInput = document.getElementById('searchInput') || document.querySelector('input[type="search"]');

  if (btnInicio) {
    btnInicio.onclick = (e) => { 
      e.preventDefault(); 
      renderHeroSlider(allContent);
      renderCatalog(allContent); 
    };
  }
  if (btnPelis) {
    btnPelis.onclick = (e) => {
      e.preventDefault();
      const pelis = allContent.filter(i => i.type === 'movie' || i.tipo === 'pelicula');
      renderHeroSlider(pelis);
      renderCatalog(pelis);
    };
  }
  if (btnSeries) {
    btnSeries.onclick = (e) => {
      e.preventDefault();
      const series = allContent.filter(i => i.type === 'series' || i.tipo === 'serie');
      renderHeroSlider(series);
      renderCatalog(series);
    };
  }

  if (searchInput) {
    searchInput.oninput = (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderHeroSlider(allContent);
        renderCatalog(allContent);
        return;
      }
      const filtrados = allContent.filter(item => {
        const titulo = (item.title || item.titulo || '').toLowerCase();
        const desc = (item.description || item.descripcion || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : (item.tags || '').toLowerCase();
        return titulo.includes(query) || desc.includes(query) || tags.includes(query);
      });
      renderHeroSlider(filtrados);
      renderCatalog(filtrados);
    };
  }
}

// 4. HERO SLIDER AUTOMÁTICO (CADA 10 SEGUNDOS)
function renderHeroSlider(items) {
  const heroContainer = document.getElementById('heroContainer');
  if (!heroContainer) return;

  const heroItems = items.filter(i => i.heroImg || i.poster || i.img);
  if (heroItems.length === 0) {
    heroContainer.style.display = 'none';
    return;
  }

  heroContainer.style.display = 'block';
  clearInterval(heroInterval);

  function updateHero(index) {
    const item = heroItems[index];
    const bgUrl = item.heroImg || item.poster || item.img;

    heroContainer.innerHTML = `
      <div style="position:relative; width:100%; height:55vh; background:linear-gradient(to top, #141414, transparent), url('${bgUrl}') center/cover no-repeat; transition: background 1s ease-in-out; display:flex; align-items:flex-end; padding:30px; border-radius:8px; margin-bottom:20px;">
        <div style="max-width:500px; color:#fff; z-index:2;">
          <h1 style="font-size:2rem; margin-bottom:10px;">${item.title || item.titulo || ''}</h1>
          <p style="font-size:0.85rem; color:#ccc; margin-bottom:15px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${item.description || item.descripcion || ''}</p>
          <button id="btnHeroPlay" style="background:#e50914; color:#fff; border:none; padding:10px 20px; font-weight:bold; border-radius:4px; cursor:pointer;">▶ Reproducir</button>
        </div>
      </div>
    `;

    const btnPlay = document.getElementById('btnHeroPlay');
    if (btnPlay) {
      btnPlay.onclick = () => {
        const container = document.getElementById('detailsContainer') || document.getElementById('mainAppContainer');
        renderDetailsScreen(container, item);
      };
    }
  }

  currentHeroIndex = 0;
  updateHero(currentHeroIndex);

  if (heroItems.length > 1) {
    heroInterval = setInterval(() => {
      currentHeroIndex = (currentHeroIndex + 1) % heroItems.length;
      updateHero(currentHeroIndex);
    }, 10000);
  }
}

// 5. RENDERIZADO DE CATÁLOGO
function renderCatalog(items) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = '<p style="color: #fff; padding: 20px;">No se encontraron resultados.</p>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.style.cssText = 'cursor:pointer; margin:10px; display:inline-block; width:150px;';
    card.innerHTML = `
      <img src="${item.poster || item.img || ''}" alt="${item.title || ''}" style="width:100%; border-radius:8px; height:225px; object-fit:cover;">
      <h4 style="color:#fff; font-size:14px; margin-top:5px; text-align:center;">${item.title || item.titulo || ''}</h4>
    `;
    card.onclick = () => {
      const container = document.getElementById('detailsContainer') || document.getElementById('mainAppContainer');
      renderDetailsScreen(container, item);
    };
    grid.appendChild(card);
  });
}
