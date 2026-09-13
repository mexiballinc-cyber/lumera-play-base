// i18n.js - Sistema Internacional de 7 Idiomas
const translations = {
  es: {
    home: "Inicio",
    series: "Series",
    movies: "Películas",
    kids: "Niños",
    sparks: "Spark Shorts",
    admin: "Panel Admin",
    whoIsWatching: "¿Quién está viendo?",
    addProfile: "Añadir",
    editProfiles: "Administrar Perfiles",
    logout: "Cerrar Sesión",
    play: "▶ Reproducir",
    continueWatching: "Continuar Viendo",
    featured: "Destacados",
    audioAndSubs: "💬 Audio y Subtítulos",
    exit: "✕ Salir",
    dubbing: "Doblaje (Audio)",
    subtitles: "Subtítulos",
    disabled: "Desactivados",
    original: "Principal (Original)",
    selectLanguage: "Seleccionar Idioma"
  },
  en: {
    home: "Home",
    series: "TV Shows",
    movies: "Movies",
    kids: "Kids",
    sparks: "Spark Shorts",
    admin: "Admin Panel",
    whoIsWatching: "Who's watching?",
    addProfile: "Add",
    editProfiles: "Manage Profiles",
    logout: "Sign Out",
    play: "▶ Play",
    continueWatching: "Continue Watching",
    featured: "Featured",
    audioAndSubs: "💬 Audio & Subtitles",
    exit: "✕ Exit",
    dubbing: "Audio (Dubbing)",
    subtitles: "Subtitles",
    disabled: "Off",
    original: "Main (Original)",
    selectLanguage: "Select Language"
  },
  fr: {
    home: "Accueil",
    series: "Séries",
    movies: "Films",
    kids: "Enfants",
    sparks: "Spark Shorts",
    admin: "Panneau Admin",
    whoIsWatching: "Qui regarde ?",
    addProfile: "Ajouter",
    editProfiles: "Gérer les profils",
    logout: "Se déconnecter",
    play: "▶ Regarder",
    continueWatching: "Reprendre la lecture",
    featured: "En vedette",
    audioAndSubs: "💬 Audio et Sous-titres",
    exit: "✕ Quitter",
    dubbing: "Doublage (Audio)",
    subtitles: "Sous-titres",
    disabled: "Désactivé",
    original: "Principal (Original)",
    selectLanguage: "Choisir la langue"
  },
  it: {
    home: "Home",
    series: "Serie TV",
    movies: "Film",
    kids: "Bambini",
    sparks: "Spark Shorts",
    admin: "Pannello Admin",
    whoIsWatching: "Chi sta guardando?",
    addProfile: "Aggiungi",
    editProfiles: "Gestisci Profili",
    logout: "Esci",
    play: "▶ Riproduci",
    continueWatching: "Continua a guardare",
    featured: "In evidenza",
    audioAndSubs: "💬 Audio e Sottotitoli",
    exit: "✕ Esci",
    dubbing: "Doppiaggio (Audio)",
    subtitles: "Sottotitoli",
    disabled: "Disattivati",
    original: "Principale (Originale)",
    selectLanguage: "Seleziona Lingua"
  },
  de: {
    home: "Startseite",
    series: "Serien",
    movies: "Filme",
    kids: "Kinder",
    sparks: "Spark Shorts",
    admin: "Admin-Bereich",
    whoIsWatching: "Wer schaut gerade?",
    addProfile: "Hinzufügen",
    editProfiles: "Profile verwalten",
    logout: "Abmelden",
    play: "▶ Abspielen",
    continueWatching: "Weitersehen",
    featured: "Highlights",
    audioAndSubs: "💬 Audio und Untertitel",
    exit: "✕ Beenden",
    dubbing: "Synchronisation (Audio)",
    subtitles: "Untertitel",
    disabled: "Aus",
    original: "Hauptspur (Original)",
    selectLanguage: "Sprache wählen"
  },
  ja: {
    home: "ホーム",
    series: "シリーズ",
    movies: "映画",
    kids: "キッズ",
    sparks: "Spark Shorts",
    admin: "管理パネル",
    whoIsWatching: "視聴者を選択",
    addProfile: "追加",
    editProfiles: "プロフィール管理",
    logout: "ログアウト",
    play: "▶ 再生",
    continueWatching: "視聴を続ける",
    featured: "注目のコンテンツ",
    audioAndSubs: "💬 音声と字幕",
    exit: "✕ 終了",
    dubbing: "吹き替え (音声)",
    subtitles: "字幕",
    disabled: "オフ",
    original: "オリジナル",
    selectLanguage: "言語を選択"
  },
  pt: {
    home: "Início",
    series: "Séries",
    movies: "Filmes",
    kids: "Infantil",
    sparks: "Spark Shorts",
    admin: "Painel Admin",
    whoIsWatching: "Quem está assistindo?",
    addProfile: "Adicionar",
    editProfiles: "Gerenciar Perfis",
    logout: "Sair",
    play: "▶ Assistir",
    continueWatching: "Continuar Assistindo",
    featured: "Destaques",
    audioAndSubs: "💬 Áudio e Legendas",
    exit: "✕ Sair",
    dubbing: "Dublagem (Áudio)",
    subtitles: "Legendas",
    disabled: "Desativado",
    original: "Principal (Original)",
    selectLanguage: "Selecionar Idioma"
  }
};

export function getCurrentLang() {
  return localStorage.getItem('lumera_lang') || 'es';
}

export function setLanguage(lang) {
  if (translations[lang]) {
    localStorage.setItem('lumera_lang', lang);
    applyTranslations();
  }
}

export function applyTranslations() {
  const currentLang = getCurrentLang();
  const langDict = translations[currentLang] || translations.es;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (langDict[key]) {
      element.textContent = langDict[key];
    }
  });
}

export function openLanguageSelectorModal() {
  const existingModal = document.getElementById('langModal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'langModal';
  modal.className = 'modal glass-modal';
  
  const langs = [
    { code: 'es', label: 'Español 🇪🇸' },
    { code: 'en', label: 'English 🇺🇸' },
    { code: 'fr', label: 'Français 🇫🇷' },
    { code: 'it', label: 'Italiano 🇮🇹' },
    { code: 'de', label: 'Deutsch 🇩🇪' },
    { code: 'ja', label: '日本語 🇯🇵' },
    { code: 'pt', label: 'Português 🇧🇷' }
  ];

  const current = getCurrentLang();

  modal.innerHTML = `
    <div class="modal-content glass-panel" style="max-width: 380px; width: 90%; padding: 25px; border-radius: 12px; position: relative;">
      <button id="btnCloseLang" class="icon-btn" style="position: absolute; top: 15px; right: 15px;">✕</button>
      <h3 data-i18n="selectLanguage" style="margin-bottom: 20px;">${translations[current]?.selectLanguage || 'Seleccionar Idioma'}</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${langs.map(l => `
          <button class="lang-option-btn" data-lang="${l.code}" style="padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: ${l.code === current ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)'}; color: #fff; text-align: left; cursor: pointer; font-weight: bold;">
            ${l.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelectorAll('.lang-option-btn').forEach(btn => {
    btn.onclick = () => {
      setLanguage(btn.dataset.lang);
      modal.remove();
    };
  });

  document.getElementById('btnCloseLang').onclick = () => modal.remove();
}
