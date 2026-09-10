// auth.js - Autenticación e Inicio de Sesión de Lumera
// Controla el registro de usuarios, login y la gestión de acceso a la plataforma.

import { db } from './db.js';
import { state, updateState } from './state.js';

let isRegisterMode = false;

/**
 * Renderiza la pantalla de Autenticación (Login / Registro).
 * @param {HTMLElement} container - Contenedor principal del DOM.
 */
export function renderAuth(container) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  container.innerHTML = `
    <div class="auth-wrapper" style="min-height: 100vh; background: linear-gradient(135deg, #0b0b0e 0%, #1a1a24 100%); display: flex; align-items: center; justify-content: center; padding: 20px;">
      
      <div class="auth-card" style="background: rgba(21, 21, 24, 0.85); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 16px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 15px 35px rgba(0,0,0,0.6); backdrop-filter: blur(10px); color: white;">
        
        <!-- LOGO Y TÍTULO -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d4af37; font-size: 2.5rem; font-weight: 800; margin: 0; letter-spacing: 2px;">LUMERA</h1>
          <p style="color: #888; font-size: 0.9rem; margin-top: 6px;" id="authSubtitle">
            ${isRegisterMode ? 'Crea tu cuenta para comenzar' : 'Ingresa a tu experiencia de cine'}
          </p>
        </div>

        <!-- FORMULARIO -->
        <form id="authForm" style="display: flex; flex-direction: column; gap: 18px;">
          
          ${isRegisterMode ? `
            <div>
              <label style="display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 6px;">Nombre Completo</label>
              <input type="text" id="authName" required placeholder="Tu nombre" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 0.95rem;">
            </div>
          ` : ''}

          <div>
            <label style="display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 6px;">Correo Electrónico</label>
            <input type="email" id="authEmail" required placeholder="usuario@lumera.com" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 0.95rem;">
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; color: #aaa; margin-bottom: 6px;">Contraseña</label>
            <input type="password" id="authPassword" required placeholder="••••••••" style="width: 100%; padding: 12px; background: rgba(0,0,0,0.4); border: 1px solid #333; color: white; border-radius: 8px; box-sizing: border-box; outline: none; font-size: 0.95rem;">
          </div>

          <div id="authError" style="color: #ff4444; font-size: 0.85rem; display: none; text-align: center;"></div>

          <button type="submit" style="margin-top: 10px; padding: 14px; background: #d4af37; border: none; color: #000; font-weight: bold; font-size: 1rem; border-radius: 8px; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease;">
            ${isRegisterMode ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <!-- CAMBIO DE MODO (LOGIN / REGISTRO) -->
        <div style="text-align: center; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
          <span style="color: #888; font-size: 0.88rem;">
            ${isRegisterMode ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta en Lumera?'}
          </span>
          <button id="btnToggleAuthMode" style="background: none; border: none; color: #d4af37; font-weight: bold; cursor: pointer; margin-left: 6px; font-size: 0.88rem; text-decoration: underline;">
            ${isRegisterMode ? 'Inicia Sesión' : 'Regístrate aquí'}
          </button>
        </div>

      </div>

    </div>
  `;

  // EVENTOS DEL FORMULARIO
  const form = document.getElementById('authForm');
  const btnToggle = document.getElementById('btnToggleAuthMode');
  const authError = document.getElementById('authError');

  btnToggle?.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    renderAuth(container);
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authError) authError.style.display = 'none';

    const email = document.getElementById('authEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('authPassword')?.value;
    const name = document.getElementById('authName')?.value.trim();

    try {
      let users = (await db.getAll('users')) || [];

      if (isRegisterMode) {
        // Lógica de Registro
        const userExists = users.some(u => u.email === email);
        if (userExists) {
          showError('Este correo electrónico ya está registrado.');
          return;
        }

        const newUser = {
          name,
          email,
          password,
          createdAt: new Date().toISOString()
        };

        const newUserId = await db.add('users', newUser);
        state.currentUser = { ...newUser, id: newUserId };

        // Crear perfil inicial por defecto para el usuario
        await db.add('profiles', {
          name: name || 'Principal',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
        });

        updateState('currentView', 'profiles');
      } else {
        // Lógica de Login
        const foundUser = users.find(u => u.email === email && u.password === password);

        if (!foundUser) {
          showError('Credenciales incorrectas. Verifica tu correo y contraseña.');
          return;
        }

        state.currentUser = foundUser;
        updateState('currentView', 'profiles');
      }
    } catch (err) {
      console.error('Error durante la autenticación:', err);
      showError('Ocurrió un error en el servidor local. Inténtalo de nuevo.');
    }
  });

  function showError(msg) {
    if (authError) {
      authError.innerText = msg;
      authError.style.display = 'block';
    }
  }
}
