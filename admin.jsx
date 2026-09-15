import React, { useState } from 'react';

export default function Admin({ onBack }) {
  const [tab, setTab] = useState('contenido'); // contenido, spark, hero, perfiles
  const [contentType, setContentType] = useState('pelicula'); // pelicula | serie
  const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués', 'Japonés'];

  // Formulario Contenido
  const [title, setTitle] = useState('');
  const [coverImg, setCoverImg] = useState('');
  const [bannerImg, setBannerImg] = useState('');
  const [desc, setDesc] = useState('');
  const [is7Plus, setIs7Plus] = useState(false);
  const [mainVideoUrl, setMainVideoUrl] = useState('');

  // Matriz de 14 Archivos/Links
  const [subtitles, setSubtitles] = useState({});
  const [dubbing, setDubbing] = useState({});

  // Formulario Series
  const [seasons, setSeasons] = useState([{ name: 'Temporada 1', episodes: [] }]);

  const handleSubChange = (lang, url) => setSubtitles({ ...subtitles, [lang]: url });
  const handleDubChange = (lang, url) => setDubbing({ ...dubbing, [lang]: url });

  const addEpisode = (seasonIndex) => {
    const updated = [...seasons];
    updated[seasonIndex].episodes.push({ title: 'Nuevo Episodio', videoUrl: '', subtitles: {}, dubbing: {} });
    setSeasons(updated);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2>✏️ Panel Maestro de Administración (Lumera)</h2>
        <button onClick={onBack} style={styles.closeBtn}>✕ Cerrar</button>
      </header>

      {/* Tabs */}
      <div style={styles.tabContainer}>
        {['contenido', 'spark', 'hero', 'perfiles'].map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            style={{ ...styles.tabBtn, backgroundColor: tab === t ? '#e50914' : '#222' }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* PESTAÑA: HERO / PERFILES (Añadir por Imgur) */}
      {(tab === 'hero' || tab === 'perfiles') && (
        <div style={styles.section}>
          <h3>Añadir Imagen a {tab.toUpperCase()}</h3>
          <input type="text" placeholder="URL de Imgur (ej: https://i.imgur.com/...)" style={styles.input} />
          <button style={styles.saveBtn}>Guardar Imagen</button>
        </div>
      )}

      {/* PESTAÑA: SPARK */}
      {tab === 'spark' && (
        <div style={styles.section}>
          <h3>Añadir Nuevo Spark</h3>
          <input type="text" placeholder="Nombre del Spark" style={styles.input} />
          <input type="text" placeholder="URL (Internet Archive / Imgur)" style={styles.input} />
          <input type="text" placeholder="Categoría (ej: Acción)" style={styles.input} />
          <button style={styles.saveBtn}>Añadir Spark</button>
        </div>
      )}

      {/* PESTAÑA: CONTENIDO (PELÍCULAS / SERIES) */}
      {tab === 'contenido' && (
        <div style={styles.section}>
          <h3>Añadir Nuevo Contenido</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <label>
              <input type="radio" name="type" checked={contentType === 'pelicula'} onChange={() => setContentType('pelicula')} /> Película
            </label>
            <label>
              <input type="radio" name="type" checked={contentType === 'serie'} onChange={() => setContentType('serie')} /> Serie
            </label>
            <label style={{ marginLeft: 'auto', color: '#ffd700' }}>
              <input type="checkbox" checked={is7Plus} onChange={(e) => setIs7Plus(e.target.checked)} /> +7 Años (Ocultar en Kids)
            </label>
          </div>

          <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
          <input type="text" placeholder="Portada (Link Imgur)" value={coverImg} onChange={(e) => setCoverImg(e.target.value)} style={styles.input} />
          <input type="text" placeholder="Banner Descripción (Link Imgur)" value={bannerImg} onChange={(e) => setBannerImg(e.target.value)} style={styles.input} />
          <textarea placeholder="Descripción" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...styles.input, height: '80px' }} />

          {/* SI ES PELÍCULA */}
          {contentType === 'pelicula' && (
            <>
              <h4>Link de Video Principal (Internet Archive)</h4>
              <input type="text" placeholder="URL del Video .mp4" value={mainVideoUrl} onChange={(e) => setMainVideoUrl(e.target.value)} style={styles.input} />

              {/* LAS 14 SECCIONES (7 Subtítulos + 7 Doblajes) */}
              <div style={styles.matrixContainer}>
                <div>
                  <h4>Subtítulos (7 Idiomas - Archivo .vtt / .srt)</h4>
                  {languages.map((lang) => (
                    <input 
                      key={`sub-${lang}`} 
                      type="text" 
                      placeholder={`Subtítulo ${lang}`} 
                      onChange={(e) => handleSubChange(lang, e.target.value)}
                      style={styles.subInput} 
                    />
                  ))}
                </div>

                <div>
                  <h4>Doblaje Audio (7 Idiomas - Internet Archive)</h4>
                  {languages.map((lang) => (
                    <input 
                      key={`dub-${lang}`} 
                      type="text" 
                      placeholder={`Doblaje ${lang}`} 
                      onChange={(e) => handleDubChange(lang, e.target.value)}
                      style={styles.subInput} 
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SI ES SERIE */}
          {contentType === 'serie' && (
            <div>
              <h4>Estructura de Temporadas y Episodios</h4>
              {seasons.map((s, idx) => (
                <div key={idx} style={{ background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <h5>{s.name}</h5>
                  <button onClick={() => addEpisode(idx)} style={styles.smallBtn}>+ Añadir Episodio</button>
                  <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Episodios creados: {s.episodes.length}</p>
                </div>
              ))}
            </div>
          )}

          <button style={{ ...styles.saveBtn, marginTop: '20px', width: '100%' }}>Guardar en Catálogo</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#0a0a0d', color: '#fff', padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px' },
  closeBtn: { background: '#e50914', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
  tabContainer: { display: 'flex', gap: '10px', margin: '20px 0' },
  tabBtn: { border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  section: { background: '#16161e', padding: '25px', borderRadius: '8px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px', boxSizing: 'border-box' },
  subInput: { width: '100%', padding: '8px', marginBottom: '8px', background: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px', boxSizing: 'border-box', fontSize: '0.85rem' },
  matrixContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px', background: '#0f0f14', padding: '15px', borderRadius: '6px' },
  saveBtn: { background: '#28a745', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  smallBtn: { background: '#007bff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }
};
