// admin.js - Panel Maestro de Lumera

export function renderAdminPanel(container) {
  // Inyectamos la interfaz del Panel Admin en el contenedor principal
  container.innerHTML = `
    <div class="admin-panel" style="padding: 20px; color: #fff; max-width: 900px; margin: 0 auto; background: rgba(20,20,20,0.8); border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.3);">
      <h1 style="color: #d4af37; margin-bottom: 20px;">Panel Maestro Lumera</h1>
      
      <!-- Pestañas de Navegación del Admin -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">
        <button class="admin-tab svg-btn active" data-target="seccion-contenido">Contenido</button>
        <button class="admin-tab svg-btn" data-target="seccion-hero">Hero</button>
        <button class="admin-tab svg-btn" data-target="seccion-avatares">Imágenes de Perfil</button>
        <button class="admin-tab svg-btn" data-target="seccion-spark">Spark</button>
      </div>

      <!-- SECCIÓN CONTENIDO (Películas y Series) -->
      <div id="seccion-contenido" class="admin-section">
        <h3>Añadir Nuevo Contenido</h3>
        <form id="formContenido" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
          
          <input type="text" placeholder="Nombre del contenido" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <input type="text" placeholder="Categoría (Ej. Acción, Comedia)" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <input type="url" placeholder="URL Portada (Imgur)" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <input type="url" placeholder="URL Foto Descripción (Imgur)" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <textarea placeholder="Descripción" rows="3" style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;"></textarea>
          
          <!-- FILTRO DE EDAD IMPORTANTE -->
          <label style="display: flex; align-items: center; gap: 10px; color: #ff4d4d; font-weight: bold;">
            <input type="checkbox" id="checkEdad" style="width: 18px; height: 18px;">
            Es para mayores de 7 años (Ocultar de perfil Kids)
          </label>

          <select id="tipoContenido" style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
            <option value="pelicula">Película</option>
            <option value="serie">Serie</option>
          </select>

          <!-- Doblajes y Subtítulos (7 Idiomas) -->
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
            <h4>Enlaces de Audio (Doblaje) y Subtítulos (.vtt)</h4>
            <p style="font-size: 12px; color: #aaa; margin-bottom: 10px;">Llena solo los que tengas disponibles.</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <input type="url" placeholder="Audio ES (Internet Archive)" style="padding: 8px; border-radius: 4px; background: #111; color: white; border: 1px solid #333;">
              <input type="url" placeholder="Subtítulo ES (.vtt)" style="padding: 8px; border-radius: 4px; background: #111; color: white; border: 1px solid #333;">
              <!-- Repetir esto para EN, PT, FR, DE, JA en la versión final -->
              <input type="url" placeholder="Audio EN (Internet Archive)" style="padding: 8px; border-radius: 4px; background: #111; color: white; border: 1px solid #333;">
              <input type="url" placeholder="Subtítulo EN (.vtt)" style="padding: 8px; border-radius: 4px; background: #111; color: white; border: 1px solid #333;">
            </div>
          </div>

          <button type="button" style="padding: 10px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Guardar Contenido</button>
        </form>
      </div>

      <!-- SECCIÓN HERO -->
      <div id="seccion-hero" class="admin-section" style="display: none;">
        <h3>Gestor de Hero (Banner Principal)</h3>
        <input type="url" placeholder="Añadir nueva imagen Hero (Imgur)" style="width: 100%; padding: 10px; margin-top: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <button style="margin-top: 10px; padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 6px;">Añadir al Hero</button>
      </div>

      <!-- SECCIÓN AVATARES -->
      <div id="seccion-avatares" class="admin-section" style="display: none;">
        <h3>Gestor de Imágenes de Perfil</h3>
        <input type="url" placeholder="Añadir nuevo Avatar (Imgur)" style="width: 100%; padding: 10px; margin-top: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
        <button style="margin-top: 10px; padding: 10px 15px; background: #28a745; color: white; border: none; border-radius: 6px;">Añadir Avatar</button>
      </div>

      <!-- SECCIÓN SPARK -->
      <div id="seccion-spark" class="admin-section" style="display: none;">
        <h3>Añadir Video Spark (Shorts)</h3>
        <form style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
          <input type="text" placeholder="Nombre del video" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <input type="text" placeholder="Categoría (Para el Algoritmo)" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <input type="url" placeholder="Enlace del Video (Internet Archive)" required style="padding: 10px; border-radius: 6px; background: #222; border: 1px solid #444; color: white;">
          <button type="button" style="padding: 10px; background: #d4af37; color: black; font-weight: bold; border: none; border-radius: 6px;">Subir a Spark</button>
        </form>
      </div>

    </div>
  `;

  // Lógica para cambiar entre pestañas del Admin
  const tabs = container.querySelectorAll('.admin-tab');
  const sections = container.querySelectorAll('.admin-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Quitar activo de todos
      tabs.forEach(t => t.style.color = 'white');
      sections.forEach(s => s.style.display = 'none');
      
      // Activar el clickeado
      tab.style.color = '#d4af37';
      const target = tab.getAttribute('data-target');
      container.querySelector(`#${target}`).style.display = 'block';
    });
  });
}
