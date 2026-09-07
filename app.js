// ==========================================
// 1. IMPORTACIONES FIREBASE V12 MODULAR
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
    addDoc, 
    onSnapshot, 
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

// CORREO MAESTRO DEL ADMINISTRADOR
const MASTER_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

// ESTADOS GENERALES
let currentEditProfileIndex = null;
let selectedAvatarTemp = "";
let customAvatars = [
    "https://i.imgur.com/tqYZ1f3.png", "https://i.imgur.com/0g0UIuy.png",
    "https://i.imgur.com/6utiIjR.png", "https://i.imgur.com/W74FXcH.png",
    "https://i.imgur.com/cDRVrmd.png", "https://i.imgur.com/4Y7C6I8.png",
    "https://i.imgur.com/Dg0pNPU.png", "https://i.imgur.com/6hMJyYR.png"
];

// ==========================================
// 2. CONTROL DE AUTENTICACIÓN
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';

        // Habilitar Lápiz Maestro solo para tu correo
        if (user.email === MASTER_EMAIL) {
            document.getElementById('btnMasterAdmin').style.display = 'flex';
        } else {
            document.getElementById('btnMasterAdmin').style.display = 'none';
        }

        initApp();
    } else {
        document.getElementById('authScreen').style.display = 'flex';
        document.getElementById('appScreen').style.display = 'none';
    }
});

document.getElementById('btnLogin').onclick = () => {
    const e = document.getElementById('authEmail').value.trim();
    const p = document.getElementById('authPass').value.trim();
    if(!e || !p) return alert("Ingresa tu correo y contraseña");
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
};

document.getElementById('btnRegister').onclick = () => {
    const e = document.getElementById('authEmail').value.trim();
    const p = document.getElementById('authPass').value.trim();
    if(!e || !p) return alert("Ingresa un correo y contraseña para registrarte");
    createUserWithEmailAndPassword(auth, e, p).catch(err => alert("Error: " + err.message));
};

document.getElementById('btnLogout').onclick = () => signOut(auth);

// ==========================================
// 3. INICIALIZACIÓN Y EVENTOS
// ==========================================
function initApp() {
    setupDrawer();
    renderProfiles();
    
    // Abrir Modales
    document.getElementById('btnOpenSettings').onclick = () => document.getElementById('settingsModal').classList.add('active');
    document.getElementById('btnCloseSettingsModal').onclick = () => document.getElementById('settingsModal').classList.remove('active');
    
    document.getElementById('btnMasterAdmin').onclick = () => {
        document.getElementById('adminMasterModal').classList.add('active');
        renderAdminTab('content');
    };
    document.getElementById('btnCloseAdminModal').onclick = () => document.getElementById('adminMasterModal').classList.remove('active');
    
    // Pestañas del Admin Maestro
    document.querySelectorAll('.btn-tab').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.btn-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAdminTab(btn.dataset.tab);
        };
    });
}

// NAVEGACIÓN Y DRAWER
function setupDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    
    const toggle = () => {
        drawer.classList.toggle('active');
        backdrop.classList.toggle('active');
    };

    document.getElementById('btnMenuToggle').onclick = toggle;
    document.getElementById('btnCloseDrawer').onclick = toggle;
    backdrop.onclick = toggle;

    document.querySelectorAll('.drawer-btn').forEach(btn => {
        btn.onclick = () => {
            const target = btn.dataset.target;
            document.querySelectorAll('.spa-view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.drawer-btn').forEach(b => b.classList.remove('active'));
            
            document.getElementById(`view-${target}`).classList.add('active');
            btn.classList.add('active');
            toggle();
        };
    });
}

// ==========================================
// 4. GESTOR COMPLETO DE PERFILES
// ==========================================
function getProfiles() {
    return JSON.parse(localStorage.getItem('lumera_profiles_db')) || [
        { name: "Principal", avatar: customAvatars[0] }
    ];
}

function saveProfiles(profiles) {
    localStorage.setItem('lumera_profiles_db', JSON.stringify(profiles));
    renderProfiles();
}

