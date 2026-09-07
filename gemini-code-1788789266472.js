// ==========================================
// 1. INICIALIZACIÓN CON FIREBASE V12 MODULAR
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    getDocs, 
    onSnapshot, 
    query, 
    where, 
    deleteDoc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBynw4cMM1Y2iY8zeX37WJBcT6aNQMqGQc",
    authDomain: "lumera-79254.firebaseapp.com",
    projectId: "lumera-79254",
    storageBucket: "lumera-79254.firebasestorage.app",
    messagingSenderId: "4621510860",
    appId: "1:4621510860:web:fcd7cfa27a59f196943a69"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// CORREO MAESTRO DEL CREADOR
const MASTER_ADMIN_EMAIL = "tu_correo_maestro@gmail.com"; 

// ESTADOS GLOBALES DE LA APP
let currentUser = null;
let currentProfile = null;
let currentLang = 'es';
let contentCatalog = [];
let categoriesList = [];
let userLikes = {}; // Historial de likes de Spark para el algoritmo

// DICCIONARIO MULTI-IDIOMA (SISTEMA)
const i18n = {
    es: {
        welcome: "Bienvenido a Lumera",
        login: "Iniciar Sesión",
        register: "Registrarse",
        nav_home: "Inicio",
        nav_series: "Series",
        nav_movies: "Películas",
        nav_kids: "Kids",
        nav_profiles: "Perfiles",
        logout: "Cerrar Sesión",
        who_is_watching: "¿Quién está viendo ahora?",
        settings: "Configuración",
        play: "Reproducir",
        language: "Idioma de la Plataforma:",
        theme: "Tema Visual:"
    },
    en: {
        welcome: "Welcome to Lumera",
        login: "Log In",
        register: "Sign Up",
        nav_home: "Home",
        nav_series: "Series",
        nav_movies: "Movies",
        nav_kids: "Kids",
        nav_profiles: "Profiles",
        logout: "Log Out",
        who_is_watching: "Who is watching?",
        settings: "Settings",
        play: "Play",
        language: "Platform Language:",
        theme: "Visual Theme:"
    }
};

// ==========================================
// 2. CONTROL DE SESIÓN Y AUTENTICACIÓN
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';

        // Validar si es el Administrador Maestro
        if (user.email === MASTER_ADMIN_EMAIL) {
            document.getElementById('btnAdminPencil').style.display = 'block';
        } else {
            document.getElementById('btnAdminPencil').style.display = 'none';
        }

        initAppListeners();
    } else {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('appScreen').style.display = 'none';
    }
});

document.getElementById('btnLogin').addEventListener('click', () => {
    const e = document.getElementById('authEmail').value;
    const p = document.getElementById('authPass').value;
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
});

document.getElementById('btnRegister').addEventListener('click', () => {
    const e = document.getElementById('authEmail').value;
    const p = document.getElementById('authPass').value;
    createUserWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
});

document.getElementById('btnLogout').addEventListener('click', () => signOut(auth));

// ==========================================
// 3. NAVEGACIÓN Y CONFIGURACIONES
// ==========================================
function initAppListeners() {
    // Escuchar categorías en tiempo real
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        categoriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAllPages();
    });

    // Escuchar contenido general
    onSnapshot(collection(db, "contenido"), (snapshot) => {
        contentCatalog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAllPages();
    });

    // Menú Lateral (Drawer)
    document.getElementById('btnToggleMenu').onclick = toggleDrawer;
    document.getElementById('drawerOverlay').onclick = toggleDrawer;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            const page = item.getAttribute('data-page');
            switchPage(page);
            toggleDrawer();
        };
    });

    // Configuración y Modales
    document.getElementById('btnOpenSettings').onclick = () => document.getElementById('settingsModal').style.display = 'flex';
    document.getElementById('btnCloseSettings').onclick = () => document.getElementById('settingsModal').style.display = 'none';
    
    document.getElementById('settingLanguage').onchange = (e) => setLanguage(e.target.value);
    document.getElementById('settingTheme').onchange = (e) => setTheme(e.target.value);

    // Panel Administrador (Lápiz)
    document.getElementById('btnAdminPencil').onclick = () => document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('btnCloseAdmin').onclick = () => document.getElementById('adminModal').style.display = 'none';

    // Pestañas del Admin
    document.getElementById('btnAdminAddContent').onclick = () => renderAdminTab('content');
    document.getElementById('btnAdminAddCategory').onclick = () => renderAdminTab('category');
    document.getElementById('btnAdminHero').onclick = () => renderAdminTab('hero');
    document.getElementById('btnAdminSpark').onclick = () => renderAdminTab('spark');

    renderAdminTab('content'); // Cargar pestaña por defecto
}

