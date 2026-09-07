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
const MASTER_ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx"; 

// ESTADOS GLOBALES DE LA APP
let currentUser = null;
let currentLang = 'es';
let contentCatalog = [];
let categoriesList = [];
let userLikes = {};
let tempSeasons = []; // Almacena temporadas y episodios temporalmente

let customAvatars = [
    "https://i.imgur.com/tqYZ1f3.png", "https://i.imgur.com/0g0UIuy.png",
    "https://i.imgur.com/6utiIjR.png", "https://i.imgur.com/W74FXcH.png",
    "https://i.imgur.com/cDRVrmd.png", "https://i.imgur.com/4Y7C6I8.png",
    "https://i.imgur.com/Dg0pNPU.png", "https://i.imgur.com/6hMJyYR.png"
];

// DICCIONARIO MULTI-IDIOMA
const i18n = {
    es: { welcome: "Bienvenido a Lumera", login: "Iniciar Sesión", register: "Registrarse", nav_home: "Inicio", nav_series: "Series", nav_movies: "Películas", nav_kids: "Kids", nav_profiles: "Perfiles", logout: "Cerrar Sesión" },
    en: { welcome: "Welcome to Lumera", login: "Log In", register: "Sign Up", nav_home: "Home", nav_series: "Series", nav_movies: "Movies", nav_kids: "Kids", nav_profiles: "Profiles", logout: "Log Out" }
};

// ==========================================
// 2. CONTROL DE SESIÓN Y AUTENTICACIÓN
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';

        if (user.email === MASTER_ADMIN_EMAIL) {
            const btnPencil = document.getElementById('btnAdminPencil');
            if (btnPencil) btnPencil.style.display = 'flex';
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
// 3. ESCUCHADORES DE RED Y SPA
// ==========================================
function initAppListeners() {
    onSnapshot(collection(db, "categorias"), (snapshot) => {
        categoriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAllPages();
    });

    onSnapshot(collection(db, "contenido"), (snapshot) => {
        contentCatalog = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAllPages();
    });

    // Menú Lateral
    document.getElementById('btnToggleMenu').onclick = toggleDrawer;
    document.getElementById('drawerOverlay').onclick = toggleDrawer;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => {
            switchPage(item.getAttribute('data-page'));
            toggleDrawer();
        };
    });

    // Modales y Pestañas Admin
    const pencilBtn = document.getElementById('btnAdminPencil');
    if (pencilBtn) {
        pencilBtn.onclick = () => {
            document.getElementById('adminMasterModal').style.display = 'flex';
            renderAdminTab('content');
        };
    }

    const closeAdminBtn = document.getElementById('btnCloseAdminModal');
    if (closeAdminBtn) {
        closeAdminBtn.onclick = () => document.getElementById('adminMasterModal').style.display = 'none';
    }

    document.querySelectorAll('.admin-tab-item').forEach(tabBtn => {
        tabBtn.onclick = (e) => {
            document.querySelectorAll('.admin-tab-item').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderAdminTab(e.target.getAttribute('data-tab'));
        };
    });
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

    if(pageId === 'spark') loadSparkFeed();
}

// ==========================================
// 4. RENDERIZADO DE CONTENIDO (PÁGINAS)
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
            card.style.backgroundImage = `url('${item.imgCover || item.img}')`;
            card.onclick = () => openPlayer(item.url || (item.seasons?.[0]?.episodes?.[0]?.videoUrl));
            rowContainer.appendChild(card);
        });

        container.appendChild(rowTitle);
        container.appendChild(rowContainer);
    });
}

