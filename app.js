// app.js - Gestión de Eventos Globales, Inicialización y Menú Lateral
import { 
  initAuth, 
  showAuthModal, 
  showProfileSelectorModal, 
  abrirModalBusqueda, 
  abrirModalIdioma, 
  setLanguage, 
  currentLang 
} from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Autenticación y Carga Principal
  initAuth((user, activeProfile, role) => {
    console.log("Estado de autenticación actualizado:", { user, activeProfile, role });

    if (!user) {
      // Si no hay usuario, forzar el modal de inicio de sesión
      showAuthModal(() => {
        showProfileSelectorModal();
      });
    } else if (!activeProfile) {
      // Si hay usuario pero no se ha elegido perfil, mostrar el selector de perfiles
      showProfileSelectorModal();
    } else {
      console.log(`Bienvenido ${activeProfile.name} (Rol: ${role})`);
      // Aquí se activaría el renderizado del catálogo principal
    }
  });

  // 2. Elementos de la Interfaz
  const btnMenu = document.getElementById('btnMenu');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  const btnSearch = document.getElementById('btnSearch');
  const btnConfig = document.getElementById('btnConfig');
  const langSelect = document.getElementById('langSelect');

  // Control del Menú Lateral (Abrir / Cerrar)
  if (btnMenu) {
    btnMenu.onclick = () => {
      drawerOverlay?.classList.add('open', 'active');
      mainDrawer?.classList.add('open', 'active');
    };
  }

  if (btnCloseDrawer) btnCloseDrawer.onclick = cerrarDrawerGlobal;
  if (drawerOverlay) drawerOverlay.onclick = cerrarDrawerGlobal;

  // Control de Botones del Header
  if (btnSearch) btnSearch.onclick = () => abrirModalBusqueda();
  if (btnConfig) btnConfig.onclick = () => abrirModalIdioma();

  // Control del Selector de Idioma
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.onchange = (e) => setLanguage(e.target.value);
  }

  // 3. Navegación del Menú Lateral
  const navItems = document.querySelectorAll('.drawer-links .nav-item');
  navItems.forEach((item, index) => {
    item.onclick = (e) => {
      e.preventDefault();
      cerrarDrawerGlobal();

      switch (index) {
        case 0: // Inicio
          console.log("Cargando Todo...");
          break;
        case 1: // Series
          console.log("Filtrando Series...");
          break;
        case 2: // Películas
          console.log("Filtrando Películas...");
          break;
        case 3: // Niños
          console.log("Modo Niños Activo");
          break;
        case 4: // Perfiles
          showProfileSelectorModal();
          break;
        case 5: // Spark / Admin
          alert("Próximamente Lumera Spark AI ✨");
          break;
      }
    };
  });
});

export function cerrarDrawerGlobal() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const mainDrawer = document.getElementById('mainDrawer');
  if (drawerOverlay) drawerOverlay.classList.remove('open', 'active');
  if (mainDrawer) mainDrawer.classList.remove('open', 'active');
}
