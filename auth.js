// auth.js - Autenticación Firebase y Gestión Completa de Perfiles
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } 
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } 
  from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

export function initAuthObserver(onAuthChange) {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const role = user.email === ADMIN_EMAIL ? 'admin' : 'user';
      localStorage.setItem('lumera_user', JSON.stringify({ uid: user.uid, email: user.email, role }));
      
      const activeProfile = getActiveProfile();
      if (!activeProfile) {
        renderProfilesScreen(document.getElementById('appContainer'), onAuthChange);
      } else {
        if (onAuthChange) onAuthChange(user, activeProfile, role);
      }
    } else {
      localStorage.removeItem('lumera_user');
      localStorage.removeItem('lumera_active_profile');
      renderAuthForm(document.getElementById('appContainer'), onAuthChange);
    }
  });
}

// 1. PANTALLA DE LOGIN / REGISTRO
export function renderAuthForm(container, onAuthChange) {
  container.innerHTML = `
    <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="glass-panel" style="width: 100%; max-width: 400px; padding: 30px; border-radius: 12px; background: rgba(15, 17, 26, 0.85);">
        <h2 style="text-align: center; margin-bottom: 25px;">Iniciar Sesión en Lumera</h2>
        
        <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
          <div>
            <label style="font-size: 12px; color: var(--text-muted);">Correo Electrónico</label>
            <input type="email" id="authEmail" required style="width: 100%; padding: 12px; margin-top: 5px; background: #1a1c23; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff;">
          </div>
          <div>
            <label style="font-size: 12px; color: var(--text-muted);">Contraseña</label>
            <input type="password" id="authPassword" required style="width: 100%; padding: 12px; margin-top: 5px; background: #1a1c23; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff;">
          </div>

          <button type="submit" id="btnLogin" style="padding: 12px; background: var(--accent-color); border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px;">Entrar</button>
          <button type="button" id="btnRegister" style="padding: 12px; background: transparent; border: 1px solid var(--glass-border); border-radius: 6px; color: #fff; cursor: pointer;">Crear Cuenta</button>
        </form>
      </div>
    </div>
  `;

  const auth = getAuth();
  const form = document.getElementById('authForm');
  const emailInput = document.getElementById('authEmail');
  const passInput = document.getElementById('authPassword');

  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
    } catch (err) {
      alert("Error al iniciar sesión: " + err.message);
    }
  };

  document.getElementById('btnRegister').onclick = async () => {
    if (!emailInput.value || !passInput.value) {
      alert("Escribe correo y contraseña para registrarte.");
      return;
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
      const role = res.user.email === ADMIN_EMAIL ? 'admin' : 'user';
      const db = getFirestore();
      await setDoc(doc(db, "users", res.user.uid), { email: res.user.email, role });
    } catch (err) {
      alert("Error al registrarse: " + err.message);
    }
  };
}

// 2. PANTALLA "¿QUIÉN ESTÁ VIENDO?" Y PERFILES
export function renderProfilesScreen(container, onAuthChange) {
  const user = JSON.parse(localStorage.getItem('lumera_user') || '{}');
  const isAdmin = user.email === ADMIN_EMAIL;
  let profiles = JSON.parse(localStorage.getItem(`lumera_profiles_${user.uid}`) || '[]');
  let isEditingMode = false;

  const render = () => {
    container.innerHTML = `
      <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <h1 style="font-size: 2rem; margin-bottom: 30px;">¿Quién está viendo?</h1>

        <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; margin-bottom: 40px;">
          ${profiles.map((p, idx) => `
            <div class="profile-card" data-idx="${idx}" style="display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative;">
              <!-- Borde arcoíris si es Kids -->
              <div class="avatar-box ${p.isKids ? 'rainbow-avatar' : ''}" style="width: 110px; height: 110px; border-radius: 12px; background: #2a2d3d; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: bold; overflow: hidden; position: relative; border: 2px solid transparent;">
                ${p.avatar ? `<img src="${p.avatar}" style="width: 100%; height: 100%; object-fit: cover;">` : p.name.charAt(0).toUpperCase()}
                ${isEditingMode ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 20px;">✏️</div>` : ''}
              </div>
              <span style="margin-top: 10px; font-weight: 500;">${p.name}</span>
            </div>
          `).join('')}

          <!-- Botón Agregar Perfil -->
          <div id="btnAddProfile" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="width: 110px; height: 110px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 2px dashed var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 2.5rem;">+</div>
            <span style="margin-top: 10px; color: var(--text-muted);">Añadir</span>
          </div>
        </div>

        <div style="display: flex; gap: 15px;">
          ${isAdmin ? `<button id="btnEditProfiles" style="padding: 10px 20px; background: rgba(255,255,255,0.1); border: 1px solid var(--glass-border); border-radius: 6px; cursor: pointer; color: #fff;">✏️ Administrar Perfiles</button>` : ''}
          <button id="btnLogout" style="padding: 10px 20px; background: rgba(229, 9, 20, 0.2); border: 1px solid var(--accent-color); border-radius: 6px; cursor: pointer; color: #fff;">Cerrar Sesión</button>
        </div>
      </div>
    `;

    // Eventos Perfiles
    container.querySelectorAll('.profile-card').forEach(card => {
      card.onclick = () => {
        const idx = card.dataset.idx;
        const selected = profiles[idx];
        
        if (isEditingMode) {
          const newName = prompt("Nuevo nombre del perfil:", selected.name);
          if (newName) {
            profiles[idx].name = newName;
            localStorage.setItem(`lumera_profiles_${user.uid}`, JSON.stringify(profiles));
            render();
          }
        } else {
          localStorage.setItem('lumera_active_profile', JSON.stringify(selected));
          if (onAuthChange) onAuthChange(user, selected, user.role);
        }
      };
    });

    // Agregar Perfil
    document.getElementById('btnAddProfile').onclick = () => {
      const name = prompt("Nombre del perfil:");
      if (!name) return;
      const isKids = confirm("¿Es un perfil infantil (Kids)?");
      profiles.push({ name, isKids, avatar: '' });
      localStorage.setItem(`lumera_profiles_${user.uid}`, JSON.stringify(profiles));
      render();
    };

    if (isAdmin) {
      document.getElementById('btnEditProfiles').onclick = () => {
        isEditingMode = !isEditingMode;
        render();
      };
    }

    document.getElementById('btnLogout').onclick = () => signOut(getAuth());
  };

  render();
}

export function getActiveProfile() {
  return JSON.parse(localStorage.getItem('lumera_active_profile') || 'null');
}
