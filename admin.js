import { t } from './i18n.js';

export function renderAdminView(container) {
  let subTracks = [];

  container.innerHTML = `
    <div style="max-width: 600px; margin: 0 auto; background: #14161d; padding: 25px; border-radius: 12px;">
      <h2 style="margin-bottom: 20px;" data-i18n="settings">${t('settings')}</h2>
      
      <form id="adminContentForm" style="display: flex; flex-direction: column; gap: 15px;">
        <input type="text" id="titleInput" placeholder="Título" required style="padding: 10px; background: #222531; border: 1px solid #333; color: #fff; border-radius: 6px;">
        <input type="url" id="posterInput" placeholder="URL Imgur de Portada" required style="padding: 10px; background: #222531; border: 1px solid #333; color: #fff; border-radius: 6px;">
        
        <label style="font-size: 0.9rem; color: #aaa;" data-i18n="addSubtitles">${t('addSubtitles')}</label>
        
        <div style="display: flex; gap: 10px;">
          <select id="subLang" style="padding: 10px; background: #222531; color: #fff; border: 1px solid #333; border-radius: 6px;">
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
          <input type="url" id="subUrl" placeholder="URL archivo (.vtt)" style="flex:1; padding: 10px; background: #222531; border: 1px solid #333; color: #fff; border-radius: 6px;">
          <button type="button" id="btnAddSub" style="padding: 10px 15px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer;">+</button>
        </div>

        <div id="subList" style="display: flex; flex-direction: column; gap: 5px;"></div>

        <button type="submit" style="padding: 12px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;" data-i18n="save">${t('save')}</button>
      </form>
    </div>
  `;

  const btnAddSub = container.querySelector('#btnAddSub');
  const subListDiv = container.querySelector('#subList');

  btnAddSub.onclick = () => {
    const lang = container.querySelector('#subLang').value;
    const url = container.querySelector('#subUrl').value.trim();
    if (url) {
      subTracks.push({ lang, url });
      container.querySelector('#subUrl').value = '';
      renderSubList();
    }
  };

  function renderSubList() {
    subListDiv.innerHTML = subTracks.map((s, i) => `
      <div style="display:flex; justify-size:space-between; background:#1f222e; padding:8px; border-radius:4px; font-size:0.85rem;">
        <span><strong>[${s.lang.toUpperCase()}]</strong> ${s.url}</span>
      </div>
    `).join('');
  }
}