function toggleDrawer() {
    document.getElementById('sideMenu').classList.toggle('active');
    document.getElementById('drawerOverlay').classList.toggle('active');
}

function switchPage(pageId) {
    document.querySelectorAll('.spa-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    const target = document.getElementById(`page-${pageId}`);
    if(target) target.classList.add('active');
    
    const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if(navItem) navItem.classList.add('active');

    if(pageId === 'spark') loadSparkFeed();
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if(i18n[lang][key]) el.innerText = i18n[lang][key];
    });
    renderAllPages();
}

function setTheme(themeClass) {
    document.body.className = themeClass;
}

// ==========================================
// 4. RENDERIZADO DINÁMICO DE CONTENIDO (SPA)
// ==========================================
function renderAllPages() {
    renderRows('homeRowsContainer', contentCatalog);
    renderRows('seriesRowsContainer', contentCatalog.filter(i => i.type === 'serie'));
    renderRows('moviesRowsContainer', contentCatalog.filter(i => i.type === 'peli'));
    renderRows('kidsRowsContainer', contentCatalog.filter(i => i.age <= 7));
    renderProfiles();
}

function renderRows(containerId, dataList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    categoriesList.forEach(cat => {
        const catItems = dataList.filter(item => item.categoryId === cat.id);
        if (catItems.length === 0) return;

        const rowTitle = document.createElement('h3');
        rowTitle.className = 'rowTitle';
        rowTitle.innerText = cat[currentLang] || cat.es || cat.name;

        const rowContainer = document.createElement('div');
        rowContainer.className = 'row';

        catItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'media-card';
            card.style.backgroundImage = `url('${item.img}')`;
            card.onclick = () => openPlayer(item.url);
            rowContainer.appendChild(card);
        });

        container.appendChild(rowTitle);
        container.appendChild(rowContainer);
    });
}

// ==========================================
// 5. ALGORITMO TIKTOK / SPARK
// ==========================================
async function loadSparkFeed() {
    const feed = document.getElementById('sparkFeed');
    feed.innerHTML = "<p style='text-align:center;'>Cargando Sparks...</p>";

    const snapshot = await getDocs(collection(db, "sparks"));
    let sparks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // ALGORITMO DE RECOMENDACIÓN: Ordenar según la categoría con más ❤️
    sparks.sort((a, b) => {
        const scoreA = userLikes[a.category] || 0;
        const scoreB = userLikes[b.category] || 0;
        return scoreB - scoreA;
    });

    feed.innerHTML = "";
    sparks.forEach(spark => {
        const sparkCard = document.createElement('div');
        sparkCard.style.cssText = "position:relative; height:80vh; margin-bottom:20px; border-radius:20px; overflow:hidden; background:#000;";
        sparkCard.innerHTML = `
            <video src="${spark.urlWayback}" loop playsinline style="width:100%; height:100%; object-fit:cover;" onclick="this.paused ? this.play() : this.pause()"></video>
            <div style="position:absolute; bottom:20px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <h4>${spark.title}</h4>
                    <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:10px;">${spark.category}</span>
                </div>
                <button class="btn-like-spark" style="background:none; border:none; font-size:30px; cursor:pointer;">❤️</button>
            </div>
        `;

        const likeBtn = sparkCard.querySelector('.btn-like-spark');
        likeBtn.onclick = () => {
            userLikes[spark.category] = (userLikes[spark.category] || 0) + 1;
            likeBtn.style.transform = "scale(1.3)";
            setTimeout(() => likeBtn.style.transform = "scale(1)", 200);
        };

        feed.appendChild(sparkCard);
    });
}

// ==========================================
// 6. AVATARES DE PERFIL (E INICIALES)
// ==========================================
function renderProfiles() {
    const container = document.getElementById('profilesContainer');
    if (!container) return;
    
    // Lista de tus 8 imágenes de Imgur
    const defaultAvatars = [
        "https://i.imgur.com/tqYZ1f3.png", "https://i.imgur.com/0g0UIuy.png",
        "https://i.imgur.com/6utiIjR.png", "https://i.imgur.com/W74FXcH.png",
        "https://i.imgur.com/cDRVrmd.png", "https://i.imgur.com/4Y7C6I8.png",
        "https://i.imgur.com/Dg0pNPU.png", "https://i.imgur.com/6hMJyYR.png"
    ];

    container.innerHTML = "";
    
    // Ejemplo de renderizado de Perfil con Avatar o Inicial
    defaultAvatars.slice(0, 3).forEach((imgUrl, idx) => {
        const pCard = document.createElement('div');
        pCard.style.textAlign = 'center';
        pCard.style.cursor = 'pointer';
        pCard.innerHTML = `<div class="media-card" style="width:100px; height:100px; border-radius:50%; background-image:url('${imgUrl}'); margin:0 auto;"></div><p>Perfil ${idx + 1}</p>`;
        pCard.onclick = () => switchPage('home');
        container.appendChild(pCard);
    });

    // Avatar Generativo con Inicial (Ejemplo)
    const initialCard = document.createElement('div');
    initialCard.style.textAlign = 'center';
    initialCard.style.cursor = 'pointer';
    initialCard.innerHTML = `<div class="profile-avatar-initial" style="margin:0 auto;">L</div><p>Lumera User</p>`;
    initialCard.onclick = () => switchPage('home');
    container.appendChild(initialCard);
}

