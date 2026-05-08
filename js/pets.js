// =========================================
// HVEO+ — pets.js
// Pet Management: Add, View, Delete
// Connects to Firestore collection: 'pets'
// =========================================

import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp, updateDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  showToast, requireAuth, getAnimalEmoji, formatDate,
  getReminderStatus, daysUntil, renderNavbar, renderFooter
} from './utils.js';

// ─── Add Pet ──────────────────────────────────────────────────────────────────
export async function addPet(userId, petData) {
  try {
    const docRef = await addDoc(collection(db, 'pets'), {
      ...petData,
      userId,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error adding pet:', err);
    return { success: false, error: err.message };
  }
}

// ─── Get Pets for User ────────────────────────────────────────────────────────
export async function getUserPets(userId) {
  try {
    const q = query(
      collection(db, 'pets'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error getting pets:', err);
    return [];
  }
}

// ─── Delete Pet ───────────────────────────────────────────────────────────────
// Ownership is enforced by Firestore rules (request.auth.uid == resource.data.userId).
export async function deletePet(petId) {
  try {
    await deleteDoc(doc(db, 'pets', petId));
    return { success: true };
  } catch (err) {
    console.error('Error deleting pet:', err.code, err.message);
    return { success: false, error: err.message, code: err.code };
  }
}

// ─── Update Pet ───────────────────────────────────────────────────────────────
export async function updatePet(petId, data) {
  try {
    await updateDoc(doc(db, 'pets', petId), { ...data, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    console.error('Error updating pet:', err.code, err.message);
    return { success: false, error: err.message, code: err.code };
  }
}

// ─── Render Pet Card HTML ──────────────────────────────────────────────────────
export function renderPetCard(pet) {
  const emoji    = getAnimalEmoji(pet.type);
  const vacDate  = formatDate(pet.vaccineDate);
  const medDate  = formatDate(pet.medicationDate);
  const vacStatus= getReminderStatus(pet.vaccineDate);
  const medStatus= getReminderStatus(pet.medicationDate);

  const statusBadge = (status, label) => {
    const map = {
      overdue: ['badge-red',    '⚠ Vencida'],
      urgent:  ['badge-orange', '⏰ Próxima'],
      soon:    ['badge-blue',   '📅 Pronto'],
      ok:      ['badge-green',  '✓ Al día'],
    };
    if (label === '—') return '';
    const [cls, icon] = map[status] || map['ok'];
    return `<span class="badge ${cls}">${icon}</span>`;
  };

  const vacDays = daysUntil(pet.vaccineDate);
  const medDays = daysUntil(pet.medicationDate);
  const vacMsg  = vacDays !== null ? (vacDays < 0 ? `Vencida hace ${Math.abs(vacDays)}d` : `En ${vacDays}d`) : '';
  const medMsg  = medDays !== null ? (medDays < 0 ? `Vencida hace ${Math.abs(medDays)}d` : `En ${medDays}d`) : '';

  return `
    <div class="pet-card anim-fade-up" data-pet-id="${pet.id}">
      <div class="pet-avatar">${emoji}</div>
      <div class="pet-info">
        <div class="pet-name">${escHtml(pet.name)}</div>
        <div class="pet-meta">
          ${escHtml(pet.type || '—')}
          ${pet.breed ? ' · ' + escHtml(pet.breed) : ''}
          ${pet.age   ? ' · ' + escHtml(pet.age) + ' años' : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          ${pet.vaccineDate ? `
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:.8rem;color:var(--text-muted);width:80px;">💉 Vacuna:</span>
              <span style="font-size:.82rem;font-weight:500;">${vacDate}</span>
              ${statusBadge(vacStatus, vacDate)}
              ${vacMsg ? `<span style="font-size:.75rem;color:var(--text-light);">${vacMsg}</span>` : ''}
            </div>
          ` : ''}
          ${pet.medicationDate ? `
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:.8rem;color:var(--text-muted);width:80px;">💊 Medicación:</span>
              <span style="font-size:.82rem;font-weight:500;">${medDate}</span>
              ${statusBadge(medStatus, medDate)}
              ${medMsg ? `<span style="font-size:.75rem;color:var(--text-light);">${medMsg}</span>` : ''}
            </div>
          ` : ''}
          ${pet.notes ? `<div style="font-size:.82rem;color:var(--text-muted);font-style:italic;margin-top:4px;">📝 ${escHtml(pet.notes)}</div>` : ''}
        </div>
        <div class="pet-actions">
          <button class="btn btn-sm btn-outline" onclick="editPet('${escHtml(pet.id)}')">Editar</button>
          <button class="btn btn-sm btn-ghost" onclick="confirmDeletePet('${escHtml(pet.id)}')">Eliminar</button>
          <a href="appointments.html?pet=${encodeURIComponent(pet.id)}" class="btn btn-sm btn-primary">Agendar Cita</a>
        </div>
      </div>
    </div>
  `;
}

// ─── Render Reminder Alerts ────────────────────────────────────────────────────
export function renderReminders(pets) {
  const alerts = [];
  pets.forEach(pet => {
    const emoji = getAnimalEmoji(pet.type);
    
    if (pet.vaccineDate) {
      const status = getReminderStatus(pet.vaccineDate);
      const days   = daysUntil(pet.vaccineDate);
      if (status === 'overdue' || status === 'urgent' || status === 'soon') {
        const isUrgent = status === 'overdue' || status === 'urgent';
        alerts.push(`
          <div class="reminder-card ${isUrgent ? 'urgent' : ''}">
            <span style="font-size:1.5rem;">${emoji}</span>
            <div>
              <div style="font-weight:600;font-size:.9rem;color:var(--text);">
                ${status === 'overdue' ? '⚠️' : '⏰'} Vacuna de ${escHtml(pet.name)}
              </div>
              <div style="font-size:.82rem;color:var(--text-muted);">
                ${status === 'overdue'
                  ? `Vencida hace ${Math.abs(days)} días — ${formatDate(pet.vaccineDate)}`
                  : `Vence en ${days} días — ${formatDate(pet.vaccineDate)}`}
              </div>
            </div>
            <a href="appointments.html" class="btn btn-sm btn-accent" style="margin-left:auto;">Agendar</a>
          </div>
        `);
      }
    }

    if (pet.medicationDate) {
      const status = getReminderStatus(pet.medicationDate);
      const days   = daysUntil(pet.medicationDate);
      if (status === 'overdue' || status === 'urgent' || status === 'soon') {
        const isUrgent = status === 'overdue' || status === 'urgent';
        alerts.push(`
          <div class="reminder-card ${isUrgent ? 'urgent' : ''}">
            <span style="font-size:1.5rem;">${emoji}</span>
            <div>
              <div style="font-weight:600;font-size:.9rem;color:var(--text);">
                💊 Medicación de ${escHtml(pet.name)}
              </div>
              <div style="font-size:.82rem;color:var(--text-muted);">
                ${status === 'overdue'
                  ? `Vencida hace ${Math.abs(days)} días — ${formatDate(pet.medicationDate)}`
                  : `Renueva en ${days} días — ${formatDate(pet.medicationDate)}`}
              </div>
            </div>
            <a href="appointments.html" class="btn btn-sm btn-accent" style="margin-left:auto;">Agendar</a>
          </div>
        `);
      }
    }
  });
  return alerts;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}