import { t } from './i18n.js';

export function renderProfilesView(container, onSelectProfile) {
  const profiles = JSON.parse(localStorage.getItem('lumera_profiles')) || [
    { name: "Usuario Normal", type: "normal", avatar: "https://i.imgur.com/9W9C2TC.png" },
    { name: "Modo Kids", type: "kids", avatar: "https://i.imgur.com/9rDtCyZ.png" }
  ];

  container.innerHTML = `
    <div style="text-align: center; max-width: 600px; margin: 50px auto;">
      <h1 data-i18n="selectProfile" style="margin-bottom: 30px;">${t('selectProfile')}</h1>
      <div id="profilesList" style="display: flex; justify-content: center; gap: 25px; flex-wrap: wrap;"></div>
    </div>
  `;

  const list = container.querySelector('#profilesList');

  profiles.forEach(p => {
    const isKids = p.type === 'kids';
    const card = document.createElement('div');
    card.style.cssText = "cursor: pointer; text-align: center; width: 120px;";
    
    card.innerHTML = `
      <div class="avatar-box ${isKids ? 'avatar-kids' : ''}" 
           style="width: 110px; height: 110px; border-radius: 50%; overflow: hidden; margin: 0 auto; border: 3px solid #333;">
        <img src="${p.avatar}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <p style="margin-top: 12px; font-weight: 600;">${p.name}</p>
    `;

    card.onclick = () => {
      if (isKids) {
        document.body.classList.add('kids-theme-active');
        onSelectProfile('kids');
      } else {
        document.body.classList.remove('kids-theme-active');
        onSelectProfile('home');
      }
    };

    list.appendChild(card);
  });
}
