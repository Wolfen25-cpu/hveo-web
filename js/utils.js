// =========================================
// HVEO+ — utils.js
// Shared Utilities: Toast, Auth Guard,
// Navigation Rendering, Date Helpers
// =========================================

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ─── Toast Notification System ───────────────────────────────────────────────
// Creates a temporary notification that auto-dismisses

function ensureToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return document.getElementById('toast-container');
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  // Build with textContent so messages from Firebase errors / user data can't inject HTML.
  const iconSpan = document.createElement('span');
  iconSpan.textContent = icons[type] || 'ℹ';
  const msgSpan = document.createElement('span');
  msgSpan.textContent = String(message ?? '');
  toast.append(iconSpan, msgSpan);

  container.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── Auth Guard ──────────────────────────────────────────────────────────────
// Call on protected pages to redirect if not logged in

export function requireAuth(redirectTo = 'login.html') {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        window.location.href = redirectTo;
        reject(new Error('Not authenticated'));
      }
    });
  });
}

// Redirect if already logged in (for login/register pages)
export function redirectIfLoggedIn(redirectTo = 'dashboard.html') {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = redirectTo;
  });
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function handleSignOut() {
  try {
    await signOut(auth);
    showToast('Sesión cerrada exitosamente.', 'success');
    setTimeout(() => window.location.href = 'index.html', 800);
  } catch (err) {
    showToast('Error al cerrar sesión.', 'error');
  }
}

// ─── Password Visibility Toggle ──────────────────────────────────────────────
// Any <input data-password-toggle> automatically gets a circular button
// inside its right edge. Clicking the button flips the input between
// type="password" and type="text" and swaps the dog icon between
// closed-eyes (hidden) and open-eyes (visible).

const DOG_CLOSED_SVG = `
  <svg class="dog-closed" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 7 C 3 9 3 12.5 6 13"/>
    <path d="M19 7 C 21 9 21 12.5 18 13"/>
    <ellipse cx="12" cy="13" rx="6" ry="6.5"/>
    <path d="M9 11.5 Q 10 12.3 11 11.5"/>
    <path d="M13 11.5 Q 14 12.3 15 11.5"/>
    <circle cx="12" cy="15" r="0.9" fill="currentColor"/>
    <path d="M10.5 17 Q 12 18 13.5 17"/>
  </svg>`;
const DOG_OPEN_SVG = `
  <svg class="dog-open" viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M5 7 C 3 9 3 12.5 6 13"/>
    <path d="M19 7 C 21 9 21 12.5 18 13"/>
    <ellipse cx="12" cy="13" rx="6" ry="6.5"/>
    <circle cx="10" cy="12" r="1" fill="currentColor"/>
    <circle cx="14" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="15" r="0.9" fill="currentColor"/>
    <path d="M10.5 17 Q 12 18 13.5 17"/>
  </svg>`;

