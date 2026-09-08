// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Exportar base de datos Firestore
export const db = getFirestore(app);
