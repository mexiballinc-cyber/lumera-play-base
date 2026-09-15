import React, { useState, useEffect } from 'react';
import './Lumera.css';

export default function Main({ currentProfile, onSelectMedia, onNavigate }) {
  const [activeTab, setActiveTab] = useState('home'); // home, series, peliculas, kids
  const [searchQuery, setSearchQuery] = useState('');
  const [continueWatching, setContinueWatching] = useState([]);

  // Simulador de datos traídos de GitHub / Firebase
  const heroData = {
    title: "Lumera Originals: Odyssey",
    description: "Una aventura espacial sin precedentes.",
    bannerUrl: "https://i.imgur.com/8Q4U2X1.jpg" // URL de ejemplo Imgur
  };

  const catalog = [
    { id: 1, title: "Cyberpunk 2099", type: "serie", is7Plus: true, image: "https://i.imgur.com/5XkM2zL.jpg", category: "Acción" },
    { id: 2, title: "El Bosque Mágico", type: "pelicula", is7Plus: false, image: "https://i.imgur.com/2nL83xM.jpg", category: "Infantil" },
    { id: 3, title: "Aventura Estelar", type: "pelicula", is7Plus: true, image: "https://i.imgur.com/9K0P1yT.jpg", category: "Sci-Fi" }
  ];

  // Cargar "Continuar Viendo" desde LocalStorage al iniciar
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('lumera_continue')) || [];
    setContinueWatching(savedProgress);
  }, []);

  // Determinar si aplica el Borde Arcoíris (Perfil Kids o Tab Kids)
  const isKidsActive = currentProfile?.isKids || activeTab === 'kids';

  // Filtrar catálogo si estamos en modo Kids
  const filteredCatalog = catalog.filter(item => {
    if (isKidsActive) return !item.is7Plus; // Solo contenido apto
    if (activeTab === 'series') return item.type === 'serie';
    if (activeTab === 'peliculas') return item.type === 'pelicula';
    return true;
  });

  return (
    <div className={`main-shell ${isKidsActive ? 'kids-mode' : ''}`}>
      {/* NAVBAR */}
      <nav className="navbar">
        <h1 style={{ color: '#e50914', margin: 0, cursor: 'pointer' }} onClick={() => setActiveTab('home')}>LUMERA</h1>
        <ul className="nav-links">
          <li className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Inicio</li>
          <li className={`nav-item ${activeTab === 'series' ? 'active' : ''}`} onClick={() => setActiveTab('series')}>Series</li>
          <li className={`nav-item ${activeTab === 'peliculas' ? 'active' : ''}`} onClick={() => setActiveTab('peliculas')}>Películas</li>
          <li className={`nav-item ${activeTab === 'kids' ? 'active' : ''}`} onClick={() => setActiveTab('kids')}>Kids 🌈</li>
        </ul>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#222', color: '#fff' }}
          />
          <button onClick={() => onNavigate('spark')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>⚡ Spark</button>
          <button onClick={() => onNavigate('config')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>⚙️</button>
          <div onClick={() => onNavigate('profiles')} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            {currentProfile?.name ? currentProfile.name[0].toUpperCase() : 'U'}
          </div>
        </div>
      </nav>

      {/* HERO DINÁMICO */}
      <div className="hero-container" style={{ backgroundImage: `url(${heroData.bannerUrl})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h2>{heroData.title}</h2>
          <p>{heroData.description}</p>
          <button className="btn-play" onClick={() => onSelectMedia({ id: 99, title: heroData.title })}>
            ▶ Reproducir
          </button>
        </div>
      </div>

      {/* SECCIÓN CONTINUAR VIENDO (LocalStorage) */}
      {continueWatching.length > 0 && (
        <div className="row-container">
          <h3>Continuar Viendo</h3>
          <div className="cards-scroll">
            {continueWatching.map((item) => (
              <div 
                key={item.id} 
                className="media-card" 
                style={{ backgroundImage: `url(${item.image})` }}
                onClick={() => onSelectMedia(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* FILA DE CONTENIDO FILTRADO */}
      <div className="row-container">
        <h3>{isKidsActive ? "Contenido para Niños" : "Catálogo Principal"}</h3>
        <div className="cards-scroll">
          {filteredCatalog.map((item) => (
            <div 
              key={item.id} 
              className="media-card" 
              style={{ backgroundImage: `url(${item.image})` }}
              onClick={() => onSelectMedia(item)}
            >
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
