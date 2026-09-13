import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AiZaSyBynw4CMM1Y2iY8zeX37WJBcT6aNQMgQc",
  authDomain: "lumera-79254.firebaseapp.com",
  projectId: "lumera-79254",
  storageBucket: "lumera-79254.firebasestorage.app",
  messagingSenderId: "4621510860",
  appId: "1:4621510860:web:fcd7cfa27a59f196943a69"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Inyección limpia al ámbito global sin errores de sintaxis
window.db = db;
window.auth = auth;
