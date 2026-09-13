import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let currentUser = null;
let activeProfile = null;
let userRole = 'guest';

export function initAuthObserver(onStateChange) {
  onAuthStateChanged(window.auth, async (user) => {
    if (user) {
      currentUser = user;
      try {
        const userDoc = await getDoc(doc(window.db, "users", user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role || 'user';
        } else {
          userRole = (user.email === "jgonzalezgutierrez1@bcedu.mx") ? 'admin' : 'user';
          await setDoc(doc(window.db, "users", user.uid), {
            email: user.email,
            role: userRole,
            profiles: [{ id: 'default', name: user.email.split('@')[0], isKids: false }]
          });
        }
      } catch (e) {
        userRole = 'user';
      }
    } else {
      currentUser = null;
      activeProfile = null;
      userRole = 'guest';
    }
    if (onStateChange) onStateChange(currentUser, activeProfile, userRole);
  });
}

export function getCurrentUser() { return currentUser; }
export function getActiveProfile() { return activeProfile; }
export function getUserRole() { return userRole; }
export function setActiveProfile(profile) { activeProfile = profile; }

export async function loginUser(email, pass) {
  return await signInWithEmailAndPassword(window.auth, email.trim(), pass);
}

export async function registerUser(email, pass) {
  const res = await createUserWithEmailAndPassword(window.auth, email.trim(), pass);
  const role = (email.trim() === "jgonzalezgutierrez1@bcedu.mx") ? 'admin' : 'user';
  await setDoc(doc(window.db, "users", res.user.uid), {
    email: email.trim(),
    role: role,
    profiles: [{ id: 'p_' + Date.now(), name: 'Perfil 1', isKids: false }]
  });
  return res;
}

export async function logout() {
  await signOut(window.auth);
}

export function renderProfileSelector(container, onSelect) {
  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <h2>¿Quién está viendo?</h2>
      <div id="profilesList" style="display: flex; gap: 20px; justify-content: center; margin: 30px 0; flex-wrap: wrap;"></div>
      <button id="btnAddProfile" class="btn-secondary">+ Crear Perfil</button>
    </div>
  `;
  loadProfilesUI(onSelect);
}

async function loadProfilesUI(onSelect) {
  if (!currentUser) return;
  const userDoc = await getDoc(doc(window.db, "users", currentUser.uid));
  const profiles = userDoc.exists() ? (userDoc.data().profiles || []) : [];
  const list = document.getElementById('profilesList');
  if (!list) return;

  list.innerHTML = profiles.map(p => `
    <div class="profile-card ${p.isKids ? 'rainbow-avatar' : ''}" data-id="${p.id}" style="cursor: pointer; text-align: center;">
      <div class="mini-avatar" style="width: 80px; height: 80px; font-size: 28px; margin: 0 auto;">${p.name.charAt(0).toUpperCase()}</div>
      <p style="margin-top: 10px;">${p.name}</p>
    </div>
  `).join('');

  list.querySelectorAll('.profile-card').forEach(card => {
    card.onclick = () => {
      const selected = profiles.find(p => p.id === card.dataset.id);
      setActiveProfile(selected);
      if (onSelect) onSelect(selected);
    };
  });
}
