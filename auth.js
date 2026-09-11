// auth.js - Sistema de Autenticación y Gestión de Perfiles
import { db } from './firebase.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const auth = getAuth();
let currentUser = null;
let activeProfile = null;

// ----------------------------------------------------
// INICIALIZACIÓN Y OBSERVADOR DE ESTADO DE SESIÓN
// ----------------------------------------------------
export function initAuth(onUserChanged) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Crear documento base si no existe
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: 'user',
          profiles: [
            { id: 'default_1', name: 'Perfil 1', avatar: '', isKids: false }
          ]
        });
      }
      
      // Cargar perfil seleccionado guardado localmente o por defecto
      const savedProfileId = localStorage.getItem(`lumera_profile_${user.uid}`);
      const profiles = (await getDoc(doc(db, "users", user.uid))).data()?.profiles || [];
      activeProfile = profiles.find(p => p.id === savedProfileId) || profiles[0] || null;

    } else {
      currentUser = null;
      activeProfile = null;
    }

    if (typeof onUserChanged === 'function') {
      onUserChanged(currentUser, activeProfile);
    }
  });
}

// ----------------------------------------------------
// OBTENER ESTADOS ACTUALES
// ----------------------------------------------------
export function getCurrentUser() {
  return currentUser;
}

export function getActiveProfile() {
  return activeProfile;
}

export async function isUserAdmin() {
  if (!currentUser) return false;
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  return userDoc.exists() && userDoc.data().role === 'admin';
}

