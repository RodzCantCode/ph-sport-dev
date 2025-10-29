# 🎭 Modo DEMO - Instrucciones

## ¿Qué es el Modo DEMO?

El modo DEMO te permite usar la aplicación con **datos de prueba** sin necesidad de configurar Supabase. Es perfecto para:

- ✅ Demostraciones al cliente
- ✅ Desarrollo sin BD
- ✅ Testing rápido
- ✅ Onboarding de nuevos desarrolladores

## 🎛️ Cómo Activar/Desactivar

### Modo DEMO activado (datos de prueba)
```env
NEXT_PUBLIC_DEMO_MODE=true
```

### Modo DEMO desactivado (Supabase real)
```env
NEXT_PUBLIC_DEMO_MODE=false
```

## 📋 Datos de Prueba Incluidos

### Usuarios:
- **Eva Martinez** (eva@phsport.com) - Manager
- **Izan Amez** (izan@phsport.com) - Designer
- **Luis** (luis@phsport.com) - Designer
- **Pau** (pau@phsport.com) - Designer
- **Lorenzo** (lorenzo@phsport.com) - Designer

### Partidos:
- Real Madrid CF (próximo)
- Atletico Madrid (próximo)
- Sevilla FC (próximo)

### Tareas (Assets):
- Matchday designs
- Result graphics
- MVP graphics
- Social media content

## 🔧 Cómo Usar

### 1. Verificar Modo Actual

El banner **"DEMO MODE"** aparece en el header cuando está activo.

### 2. Login en Modo DEMO

Cualquier email/contraseña funciona. El rol se determina automáticamente:
- Contiene "eva" o "manager" → Rol manager
- Otros → Rol designer

**Ejemplos:**
- `eva@phsport.com` / `123` → Manager
- `izan@phsport.com` / `123` → Designer

### 3. Cuando Pasar a Producción

1. Configura Supabase real
2. Cambia `NEXT_PUBLIC_DEMO_MODE=false` en `.env.local`
3. En producción, NO incluyas esta variable (o ponla en `false`)
4. Los datos mock NO aparecerán

## ⚠️ Importante

- **En producción**: El modo DEMO debe estar DESACTIVADO
- **Para demos al cliente**: Actívalo temporalmente
- **Los datos mock son solo para testing**

## 🧹 Limpiar Datos de Demo

Cuando desactives el modo DEMO:
- Todos los datos mock desaparecen
- Solo verás datos reales de Supabase
- Si no hay datos en Supabase, todo estará vacío

## 📝 Notas

- El modo DEMO NO afecta a las migraciones SQL
- Puedes alternar entre demo y real sin problemas
- El cliente NO verá datos de demo si está desactivado


