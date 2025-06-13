# Ark Business Hub

**Ark Business Hub** es una plataforma multitenant para la gestión de salones de belleza, spas y negocios de bienestar. Cada salón tiene una URL personalizada dentro del dominio principal.

## 🚀 Funcionalidades

- Registro y gestión de múltiples salones (tenants).
- Filtros por tipo de negocio y búsqueda por nombre o slug.
- Rutas dinámicas para cada negocio:

https://tusitio.netlify.app/salon/<slug-del-negocio>

- Acceso protegido por clave (válida durante 3 minutos).
- Interfaz responsiva y moderna construida con **React** + **TailwindCSS**.
- Despliegue fácil en **Netlify**.

---

## 🧱 Estructura del Proyecto

src/
├── components/
│ └── TenantSelector.tsx
├── pages/
│ └── SalonPage.tsx
├── hooks/
│ └── useTenant.ts
├── types/
│ └── tenant.ts
├── utils/
│ └── tenantManager.ts
├── App.tsx
└── main.tsx


---

## 🌐 URLs Dinámicas por Negocio

Cada negocio tiene un slug único, accesible en rutas como:


/salon/<slug>

El componente `SalonPage.tsx` lee el slug desde la URL con `useParams()` y carga dinámicamente la información del negocio correspondiente.

### Ejemplos:

- `/salon/glow-up-studio`
- `/salon/belleza-aurora`

Asegúrate de tener los slugs definidos correctamente en tu fuente de datos (`tenant.slug`).

---

## 🔒 Seguridad de Acceso

Al cargar la app, se solicita una clave para continuar. Este sistema se basa en `localStorage` y verifica si la clave sigue siendo válida.

- Clave de acceso: `Basilisco1`
- Duración de validez: **3 minutos**

```ts
const validDuration = 3 * 60 * 1000; // 3 minutos en milisegundos

⚙️ Despliegue en Netlify
Puedes desplegar la aplicación como un Single Page App (SPA). Para que Netlify soporte rutas dinámicas, asegúrate de tener el archivo netlify.toml con lo siguiente:

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200


Esto permite que cualquier ruta como /salon/belleza-aurora sea correctamente redirigida al index.html, y tu enrutador de React se encargará del resto.

🛠 Instalación Local
Clona el repositorio y ejecuta la aplicación en desarrollo:

git clone https://github.com/tuusuario/ark-business-hub.git
cd ark-business-hub
npm install
npm run dev




✨ Autor
Este proyecto fue creado por Cristian Escamilla.