function attachPasswordToggles() {
  document.querySelectorAll('input[data-password-toggle]').forEach(input => {
    if (input.dataset.toggleAttached) return;
    input.dataset.toggleAttached = '1';

    // Wrap the input so the button can be absolutely positioned over it.
    const wrap = document.createElement('div');
    wrap.className = 'password-toggle-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'password-toggle';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    btn.innerHTML = DOG_CLOSED_SVG + DOG_OPEN_SVG;
    btn.addEventListener('click', () => {
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      btn.classList.toggle('is-open', !visible);
      btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
    wrap.appendChild(btn);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachPasswordToggles);
} else {
  attachPasswordToggles();
}

// ─── Navigation Rendering ─────────────────────────────────────────────────────
// Injects the shared navbar into every page
// The hamburger menu is always visible on mobile and shows ALL pages,
// organized by section. On desktop the top nav shows only the main links.

export function renderNavbar(activePage = '') {
  const publicLinks = [
    { href: 'index.html',    label: 'Inicio',    key: 'home',     icon: '🏠' },
    { href: 'services.html', label: 'Servicios', key: 'services', icon: '🏥' },
    { href: 'about.html',    label: 'Nosotros',  key: 'about',    icon: '💙' },
    { href: 'blog.html',     label: 'Blog',      key: 'blog',     icon: '📰' },
  ];
  const authLinks = [
    { href: 'dashboard.html',    label: 'Dashboard', key: 'dashboard',    icon: '📊' },
    { href: 'pets.html',         label: 'Mascotas',  key: 'pets',         icon: '🐾' },
    { href: 'appointments.html', label: 'Citas',     key: 'appointments', icon: '📅' },
    { href: 'profile.html',      label: 'Perfil',    key: 'profile',      icon: '👤' },
  ];

  const navEl = document.getElementById('navbar');
  if (!navEl) return;

  // Desktop top-nav links (no icons needed)
  const buildDesktopLinks = (links) => links.map(l => `
    <a href="${l.href}" class="nav-link ${activePage === l.key ? 'active' : ''}">${l.label}</a>
  `).join('');

  // Mobile nav links (with icon + label + active indicator)
  const buildMobileLinks = (links) => links.map(l => `
    <a href="${l.href}" class="mobile-nav-link ${activePage === l.key ? 'active' : ''}">
      <span class="mn-icon">${l.icon}</span>
      <span class="mn-label">${l.label}</span>
      ${activePage === l.key ? '<span class="mn-active-dot"></span>' : ''}
    </a>
  `).join('');

  // ── Initial render ──────────────────────────────────────────────────────────
  navEl.innerHTML = `
    <div class="container">

      <!-- Logo -->
      <a href="index.html" class="nav-logo" aria-label="HVEO+ — Inicio">
        <img src="img/logo/logo.png" alt="HVEO+ Hospital Veterinario del Oeste" class="nav-logo-img">
      </a>

      <!-- Desktop links -->
      <nav class="nav-links" id="nav-desktop">
        ${buildDesktopLinks(publicLinks)}
        <span style="display:flex;gap:4px;" id="nav-auth-desktop"></span>
      </nav>

      <!-- Desktop action buttons + Hamburger -->
      <div class="nav-actions">
        <span id="nav-action-btn">
          <a href="login.html"    class="btn btn-outline btn-sm hide-mobile">Iniciar Sesión</a>
          <a href="register.html" class="btn btn-primary btn-sm hide-mobile">Registrarse</a>
        </span>
        <!-- Hamburger always visible on mobile -->
        <button class="hamburger" id="hamburger" onclick="toggleMobileNav()" aria-label="Abrir menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>

    <!-- ── Full-screen mobile drawer ───────────────────────────────────────── -->
    <div class="mobile-nav" id="mobile-nav">

      <!-- Drawer header -->
      <div class="mobile-nav-header">
        <img src="img/logo/logo.png" alt="HVEO+ Hospital Veterinario del Oeste" class="drawer-logo-img">
        <button class="modal-close" onclick="toggleMobileNav()" aria-label="Cerrar menú">✕</button>
      </div>

      <!-- Section: Información general (always visible) -->
      <div class="mobile-nav-section-label">🌐 Información General</div>
      ${buildMobileLinks(publicLinks)}

      <!-- Section: Mi Portal (shown when logged in, placeholder when not) -->
      <div class="mobile-nav-divider"></div>
      <div id="mobile-portal-section">
        <!-- Filled by auth state listener below -->
        <div class="mobile-nav-section-label">🔒 Mi Portal</div>
        <div style="padding:12px 16px;">
          <p style="font-size:.83rem;color:var(--text-muted);margin-bottom:12px;">
            Inicia sesión para acceder al portal de clientes.
          </p>
          <a href="login.html"    class="btn btn-outline btn-block" style="margin-bottom:8px;">Iniciar Sesión</a>
          <a href="register.html" class="btn btn-primary btn-block">Registrarse Gratis</a>
        </div>
      </div>

      <!-- Footer info -->
      <div class="mobile-nav-divider"></div>
      <div style="padding:12px 16px 4px;">
        <div style="font-size:.75rem;color:var(--text-light);text-align:center;">
          📍 Añasco, Puerto Rico 🇵🇷
        </div>
      </div>

    </div>

    <!-- Backdrop -->
    <div class="mobile-nav-backdrop" id="mobile-backdrop" onclick="toggleMobileNav()"></div>
  `;

  // ── Inject floating profile FAB into body (shown when logged in) ───────────
  // Creates a persistent circular button fixed to bottom-right on every page.
  function injectProfileFAB() {
    if (document.getElementById('profile-fab')) return; // already injected
    const fab = document.createElement('div');
    fab.id = 'profile-fab';
    fab.innerHTML = `
      <a href="profile.html" class="profile-fab-btn" id="profile-fab-btn" title="Mi Perfil">
        <span class="profile-fab-initials" id="fab-initials">?</span>
        <img class="profile-fab-img" id="fab-img" alt="" style="display:none;">
        <!-- Tooltip -->
        <span class="profile-fab-tooltip">Mi Perfil</span>
        <!-- Pulse ring (shown when on profile page) -->
        <span class="profile-fab-ring"></span>
      </a>
    `;
    document.body.appendChild(fab);
  }

  // ── Auth state listener — updates portal section, desktop nav & FAB ────────
  onAuthStateChanged(auth, async (user) => {
    // Toggle body classes so any element marked .hide-authed or .hide-anon
    // can react to login state via CSS (used for register/login CTAs that
    // shouldn't show to already-signed-in users).
    document.body.classList.toggle('is-authed', !!user);
    document.body.classList.toggle('is-anon',   !user);

    const actionBtn      = document.getElementById('nav-action-btn');
    const authDesktop    = document.getElementById('nav-auth-desktop');
    const portalSection  = document.getElementById('mobile-portal-section');

    if (user) {
      const initials = (user.displayName || user.email || 'U').slice(0, 2).toUpperCase();
      const name     = user.displayName || (user.email || '').split('@')[0];

      // Fetch the user's Firestore profile photo (stored as a base64 data URL).
      // We only accept data:image/ URLs to prevent javascript:/http: photoURLs
      // from being injected (defense-in-depth — Firestore rules should already block this).
      let photoURL = null;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const raw = snap.data().photoURL;
          if (typeof raw === 'string' && raw.startsWith('data:image/')) photoURL = raw;
        }
      } catch (e) { /* ignore — fall back to initials */ }

      const avatarInner = photoURL
        ? `<img src="${escapeHtml(photoURL)}" alt="">`
        : escapeHtml(initials);

      // Desktop: inject portal links next to public links.
      // Profile is omitted here — the avatar circle next to "Salir" serves
      // as the profile link on the desktop top bar (and the floating FAB
      // duplicates it on every page). The mobile drawer still shows it.
      if (authDesktop) authDesktop.innerHTML = buildDesktopLinks(authLinks.filter(l => l.key !== 'profile'));

      // Desktop: replace login/register with avatar + salir
      if (actionBtn) actionBtn.innerHTML = `
        <div class="nav-avatar" title="${escapeHtml(user.email || '')}" onclick="window.location.href='profile.html'"
             style="cursor:pointer;">${avatarInner}</div>
        <button class="btn btn-ghost btn-sm hide-mobile" onclick="hveoSignOut()">Salir</button>
      `;

      // Mobile: replace portal section with full authenticated menu
      // (includes profile.html link in authLinks)
      if (portalSection) portalSection.innerHTML = `
        <!-- User identity card inside drawer -->
        <div class="mobile-user-card">
          <div class="mobile-user-avatar">${initials}</div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:.9rem;color:var(--dark-blue);">
              ${escapeHtml(name)}
            </div>
            <div style="font-size:.75rem;color:var(--text-muted);">${escapeHtml(user.email)}</div>
          </div>
        </div>

        <div class="mobile-nav-section-label">📱 Mi Portal</div>
        ${buildMobileLinks(authLinks)}

        <div style="padding:12px 16px 0;">
          <button class="btn btn-ghost btn-block" onclick="hveoSignOut()"
                  style="border:1.5px solid var(--border);">
            🚪 Cerrar Sesión
          </button>
        </div>
      `;

      // ── Floating profile FAB ──────────────────────────────────────────────
      injectProfileFAB();
      const fabInitials = document.getElementById('fab-initials');
      const fabImg      = document.getElementById('fab-img');
      const fabBtn      = document.getElementById('profile-fab-btn');
      if (fabInitials) fabInitials.textContent = initials;
      if (fabImg) {
        if (photoURL) {
          fabImg.src = photoURL;
          fabImg.style.display = '';
          if (fabInitials) fabInitials.style.display = 'none';
        } else {
          fabImg.removeAttribute('src');
          fabImg.style.display = 'none';
          if (fabInitials) fabInitials.style.display = '';
        }
      }
      if (fabBtn) {
        // Highlight the FAB when already on profile page
        if (activePage === 'profile') {
          fabBtn.classList.add('fab-active');
        }
        // Show FAB (it starts hidden via CSS opacity:0)
        fabBtn.classList.add('fab-visible');
      }

    } else {
      // Logged out: desktop clean up + hide FAB
      if (authDesktop) authDesktop.innerHTML = '';
      if (actionBtn) actionBtn.innerHTML = `
        <a href="login.html"    class="btn btn-outline btn-sm hide-mobile">Iniciar Sesión</a>
        <a href="register.html" class="btn btn-primary btn-sm hide-mobile">Registrarse</a>
      `;
      // Remove FAB if present
      const fab = document.getElementById('profile-fab');
      if (fab) fab.remove();
    }
  });

  // ── Global helpers ─────────────────────────────────────────────────────────
  window.hveoSignOut = handleSignOut;

  window.toggleMobileNav = function () {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    const backdrop  = document.getElementById('mobile-backdrop');
    const isOpen    = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    if (backdrop) backdrop.classList.toggle('open', isOpen);
    // Prevent body scroll when drawer is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const mobileNav = document.getElementById('mobile-nav');
      if (mobileNav && mobileNav.classList.contains('open')) {
        window.toggleMobileNav();
      }
    }
  });
}