// ==========================================
// 5. PANEL MAESTRO DE ADMINISTRACIÓN
// ==========================================
function renderAdminTab(tab) {
    const container = document.getElementById('adminTabContent');
    if (!container) return;
    container.innerHTML = "";

    if (tab === 'content') {
        container.innerHTML = `
            <div class="admin-action-row">
                <button id="btnAddCategoryModal" class="btn-round btn-dark" style="width: auto;">+ Categoría</button>
                <button id="btnAddMediaModal" class="btn-round btn-gold" style="width: auto;">+ Contenido</button>
            </div>
            <div id="adminCategoriesList"></div>
        `;
        document.getElementById('btnAddMediaModal').onclick = openAddMediaModal;
        document.getElementById('btnAddCategoryModal').onclick = openAddCategoryModal;
        renderAdminInventoryView();
    } 
    else if (tab === 'spark') {
        container.innerHTML = `
            <div class="admin-action-row">
                <h4 style="margin:0;">Videos Spark</h4>
                <button id="btnAddSparkModal" class="btn-round btn-gold" style="width: auto;">+ Video Spark</button>
            </div>
            <div id="sparkAdminList" class="admin-cards-grid" style="margin-top:15px;"></div>
        `;
        document.getElementById('btnAddSparkModal').onclick = openAddSparkModal;
        renderSparkAdminList();
    }
    else if (tab === 'hero') {
        container.innerHTML = `
            <h4 style="margin:0 0 8px 0;">Configurar Banner Hero</h4>
            <p style="font-size:0.8rem; color:#aaa; margin-bottom:12px;">Destaca contenido especial en la pantalla de inicio.</p>
            <input id="heroTitleInput" placeholder="Título Principal" style="margin-bottom:8px;">
            <textarea id="heroDescInput" placeholder="Descripción destacada" style="width:100%; height:60px; border-radius:12px; background:rgba(255,255,255,0.07); color:#fff; padding:10px; border:1px solid var(--card-border); margin-bottom:8px;"></textarea>
            <input id="heroBgInput" placeholder="URL Imagen de Fondo (Imgur)" style="margin-bottom:8px;">
            <input id="heroVideoInput" placeholder="URL Video MP4" style="margin-bottom:12px;">
            <button id="btnSaveHero" class="btn-round btn-gold">Guardar Banner Hero</button>
        `;
        document.getElementById('btnSaveHero').onclick = async () => {
            await setDoc(doc(db, "settings", "hero"), {
                title: document.getElementById('heroTitleInput').value,
                desc: document.getElementById('heroDescInput').value,
                bg: document.getElementById('heroBgInput').value,
                video: document.getElementById('heroVideoInput').value
            });
            alert("¡Banner Hero actualizado!");
        };
    }
    else if (tab === 'avatars') {
        container.innerHTML = `
            <div class="admin-action-row">
                <h4 style="margin:0;">Avatares Disponibles</h4>
                <button id="btnAddAvatarModal" class="btn-round btn-gold" style="width: auto;">+ Avatar Imgur</button>
            </div>
            <div id="avatarsAdminList" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-top:15px;"></div>
        `;
        renderAdminAvatarsView();
        document.getElementById('btnAddAvatarModal').onclick = () => {
            const url = prompt("Pega el enlace directo de la imagen en Imgur:");
            if (url) {
                customAvatars.push(url);
                renderAdminAvatarsView();
            }
        };
    }
}

// VISTA TIPO INVENTARIO
function renderAdminInventoryView() {
    const container = document.getElementById('adminCategoriesList');
    if (!container) return;
    container.innerHTML = "";

    categoriesList.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = "cat-header-manage";
        catDiv.innerHTML = `
            <strong>${cat.es || cat.name}</strong>
            <div class="action-btns-group">
                <button onclick="deleteCategory('${cat.id}')" class="btn-icon-sm btn-delete-sm">🗑️</button>
            </div>
        `;
        container.appendChild(catDiv);

        const itemsGrid = document.createElement('div');
        itemsGrid.className = "admin-cards-grid";

        const catItems = contentCatalog.filter(item => item.categoryId === cat.id);
        if (catItems.length === 0) {
            itemsGrid.innerHTML = `<p style="font-size:0.8rem; color:#666; grid-column:span 2;">Sin contenido en esta categoría.</p>`;
        } else {
            catItems.forEach(item => {
                const card = document.createElement('div');
                card.className = "admin-media-card";
                card.innerHTML = `
                    <img src="${item.imgCover || item.img}" class="admin-card-thumb">
                    <div class="admin-card-info">
                        <span class="admin-card-title">${item.titleEs || item.title || 'Sin Título'}</span>
                        <button onclick="deleteContent('${item.id}')" class="btn-icon-sm btn-delete-sm">🗑️</button>
                    </div>
                `;
                itemsGrid.appendChild(card);
            });
        }
        container.appendChild(itemsGrid);
    });
}

// CREACIÓN DE CONTENIDO Y CATEGORÍAS
function openAddCategoryModal() {
    const nameEs = prompt("Nombre de la categoría (Español):");
    const nameEn = prompt("Category Name (English):");
    if (nameEs) {
        addDoc(collection(db, "categorias"), { es: nameEs, en: nameEn || nameEs, createdAt: serverTimestamp() });
    }
}

