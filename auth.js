// auth.js - Autenticación Firebase, Roles y Perfiles
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const auth = window.auth;
const db = window.db;

let currentUser = null;
let activeProfile = null;
let userRole = 'user';
let authListeners = [];

const DEFAULT_AVATARS = [
  'https://i.imgur.com/6VBx3io.png',
  'https://i.imgur.com/3G3f2xG.png',
  'https://i.imgur.com/N71Xf4G.png',
  'https://i.imgur.com/K1e4a1Y.png'
];

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
        console.error("Error al sincronizar usuario en Firestore:", err);
      }
    } else {
      currentUser = null;
      activeProfile = null;
      userRole = 'guest';
    }

    notifyAuthListeners();
  });
}

function notifyAuthListeners() {
  authListeners.forEach(listener => {
    if (typeof listener === 'function') {
      listener(currentUser, activeProfile, userRole);
    }
  });
}

export function getCurrentUser() { return currentUser; }
export function getActiveProfile() { return activeProfile; }
export function getUserRole() { return userRole; }

export async function loginEmail(email, password) {
  try {
    const res = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: res.user };
  } catch (error) {
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function registerEmail(email, password) {
  try {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = res.user;
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
    return { success: true, user };
  } catch (error) {
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error) {
    return { success: false, error: parseFirebaseError(error.code) || error.message };
  }
}

export async function logoutUser() {
  try {
    if (currentUser) localStorage.removeItem(`lumera_active_profile_${currentUser.uid}`);
    await signOut(auth);
    currentUser = null;
    activeProfile = null;
    userRole = 'guest';
    notifyAuthListeners();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserProfiles() {
  if (!currentUser) return [];
  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    return userSnap.exists() ? (userSnap.data().profiles || []) : [];
  } catch (error) {
    return [];
  }
}

export function setActiveProfile(profile) {
  if (!profile) return;
  activeProfile = profile;
  if (currentUser) localStorage.setItem(`lumera_active_profile_${currentUser.uid}`, profile.id);
  notifyAuthListeners();
}

export async function createProfile(name, avatarUrl, isKids = false) {
  if (!currentUser) return;
  const currentProfiles = await getUserProfiles();
  if (currentProfiles.length >= 5) throw new Error("Máximo 5 perfiles permitidos.");

  const newProfile = {
    id: 'prof_' + Date.now(),
    name: name.trim() || 'Nuevo Perfil',
    avatar: avatarUrl.trim() || DEFAULT_AVATARS[0],
    isKids: Boolean(isKids)
  };

  await updateDoc(doc(db, "users", currentUser.uid), { profiles: arrayUnion(newProfile) });
  return newProfile;
}

export function showAuthModal(onSuccessCallback) {
  const existingModal = document.getElementById('lumeraAuthModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'lumeraAuthModal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 10000; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px;`;

  let currentView = 'login';

  const renderModalContent = () => {
    let title = currentView === 'register' ? 'Crear Cuenta' : (currentView === 'recover' ? 'Recuperar Contraseña' : 'Iniciar Sesión');
    let submitText = currentView === 'register' ? 'Registrarse' : (currentView === 'recover' ? 'Enviar Correo' : 'Entrar');

    modal.innerHTML = `
      <div style="background: #141414; border: 1px solid #333; border-radius: 12px; width: 100%; max-width: 400px; padding: 30px; color: white; position: relative;">
        <button id="closeAuthModal" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
        <h2 style="margin-top: 0; color: white; text-align: center;">${title}</h2>
        <form id="authForm" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
          <input type="email" id="authEmail" placeholder="Correo Electrónico" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">
          ${currentView !== 'recover' ? `<input type="password" id="authPassword" placeholder="Contraseña" required style="padding: 12px; background: #222; border: 1px solid #444; color: white; border-radius: 6px;">` : ''}
          <div id="authError" style="color: #ff4d4d; font-size: 13px; display: none; text-align: center;"></div>
          <button type="submit" style="padding: 12px; background: white; border: none; color: black; font-weight: bold; border-radius: 6px; cursor: pointer;">${submitText}</button>
        </form>
        <div style="margin-top: 20px; text-align: center; font-size: 13px; color: #aaa;">
          ${currentView === 'login' ? `<div>¿No tienes cuenta? <span id="btnGoRegister" style="color: white; text-decoration: underline; cursor: pointer;">Regístrate</span></div>` : ''}
          ${currentView === 'register' ? `<div>¿Ya tienes cuenta? <span id="btnGoLogin" style="color: white; text-decoration: underline; cursor: pointer;">Inicia Sesión</span></div>` : ''}
        </div>
      </div>
    `;

    document.getElementById('closeAuthModal').onclick = () => modal.remove();
    document.getElementById('btnGoRegister')?.addEventListener('click', () => { currentView = 'register'; renderModalContent(); });
    document.getElementById('btnGoLogin')?.addEventListener('click', () => { currentView = 'login'; renderModalContent(); });

    document.getElementById('authForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPassword')?.value;
      const errorDiv = document.getElementById('authError');

      let res = currentView === 'login' ? await loginEmail(email, pass) : await registerEmail(email, pass);
      if (res.success) {
        modal.remove();
        if (typeof onSuccessCallback === 'function') onSuccessCallback(res.user);
      } else {
        errorDiv.textContent = res.error;
        errorDiv.style.display = 'block';
      }
    };
  };

  renderModalContent();
  document.body.appendChild(modal);
}

export async function showProfileSelectorModal(onProfileSelectedCallback) {
  const existingModal = document.getElementById('lumeraProfileModal');
  if (existingModal) existingModal.remove();

  const profiles = await getUserProfiles();
  const modal = document.createElement('div');
  modal.id = 'lumeraProfileModal';
  modal.style.cssText = `position: fixed; inset: 0; z-index: 10000; background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; color: white;`;

  modal.innerHTML = `
    <div style="max-width: 800px; width: 100%; text-align: center;">
      <h2 style="font-size: 28px; margin-bottom: 30px;">¿Quién está viendo?</h2>
      <div style="display: flex; gap: 25px; justify-content: center; flex-wrap: wrap;">
        ${profiles.map(p => `
          <div class="profile-card" data-id="${p.id}" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 110px;">
            <img src="${p.avatar || DEFAULT_AVATARS[0]}" style="width: 90px; height: 90px; border-radius: 12px; object-fit: cover; border: 2px solid transparent; transition: border 0.2s;">
            <span style="margin-top: 10px; font-size: 14px; color: #ccc;">${p.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.querySelectorAll('.profile-card').forEach(card => {
    card.onclick = () => {
      const selected = profiles.find(p => p.id === card.getAttribute('data-id'));
      setActiveProfile(selected);
      modal.remove();
      if (typeof onProfileSelectedCallback === 'function') onProfileSelectedCallback(selected);
    };
  });

  document.body.appendChild(modal);
}

function parseFirebaseError(code) {
  switch (code) {
    case 'auth/invalid-email': return 'El correo no es válido.';
    case 'auth/user-not-found': return 'No existe esta cuenta.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/email-already-in-use': return 'Este correo ya está registrado.';
    default: return 'Error de autenticación.';
  }
}