// Small HTML escape helper — also escapes single quotes so values are safe
// inside single-quoted attributes.
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ─── Footer Rendering ─────────────────────────────────────────────────────────
export function renderFooter() {
  const footerEl = document.getElementById('footer');
  if (!footerEl) return;
  
  footerEl.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">
            <img src="img/logo/logo.png" alt="HVEO+ Hospital Veterinario del Oeste">
          </div>
          <p class="footer-desc">Cuidado Veterinario Avanzado en el Oeste de Puerto Rico</p>
        </div>
        <div>
          <h4>Servicios</h4>
          <ul>
            <li><a href="services.html">Medicina General</a></li>
            <li><a href="services.html">Vacunaciones</a></li>
            <li><a href="services.html">Diagnóstico</a></li>
            <li><a href="services.html">Cirugía</a></li>
          </ul>
        </div>
        <div>
          <h4>Portal</h4>
          <ul>
            <li><a href="dashboard.html">Mi Dashboard</a></li>
            <li><a href="pets.html">Mis Mascotas</a></li>
            <li><a href="appointments.html">Citas</a></li>
            <li><a href="profile.html">Mi Perfil</a></li>
          </ul>
        </div>
        <div>
          <h4>Clínica</h4>
          <ul>
            <li><a href="about.html">Sobre Nosotros</a></li>
            <li><a href="blog.html">Blog</a></li>
            <li><a href="#">Contacto</a></li>
            <li><a href="https://www.google.com/maps/place/A%C3%B1asco+Plaza/@18.299040804011238,-67.15797515964063,17z" target="_blank" rel="noopener noreferrer">Ubicación</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 HVEO+ Hospital Veterinario del Oeste+. Todos los derechos reservados.</span>
        <span>Añasco, Puerto Rico 🇵🇷</span>
      </div>
    </div>
  `;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

// Format timestamp/date to readable string
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-PR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Get days until a date (negative = overdue)
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

// Reminder status: 'overdue', 'urgent' (<=7d), 'soon' (<=30d), 'ok'
export function getReminderStatus(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return 'ok';
  if (days < 0)  return 'overdue';
  if (days <= 7)  return 'urgent';
  if (days <= 30) return 'soon';
  return 'ok';
}

// Animal emoji by type
export function getAnimalEmoji(type) {
  const map = {
    dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇',
    fish: '🐠', hamster: '🐹', turtle: '🐢', other: '🐾'
  };
  return map[(type || '').toLowerCase()] || '🐾';
}

// Format appointment date for the date-box widget
export function formatApptDate(dateStr) {
  if (!dateStr) return { month: '---', day: '--' };
  const d = new Date(dateStr + 'T12:00:00');
  return {
    month: d.toLocaleDateString('es-PR', { month: 'short' }).toUpperCase(),
    day: d.getDate()
  };
}

// ─── Loading overlay ──────────────────────────────────────────────────────────
export function showLoading(containerId, message = 'Cargando...') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">
      <div class="spinner spinner-blue" style="margin:0 auto 16px;width:32px;height:32px;border-width:3px;"></div>
      <p>${message}</p>
    </div>
  `;
}