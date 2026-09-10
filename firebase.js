// firebase.js - Conexión Real a Firebase Firestore y Autenticación
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Credenciales Oficiales del Proyecto Lumera
const firebaseConfig = {
  apiKey: "AIzaSyBynw4cMM1Y2iY8zeX37WJBcT6aNQMqGQc",
  authDomain: "lumera-79254.firebaseapp.com",
  projectId: "lumera-79254",
  storageBucket: "lumera-79254.firebasestorage.app",
  messagingSenderId: "4621510860",
  appId: "1:4621510860:web:fcd7cfa27a59f196943a69"
};

// Inicialización de la App y Servicios de Firebase
const app = initializeApp(firebaseConfig);
export const firestoreDB = getFirestore(app);
export const auth = getAuth(app);

/**
 * Adaptador de Compatibilidad:
 * Expone la misma interfaz que 'db.js' para que auth.js, profiles.js 
 * y admin.js funcionen sin modificar una sola línea de código en ellos.
 */
export const db = {
  /**
   * Obtiene todos los documentos de una colección en Firestore.
   * @param {string} storeName - Nombre de la colección ('media', 'profiles', 'users', etc.)
   */
  async getAll(storeName) {
    try {
      const querySnapshot = await getDocs(collection(firestoreDB, storeName));
      return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
    } catch (error) {
      console.error(`Error al obtener ${storeName} de Firestore:`, error);
      return [];
    }
  },

  /**
   * Agrega un nuevo documento a Firestore.
   * @param {string} storeName - Nombre de la colección.
   * @param {Object} data - Objeto con los datos a guardar.
   */
  async add(storeName, data) {
    try {
      const docRef = await addDoc(collection(firestoreDB, storeName), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error al agregar en ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza o inserta un documento con un ID específico.
   * @param {string} storeName - Nombre de la colección.
   * @param {Object} data - Datos a guardar (debe contener propiedad 'id').
   */
  async put(storeName, data) {
    try {
      if (!data.id) return await this.add(storeName, data);
      
      const docRef = doc(firestoreDB, storeName, String(data.id));
      const payload = { ...data };
      delete payload.id; // Firestore maneja el ID en la referencia del documento
      
      await setDoc(docRef, payload, { merge: true });
      return data.id;
    } catch (error) {
      console.error(`Error al actualizar en ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un documento por su ID.
   * @param {string} storeName - Nombre de la colección.
   * @param {string|number} id - ID del documento a eliminar.
   */
  async delete(storeName, id) {
    try {
      const docRef = doc(firestoreDB, storeName, String(id));
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error al eliminar de ${storeName}:`, error);
      throw error;
    }
  }
};
