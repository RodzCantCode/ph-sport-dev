# 🚀 Configuración de Supabase - PH Sport Dashboard

## Paso 1: Obtener credenciales del proyecto

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu nuevo proyecto
3. Click en **⚙️ Project Settings** (barra lateral)
4. Click en **API**
5. Copia estos valores:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** (en "Project API keys")

## Paso 2: Configurar variables de entorno

Abre `.env.local` en la raíz del proyecto y añade/actualiza:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui

# Demo Mode
# true = datos mock (desarrollo)
# false = Supabase real (demos al cliente)
NEXT_PUBLIC_DEMO_MODE=true
```

## Paso 3: Crear estructura de base de datos

1. En Supabase, ve a **SQL Editor** (icono </> en la barra lateral)
2. Click en **➕ New Query**
3. Copia y pega el contenido del archivo `SETUP_DATABASE.sql`
4. Click en **▶ Run** (o presiona `Ctrl+Enter`)
5. Deberías ver "Success. No rows returned"

## Paso 4: Verificar instalación

En el SQL Editor, ejecuta:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Deberías ver estas tablas:

- `profiles`
- `designs`
- `audit_log`
- `settings`
- `asset_types`
- `matches`
- `assets`

## Paso 5: Crear tu primer usuario admin

En el SQL Editor, ejecuta (reemplaza los datos):

```sql
-- 1. Primero crea el usuario en Authentication > Add User (email + password)
-- 2. Luego copia su UUID y ejecuta:

INSERT INTO public.profiles (id, full_name, role)
VALUES ('UUID-DEL-USUARIO-AQUI', 'Tu Nombre', 'ADMIN');
```

## Paso 6: Testar la conexión

1. En tu terminal, reinicia el servidor:

   ```bash
   npm run dev
   ```

2. Cambia temporalmente en `.env.local`:

   ```bash
   NEXT_PUBLIC_DEMO_MODE=false
   ```

3. Reinicia de nuevo el servidor

4. Abre la app y verifica que no hay errores en la consola

---

## 🔄 Alternar entre Demo/Real

**Modo Demo** (desarrollo rápido):

```bash
NEXT_PUBLIC_DEMO_MODE=true
```

**Modo Real** (demos al cliente):

```bash
NEXT_PUBLIC_DEMO_MODE=false
```

Recuerda reiniciar el servidor después de cambiar esta variable.
