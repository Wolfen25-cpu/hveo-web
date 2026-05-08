# HVEO+ — Hospital Veterinario del Oeste
## Portal Digital de Clientes

---

## 📁 Estructura del Proyecto

```
hveo-plus/
├── index.html              → Landing page / Home
├── login.html              → Inicio de sesión
├── register.html           → Registro de cuenta
├── dashboard.html          → Portal principal del cliente (🔒 protegido)
├── pets.html               → Gestión de mascotas (🔒 protegido)
├── appointments.html       → Citas en línea (🔒 protegido)
├── profile.html            → Perfil del usuario (🔒 protegido)
├── services.html           → Página de servicios (pública)
├── about.html              → Sobre nosotros, visión y misión (pública)
├── blog.html               → Blog con artículos educativos (pública)
│
├── css/
│   ├── main.css            → Design system, variables, estilos globales
│   └── components.css      → Navbar, sidebar, tarjetas, componentes UI
│
└── js/
    ├── firebase-config.js  → ⚠️ Configuración de Firebase (requiere setup)
    ├── utils.js            → Navbar, footer, toast, auth guard, helpers
    ├── auth.js             → Login & registro con Firebase Auth
    ├── pets.js             → CRUD de mascotas con Firestore
    └── appointments.js     → Sistema de citas con Firestore
```

---

## 🔥 Configuración de Firebase (REQUERIDO)

### Paso 1 — Crear proyecto en Firebase

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com)
2. Clic en **"Add project"** → escribe el nombre (ej: `hveo-plus`)
3. Desactiva Google Analytics si no lo necesitas → **"Create project"**

### Paso 2 — Registrar app web

1. En el dashboard del proyecto → clic en el ícono **`</>`** (Web)
2. Escribe un nombre (ej: `hveo-web`) → **"Register app"**
3. Copia el objeto `firebaseConfig` que aparece

### Paso 3 — Editar `js/firebase-config.js`

Reemplaza los valores con los tuyos:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Paso 4 — Activar Authentication

1. En Firebase Console → **"Authentication"** → **"Get started"**
2. **"Sign-in method"** → Habilitar **Email/Password** → Guardar

### Paso 5 — Crear Firestore Database

1. Firebase Console → **"Firestore Database"** → **"Create database"**
2. Selecciona **"Start in test mode"** (para desarrollo)
3. Elige una región → **"Enable"**

### Paso 6 — Reglas de Firestore (Security Rules)

En **Firestore → Rules**, pega estas reglas básicas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Pets belong to users
    match /pets/{petId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    // Appointments belong to users
    match /appointments/{apptId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🚀 Cómo Correr el Proyecto

### Opción A — VS Code Live Server (Recomendado)

1. Instala la extensión **"Live Server"** en VS Code
2. Clic derecho en `index.html` → **"Open with Live Server"**
3. El proyecto abre en `http://127.0.0.1:5500`

### Opción B — Python HTTP Server

```bash
# En la carpeta del proyecto
python3 -m http.server 3000
# Abre: http://localhost:3000
```

### Opción C — Node.js serve

```bash
npm install -g serve
serve .
# Abre: http://localhost:3000
```

> ⚠️ **IMPORTANTE:** Los módulos ES6 (`import/export`) **no funcionan** si abres los archivos directamente (`file://`). Siempre usa un servidor local.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de páginas |
| CSS3 + CSS Variables | Design system, animaciones |
| JavaScript ES6+ Modules | Lógica de la app |
| Firebase Authentication | Login / Registro |
| Cloud Firestore | Base de datos (mascotas, citas) |
| Google Fonts (Syne + DM Sans) | Tipografía |

---

## 📄 Páginas del Sistema

| Página | URL | Acceso |
|---|---|---|
| Home | `index.html` | Público |
| Login | `login.html` | Público |
| Registro | `register.html` | Público |
| Dashboard | `dashboard.html` | 🔒 Autenticado |
| Mascotas | `pets.html` | 🔒 Autenticado |
| Citas | `appointments.html` | 🔒 Autenticado |
| Perfil | `profile.html` | 🔒 Autenticado |
| Servicios | `services.html` | Público |
| Sobre Nosotros | `about.html` | Público |
| Blog | `blog.html` | Público |

---

## 🎨 Paleta de Colores

| Variable | Color | Hex |
|---|---|---|
| `--gray` | Gris principal | `#4E5255` |
| `--blue` | Azul principal | `#0E719A` |
| `--light-gray` | Gris claro | `#C2B7B5` |
| `--dark-blue` | Azul oscuro | `#053D58` |
| `--accent` | Beige/terracota | `#BE806F` |

---

## 👥 Equipo Fundador

- **Dr. Adrian Galloza** — DVM, Cirugía & Medicina General
- **Dra. Nicole Guzmán** — DVM, Medicina Preventiva & Gestión

---

*HVEO+ — Hospital Veterinario del Oeste+ | Añasco, Puerto Rico 🇵🇷*
