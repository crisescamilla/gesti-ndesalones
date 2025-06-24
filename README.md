# Sistema de Registro y Consulta de Negocios (SRCN)

Aplicación web para la gestión de salones de belleza y negocios similares, con soporte multi-tenant, notificaciones por correo/SMS y panel administrativo.

---

## Características

- Registro y gestión de múltiples negocios (multi-tenant)
- Panel de administración para cada negocio
- Gestión de citas, personal, servicios y recompensas
- Confirmación de citas por correo electrónico y SMS (requiere configuración de backend)
- Autenticación y control de acceso
- Interfaz moderna con React, TypeScript, Vite y TailwindCSS
- Backend y base de datos con Supabase
- Soporte para Edge Functions (notificaciones y lógica personalizada)

---

## Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <URL-del-repo>
   cd project
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura Supabase:**
   - Crea un proyecto en [Supabase](https://supabase.com/)
   - Crea las tablas necesarias (`tenants`, `clientes`, `citas`, etc.)
   - Copia tu URL y anon key en `src/utils/supabaseClient.ts`:

     ```typescript
     import { createClient } from '@supabase/supabase-js'
     const supabaseUrl = 'https://<tu-proyecto>.supabase.co'
     const supabaseKey = '<tu-anon-key>'
     export const supabase = createClient(supabaseUrl, supabaseKey)
     ```

4. **Inicia la app:**
   ```bash
   npm run dev
   ```

   La app estará disponible en [http://localhost:5173](http://localhost:5173)

---

## Notificaciones en tiempo real (correo/SMS)

Para enviar confirmaciones de cita por correo o SMS:

- Implementa una función backend (Node.js, Supabase Edge Function, etc.)
- Usa servicios como [SendGrid](https://sendgrid.com/) (correo) y [Twilio](https://www.twilio.com/) (SMS)
- Llama a la función desde el frontend al agendar una cita

---

## Estructura de carpetas

```
src/
components/ # Componentes React
data/ # Datos estáticos
hooks/ # Custom hooks
types/ # Definiciones de tipos TypeScript
utils/ # Utilidades y cliente Supabase
index.css # Estilos globales
main.tsx # Entry point
---

## Multi-tenant

- Todas las tablas principales incluyen el campo `tenant_id`
- Las consultas y escrituras siempre filtran por `tenant_id`
- Cada negocio ve solo sus propios datos

---

## Seguridad

- No expongas claves privadas en el frontend
- Usa Row Level Security (RLS) en Supabase para proteger los datos por tenant
- Implementa autenticación para acceso seguro

---

## Contribuciones

¡Las contribuciones son bienvenidas!  
Abre un issue o pull request para sugerencias, mejoras o reportar bugs.

---

## Licencia

MIT

---

## Contacto

Desarrollado por [Cristian Escamilla]  
Soporte: cescamilla@arkusnexus.com
