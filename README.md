# Sistema de Gestión de Salones (SRCN)

Una aplicación web moderna para la gestión integral de salones de belleza, spas, barberías y centros de bienestar con soporte multi-tenant.

## 🚀 Características

- **Gestión Multi-Tenant**: Cada negocio tiene su propio espacio y configuración
- **Panel de Administración**: Gestión completa de citas, personal, servicios y clientes
- **Sistema de Citas**: Agendamiento, confirmaciones y recordatorios
- **Gestión de Personal**: Control de empleados, horarios y especialidades
- **Sistema de Recompensas**: Programa de fidelización para clientes
- **Configuraciones Personalizables**: Marca, colores y configuraciones por negocio
- **Interfaz Moderna**: Diseño responsivo con React, TypeScript y TailwindCSS
- **Base de Datos en Tiempo Real**: Supabase para sincronización instantánea

## 🛠 Tecnologías

- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: TailwindCSS
- **Backend**: Supabase (Base de datos, autenticación, Edge Functions)
- **Iconos**: Lucide React
- **Despliegue**: Netlify

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta en Supabase

### Pasos de instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/crisescamilla/gesti-ndesalones.git
   cd gesti-ndesalones
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com/)
   - Configura las tablas necesarias (tenants, citas, clientes, etc.)
   - Actualiza las credenciales en `src/utils/supabaseClient.ts`

4. **Ejecuta en desarrollo**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador**
   - La aplicación estará disponible en `http://localhost:5173`

## 🏗 Estructura del Proyecto


src/
├── components/ # Componentes React
│ ├── AccessControl.tsx
│ ├── AdminPanel.tsx
│ ├── AppointmentForm.tsx
│ ├── Dashboard.tsx
│ └── ...
├── hooks/ # Custom hooks
│ ├── useSalonSettings.ts
│ ├── useStaffData.ts
│ └── useTenant.ts
├── types/ # Definiciones TypeScript
│ ├── index.ts
│ └── tenant.ts
├── utils/ # Utilidades y configuraciones
│ ├── supabaseClient.ts
│ ├── auth.ts
│ └── ...
└── data/ # Datos estáticos
├── services.ts
└── staff.ts


## �� Configuración

### Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Base de Datos
Configura las siguientes tablas en Supabase:
- `tenants` - Información de los negocios
- `citas` - Citas y reservaciones
- `clientes` - Información de clientes
- `personal` - Empleados del negocio
- `servicios` - Servicios ofrecidos

## 🚀 Despliegue

### Netlify (Recomendado)
1. Conecta tu repositorio de GitHub a Netlify
2. Configura:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Agrega las variables de entorno en Netlify
4. ¡Listo! Tu sitio se desplegará automáticamente

### Otros proveedores
- **Vercel**: Similar a Netlify
- **Firebase Hosting**: Para proyectos con Firebase
- **GitHub Pages**: Para sitios estáticos

## 📱 Uso

### Para Administradores
1. Accede con la clave de autorización
2. Registra tu negocio en el sistema
3. Configura servicios, personal y horarios
4. Gestiona citas y clientes desde el panel

### Para Clientes
1. Accede a la URL personalizada de tu salón
2. Selecciona servicio y fecha
3. Confirma tu cita
4. Recibe confirmación por email/SMS

## 🔒 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) para separación de datos por tenant
- Validación de datos en frontend y backend
- Claves de API seguras en variables de entorno

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! 

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Cristian Escamilla**
- Email: cescamilla@arkusnexus.com
- GitHub: [@crisescamilla](https://github.com/crisescamilla)

## 🙏 Agradecimientos

- [Supabase](https://supabase.com/) por la infraestructura backend
- [TailwindCSS](https://tailwindcss.com/) por el framework de estilos
- [Vite](https://vitejs.dev/) por la herramienta de build
- [React](https://reactjs.org/) por el framework de UI

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un [issue](https://github.com/crisescamilla/gesti-ndesalones/issues) en GitHub
- Contacta directamente: cescamilla@arkusnexus.com

---

⭐ **Si este proyecto te ayuda, considera darle una estrella en GitHub**



