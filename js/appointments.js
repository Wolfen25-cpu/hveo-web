// =========================================
// HVEO+ — appointments.js
// Appointment Scheduling & Management
// =========================================

import { db, auth } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { showToast, formatApptDate, formatDate } from './utils.js';

// Doctors available at the clinic
export const DOCTORS = [
  {
    id: 'dr-galloza',
    name: 'Dr. Adrian Galloza',
    title: 'DVM — Medicina General & Cirugía',
    initials: 'AG',
    specialty: 'Cirugía, Medicina Preventiva',
    schedule: 'Lunes a Viernes',
    bio: 'Especialista en cirugía de tejidos blandos y medicina interna. Cofundador de HVEO+.',
  },
  {
    id: 'dr-guzman',
    name: 'Dra. Nicole Guzmán',
    title: 'DVM — Medicina General & Preventiva',
    initials: 'NG',
    specialty: 'Medicina Preventiva, Relaciones con Clientes',
    schedule: 'Lunes a Sábado',
    bio: 'Apasionada por la medicina preventiva y el bienestar animal. Cofundadora de HVEO+.',
  }
];

// Basic services for general practice
export const SERVICES = [
  { id: 'vacunacion',   label: 'Vacunación',          icon: '💉', duration: '30 min', price: '$45–$85' },
  { id: 'chequeo',      label: 'Chequeo General',      icon: '🩺', duration: '45 min', price: '$60–$90' },
  { id: 'consulta',     label: 'Consulta Básica',      icon: '📋', duration: '30 min', price: '$50–$70' },
  { id: 'laboratorio',  label: 'Laboratorio / Análisis',icon: '🔬', duration: '1 hora', price: '$80–$150' },
  { id: 'radiografia',  label: 'Radiografía Digital',  icon: '🏥', duration: '45 min', price: '$90–$140' },
];

// ─── Book Appointment ──────────────────────────────────────────────────────────
export async function bookAppointment(userId, appointmentData) {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      userId,
      status: 'confirmed',
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error('Error booking appointment:', err);
    return { success: false, error: err.message };
  }
}

// ─── Get Appointments for User ─────────────────────────────────────────────────
export async function getUserAppointments(userId) {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error getting appointments:', err);
    return [];
  }
}

// ─── Cancel Appointment ────────────────────────────────────────────────────────
// Ownership is enforced by Firestore rules (request.auth.uid == resource.data.userId).
export async function cancelAppointment(apptId) {
  try {
    await deleteDoc(doc(db, 'appointments', apptId));
    return { success: true };
  } catch (err) {
    console.error('Error cancelling appointment:', err.code, err.message);
    return { success: false, error: err.message, code: err.code };
  }
}

// ─── Render Appointment Card ───────────────────────────────────────────────────
export function renderApptCard(appt) {
  const { month, day } = formatApptDate(appt.date);
  const isPast  = new Date(appt.date + 'T23:59:59') < new Date();
  const service = SERVICES.find(s => s.id === appt.service) || { label: appt.service, icon: '📅' };
  const doctor  = DOCTORS.find(d => d.id === appt.doctorId) || { name: appt.doctorName || 'Doctor', initials: 'DV' };
  const statusCls = isPast ? 'badge-gray' : 'badge-green';
  const statusLbl = isPast ? 'Completada' : 'Confirmada';

  return `
    <div class="appt-card anim-fade-up" data-appt-id="${appt.id}">
      <div class="appt-date-box">
        <div class="month">${month}</div>
        <div class="day">${day}</div>
      </div>
      <div class="appt-info">
        <div class="appt-title">${service.icon} ${escHtml(service.label)}</div>
        <div class="appt-sub">
          ${escHtml(doctor.name)} · ${escHtml(appt.time || '')}
          ${appt.petName ? ` · 🐾 ${escHtml(appt.petName)}` : ''}
        </div>
        ${appt.notes ? `<div style="font-size:.8rem;color:var(--text-muted);margin-top:4px;font-style:italic;">📝 ${escHtml(appt.notes)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
        <span class="badge ${statusCls}">${statusLbl}</span>
        ${!isPast ? `<button class="btn btn-sm btn-ghost" onclick="confirmCancelAppt('${appt.id}')">Cancelar</button>` : ''}
      </div>
    </div>
  `;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}