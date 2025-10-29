# 🚀 Inicio Rápido - PH Sport Dashboard

## ✅ Pasos para Empezar (5 minutos)

### 1. Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto (toma 2 minutos)
3. Ve a **Settings > API**
4. Copia estos valores:
   - `Project URL` (ejemplo: `https://xxxxx.supabase.co`)
   - `anon/public key` (empieza con `eyJhbGc...`)

### 2. Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto con este contenido:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **Importante**: No necesitas configurar Google OAuth ni descargar nada. Todo está listo para usar Email/Password.

### 3. Iniciar el Proyecto

```bash
npm run dev
```

### 4. Acceder a la Aplicación

1. Abre http://localhost:3000
2. Usa cualquier email/contraseña para login (ejemplo: `eva@phsport.com` / `password123`)
3. La primera vez, se creará la cuenta automáticamente

### 5. ¡Listo! 🎉

Ya puedes navegar por las páginas:
- `/dashboard` - Dashboard del equipo
- `/my` - Calendario personal
- `/team` - Gestión del equipo
- `/matches` - Partidos

## 📋 Preguntas Frecuentes

**¿Necesito crear carpetas para Supabase?**
❌ NO. Supabase es un servicio en la nube. Solo necesitas crear el proyecto en supabase.com y copiar las credenciales.

**¿Funciona Google Login?**
⚠️ Temporalmente pausado. Ahora funciona con Email/Password. Google se puede activar después si lo necesitas.

**¿Qué pasa si olvido la contraseña?**
En Supabase Dashboard > Authentication > Users puedes resetear contraseñas de usuarios.

**¿Cómo añado más usuarios?**
Por ahora, usa cualquier email/contraseña para crear una cuenta. En PR#2 se añadirá sistema completo de usuarios.

## 🔧 Solución de Problemas

**Error: "Invalid API key"**
- Verifica que `.env.local` existe en la raíz del proyecto
- Verifica que copiaste las credenciales correctamente desde Supabase

**Error: "Connection refused"**
- Asegúrate de que el servidor esté corriendo con `npm run dev`
- Verifica que no estés usando otro puerto (por defecto es 3000)

**La página está en blanco**
- Abre la consola del navegador (F12) para ver errores
- Verifica que las variables de entorno estén configuradas

## 📞 ¿Necesitas Ayuda?

- Revisa `README.md` para documentación completa
- Revisa `SUPABASE_SETUP.md` para configuración avanzada
- Revisa `PROYECTO.md` para ver el estado del proyecto


