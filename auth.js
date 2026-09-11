// ============================================================================
// auth.js - Módulo Completo de Autenticación, Roles y Gestión de Perfiles
// ============================================================================

import { db } from './firebase.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseUserProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  arrayUnion,
  arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Instancia global de Auth
const auth = getAuth();

// Estados globales del módulo de autenticación
let currentUser = null;
let activeProfile = null;
let userRole = 'user';
let authListeners = [];

// Avatares por defecto en caso de que Firestore no devuelva ninguno aún
const DEFAULT_AVATARS = [
  'https://i.imgur.com/6VBx3io.png',
  'https://i.imgur.com/3G3f2xG.png',
  'https://i.imgur.com/N71Xf4G.png',
  'https://i.imgur.com/K1e4a1Y.png'
];

// ============================================================================
// 1. INICIALIZACIÓN Y SUSCRIPCIÓN AL ESTADO DE AUTENTICACIÓN
// ============================================================================

/**
 * Inicializa la escucha global de la sesión de Firebase Auth.
 * @param {Function} onUserChangedCallback - Callback ejecutado al cambiar la sesión.
 */
export function initAuth(onUserChangedCallback) {
  if (typeof onUserChangedCallback === 'function') {
    authListeners.push(onUserChangedCallback);
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          // Si el usuario es totalmente nuevo, creamos su registro base en Firestore
          const initialData = {
            uid: user.uid,
            email: user.email,
            role: 'user',
            createdAt: new Date().toISOString(),
            profiles: [
              {
                id: 'prof_' + Date.now(),
                name: 'Principal',
                avatar: DEFAULT_AVATARS[0],
                isKids: false
              }
            ]
          };
          await setDoc(userDocRef, initialData);
          userRole = 'user';
          activeProfile = initialData.profiles[0];
        } else {
          const userData = userSnap.data();
          userRole = userData.role || 'user';
          
          // Cargar perfil guardado en el almacenamiento local para este UID
          const savedProfileId = localStorage.getItem(`lumera_active_profile_${user.uid}`);
          const profilesList = userData.profiles || [];
          
          if (savedProfileId) {
            const found = profilesList.find(p => p.id === savedProfileId);
            activeProfile = found || profilesList[0] || null;
          } else {
            activeProfile = profilesList[0] || null;
          }
        }

        if (activeProfile) {
          localStorage.setItem(`lumera_active_profile_${user.uid}`, activeProfile.id);
        }

      } catch (err) {
        console.error("Error al sincronizar datos de usuario en Firestore:", err);
      }

    } else {
      currentUser = null;
      activeProfile = null;
      userRole = 'guest';
    }

    // Notificar a todos los escuchas registrados
    notifyAuthListeners();
  });
}

/**
 * Notifica los cambios a las vistas o componentes suscritos.
 */
function notifyAuthListeners() {
  authListeners.forEach(listener => {
    if (typeof listener === 'function') {
      listener(currentUser, activeProfile, userRole);
    }
  });
}

// ============================================================================
// 2. FUNCIONES GETTER DE ESTADO
// ============================================================================

export function getCurrentUser() {
  return currentUser;
}

export function getActiveProfile() {
  return activeProfile;
}

export function getUserRole() {
  return userRole;
}

export async function isUserAdmin() {
  if (!currentUser) return false;
  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (userSnap.exists()) {
      return userSnap.data().role === 'admin';
    }
    return false;
  } catch (error) {
    console.error("Error comprobando el rol de administrador:", error);
    return false;
  }
}

// ============================================================================
// 3. OPERACIONES DE AUTENTICACIÓN (LOGIN, REGISTRO, RECOVERY, LOGOUT)
// ============================================================================

