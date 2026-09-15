import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';

export default function Auth({ onProfileSelect, onOpenAdmin }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Cargar perfiles ÚNICAMENTE desde LocalStorage (Sin satuar Firebase)
  const [profiles, setProfiles] = useState(() => {
    const savedProfiles = localStorage.getItem('lumera_profiles');
    return savedProfiles ? JSON.parse(savedProfiles) : [
      { id: '1', name: 'Usuario Standard', isKids: false },
      { id: '2', name: 'Modo Niños', isKids: true }
    ];
  });

  const [newProfileName, setNewProfileName] = useState('');
  const [isNewKids, setIsNewKids] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const ADMIN_EMAIL = "jgonzalezgutierrez1@bcedu.mx";

  // Guardar en LocalStorage cada vez que cambie la lista de perfiles
  useEffect(() => {
    localStorage.setItem('lumera_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setErrorMsg("Error al conectar con Firebase. Revisa tus credenciales.");
    }
  };

  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProfile = {
      id: Date.now().toString(),
      name: newProfileName,
      isKids: isNewKids
    };

    setProfiles([...profiles, newProfile]);
    setNewProfileName('');
    setIsNewKids(false);
    setShowAddForm(false);
  };

  const handleDeleteProfile = (id, e) => {
    e.stopPropagation();
    if (profiles.length <= 1) return alert("Debes conservar al menos un perfil.");
    setProfiles(profiles.filter(p => p.id !== id));
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={{ color: '#e50914', marginBottom: '20px' }}>LUMERA</h1>
          <h2>{isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
          
          {errorMsg && <p style={{ color: '#ff4d4d' }}>{errorMsg}</p>}

          <form onSubmit={handleAuth} style={styles.form}>
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={styles.input}
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              {isRegistering ? 'Registrarse' : 'Entrar'}
            </button>
          </form>

          <p 
            onClick={() => setIsRegistering(!isRegistering)} 
            style={{ color: '#aaa', cursor: 'pointer', marginTop: '15px' }}
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primera vez en Lumera? Regístrate'}
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '40px' }}>¿Quién está viendo ahora?</h1>

        <div style={styles.profilesGrid}>
          {profiles.map((profile) => (
            <div 
              key={profile.id} 
              onClick={() => onProfileSelect(profile)}
              style={profile.isKids ? styles.kidsAvatarCard : styles.avatarCard}
            >
              <div style={styles.avatarIcon}>
                {profile.name[0].toUpperCase()}
              </div>
              <span style={{ marginTop: '10px', fontSize: '1.2rem' }}>
                {profile.name} {profile.isKids ? '🌈' : ''}
              </span>
              <button 
                onClick={(e) => handleDeleteProfile(profile.id, e)}
                style={styles.deleteProfileBtn}
              >
                ✕
              </button>
            </div>
          ))}

          <div onClick={() => setShowAddForm(true)} style={styles.addAvatarCard}>
            <div style={styles.avatarIcon}>+</div>
            <span style={{ marginTop: '10px', fontSize: '1.2rem' }}>Añadir Perfil</span>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreateProfile} style={styles.addForm}>
            <input 
              type="text" 
              placeholder="Nombre del perfil" 
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              required
              style={styles.input}
            />
            <label style={{ display: 'block', margin: '10px 0', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isNewKids} 
                onChange={(e) => setIsNewKids(e.target.checked)} 
              /> {' '}
              ¿Es perfil Kids? 🌈
            </label>
            <button type="submit" style={styles.primaryBtn}>Guardar</button>
            <button type="button" onClick={() => setShowAddForm(false)} style={styles.cancelBtn}>Cancelar</button>
          </form>
        )}

        <div style={{ marginTop: '50px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {isAdmin && (
            <button onClick={onOpenAdmin} style={styles.adminBtn}>
              ✏️ Panel Maestro Admin
            </button>
          )}
          <button onClick={() => signOut(auth)} style={styles.logoutBtn}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f12', color: '#fff', padding: '20px' },
  card: { background: '#181820', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' },
  addForm: { marginTop: '30px', display: 'inline-block', background: '#1c1c24', padding: '20px', borderRadius: '8px' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #333', background: '#252530', color: '#fff', fontSize: '1rem' },
  primaryBtn: { padding: '12px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#e50914', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { padding: '12px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#444', color: '#fff', marginLeft: '10px', cursor: 'pointer' },
  profilesGrid: { display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' },
  avatarCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' },
  kidsAvatarCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: '2px dashed #00dfd8', borderRadius: '12px', padding: '10px', position: 'relative' },
  addAvatarCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: 0.7 },
  avatarIcon: { width: '100px', height: '100px', borderRadius: '12px', backgroundColor: '#2b2b38', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' },
  deleteProfileBtn: { position: 'absolute', top: '-5px', right: '-5px', background: '#e50914', border: 'none', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.8rem' },
  adminBtn: { padding: '10px 20px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  logoutBtn: { padding: '10px 20px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};