function openAddMediaModal() {
    const container = document.getElementById('adminTabContent');
    tempSeasons = [];

    container.innerHTML = `
        <button id="btnBackToAdminInv" class="btn-round btn-dark" style="width:auto; margin-bottom:12px;">← Volver</button>
        <h4 style="margin:0 0 12px 0;">Nuevo Contenido</h4>
        
        <select id="mediaTypeSelect" class="round-select" style="margin-bottom:8px;">
            <option value="peli">Película</option>
            <option value="serie">Serie</option>
        </select>

        <select id="mediaCategorySelect" class="round-select" style="margin-bottom:8px;">
            ${categoriesList.map(c => `<option value="${c.id}">${c.es || c.name}</option>`).join('')}
        </select>

        <input id="mediaTitleEs" placeholder="Título (Español)" style="margin-bottom:8px;">
        <input id="mediaTitleEn" placeholder="Title (English)" style="margin-bottom:8px;">
        
        <input id="mediaImgCover" placeholder="Foto Portada Link (Imgur)" style="margin-bottom:8px;">
        <input id="mediaImgDesc" placeholder="Foto Descripción Link (Imgur)" style="margin-bottom:8px;">
        
        <textarea id="mediaDescEs" placeholder="Descripción en Español" style="width:100%; height:50px; border-radius:12px; background:rgba(255,255,255,0.07); color:#fff; padding:8px; border:1px solid var(--card-border); margin-bottom:8px;"></textarea>
        <textarea id="mediaDescEn" placeholder="English Description" style="width:100%; height:50px; border-radius:12px; background:rgba(255,255,255,0.07); color:#fff; padding:8px; border:1px solid var(--card-border); margin-bottom:10px;"></textarea>

        <div id="mediaTypeFields"></div>

        <button id="btnSaveMediaItem" class="btn-round btn-gold" style="margin-top:12px;">Guardar Contenido</button>
    `;

    const selectType = document.getElementById('mediaTypeSelect');
    const dynamicFields = document.getElementById('mediaTypeFields');

    const updateFields = () => {
        if (selectType.value === 'peli') {
            dynamicFields.innerHTML = `
                <input id="peliVideoUrl" placeholder="Link Película (MP4 / Archive.org)" style="margin-bottom:8px;">
                <input id="peliSubtitlesVtt" placeholder="Link Subtítulos (.VTT / .SRT)" style="margin-bottom:8px;">
            `;
        } else {
            dynamicFields.innerHTML = `
                <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; border:1px solid var(--card-border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h5 style="margin:0;">Temporadas</h5>
                        <button id="btnAddSeason" class="btn-round btn-dark" style="font-size:0.75rem; padding:4px 10px; width:auto;">+ Temporada</button>
                    </div>
                    <div id="seasonsContainer"></div>
                </div>
            `;
            document.getElementById('btnAddSeason').onclick = addSeasonBlock;
        }
    };

    selectType.onchange = updateFields;
    updateFields();

    document.getElementById('btnBackToAdminInv').onclick = () => renderAdminTab('content');

    document.getElementById('btnSaveMediaItem').onclick = async () => {
        const type = selectType.value;
        const payload = {
            type,
            categoryId: document.getElementById('mediaCategorySelect').value,
            titleEs: document.getElementById('mediaTitleEs').value,
            titleEn: document.getElementById('mediaTitleEn').value,
            imgCover: document.getElementById('mediaImgCover').value,
            imgDesc: document.getElementById('mediaImgDesc').value,
            descEs: document.getElementById('mediaDescEs').value,
            descEn: document.getElementById('mediaDescEn').value,
            createdAt: serverTimestamp()
        };

        if (type === 'peli') {
            payload.url = document.getElementById('peliVideoUrl').value;
            payload.subtitles = document.getElementById('peliSubtitlesVtt').value;
        } else {
            payload.seasons = tempSeasons;
        }

        await addDoc(collection(db, "contenido"), payload);
        alert("¡Contenido publicado!");
        renderAdminTab('content');
    };
}

// MANEJO DE TEMPORADAS Y EPISODIOS
function addSeasonBlock() {
    tempSeasons.push({ seasonNumber: tempSeasons.length + 1, episodes: [] });
    renderSeasonsList();
}

