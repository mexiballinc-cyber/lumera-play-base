// auth.js - Sistema Autenticación y Perfiles Real
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, getDocs } from './firebase.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";
let isRegistering = false;

const profileImages = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png",
  "https://i.imgur.com/n7hvMwp.png",
  "https://i.imgur.com/L48WRuk.png"
];

onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  if (user) {
    if (user.email === ADMIN_EMAIL) inyectarBotonAdmin();
    renderProfileSelection(container);
  } else {
    quitarBotonAdmin();
    renderAuthScreen(container);
  }
});

function renderAuthScreen(container) {
  container.innerHTML = `
    <div style="max-width: 400px; margin: 80px auto; background: rgba(20,20,20,0.9); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); text-align: center; backdrop-filter: blur(12px);">
      <img src="https://i.imgur.com/9rarmsD.png" alt="Lumera" style="height: 60px; margin-bottom: 20px;">
      <h2 id="authTitle" style="color: #fff; margin-bottom: 20px;">${isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
      
      <form id="authForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px; border-radius: 8px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" id="btnSubmitAuth" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
          ${isRegistering ? 'Registrarse' : 'Entrar a Lumera'}
        </button>
      </form>

      <p style="margin-top: 20px; color: #aaa; font-size: 14px;">
        ${isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
        <span id="btnToggleAuth" style="color: #d4af37; cursor: pointer; font-weight: bold;">
          ${isRegistering ? ' Inicia Sesión' : ' Regístrate gratis'}
        </span>
      </p>
    </div>
  `;

  document.getElementById('btnToggleAuth').onclick = () => {
    isRegistering = !isRegistering;
    renderAuthScreen(container);
  };

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

function renderProfileSelection(container) {
  container.innerHTML = `
    <div style="text-align: center; margin-top: 60px;">
      <h1 style="color: #fff; font-size: 2.2rem; margin-bottom: 30px;">¿Quién está viendo?</h1>
      
      <div style="display: flex; justify-content: center; gap: 25px; flex-wrap: wrap;">
        <div style="cursor: pointer; text-align: center;" id="profileNormal">
          <img src="${profileImages[0]}" style="width: 110px; height: 110px; border-radius: 12px; border: 2px solid transparent;" onmouseover="this.style.border='2px solid white'" onmouseout="this.style.border='2px solid transparent'">
          <p style="color: #fff; margin-top: 10px; font-weight: bold;">Principal</p>
        </div>

        <div style="cursor: pointer; text-align: center;" id="profileKids">
          <img src="${profileImages[1]}" class="kids-avatar-active" style="width: 110px; height: 110px; border-radius: 12px;">
          <p style="color: #fff; margin-top: 10px; font-weight: bold;">Niños</p>
        </div>
      </div>
      
      <button id="btnSignOut" style="margin-top: 40px; padding: 10px 20px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 8px; cursor: pointer;">Cerrar Sesión</button>
    </div>
  `;

  document.getElementById('profileNormal').onclick = () => entrarPlataforma(false);
  document.getElementById('profileKids').onclick = () => entrarPlataforma(true);
  document.getElementById('btnSignOut').onclick = () => signOut(auth);
}

async function entrarPlataforma(isKids) {
  const container = document.getElementById('appContainer');
  container.innerHTML = `<h2 style="color:#d4af37; text-align:center; margin-top:40px;">Cargando catálogo...</h2>`;
  
  const contentsSnap = await getDocs(collection(db, "contents"));
  let html = `<div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">`;
  
  contentsSnap.forEach(doc => {
    const item = doc.data();
    if (isKids && item.is7Plus) return; // Filtro Kids estricto

    html += `
      <div style="width:160px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
        <img src="${item.poster}" style="width:100%; height:220px; object-fit:cover;">
        <div style="padding:10px;">
          <h4 style="color:#fff; font-size:14px; margin-bottom:5px;">${item.title}</h4>
          <span style="color:#d4af37; font-size:12px;">${item.type.toUpperCase()}</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html || `<p style="text-align:center; color:#888;">No hay contenido disponible para este perfil.</p>`;
}

function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'btnAdminSecret';
    btnAdmin.className = 'svg-btn';
    btnAdmin.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    btnAdmin.onclick = () => {
      import('./admin.js').then(module => {
        module.renderAdminPanel(document.getElementById('appContainer'));
      });
    };
    navRight.prepend(btnAdmin);
  }
}

function quitarBotonAdmin() {
  const btn = document.getElementById('btnAdminSecret');
  if (btn) btn.remove();
}