// ==========================================
// 7. GESTOR MAESTRO DEL PANEL ADMINISTRADOR
// ==========================================
function renderAdminTab(tab) {
    const body = document.getElementById('adminTabBody');
    body.innerHTML = "";

    if (tab === 'content') {
        body.innerHTML = `
            <h3>Subir Película / Serie</h3>
            <input id="admTitleEs" placeholder="Título (Español)">
            <input id="admTitleEn" placeholder="Title (English)">
            <input id="admImg" placeholder="Link de Portada (Imgur)">
            <input id="admUrl" placeholder="Link Video (Internet Archive MP4)">
            <select id="admType">
                <option value="peli">Película</option>
                <option value="serie">Serie</option>
            </select>
            <select id="admCategory">
                ${categoriesList.map(c => `<option value="${c.id}">${c.es || c.name}</option>`).join('')}
            </select>
            <select id="admAge">
                <option value="0">+0 (Apto para Kids)</option>
                <option value="7">+7 años</option>
                <option value="13">+13 años</option>
                <option value="18">+18 años</option>
            </select>
            <button id="btnSaveContent" class="btn btn-primary">Guardar Contenido</button>
        `;

        document.getElementById('btnSaveContent').onclick = async () => {
            await addDoc(collection(db, "contenido"), {
                titleEs: document.getElementById('admTitleEs').value,
                titleEn: document.getElementById('admTitleEn').value,
                img: document.getElementById('admImg').value,
                url: document.getElementById('admUrl').value,
                type: document.getElementById('admType').value,
                categoryId: document.getElementById('admCategory').value,
                age: parseInt(document.getElementById('admAge').value),
                createdAt: serverTimestamp()
            });
            alert("¡Contenido Guardado!");
            document.getElementById('adminModal').style.display = 'none';
        };
    } 
    else if (tab === 'category') {
        body.innerHTML = `
            <h3>Añadir Nueva Categoría</h3>
            <input id="admCatEs" placeholder="Nombre (Español)">
            <input id="admCatEn" placeholder="Name (English)">
            <button id="btnSaveCategory" class="btn btn-primary">Crear Categoría</button>
        `;

        document.getElementById('btnSaveCategory').onclick = async () => {
            await addDoc(collection(db, "categorias"), {
                es: document.getElementById('admCatEs').value,
                en: document.getElementById('admCatEn').value,
                createdAt: serverTimestamp()
            });
            alert("¡Categoría Creada!");
            document.getElementById('adminModal').style.display = 'none';
        };
    }
    else if (tab === 'spark') {
        body.innerHTML = `
            <h3>Añadir Spark (TikTok)</h3>
            <input id="admSparkTitle" placeholder="Título del Video">
            <input id="admSparkUrl" placeholder="Link Wayback Machine (MP4)">
            <input id="admSparkCat" placeholder="Categoría (ej: Comedia, Acción)">
            <button id="btnSaveSpark" class="btn btn-primary">Publicar Spark</button>
        `;

        document.getElementById('btnSaveSpark').onclick = async () => {
            await addDoc(collection(db, "sparks"), {
                title: document.getElementById('admSparkTitle').value,
                urlWayback: document.getElementById('admSparkUrl').value,
                category: document.getElementById('admSparkCat').value,
                createdAt: serverTimestamp()
            });
            alert("¡Spark Publicado!");
            document.getElementById('adminModal').style.display = 'none';
        };
    }
}

// REPRODUCTOR
function openPlayer(videoUrl) {
    if(!videoUrl) return alert("Este contenido no tiene un link de video válido.");
    const player = document.getElementById('lumeraPlayer');
    const video = document.getElementById('mainVideo');
    video.src = videoUrl;
    player.style.display = 'block';
    video.play();
}

document.getElementById('btnClosePlayer').onclick = () => {
    const player = document.getElementById('lumeraPlayer');
    const video = document.getElementById('mainVideo');
    video.pause();
    player.style.display = 'none';
};