function renderSeasonsList() {
    const container = document.getElementById('seasonsContainer');
    if (!container) return;
    container.innerHTML = "";

    tempSeasons.forEach((s, sIdx) => {
        const sDiv = document.createElement('div');
        sDiv.style.cssText = "background:rgba(255,255,255,0.05); padding:8px; border-radius:10px; margin-bottom:8px;";
        sDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.8rem;">Temporada ${s.seasonNumber}</strong>
                <button onclick="addEpisodeToSeason(${sIdx})" class="btn-icon-sm btn-edit-sm" style="width:auto; padding:2px 8px;">+ Episodio</button>
            </div>
            <div id="episodesList_${sIdx}"></div>
        `;
        container.appendChild(sDiv);

        const epContainer = sDiv.querySelector(`#episodesList_${sIdx}`);
        s.episodes.forEach((ep, eIdx) => {
            const epDiv = document.createElement('div');
            epDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:4px 8px; border-radius:6px; margin-top:4px; font-size:0.75rem;";
            epDiv.innerHTML = `
                <span>E${eIdx + 1}: ${ep.title}</span>
                <button onclick="removeEpisode(${sIdx}, ${eIdx})" class="btn-icon-sm btn-delete-sm">🗑️</button>
            `;
            epContainer.appendChild(epDiv);
        });
    });
}

window.addEpisodeToSeason = function(sIdx) {
    const title = prompt("Título del Episodio:");
    const videoUrl = prompt("Link del Video (MP4):");
    const subUrl = prompt("Link de Subtítulos (.VTT - Opcional):");

    if (title && videoUrl) {
        tempSeasons[sIdx].episodes.push({ title, videoUrl, subUrl: subUrl || "" });
        renderSeasonsList();
    }
};

window.removeEpisode = function(sIdx, eIdx) {
    tempSeasons[sIdx].episodes.splice(eIdx, 1);
    renderSeasonsList();
};

window.deleteCategory = async function(id) {
    if (confirm("¿Borrar esta categoría?")) await deleteDoc(doc(db, "categorias", id));
};

window.deleteContent = async function(id) {
    if (confirm("¿Borrar este contenido?")) await deleteDoc(doc(db, "contenido", id));
};

// ==========================================
// 6. SPARKS (ESTILO TIKTOK)
// ==========================================
function openAddSparkModal() {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = `
        <button id="btnBackToSparkTab" class="btn-round btn-dark" style="width:auto; margin-bottom:12px;">← Volver</button>
        <h4>Nuevo Video Spark</h4>
        <input id="sparkTitle" placeholder="Título / Descripción corta" style="margin-bottom:8px;">
        <input id="sparkVideoUrl" placeholder="URL Video MP4 (Vertical)" style="margin-bottom:8px;">
        <input id="sparkCategory" placeholder="Categoría (Ej: Comedia, Acción)" style="margin-bottom:12px;">
        <button id="btnSaveSpark" class="btn-round btn-gold">Guardar Spark</button>
    `;

    document.getElementById('btnBackToSparkTab').onclick = () => renderAdminTab('spark');
    document.getElementById('btnSaveSpark').onclick = async () => {
        await addDoc(collection(db, "sparks"), {
            title: document.getElementById('sparkTitle').value,
            urlWayback: document.getElementById('sparkVideoUrl').value,
            category: document.getElementById('sparkCategory').value,
            createdAt: serverTimestamp()
        });
        alert("¡Spark publicado!");
        renderAdminTab('spark');
    };
}