function renderProfiles() {
    const grid = document.getElementById('profilesGrid');
    if (!grid) return;
    grid.innerHTML = "";

    const profiles = getProfiles();

    profiles.forEach((p, idx) => {
        const item = document.createElement('div');
        item.className = 'profile-card-item';
        item.innerHTML = `
            <div class="avatar-wrapper">
                <img src="${p.avatar}" class="profile-img-avatar">
                <button class="profile-btn-pencil" onclick="event.stopPropagation(); openEditProfileModal(${idx})">✏️</button>
            </div>
            <span class="profile-label">${p.name}</span>
        `;
        item.onclick = () => {
            document.querySelectorAll('.spa-view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-home').classList.add('active');
        };
        grid.appendChild(item);
    });

    // Botón "+" para añadir perfil
    const addBtn = document.createElement('div');
    addBtn.className = 'profile-card-item';
    addBtn.innerHTML = `
        <div class="profile-add-btn">+</div>
        <span class="profile-label">Añadir</span>
    `;
    addBtn.onclick = () => openEditProfileModal(null);
    grid.appendChild(addBtn);
}

window.openEditProfileModal = function(index) {
    currentEditProfileIndex = index;
    const modal = document.getElementById('profileEditModal');
    const nameInput = document.getElementById('profileInputName');
    const title = document.getElementById('modalProfileTitle');
    const btnDelete = document.getElementById('btnDeleteProfile');
    const grid = document.getElementById('avatarPickerGrid');

    const profiles = getProfiles();
    grid.innerHTML = "";

    if (index !== null) {
        title.innerText = "Editar Perfil";
        nameInput.value = profiles[index].name;
        selectedAvatarTemp = profiles[index].avatar;
        btnDelete.style.display = "inline-block";
    } else {
        title.innerText = "Nuevo Perfil";
        nameInput.value = "";
        selectedAvatarTemp = customAvatars[0];
        btnDelete.style.display = "none";
    }

    // Renderizar Selector de Avatares
    customAvatars.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'avatar-pick-item' + (url === selectedAvatarTemp ? ' selected' : '');
        img.onclick = () => {
            grid.querySelectorAll('.avatar-pick-item').forEach(i => i.classList.remove('selected'));
            img.classList.add('selected');
            selectedAvatarTemp = url;
        };
        grid.appendChild(img);
    });

    modal.classList.add('active');
};

document.getElementById('btnCloseProfileModal').onclick = () => {
    document.getElementById('profileEditModal').classList.remove('active');
};

document.getElementById('btnSaveProfile').onclick = () => {
    const name = document.getElementById('profileInputName').value.trim();
    if (!name) return alert("Ingresa un nombre para el perfil");

    const profiles = getProfiles();
    if (currentEditProfileIndex !== null) {
        profiles[currentEditProfileIndex] = { name, avatar: selectedAvatarTemp };
    } else {
        profiles.push({ name, avatar: selectedAvatarTemp });
    }

    saveProfiles(profiles);
    document.getElementById('profileEditModal').classList.remove('active');
};

document.getElementById('btnDeleteProfile').onclick = () => {
    if (currentEditProfileIndex === null) return;
    let profiles = getProfiles();
    if (profiles.length <= 1) return alert("Debes conservar al menos un perfil.");
    
    profiles.splice(currentEditProfileIndex, 1);
    saveProfiles(profiles);
    document.getElementById('profileEditModal').classList.remove('active');
};

// ==========================================
// 5. SECCIÓN ADMINISTRADOR MAESTRO
// ==========================================
function renderAdminTab(tab) {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = "";

    if (tab === 'content') {
        container.innerHTML = `
            <input id="admTitle" placeholder="Título de la película/serie" style="margin-top:15px;">
            <input id="admImg" placeholder="Link de Portada (Imgur)" style="margin-top:10px;">
            <input id="admUrl" placeholder="Link Video MP4 (Archive.org)" style="margin-top:10px;">
            <button id="btnAdminSaveContent" class="btn-round btn-gold" style="margin-top:15px;">Guardar Película</button>
        `;
    } 
    else if (tab === 'avatars') {
        container.innerHTML = `
            <p style="font-size:0.85rem; color:#aaa; margin-top:10px;">Añade nuevos avatares para los perfiles agregando el enlace directo de Imgur:</p>
            <input id="admAvatarUrl" placeholder="URL de la Imagen (Imgur)">
            <button id="btnAdminSaveAvatar" class="btn-round btn-gold" style="margin-top:15px;">Añadir Avatar</button>
        `;

        document.getElementById('btnAdminSaveAvatar').onclick = () => {
            const url = document.getElementById('admAvatarUrl').value.trim();
            if (!url) return alert("Pega una URL válida de imagen");
            customAvatars.push(url);
            alert("¡Avatar añadido a la galería!");
            document.getElementById('admAvatarUrl').value = "";
        };
    }
}
