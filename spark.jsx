import React, { useState, useEffect, useRef } from 'react';

export default function Spark({ onBack }) {
  // Base de datos de prueba para Sparks
  const initialSparks = [
    { id: 1, title: "Tráiler Espacial", category: "Sci-Fi", videoUrl: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4" },
    { id: 2, title: "Escena de Acción", category: "Acción", videoUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4" },
    { id: 3, title: "Mundo Animado", category: "Infantil", videoUrl: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4" },
    { id: 4, title: "Combate Futuro", category: "Acción", videoUrl: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4" },
    { id: 5, title: "Galaxia Lejana", category: "Sci-Fi", videoUrl: "https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4" }
  ];

  const [sparksList, setSparksList] = useState(initialSparks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCategories, setLikedCategories] = useState({});
  const videoRef = useRef(null);

  // Algoritmo del 40%: Reorganiza el feed en función de las categorías con Like
  const applyAlgorithm = (category) => {
    // Incrementar contador de likes para la categoría
    const updatedLikes = { 
      ...likedCategories, 
      [category]: (likedCategories[category] || 0) + 1 
    };
    setLikedCategories(updatedLikes);

    // Encontrar la categoría dominante
    const favoriteCategory = Object.keys(updatedLikes).reduce((a, b) => 
      updatedLikes[a] > updatedLikes[b] ? a : b
    );

    // Separar videos favoritos y el resto
    const favVideos = initialSparks.filter(s => s.category === favoriteCategory);
    const otherVideos = initialSparks.filter(s => s.category !== favoriteCategory);

    // Reestructurar lista garantizando aprox. 40% de contenido preferido
    let newFeed = [];
    let favIndex = 0;
    let otherIndex = 0;

    for (let i = 0; i < initialSparks.length; i++) {
      // Cada 1 de cada 2.5 videos (40%) coloca uno de la categoría favorita
      if (i % 2 === 0 && favVideos[favIndex]) {
        newFeed.push(favVideos[favIndex]);
        favIndex = (favIndex + 1) % favVideos.length;
      } else if (otherVideos[otherIndex]) {
        newFeed.push(otherVideos[otherIndex]);
        otherIndex = (otherIndex + 1) % otherVideos.length;
      }
    }

    setSparksList(newFeed);
  };

  const handleLike = () => {
    const currentSpark = sparksList[currentIndex];
    if (currentSpark) {
      applyAlgorithm(currentSpark.category);
    }
  };

  const handleNext = () => {
    if (currentIndex < sparksList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0); // Bucle al terminar
    }
  };

  const handleShare = () => {
    alert("¡Enlace copiado al portapapeles!");
  };

  const currentSpark = sparksList[currentIndex];

  return (
    <div style={styles.container}>
      {/* Botón Salir */}
      <button onClick={onBack} style={styles.backBtn}>✕ Salir</button>

      {/* Contenedor del Short */}
      <div style={styles.shortCard}>
        <video 
          ref={videoRef}
          src={currentSpark?.videoUrl} 
          autoPlay 
          loop 
          muted 
          style={styles.video}
        />

        {/* Info del Vídeo */}
        <div style={styles.overlayInfo}>
          <h3>{currentSpark?.title}</h3>
          <span style={styles.badge}>{currentSpark?.category}</span>
        </div>

        {/* Botones Flotantes (Corazón y Compartir) */}
        <div style={styles.actionsContainer}>
          <button onClick={handleLike} style={styles.actionBtn}>
            ♥
          </button>
          <button onClick={handleShare} style={styles.actionBtn}>
            ➥
          </button>
          <button onClick={handleNext} style={styles.nextBtn}>
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 10,
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  shortCard: {
    width: '100%',
    maxWidth: '400px',
    height: '90vh',
    maxHeight: '800px',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  overlayInfo: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    zIndex: 2,
    color: '#fff',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
  },
  badge: {
    background: '#e50914',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  actionsContainer: {
    position: 'absolute',
    right: '15px',
    bottom: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    zIndex: 2
  },
  actionBtn: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  nextBtn: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: 'none',
    background: '#e50914',
    color: '#fff',
    fontSize: '1.5rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