// ----------------------------------------------------
// LOGIN, REGISTRO Y CERRAR SESIÓN
// ----------------------------------------------------
export async function loginEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function registerEmail(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      email: cred.user.email,
      role: 'user',
      profiles: [
        { id: 'profile_' + Date.now(), name: 'Principal', avatar: '', isKids: false }
      ]
    });
    return { success: true, user: cred.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem(`lumera_profile_${currentUser?.uid}`);
    currentUser = null;
    activeProfile = null;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// GESTIÓN DE PERFILES DE USUARIO
// ----------------------------------------------------
export async function getUserProfiles() {
  if (!currentUser) return [];
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  return userDoc.exists() ? (userDoc.data().profiles || []) : [];
}

export function setActiveProfile(profile) {
  activeProfile = profile;
  if (currentUser) {
    localStorage.setItem(`lumera_profile_${currentUser.uid}`, profile.id);
  }
}

export async function createProfile(name, avatarUrl, isKids = false) {
  if (!currentUser) return null;
  const userRef = doc(db, "users", currentUser.uid);
  const profiles = await getUserProfiles();

  if (profiles.length >= 5) {
    throw new Error("Límite de 5 perfiles alcanzado.");
  }

  const newProfile = {
    id: 'profile_' + Date.now(),
    name: name.trim(),
    avatar: avatarUrl.trim(),
    isKids: !!isKids
  };

  profiles.push(newProfile);
  await updateDoc(userRef, { profiles });
  return newProfile;
}

export async function updateProfile(profileId, newName, newAvatarUrl, isKids) {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  let profiles = await getUserProfiles();

  profiles = profiles.map(p => {
    if (p.id === profileId) {
      return {
        ...p,
        name: newName.trim(),
        avatar: newAvatarUrl.trim(),
        isKids: !!isKids
      };
    }
    return p;
  });

  await updateDoc(userRef, { profiles });
  
  if (activeProfile && activeProfile.id === profileId) {
    activeProfile = profiles.find(p => p.id === profileId);
  }
}

export async function deleteProfile(profileId) {
  if (!currentUser) return;
  const userRef = doc(db, "users", currentUser.uid);
  let profiles = await getUserProfiles();

  if (profiles.length <= 1) {
    throw new Error("Debes mantener al menos un perfil.");
  }

  profiles = profiles.filter(p => p.id !== profileId);
  await updateDoc(userRef, { profiles });

  if (activeProfile && activeProfile.id === profileId) {
    setActiveProfile(profiles[0]);
  }
}

// ----------------------------------------------------
// INTERFAZ DE USUARIO: MODAL DE INICIO DE SESIÓN
// ----------------------------------------------------
export function showAuthModal(onSuccess) {
  const existingModal = document.getElementById('lumeraAuthModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'lumeraAuthModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;

  let isRegisterView = false;

  const renderModalContent = () => {
    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid var(--gold-accent, #d4af37); border-radius: 12px; width: 100%; max-width: 400px; padding: 30px; color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <h2 style="margin-top: 0; color: var(--gold-accent, #d4af37); text-align: center;">${isRegisterView ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <form id="authForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
          <input type="email" id="authEmail" placeholder="Correo Electrónico" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
          <input type="password" id="authPassword" placeholder="Contraseña" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
          <div id="authError" style="color: #ff4d4d; font-size: 13px; display: none; text-align: center;"></div>
          <button type="submit" style="padding: 12px; background: var(--gold-accent, #d4af37); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">
            ${isRegisterView ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        <div style="margin-top: 20px; text-align: center; font-size: 13px; color: #aaa;">
          ${isRegisterView ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <span id="toggleAuthMode" style="color: var(--gold-accent, #d4af37); cursor: pointer; text-decoration: underline; margin-left: 5px;">
            ${isRegisterView ? 'Inicia Sesión' : 'Regístrate'}
          </span>
        </div>
        <button id="closeAuthModal" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: white; font-size: 18px; cursor: pointer;">✕</button>
      </div>
    `;

    document.getElementById('closeAuthModal').onclick = () => modal.remove();
    document.getElementById('toggleAuthMode').onclick = () => {
      isRegisterView = !isRegisterView;
      renderModalContent();
    };

    document.getElementById('authForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;
      const errorDiv = document.getElementById('authError');

      errorDiv.style.display = 'none';
      let res = isRegisterView ? await registerEmail(email, password) : await loginEmail(email, password);

      if (res.success) {
        modal.remove();
        if (typeof onSuccess === 'function') onSuccess(res.user);
      } else {
        errorDiv.textContent = res.error;
        errorDiv.style.display = 'block';
      }
    };
  };

  renderModalContent();
  document.body.appendChild(modal);
}

// ----------------------------------------------------
// INTERFAZ DE USUARIO: SELECTOR Y GESTOR DE PERFILES
// ----------------------------------------------------
export async function showProfileSelectorModal(onProfileSelected) {
  const existingModal = document.getElementById('lumeraProfileModal');
  if (existingModal) existingModal.remove();

  const profiles = await getUserProfiles();
  
  // Cargar avatares globales desde Firestore (guardados vía admin.js)
  const avatarsSnap = await getDocs(collection(db, "avatars"));
  const globalAvatars = [];
  avatarsSnap.forEach(doc => globalAvatars.push(doc.data().url));

  const modal = document.createElement('div');
  modal.id = 'lumeraProfileModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; padding: 20px; color: white;
  `;

  const renderProfilesView = () => {
    modal.innerHTML = `
      <div style="max-width: 700px; width: 100%; text-align: center;">
        <h2 style="font-size: 28px; margin-bottom: 30px; color: var(--gold-accent, #d4af37);">¿Quién está viendo?</h2>
        <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
          ${profiles.map(p => `
            <div class="profile-card" data-id="${p.id}" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 110px;">
              <img src="${p.avatar || 'https://i.imgur.com/6VBx3io.png'}" style="width: 100px; height: 100px; border-radius: 8px; object-fit: cover; border: 2px solid transparent; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <span style="margin-top: 10px; font-size: 14px; color: #ccc;">${p.name}</span>
            </div>
          `).join('')}
          ${profiles.length < 5 ? `
            <div id="btnAddProfile" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100px; height: 100px; border: 2px dashed #555; border-radius: 8px;">
              <span style="font-size: 30px; color: #888;">+</span>
              <span style="font-size: 11px; color: #888;">Añadir</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    modal.querySelectorAll('.profile-card').forEach(card => {
      card.onclick = () => {
        const selected = profiles.find(p => p.id === card.getAttribute('data-id'));
        setActiveProfile(selected);
        modal.remove();
        if (typeof onProfileSelected === 'function') onProfileSelected(selected);
      };
    });

    const btnAdd = document.getElementById('btnAddProfile');
    if (btnAdd) {
      btnAdd.onclick = () => renderCreateProfileForm();
    }
  };

  const renderCreateProfileForm = () => {
    let selectedAvatar = globalAvatars[0] || '';

    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid var(--gold-accent, #d4af37); border-radius: 12px; max-width: 500px; width: 100%; padding: 25px;">
        <h3 style="margin-top: 0; color: var(--gold-accent, #d4af37);">Añadir Perfil</h3>
        <form id="createProfileForm" style="display: flex; flex-direction: column; gap: 15px;">
          <input type="text" id="profName" placeholder="Nombre del Perfil" required style="padding: 10px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
          
          <div>
            <label style="display: block; font-size: 12px; color: #aaa; margin-bottom: 8px;">Selecciona un Avatar:</label>
            <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
              ${globalAvatars.map((url, idx) => `
                <img src="${url}" class="avatar-opt" data-url="${url}" style="width: 60px; height: 60px; border-radius: 6px; cursor: pointer; object-fit: cover; border: ${idx === 0 ? '2px solid var(--gold-accent, #d4af37)' : '2px solid transparent'};">
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="profKids">
            <label for="profKids" style="font-size: 14px;">Perfil Infantil</label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnCancelProf" style="padding: 8px 14px; background: transparent; border: 1px solid #555; color: white; border-radius: 4px;">Cancelar</button>
            <button type="submit" style="padding: 8px 14px; background: var(--gold-accent, #d4af37); border: none; color: black; font-weight: bold; border-radius: 4px;">Guardar</button>
          </div>
        </form>
      </div>
    `;

    modal.querySelectorAll('.avatar-opt').forEach(img => {
      img.onclick = () => {
        modal.querySelectorAll('.avatar-opt').forEach(i => i.style.borderColor = 'transparent');
        img.style.borderColor = 'var(--gold-accent, #d4af37)';
        selectedAvatar = img.getAttribute('data-url');
      };
    });

    document.getElementById('btnCancelProf').onclick = () => renderProfilesView();

    document.getElementById('createProfileForm').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('profName').value;
      const isKids = document.getElementById('profKids').checked;

      await createProfile(name, selectedAvatar, isKids);
      showProfileSelectorModal(onProfileSelected);
    };
  };

  renderProfilesView();
  document.body.appendChild(modal);
}
