# 🚀 Guía de Despliegue - PH Sport Dashboard

## Desplegar en Vercel (Gratis)

### 1. Preparar el código para GitHub

```bash
# Inicializar git (si no lo has hecho)
git init
git add .
git commit -m "Initial commit - PR#1 Setup"

# Crear repo en GitHub
# Luego:
git remote add origin https://github.com/TU_USUARIO/ph-sport-dashboard.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) y regístrate (es gratis)
2. Click en "Add New" → "Project"
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio `ph-sport-dashboard`
5. Click "Import"

### 3. Configurar Variables de Entorno

En Vercel, en la página de tu proyecto:

**Settings → Environment Variables**, añade:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
NEXT_PUBLIC_APP_URL=https://ph-sport-dashboard.vercel.app
```

### 4. Configurar Supabase

1. Ve a tu Dashboard de Supabase
2. **Authentication → URL Configuration**
3. **Site URL**: `https://ph-sport-dashboard.vercel.app`
4. **Redirect URLs**: `https://ph-sport-dashboard.vercel.app/**`
5. Guarda

### 5. Desplegar

1. Click en "Deploy" en Vercel
2. Espera 2-3 minutos
3. Obtendrás un link: `https://ph-sport-dashboard.vercel.app`

## ✅ Checklist Pre-Deploy

- [ ] Código en GitHub
- [ ] Variables de entorno en Vercel
- [ ] Site URL configurado en Supabase
- [ ] Redirect URLs configurados
- [ ] Email Provider habilitado en Supabase
- [ ] "Confirm email" desactivado (para testing)

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Verifica que las variables de entorno estén bien en Vercel
- Revisa que no haya espacios extra en las keys

### Error: "Failed to fetch"
- Verifica que Site URL y Redirect URLs estén bien en Supabase
- Espera unos minutos (DNS puede tardar)

### Error: "ERR_NAME_NOT_RESOLVED"
- El proyecto de Supabase podría estar pausado
- Ve al dashboard y reactívalo

## 📝 Notas

- **Preview deployments**: Vercel crea un preview para cada PR
- **Branch protection**: Puedes configurar para que solo `main` se despliegue
- **Domain personalizado**: Puedes añadir tu propio dominio

## 🎯 Próximos Pasos

Una vez desplegado:
1. Prueba el login con email/contraseña
2. Si funciona, podemos continuar con PR#2 (tablas SQL)
3. Si falla, revisa los logs en Vercel Dashboard


