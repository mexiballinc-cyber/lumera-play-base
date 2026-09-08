export const translations = {
  es: { movies: "Películas", series: "Series", kids: "Kids", settings: "Panel Maestro", selectProfile: "¿Quién está viendo?", addProfile: "Añadir Perfil", profileType: "Tipo de Perfil", save: "Guardar", addSubtitles: "Añadir Subtítulos", selectLang: "Idioma Subtítulo" },
  en: { movies: "Movies", series: "Series", kids: "Kids", settings: "Master Panel", selectProfile: "Who is watching?", addProfile: "Add Profile", profileType: "Profile Type", save: "Save", addSubtitles: "Add Subtitles", selectLang: "Subtitle Language" },
  pt: { movies: "Filmes", series: "Séries", kids: "Kids", settings: "Painel Mestre", selectProfile: "Quem está assistindo?", addProfile: "Adicionar Perfil", profileType: "Tipo de Perfil", save: "Salvar", addSubtitles: "Adicionar Legendas", selectLang: "Idioma da Legenda" },
  fr: { movies: "Films", series: "Séries", kids: "Kids", settings: "Panneau Maître", selectProfile: "Qui regarde ?", addProfile: "Ajouter un profil", profileType: "Type de profil", save: "Enregistrer", addSubtitles: "Ajouter des sous-titres", selectLang: "Langue des sous-titres" },
  de: { movies: "Filme", series: "Serien", kids: "Kids", settings: "Master-Panel", selectProfile: "Wer schaut zu?", addProfile: "Profil hinzufügen", profileType: "Profiltyp", save: "Speichern", addSubtitles: "Untertitel hinzufügen", selectLang: "Untertitelsprache" },
  ja: { movies: "映画", series: "シリーズ", kids: "キッズ", settings: "マスターパネル", selectProfile: "閲覧中のユーザー", addProfile: "プロフィールを追加", profileType: "プロフィールの種類", save: "保存", addSubtitles: "字幕を追加", selectLang: "字幕の言語" }
};

let currentLang = localStorage.getItem('lumera_lang') || 'es';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('lumera_lang', lang);
    applyTranslations();
  }
}

export function t(key) {
  return translations[currentLang]?.[key] || translations['es'][key] || key;
}

export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.innerText = t(key);
  });
}
