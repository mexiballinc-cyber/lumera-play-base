import React, { useState } from 'react';
import Auth from './Auth';
import Main from './Main';
import Spark from './Spark';
import Admin from './Admin';

export default function App() {
  // Pantallas: 'auth' | 'main' | 'spark' | 'admin'
  const [currentScreen, setCurrentScreen] = useState('auth');
  const [activeProfile, setActiveProfile] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Al seleccionar un perfil en Auth.jsx
  const handleProfileSelect = (profile) => {
    setActiveProfile(profile);
    setCurrentScreen('main');
  };

  // Abrir Panel de Administración Maestro
  const handleOpenAdmin = () => {
    setCurrentScreen('admin');
  };

  // Navegación rápida entre secciones
  const handleNavigate = (screen) => {
    if (screen === 'profiles') {
      setActiveProfile(null);
      setCurrentScreen('auth');
    } else {
      setCurrentScreen(screen);
    }
  };

  // Al hacer clic en una película/serie
  const handleSelectMedia = (media) => {
    setSelectedMedia(media);
    alert(`Reproduciendo: ${media.title}`);
  };

  return (
    <div style={{ backgroundColor: '#0f0f12', minHeight: '100vh', color: '#fff' }}>
      {currentScreen === 'auth' && (
        <Auth 
          onProfileSelect={handleProfileSelect} 
          onOpenAdmin={handleOpenAdmin} 
        />
      )}

      {currentScreen === 'main' && (
        <Main 
          currentProfile={activeProfile} 
          onSelectMedia={handleSelectMedia} 
          onNavigate={handleNavigate} 
        />
      )}

      {currentScreen === 'spark' && (
        <Spark onBack={() => setCurrentScreen('main')} />
      )}

      {currentScreen === 'admin' && (
        <Admin onBack={() => setCurrentScreen('main')} />
      )}
    </div>
  );
}
