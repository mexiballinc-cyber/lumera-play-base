// firebase.js - Inicialización Centralizada de Firebase v12.19.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBynw4cMM1Y2iY8zeX37WJBcT6aNQMqGQc",
  authDomain: "lumera-79254.firebaseapp.com",
  projectId: "lumera-79254",
  storageBucket: "lumera-79254.firebasestorage.app",
  messagingSenderId: "4621510860",
  appId: "1:4621510860:web:fcd7cfa27a59f196943a69"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Asignación global para compatibilidad con módulos de la app
window.auth = auth;
window.db = db;