async function renderSparkAdminList() {
    const grid = document.getElementById('sparkAdminList');
    if (!grid) return;
    grid.innerHTML = "";

    const snapshot = await getDocs(collection(db, "sparks"));
    snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const card = document.createElement('div');
        card.className = "admin-media-card";
        card.innerHTML = `
            <div class="admin-card-info">
                <span class="admin-card-title">${data.title || 'Spark'}</span>
                <button onclick="deleteSpark('${docSnap.id}')" class="btn-icon-sm btn-delete-sm">🗑️</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.deleteSpark = async function(id) {
    if (confirm("¿Borrar este Spark?")) {
        await deleteDoc(doc(db, "sparks", id));
        renderSparkAdminList();
    }
};

async function loadSparkFeed() {
    const feed = document.getElementById('sparkFeed');
    if (!feed) return;
    feed.innerHTML = "<p style='text-align:center;'>Cargando Sparks...</p>";

    const snapshot = await getDocs(collection(db, "sparks"));
    let sparks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    sparks.sort((a, b) => (userLikes[b.category] || 0) - (userLikes[a.category] || 0));

    feed.innerHTML = "";
    sparks.forEach(spark => {
        const sparkCard = document.createElement('div');
        sparkCard.style.cssText = "position:relative; height:80vh; margin-bottom:20px; border-radius:20px; overflow:hidden; background:#000;";
        sparkCard.innerHTML = `
            <video src="${spark.urlWayback}" loop playsinline style="width:100%; height:100%; object-fit:cover;" onclick="this.paused ? this.play() : this.pause()"></video>
            <div style="position:absolute; bottom:20px; left:20px; right:20px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <h4 style="margin:0 0 6px 0;">${spark.title}</h4>
                    <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:10px;">${spark.category || 'General'}</span>
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
// 7. GALERÍA DE AVATARES Y PERFILES
// ==========================================

// Guardamos los perfiles creados por el usuario en memoria
let userProfiles = [
    { name: "Usuario 1", avatar: customAvatars[0] },
    { name: "Usuario 2", avatar: customAvatars[1] }
];

function renderProfiles() {
    const container = document.getElementById('profilesContainer');
    
    // Si la pantalla de perfiles aún no existe en el DOM, detenemos la ejecución sin fallar
    if (!container) return;

    container.innerHTML = "";

    // 1. Renderizar perfiles creados
    userProfiles.forEach((profile) => {
        const pCard = document.createElement('div');
        pCard.className = "profile-card-item";
        pCard.style.cssText = "text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;";
        pCard.innerHTML = `
            <div style="width: 90px; height: 90px; border-radius: 50%; background-image: url('${profile.avatar}'); background-size: cover; background-position: center; border: 2px solid var(--accent-color, #ffd700); box-shadow: 0 4px 10px rgba(0,0,0,0.5);"></div>
            <p style="margin-top: 8px; font-size: 0.9rem; font-weight: 600; color: #fff;">${profile.name}</p>
        `;
        pCard.onclick = () => {
            currentProfile = profile;
            switchPage('home');
        };
        container.appendChild(pCard);
    });

    // 2. Botón para añadir un nuevo perfil
    const addCard = document.createElement('div');
    addCard.style.cssText = "text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;";
    addCard.innerHTML = `
        <div style="width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.1); border: 2px dashed rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #fff;">+</div>
        <p style="margin-top: 8px; font-size: 0.9rem; color: #aaa;">Agregar</p>
    `;
    addCard.onclick = () => {
        const name = prompt("Nombre del nuevo perfil:");
        if (name) {
            // Asigna un avatar aleatorio de la lista disponible
            const randomAvatar = customAvatars[Math.floor(Math.random() * customAvatars.length)];
            userProfiles.push({ name, avatar: randomAvatar });
            renderProfiles();
        }
    };
    container.appendChild(addCard);
}

function renderAdminAvatarsView() {
    const grid = document.getElementById('avatarsAdminList');
    if (!grid) return;
    grid.innerHTML = "";

    customAvatars.forEach((url, idx) => {
        const item = document.createElement('div');
        item.style.cssText = "position: relative; width: 100%; aspect-ratio: 1;";
        item.innerHTML = `
            <img src="${url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1px solid var(--card-border);">
            <button onclick="deleteAvatar(${idx})" class="btn-icon-sm btn-delete-sm" style="position: absolute; top: 0; right: 0; border-radius: 50%;">✕</button>
        `;
        grid.appendChild(item);
    });
}

window.deleteAvatar = function(idx) {
    if (customAvatars.length <= 1) return alert("Debes mantener al menos un avatar.");
    customAvatars.splice(idx, 1);
    renderAdminAvatarsView();
    renderProfiles(); // Actualiza la vista pública de perfiles
};    

// ==========================================
// 8. REPRODUCTOR INTEGRADO
// ==========================================
function openPlayer(videoUrl) {
    if(!videoUrl) return alert("Este contenido no tiene un video disponible.");
    const player = document.getElementById('lumeraPlayer');
    const video = document.getElementById('mainVideo');
    if (player && video) {
        video.src = videoUrl;
        player.style.display = 'block';
        video.play();
    }
}

const closePlayerBtn = document.getElementById('btnClosePlayer');
if (closePlayerBtn) {
    closePlayerBtn.onclick = () => {
        const player = document.getElementById('lumeraPlayer');
        const video = document.getElementById('mainVideo');
        if (video) video.pause();
        if (player) player.style.display = 'none';
    };
}
