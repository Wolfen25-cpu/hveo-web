<div align="center">

# 🐾 HVEO+ — Hospital Veterinario del Oeste

### Portal digital para una clínica veterinaria

*Un demo de aplicación web completa: autenticación, gestión de mascotas, agendamiento de citas y blog de salud animal — construido con HTML, CSS y JavaScript vanilla sobre Firebase.*

[![Live Demo](https://img.shields.io/badge/🌐_Demo_en_vivo-2e7d32?style=for-the-badge)](https://wolfen25-cpu.github.io/hveo-web/)
&nbsp;
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
&nbsp;
[![No build step](https://img.shields.io/badge/no_build_step-vanilla_JS-0E719A?style=for-the-badge)](#)

📍 *Añasco, Puerto Rico (proyecto demo / ficticio)*

</div>

---

## ✨ Lo que incluye

- **Portal completo de clientes** — registro, login, recuperación de contraseña, edición de perfil con foto
- **Gestión de mascotas** — CRUD con tipo, raza, edad, fechas de vacunas y medicación
- **Recordatorios automáticos** — alertas visuales cuando una vacuna o medicamento está próximo a vencer
- **Agendamiento online** — flujo guiado: doctor → servicio → mascota → fecha → hora, con validación
- **Blog educativo** — 7 artículos de salud animal (vacunas, ansiedad, nutrición, geriatría, emergencias, etc.)
- **Mapa interactivo** — Google Maps embebido en la página de servicios
- **Diseño responsive completo** — desktop, tablet y móvil con drawer lateral en pantallas pequeñas
- **Accesibilidad** — soporte para `prefers-reduced-motion`, navegación por teclado, alt text, focus visibles
- **Toggle de visibilidad de contraseña** — custom inline SVG (perrito con ojos abiertos/cerrados 🐶)
- **Subida de foto de perfil** — redimensionada en cliente vía Canvas, almacenada en Firestore como base64

## 🛠️ Stack

| Frontend | Backend | Hosting |
|---|---|---|
| HTML5 + CSS variables | Firebase Auth (Email/Password) | GitHub Pages |
| Vanilla JS ES Modules | Cloud Firestore | — |
| Google Fonts (Syne + DM Sans) | — | — |

**Sin frameworks, sin bundlers, sin build step.** Cada archivo `.js` se carga directamente como módulo ES6 desde el navegador.

## 🏃 Correr localmente

Los módulos ES6 no funcionan con `file://`, así que necesitas un servidor estático:

**VS Code Live Server (lo más fácil):**
Instala la extensión *Live Server*, clic derecho en `index.html` → "Open with Live Server".

**Python:**
```bash
python -m http.server 3000
# → http://localhost:3000
```

**Node:**
```bash
npx serve .
```

## 📁 Estructura

```
hveo-web/
├── index.html              # Landing
├── login.html · register.html
├── dashboard.html          # 🔒 Portal del cliente
├── pets.html               # 🔒 Mascotas (CRUD)
├── appointments.html       # 🔒 Citas (booking + listado)
├── profile.html            # 🔒 Editar perfil + foto + contraseña
├── services.html · about.html · blog.html
│
├── css/
│   ├── main.css            # Design system, variables, globales
│   └── components.css      # Navbar, sidebar, cards, FAB
│
├── js/
│   ├── firebase-config.js  # ⚙️  Config de Firebase
│   ├── utils.js            # Toast, auth guard, navbar/footer, password toggle
│   ├── auth.js             # Login + registro
│   ├── pets.js             # CRUD mascotas + recordatorios
│   └── appointments.js     # Booking + cancelación
│
└── img/
    ├── logo/               # Logo de la marca
    └── blog/               # Imágenes de los artículos
```

## 🔥 Configurar Firebase (si forkeas el repo)

<details>
<summary><b>Pasos completos</b> (clic para expandir)</summary>

### 1. Crear proyecto

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
2. Desactiva Google Analytics si no lo necesitas

### 2. Registrar app web

1. En el proyecto, clic en `</>` (Web) → registra la app
2. Copia el objeto `firebaseConfig`

### 3. Editar `js/firebase-config.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Activar Authentication

Authentication → **Sign-in method** → habilitar **Email/Password**

### 5. Crear Firestore

Firestore Database → **Create database** → producción → región más cercana

### 6. ⚠️ Publicar Security Rules

Sin estas reglas, cualquier usuario autenticado puede leer/editar datos de otros. **Es obligatorio:**

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }

    match /pets/{petId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId
        && (request.method != 'update'
            || request.resource.data.userId == resource.data.userId);
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }

    match /appointments/{apptId} {
      allow read, update, delete: if request.auth != null
        && request.auth.uid == resource.data.userId
        && (request.method != 'update'
            || request.resource.data.userId == resource.data.userId);
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 7. Autorizar tu dominio

Authentication → Settings → **Authorized domains** → agrega tu dominio (`localhost` ya está; añade el de GitHub Pages u otro host).

</details>

## 🎨 Design tokens

<details>
<summary>Paleta y escala (clic para expandir)</summary>

| Token | Hex | Uso |
|---|---|---|
| `--blue` | `#0E719A` | Color primario (CTAs, links activos) |
| `--dark-blue` | `#053D58` | Headers, footer, gradientes |
| `--accent` | `#BE806F` | Highlights, secundario |
| `--gray` | `#4E5255` | Texto neutral |
| `--bg` | `#F7F5F4` | Fondo de página |
| `--surface` | `#FFFFFF` | Tarjetas |

**Fuentes:** Syne (display, headers, marcas) + DM Sans (body).

**Spacing:** escala fluida con `clamp()` para que respiren bien en cualquier viewport.

</details>

## 👥 Equipo (ficticio)

- **Dr. Adrian Galloza** — DVM, Cirugía & Medicina General
- **Dra. Nicole Guzmán** — DVM, Medicina Preventiva

## 📜 Notas

Este es un **proyecto académico/portafolio**. La clínica HVEO+ es ficticia — cualquier parecido con clínicas reales es coincidencia. Las imágenes del blog deben ser provistas por el desarrollador (placeholders fallback a emoji si faltan).

---

<div align="center">

*Construido con ☕ en Aguadilla, PR · Hospital Veterinario del Oeste — Añasco, Puerto Rico 🇵🇷*

</div>
