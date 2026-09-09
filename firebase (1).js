// firebase.js - Conexión al backend de Lumera

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// Tu configuración exacta
const firebaseConfig = {
  apiKey: "AIzaSyBynw4cMM1Y2iY8zeX37WJBcT6aNQMqGQc",
  authDomain: "lumera-79254.firebaseapp.com",
  projectId: "lumera-79254",
  storageBucket: "lumera-79254.firebasestorage.app",
  messagingSenderId: "4621510860",
  appId: "1:4621510860:web:fcd7cfa27a59f196943a69"
};

// Inicializamos los servicios
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Exportamos las herramientas para usarlas en auth.js y admin.js
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc 
};
