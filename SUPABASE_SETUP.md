# Configuración de Supabase

Este documento explica cómo configurar Supabase para el proyecto PH Sport Dashboard.

**NOTA IMPORTANTE**: Supabase es un servicio en la nube, NO necesitas crear carpetas locales. Todo funciona desde supabase.com

## 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (si no la tienes)
2. Crea un nuevo proyecto:
   - Nombre: `PH Sport Dashboard`
   - Base de datos: selecciona la región más cercana
   - Contraseña: guárdala en un lugar seguro
   - ⚠️ **NO necesitas descargar ni instalar nada**: todo funciona desde la web

## 2. Obtener Credenciales

1. Una vez creado el proyecto, ve a **Settings > API**
2. Copia los siguientes valores:
   - **Project URL**: Es tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Es tu `SUPABASE_SERVICE_ROLE_KEY` (⚠️ mantener secreto)

3. Crea el archivo `.env.local` en la raíz del proyecto:
   ```bash
   # Copia .env.example a .env.local y rellena los valores
   ```

## 3. Configurar Autenticación

### Opción A: Email/Contraseña (Actualmente Activa)

No necesitas configuración adicional. El sistema usa Email/Password por defecto.
Puedes usar cualquier email/contraseña (se creará automáticamente la primera vez).

### Opción B: Google OAuth (Pausado Temporalmente)

1. En Supabase, ve a **Authentication > Providers**
2. Activa el proveedor **Google**
3. Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto (o usa uno existente)
   - Habilita la **Google+ API**
   - Ve a **Credentials > Create Credentials > OAuth Client ID**
   - Tipo: **Web application**
   - Authorized redirect URIs:
     - `https://<tu-proyecto-id>.supabase.co/auth/v1/callback` (para producción)
     - `http://localhost:3000/api/auth/callback` (para desarrollo)
4. Copia el **Client ID** y **Client Secret**
5. Pega estos valores en Supabase (Authentication > Providers > Google)

## 4. Configurar Tablas (PR#2)

En PR#2 se añadirán las migraciones SQL para crear las siguientes tablas:
- `users`
- `matches`
- `asset_types`
- `assets`
- `approvals`
- `events_log`

Por ahora, el login con Google funcionará pero no guardará los datos en la BD personalizada.

## 5. Variables de Entorno

Tu archivo `.env.local` debe verse así:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Verificar Instalación

1. Ejecuta `npm run dev`
2. Abre http://localhost:3000
3. Haz clic en "Continuar con Google"
4. Deberías ser redirigido a Google para autenticarte
5. Después del login, serás redirigido a `/dashboard`

## Solución de Problemas

### Error: "Invalid API key"
- Verifica que hayas copiado correctamente las claves de Supabase
- Asegúrate de que `.env.local` existe en la raíz del proyecto

### Error: "Redirect URI mismatch"
- Verifica que la URL de redirect en Google Cloud Console coincida con la que has configurado en Supabase
- Incluye tanto `localhost:3000` para desarrollo como tu dominio de producción

### Error: "Email not confirmed"
- En desarrollo, puedes desactivar la confirmación de email en Supabase:
  - Ve a **Authentication > Settings**
  - Desactiva "Enable email confirmations"

### Error: Session not found
- Limpia las cookies del navegador
- Verifica que el middleware esté configurado correctamente

## Próximos Pasos

Una vez configurado Supabase, puedes:
1. Probar el login con Google
2. Ver las páginas placeholder en `/dashboard`, `/my`, `/team`, `/matches`
3. Esperar PR#2 para las migraciones SQL y modelo de datos

