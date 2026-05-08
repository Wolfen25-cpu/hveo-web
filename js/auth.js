// =========================================
// HVEO+ — auth.js
// Firebase Authentication Logic
//
// FIXES:
//  - renderNavbar/renderFooter REMOVED from here.
//    Each HTML page calls them directly — calling
//    them twice was breaking the form submit listener.
//  - Firestore profile save is non-blocking.
//  - Full Firebase error code coverage.
// =========================================

import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { showToast, redirectIfLoggedIn } from './utils.js';

// ─── REGISTER ────────────────────────────────────────────────────────────────
export function initRegisterPage() {
  redirectIfLoggedIn('dashboard.html');

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name      = document.getElementById('reg-name').value.trim();
    const email     = document.getElementById('reg-email').value.trim();
    const phone     = document.getElementById('reg-phone').value.trim();
    const password  = document.getElementById('reg-password').value;
    const confirm   = document.getElementById('reg-confirm').value;
    const submitBtn = form.querySelector('[type="submit"]');

    // Client-side validation
    let valid = true;
    if (!name)  { showFieldError('err-name', 'El nombre es requerido.'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldError('err-email', 'Escribe un email válido.'); valid = false; }
    if (password.length < 6) { showFieldError('err-password', 'Mínimo 6 caracteres.'); valid = false; }
    if (password !== confirm) { showFieldError('err-confirm', 'Las contraseñas no coinciden.'); valid = false; }
    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creando cuenta...';

    try {
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Set display name
      await updateProfile(userCred.user, { displayName: name });

      // 3. Save profile to Firestore (non-blocking — user is created even if this fails)
      try {
        await setDoc(doc(db, 'users', userCred.user.uid), {
          name, email, phone: phone || '',
          createdAt: serverTimestamp(),
          uid: userCred.user.uid,
        });
      } catch (fsErr) {
        console.warn('Firestore profile save failed:', fsErr.code, fsErr.message);
        console.warn('FIX: Firebase Console → Firestore → Rules → allow authenticated writes');
      }

      showToast('¡Cuenta creada! Bienvenido a HVEO+ 🎉', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);

    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Crear Mi Cuenta';
      handleAuthError(err);
    }
  });
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function initLoginPage() {
  redirectIfLoggedIn('dashboard.html');

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email     = document.getElementById('login-email').value.trim();
    const password  = document.getElementById('login-password').value;
    const submitBtn = form.querySelector('[type="submit"]');

    if (!email || !password) {
      showToast('Por favor llena todos los campos.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Iniciando sesión...';

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showToast('¡Bienvenido de regreso! 👋', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Iniciar Sesión';
      handleAuthError(err);
    }
  });

  // Forgot password
  const forgotBtn = document.getElementById('forgot-password');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      if (!email) { showToast('Escribe tu email primero.', 'error'); return; }
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Email de recuperación enviado. Revisa tu bandeja.', 'success');
      } catch (err) {
        showToast('No se pudo enviar el email. Verifica que sea correcto.', 'error');
      }
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = ''; el.style.display = 'none';
  });
}
function handleAuthError(err) {
  console.error('Firebase Auth Error:', err.code, '|', err.message);
  const messages = {
    'auth/email-already-in-use':      'Este email ya tiene una cuenta. ¿Quieres iniciar sesión?',
    'auth/invalid-email':             'El formato del email no es válido.',
    'auth/weak-password':             'La contraseña es muy débil. Usa al menos 6 caracteres.',
    'auth/user-not-found':            'No existe ninguna cuenta con este email.',
    'auth/wrong-password':            'Contraseña incorrecta.',
    'auth/invalid-credential':        'Email o contraseña incorrectos.',
    'auth/user-disabled':             'Esta cuenta ha sido deshabilitada.',
    'auth/too-many-requests':         'Demasiados intentos. Espera unos minutos.',
    'auth/network-request-failed':    'Error de conexión. Verifica tu internet.',
    'auth/operation-not-allowed':
      '⚠️ Email/Password no está habilitado en Firebase. ' +
      'Ve a Firebase Console → Authentication → Sign-in method → Email/Password → Habilitar.',
    'auth/configuration-not-found':
      '⚠️ Configuración de Firebase incorrecta. Verifica firebase-config.js.',
  };
  const msg = messages[err.code]
    ?? `Error (${err.code}). Abre la consola (F12) para más detalles.`;
  showToast(msg, 'error', 7000);
}