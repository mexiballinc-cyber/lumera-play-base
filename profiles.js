// profiles.js - Selección y Gestión de Perfiles de Usuario en Lumera
// Permite seleccionar un perfil existente o crear uno nuevo eligiendo un avatar de la BD.

import { db } from './db.js';
import { state, updateState } from './state.js';

/**
 * Renderiza la vista de selección y gestión de perfiles.
 * @param {HTMLElement} container - Contenedor principal del DOM.
 */
export async function renderProfiles(container) {
  if (!container) {
    container = document.getElementById('appContainer');
  }
  if (!container) return;

  let profiles = [];
  let availableAvatars = [];

  try {
    profiles = (await db.getAll('profiles')) || [];
    availableAvatars = (await db.getAll('avatars')) || [];
  } catch (err) {
    console.warn('Error al cargar perfiles/avatares:', err);
  }

  // Avatares por defecto en caso de no tener registrados en la base de datos
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  ];

  const avatarList = availableAvatars.length > 0 
    ? availableAvatars.map(a => a.url) 
    : defaultAvatars;

  container.innerHTML = `
    <div class="profiles-wrapper" style="min-height: 100vh; background: #0b0b0e; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px;">
      
      <h1 style="color: #d4af37; font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px;">¿Quién está viendo ahora?</h1>
      <p style="color: #888; font-size: 0.95rem; margin-bottom: 40px;">Selecciona tu perfil para personalizar tu experiencia en Lumera.</p>

      <!-- GRID DE PERFILES -->
      <div class="profiles-grid" style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: center; align-items: center; max-width: 900px; margin-bottom: 40px;">
        ${profiles.map(p => `
          <div class="profile-card" data-id="${p.id}" data-name="${p.name}" data-avatar="${p.avatarUrl}" style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: transform 0.25s ease;">
            <div style="width: 110px; height: 110px; border-radius: 50%; overflow: hidden; border: 3px solid transparent; transition: border-color 0.25s ease, transform 0.25s ease; box-shadow: 0 8px 20px rgba(0,0,0,0.6);" class="avatar-ring">
              <img src="${p.avatarUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <span style="font-size: 1rem; font-weight: 600; color: #ccc;">${p.name}</span>
          </div>
        `).join('')}

        <!-- BOTÓN AÑADIR PERFIL -->
        <div id="btnAddProfileCard" style="display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer;">
          <div style="width: 110px; height: 110px; border-radius: 50%; border: 2px dashed rgba(212,175,55,0.5); display: flex; align-items: center; justify-content: center; background: rgba(212,175,55,0.05); color: #d4af37; font-size: 2.5rem; transition: background 0.2s ease, border-color 0.2s ease;">
            +
          </div>
          <span style="font-size: 0.95rem; font-weight: 500; color: #888;">Añadir Perfil</span>
        </div>
      </div>

    </div>
  `;

  // INTERACCIÓN Y SELECCIÓN DE PERFIL
  container.querySelectorAll('.profile-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const ring = card.querySelector('.avatar-ring');
      if (ring) ring.style.borderColor = '#d4af37';
      card.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      const ring = card.querySelector('.avatar-ring');
      if (ring) ring.style.borderColor = 'transparent';
      card.style.transform = 'scale(1)';
    });

    card.addEventListener('click', () => {
      const profileData = {
        id: card.dataset.id,
        name: card.dataset.name,
        avatarUrl: card.dataset.avatar
      };
      state.activeProfile = profileData;
      updateState('currentView', 'home');
    });
  });

  // DESPLEGAR MODAL PARA NUEVO PERFIL
  document.getElementById('btnAddProfileCard')?.addEventListener('click', () => {
    openNewProfileModal(avatarList, async () => {
      await renderProfiles(container);
    });
  });
}

/**
 * Modal para asignar nombre y seleccionar avatar del nuevo perfil.
 */
function openNewProfileModal(avatarList, onSuccess) {
  const modal = document.createElement('div');
  modal.style.cssText = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(8px); padding:20px;";

  let selectedAvatarUrl = avatarList[0] || 'https://via.placeholder.com/100';

  modal.innerHTML = `
    <div style="background:#151518; padding:30px; border-radius:16px; border:1px solid #d4af37; width:100%; max-width:480px; color:white; text-align:center;">
      <h2 style="color:#d4af37; margin-top:0; margin-bottom:20px;">Crear Nuevo Perfil</h2>

      <div style="margin-bottom:20px;">
        <label style="display:block; text-align:left; font-size:12px; color:#aaa; margin-bottom:6px;">Nombre del Perfil</label>
        <input type="text" id="inputProfileName" placeholder="Ej. Alex, Papá, Cinefilo..." style="width:100%; padding:12px; background:#222; border:1px solid #444; color:white; border-radius:8px; box-sizing:border-box; outline:none; font-size:1rem;">
      </div>

      <label style="display:block; text-align:left; font-size:12px; color:#aaa; margin-bottom:10px;">Selecciona un Avatar</label>
      <div id="avatarPickerContainer" style="display:flex; gap:12px; overflow-x:auto; padding-bottom:10px; margin-bottom:25px;">
        ${avatarList.map((url, idx) => `
          <img src="${url}" data-url="${url}" class="picker-avatar" style="width:65px; height:65px; border-radius:50%; object-fit:cover; cursor:pointer; border:3px solid ${idx === 0 ? '#d4af37' : 'transparent'}; flex-shrink:0;">
        `).join('')}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:12px;">
        <button id="btnCancelProfile" style="padding:10px 20px; background:transparent; border:1px solid #666; color:white; border-radius:8px; cursor:pointer;">Cancelar</button>
        <button id="btnSaveProfile" style="padding:10px 24px; background:#d4af37; border:none; color:black; font-weight:bold; border-radius:8px; cursor:pointer;">Guardar Perfil</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Selección visual de avatar
  modal.querySelectorAll('.picker-avatar').forEach(img => {
    img.addEventListener('click', () => {
      modal.querySelectorAll('.picker-avatar').forEach(i => i.style.borderColor = 'transparent');
      img.style.borderColor = '#d4af37';
      selectedAvatarUrl = img.dataset.url;
    });
  });

  document.getElementById('btnCancelProfile').onclick = () => modal.remove();

  document.getElementById('btnSaveProfile').onclick = async () => {
    const nameInput = document.getElementById('inputProfileName');
    const name = nameInput?.value.trim();

    if (!name) {
      alert('Por favor, ingresa un nombre para el perfil.');
      return;
    }

    await db.add('profiles', {
      name,
      avatarUrl: selectedAvatarUrl
    });

    modal.remove();
    onSuccess();
  };
}
