// auth.js - Sistema de Usuarios y Perfiles

import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase.js';

const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

// Avatares oficiales proporcionados
const profileImages = [
  "https://i.imgur.com/JonRvHX.png",
  "https://i.imgur.com/sL5WaEy.png",
  "https://i.imgur.com/HV449p9.png",
  "https://i.imgur.com/sNakldY.png",
  "https://i.imgur.com/n7hvMwp.png",
  "https://i.imgur.com/L48WRuk.png"
];

// Observador de Sesión
onAuthStateChanged(auth, (user) => {
  const container = document.getElementById('appContainer');
  
  if (user) {
    // 1. USUARIO CONECTADO -> Mostrar pantalla de perfiles
    console.log("Sesión activa:", user.email);
    
    // Verificamos si es el admin para mostrar su botón secreto (Lapiz)
    if (user.email === ADMIN_EMAIL) {
      inyectarBotonAdmin();
    }

    renderProfileSelection(container);
  } else {
    // 2. NO HAY SESIÓN -> Mostrar Login
    renderLoginScreen(container);
  }
});

// Pantalla de Login / Registro
function renderLoginScreen(container) {
  container.innerHTML = `
    <div style="max-width: 400px; margin: 100px auto; background: rgba(20,20,20,0.9); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <img src="https://i.imgur.com/9rarmsD.png" alt="Lumera" style="height: 60px; margin-bottom: 20px;">
      <h2 style="color: #fff; margin-bottom: 20px;">Iniciar Sesión</h2>
      
      <form id="loginForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="email" id="emailInput" placeholder="Correo electrónico" required style="padding: 12px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <input type="password" id="passwordInput" placeholder="Contraseña" required style="padding: 12px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <button type="submit" style="padding: 12px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Entrar a Lumera</button>
      </form>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    const pass = document.getElementById('passwordInput').value;
    
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => console.log("¡Acceso concedido!"))
      .catch(error => alert("Error al iniciar sesión: " + error.message));
  });
}

// Pantalla de Selección de Perfiles
function renderProfileSelection(container) {
  // Aquí es donde cargaremos los perfiles guardados (por ahora pondremos unos de prueba)
  container.innerHTML = `
    <div style="text-align: center; margin-top: 80px;">
      <h1 style="color: #fff; font-size: 2.5rem; margin-bottom: 40px;">¿Quién está viendo?</h1>
      
      <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
        
        <!-- Perfil Normal -->
        <div style="cursor: pointer; text-align: center;" onclick="entrarLumera('normal')">
          <img src="${profileImages[0]}" style="width: 120px; height: 120px; border-radius: 12px; border: 2px solid transparent; transition: 0.3s;" onmouseover="this.style.border='2px solid white'" onmouseout="this.style.border='2px solid transparent'">
          <p style="color: #aaa; margin-top: 10px; font-weight: bold;">Tú</p>
        </div>

        <!-- Perfil Kids (Con clase de arcoíris de style.css) -->
        <div style="cursor: pointer; text-align: center;" onclick="entrarLumera('kids')">
          <img src="${profileImages[1]}" class="kids-avatar-active" style="width: 120px; height: 120px; border-radius: 12px;">
          <p style="color: #aaa; margin-top: 10px; font-weight: bold;">Niños</p>
        </div>

        <!-- Botón Añadir Perfil -->
        <div style="cursor: pointer; text-align: center;">
          <div style="width: 120px; height: 120px; border-radius: 12px; border: 2px dashed #666; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #666;">+</div>
          <p style="color: #aaa; margin-top: 10px; font-weight: bold;">Añadir perfil</p>
        </div>
      </div>
      
      <button onclick="cerrarSesion()" style="margin-top: 50px; padding: 10px 20px; background: transparent; border: 1px solid #666; color: #aaa; border-radius: 6px; cursor: pointer;">Cerrar Sesión</button>
    </div>
  `;
}

// Lógica para inyectar el botón secreto de Admin
function inyectarBotonAdmin() {
  const navRight = document.querySelector('.nav-right');
  if (navRight && !document.getElementById('btnAdminSecret')) {
    const btnAdmin = document.createElement('button');
    btnAdmin.id = 'btnAdminSecret';
    btnAdmin.className = 'svg-btn';
    btnAdmin.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
    btnAdmin.onclick = () => {
      import('./admin.js').then(module => {
        module.renderAdminPanel(document.getElementById('appContainer'));
      });
    };
    navRight.prepend(btnAdmin);
  }
}

// Funciones globales expuestas para el HTML
window.cerrarSesion = () => {
  signOut(auth).then(() => console.log("Sesión cerrada."));
};

window.entrarLumera = (tipo) => {
  if (tipo === 'kids') {
    console.log("Entrando en modo seguro Kids...");
    // Aquí se ocultará el contenido +7
  } else {
    console.log("Entrando al cascarón principal...");
  }
  document.getElementById('appContainer').innerHTML = "<h2 style='text-align:center; margin-top: 50px;'>El cascarón está vacío. Esperando contenido del admin...</h2>";
};
