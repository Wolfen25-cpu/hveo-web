// =========================================
// HVEO+ — firebase-config.js
// =========================================
// ✅ Usa imports por CDN (sin npm/bundler)
// ✅ Exporta auth y db para el resto del app
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDL4s7APp4X6lWZ0RTB_UD7CTO47MOvnJw",
  authDomain:        "hveo-web.firebaseapp.com",
  projectId:         "hveo-web",
  storageBucket:     "hveo-web.firebasestorage.app",
  messagingSenderId: "117923774052",
  appId:             "1:117923774052:web:55fe3a8b4675ded0c06971"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios que usa el resto del proyecto
export const auth = getAuth(app);
export const db   = getFirestore(app);

export default app;