export async function loginEmail(email, password) {
  try {
    if (!email || !password) {
      throw new Error("El correo y la contraseña son obligatorios.");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error en loginEmail:", error);
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function registerEmail(email, password) {
  try {
    if (!email || !password) {
      throw new Error("El correo y la contraseña son obligatorios.");
    }
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = userCredential.user;

    const initialProfile = {
      id: 'prof_' + Date.now(),
      name: 'Perfil 1',
      avatar: DEFAULT_AVATARS[0],
      isKids: false
    };

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'user',
      createdAt: new Date().toISOString(),
      profiles: [initialProfile]
    });

    activeProfile = initialProfile;
    localStorage.setItem(`lumera_active_profile_${user.uid}`, initialProfile.id);

    return { success: true, user: user };
  } catch (error) {
    console.error("Error en registerEmail:", error);
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function sendPasswordReset(email) {
  try {
    if (!email) {
      throw new Error("Debes proporcionar un correo electrónico.");
    }
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error) {
    console.error("Error enviando recuperación de contraseña:", error);
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function logoutUser() {
  try {
    if (currentUser) {
      localStorage.removeItem(`lumera_active_profile_${currentUser.uid}`);
    }
    await signOut(auth);
    currentUser = null;
    activeProfile = null;
    userRole = 'guest';
    notifyAuthListeners();
    return { success: true };
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// 4. GESTIÓN COMPLETA DE PERFILES DE USUARIO
// ============================================================================

export async function getUserProfiles() {
  if (!currentUser) return [];
  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (userSnap.exists()) {
      return userSnap.data().profiles || [];
    }
    return [];
  } catch (error) {
    console.error("Error al consultar perfiles:", error);
    return [];
  }
}

export function setActiveProfile(profile) {
  if (!profile) return;
  activeProfile = profile;
  if (currentUser) {
    localStorage.setItem(`lumera_active_profile_${currentUser.uid}`, profile.id);
  }
  notifyAuthListeners();
}

export async function createProfile(name, avatarUrl, isKids = false) {
  if (!currentUser) {
    throw new Error("No hay un usuario autenticado.");
  }

  const currentProfiles = await getUserProfiles();
  if (currentProfiles.length >= 5) {
    throw new Error("Has alcanzado el límite máximo de 5 perfiles.");
  }

  const newProfile = {
    id: 'prof_' + Date.now(),
    name: name.trim() || 'Nuevo Perfil',
    avatar: avatarUrl.trim() || DEFAULT_AVATARS[0],
    isKids: Boolean(isKids)
  };

  const userRef = doc(db, "users", currentUser.uid);
  await updateDoc(userRef, {
    profiles: arrayUnion(newProfile)
  });

  return newProfile;
}

export async function updateProfile(profileId, newName, newAvatarUrl, isKids) {
  if (!currentUser) {
    throw new Error("No hay un usuario autenticado.");
  }

  const userRef = doc(db, "users", currentUser.uid);
  const profiles = await getUserProfiles();

  const updatedProfiles = profiles.map(p => {
    if (p.id === profileId) {
      return {
        ...p,
        name: newName.trim() || p.name,
        avatar: newAvatarUrl.trim() || p.avatar,
        isKids: typeof isKids === 'boolean' ? isKids : p.isKids
      };
    }
    return p;
  });

  await updateDoc(userRef, { profiles: updatedProfiles });

  if (activeProfile && activeProfile.id === profileId) {
    activeProfile = updatedProfiles.find(p => p.id === profileId);
    notifyAuthListeners();
  }
}

export async function deleteProfile(profileId) {
  if (!currentUser) {
    throw new Error("No hay un usuario autenticado.");
  }

  const profiles = await getUserProfiles();
  if (profiles.length <= 1) {
    throw new Error("No puedes eliminar el único perfil registrado.");
  }

  const filteredProfiles = profiles.filter(p => p.id !== profileId);
  const userRef = doc(db, "users", currentUser.uid);

  await updateDoc(userRef, { profiles: filteredProfiles });

  if (activeProfile && activeProfile.id === profileId) {
    setActiveProfile(filteredProfiles[0]);
  }
}

// ============================================================================
// 5. INTERFAZ DE USUARIO: MODAL DE LOGIN / REGISTRO / RECUPERACIÓN
// ============================================================================

export function showAuthModal(onSuccessCallback) {
  const existingModal = document.getElementById('lumeraAuthModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'lumeraAuthModal';
  modal.className = 'glass-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  `;

  let currentView = 'login'; // 'login', 'register', 'recover'

  const renderModalContent = () => {
    let title = 'Iniciar Sesión';
    let submitText = 'Entrar';

    if (currentView === 'register') {
      title = 'Crear Cuenta Lumera';
      submitText = 'Registrarse';
    } else if (currentView === 'recover') {
      title = 'Recuperar Contraseña';
      submitText = 'Enviar Correo';
    }

    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid var(--gold-accent, #d4af37); border-radius: 12px; width: 100%; max-width: 420px; padding: 30px; color: white; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
        <button id="closeAuthModal" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
        <h2 style="margin-top: 0; color: var(--gold-accent, #d4af37); text-align: center; font-size: 24px;">${title}</h2>
        
        <form id="authForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
          <input type="email" id="authEmail" placeholder="Correo Electrónico" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; font-size: 14px;">
          
          ${currentView !== 'recover' ? `
            <input type="password" id="authPassword" placeholder="Contraseña" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; font-size: 14px;">
          ` : ''}

          <div id="authError" style="color: #ff4d4d; font-size: 13px; display: none; text-align: center; background: rgba(255,0,0,0.1); padding: 8px; border-radius: 4px;"></div>
          <div id="authSuccess" style="color: #4dfa7c; font-size: 13px; display: none; text-align: center; background: rgba(0,255,0,0.1); padding: 8px; border-radius: 4px;"></div>

          <button type="submit" style="padding: 12px; background: var(--gold-accent, #d4af37); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 15px; margin-top: 5px;">
            ${submitText}
          </button>
        </form>

        <div style="margin-top: 20px; text-align: center; font-size: 13px; color: #aaa; display: flex; flex-direction: column; gap: 8px;">
          ${currentView === 'login' ? `
            <div>¿No tienes cuenta? <span id="btnGoRegister" style="color: var(--gold-accent, #d4af37); cursor: pointer; text-decoration: underline;">Regístrate</span></div>
            <div><span id="btnGoRecover" style="color: #888; cursor: pointer; font-size: 12px;">¿Olvidaste tu contraseña?</span></div>
          ` : ''}

          ${currentView === 'register' ? `
            <div>¿Ya tienes cuenta? <span id="btnGoLogin" style="color: var(--gold-accent, #d4af37); cursor: pointer; text-decoration: underline;">Inicia Sesión</span></div>
          ` : ''}

          ${currentView === 'recover' ? `
            <div><span id="btnGoLogin" style="color: var(--gold-accent, #d4af37); cursor: pointer; text-decoration: underline;">Volver a Iniciar Sesión</span></div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('closeAuthModal').onclick = () => modal.remove();

    const btnGoRegister = document.getElementById('btnGoRegister');
    if (btnGoRegister) btnGoRegister.onclick = () => { currentView = 'register'; renderModalContent(); };

    const btnGoLogin = document.getElementById('btnGoLogin');
    if (btnGoLogin) btnGoLogin.onclick = () => { currentView = 'login'; renderModalContent(); };

    const btnGoRecover = document.getElementById('btnGoRecover');
    if (btnGoRecover) btnGoRecover.onclick = () => { currentView = 'recover'; renderModalContent(); };

    document.getElementById('authForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const passwordField = document.getElementById('authPassword');
      const password = passwordField ? passwordField.value : '';

      const errorDiv = document.getElementById('authError');
      const successDiv = document.getElementById('authSuccess');
      
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';

      if (currentView === 'login') {
        const res = await loginEmail(email, password);
        if (res.success) {
          modal.remove();
          if (typeof onSuccessCallback === 'function') onSuccessCallback(res.user);
        } else {
          errorDiv.textContent = res.error;
          errorDiv.style.display = 'block';
        }
      } else if (currentView === 'register') {
        const res = await registerEmail(email, password);
        if (res.success) {
          modal.remove();
          if (typeof onSuccessCallback === 'function') onSuccessCallback(res.user);
        } else {
          errorDiv.textContent = res.error;
          errorDiv.style.display = 'block';
        }
      } else if (currentView === 'recover') {
        const res = await sendPasswordReset(email);
        if (res.success) {
          successDiv.textContent = "Se ha enviado un correo para restablecer tu contraseña.";
          successDiv.style.display = 'block';
        } else {
          errorDiv.textContent = res.error;
          errorDiv.style.display = 'block';
        }
      }
    };
  };

  renderModalContent();
  document.body.appendChild(modal);
}

// ============================================================================
// 6. INTERFAZ DE USUARIO: SELECCIÓN Y EDICIÓN DE PERFILES
// ============================================================================

export async function showProfileSelectorModal(onProfileSelectedCallback) {
  const existingModal = document.getElementById('lumeraProfileModal');
  if (existingModal) existingModal.remove();

  const profiles = await getUserProfiles();

  // Cargar lista global de avatares creados desde la Pestaña 2 del Panel de Control admin.js
  let globalAvatars = [];
  try {
    const snap = await getDocs(collection(db, "avatars"));
    snap.forEach(d => globalAvatars.push(d.data().url));
  } catch (e) {
    console.warn("No se pudieron obtener avatares desde Firestore, utilizando valores por defecto.", e);
  }

  if (globalAvatars.length === 0) {
    globalAvatars = DEFAULT_AVATARS;
  }

  const modal = document.createElement('div');
  modal.id = 'lumeraProfileModal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(12px);
    display: flex; align-items: center; justify-content: center; padding: 20px; color: white;
  `;

  const renderProfilesView = () => {
    modal.innerHTML = `
      <div style="max-width: 800px; width: 100%; text-align: center;">
        <h2 style="font-size: 32px; margin-bottom: 30px; color: var(--gold-accent, #d4af37);">¿Quién está viendo?</h2>
        
        <div style="display: flex; gap: 25px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px;">
          ${profiles.map(p => `
            <div class="profile-card" data-id="${p.id}" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 120px;">
              <div style="position: relative; width: 100px; height: 100px;">
                <img src="${p.avatar || DEFAULT_AVATARS[0]}" style="width: 100%; height: 100%; border-radius: 12px; object-fit: cover; border: 2px solid transparent; transition: all 0.2s ease;">
                ${p.isKids ? `<span style="position: absolute; bottom: 4px; right: 4px; background: #00d2ff; color: black; font-weight: bold; font-size: 9px; padding: 2px 4px; border-radius: 4px;">KIDS</span>` : ''}
              </div>
              <span style="margin-top: 12px; font-size: 15px; color: #eee; font-weight: 500;">${p.name}</span>
              <button class="btn-edit-prof-item" data-id="${p.id}" style="margin-top: 6px; background: transparent; border: none; color: #888; font-size: 11px; cursor: pointer;">Editar</button>
            </div>
          `).join('')}

          ${profiles.length < 5 ? `
            <div id="btnAddProfile" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100px; height: 100px; border: 2px dashed #444; border-radius: 12px; background: rgba(255,255,255,0.02);">
              <span style="font-size: 32px; color: #888;">+</span>
              <span style="font-size: 12px; color: #888; margin-top: 4px;">Añadir</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    modal.querySelectorAll('.profile-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.classList.contains('btn-edit-prof-item')) return;
        const selected = profiles.find(p => p.id === card.getAttribute('data-id'));
        setActiveProfile(selected);
        modal.remove();
        if (typeof onProfileSelectedCallback === 'function') onProfileSelectedCallback(selected);
      };
    });

    modal.querySelectorAll('.btn-edit-prof-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-id');
        const targetProfile = profiles.find(p => p.id === pId);
        renderEditProfileForm(targetProfile);
      };
    });

    const btnAdd = document.getElementById('btnAddProfile');
    if (btnAdd) {
      btnAdd.onclick = () => renderCreateProfileForm();
    }
  };

  const renderCreateProfileForm = () => {
    let selectedAvatar = globalAvatars[0] || DEFAULT_AVATARS[0];

    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid var(--gold-accent, #d4af37); border-radius: 12px; max-width: 500px; width: 100%; padding: 30px;">
        <h3 style="margin-top: 0; color: var(--gold-accent, #d4af37); font-size: 22px;">Añadir Perfil</h3>
        <form id="createProfileForm" style="display: flex; flex-direction: column; gap: 18px; margin-top: 15px;">
          <input type="text" id="profName" placeholder="Nombre del Perfil" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; font-size: 14px;">
          
          <div>
            <label style="display: block; font-size: 13px; color: #aaa; margin-bottom: 10px;">Selecciona un Avatar:</label>
            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px;">
              ${globalAvatars.map((url, idx) => `
                <img src="${url}" class="avatar-opt" data-url="${url}" style="width: 65px; height: 65px; border-radius: 8px; cursor: pointer; object-fit: cover; border: ${idx === 0 ? '2px solid var(--gold-accent, #d4af37)' : '2px solid transparent'};">
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="profKids" style="width: 18px; height: 18px;">
            <label for="profKids" style="font-size: 14px;">Perfil para Niños (Infantil)</label>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btnCancelProf" style="padding: 10px 16px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
            <button type="submit" style="padding: 10px 16px; background: var(--gold-accent, #d4af37); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Guardar</button>
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
      showProfileSelectorModal(onProfileSelectedCallback);
    };
  };

  const renderEditProfileForm = (profileToEdit) => {
    let selectedAvatar = profileToEdit.avatar || globalAvatars[0];

    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid var(--gold-accent, #d4af37); border-radius: 12px; max-width: 500px; width: 100%; padding: 30px;">
        <h3 style="margin-top: 0; color: var(--gold-accent, #d4af37); font-size: 22px;">Editar Perfil</h3>
        <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 18px; margin-top: 15px;">
          <input type="text" id="profNameEdit" value="${profileToEdit.name}" placeholder="Nombre del Perfil" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px; font-size: 14px;">
          
          <div>
            <label style="display: block; font-size: 13px; color: #aaa; margin-bottom: 10px;">Selecciona un Avatar:</label>
            <div style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 10px;">
              ${globalAvatars.map(url => `
                <img src="${url}" class="avatar-opt" data-url="${url}" style="width: 65px; height: 65px; border-radius: 8px; cursor: pointer; object-fit: cover; border: ${url === selectedAvatar ? '2px solid var(--gold-accent, #d4af37)' : '2px solid transparent'};">
              `).join('')}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="profKidsEdit" ${profileToEdit.isKids ? 'checked' : ''} style="width: 18px; height: 18px;">
            <label for="profKidsEdit" style="font-size: 14px;">Perfil para Niños (Infantil)</label>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
            <button type="button" id="btnDelProf" style="padding: 10px 14px; background: #300; border: 1px solid #600; color: #ff8888; border-radius: 6px; cursor: pointer; font-size: 13px;">Eliminar Perfil</button>
            <div style="display: flex; gap: 10px;">
              <button type="button" id="btnCancelEditProf" style="padding: 10px 16px; background: transparent; border: 1px solid #555; color: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
              <button type="submit" style="padding: 10px 16px; background: var(--gold-accent, #d4af37); border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">Guardar</button>
            </div>
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

    document.getElementById('btnCancelEditProf').onclick = () => renderProfilesView();

    document.getElementById('btnDelProf').onclick = async () => {
      if (confirm(`¿Estás seguro de que deseas eliminar el perfil "${profileToEdit.name}"?`)) {
        try {
          await deleteProfile(profileToEdit.id);
          showProfileSelectorModal(onProfileSelectedCallback);
        } catch (err) {
          alert(err.message);
        }
      }
    };

    document.getElementById('editProfileForm').onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('profNameEdit').value;
      const isKids = document.getElementById('profKidsEdit').checked;

      await updateProfile(profileToEdit.id, name, selectedAvatar, isKids);
      showProfileSelectorModal(onProfileSelectedCallback);
    };
  };

  renderProfilesView();
  document.body.appendChild(modal);
}

// ============================================================================
// 7. HELPER INTERNO PARA TRADUCIR ERRORES DE FIREBASE
// ============================================================================

function parseFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada.';
    case 'auth/user-not-found':
      return 'No existe ninguna cuenta registrada con este correo.';
    case 'auth/wrong-password':
      return 'La contraseña ingresada es incorrecta.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya se encuentra registrado.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    case 'auth/invalid-credential':
      return 'Las credenciales proporcionadas son inválidas.';
    default:
      return null;
  }
}
