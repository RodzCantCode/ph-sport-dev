# PH Sport Dashboard

Dashboard simple para el equipo de diseño de PH Sport.

## Características

- Login demo (cualquier email/contraseña)
- Dashboard básico con datos mock
- Sin dependencias complejas
- Diseño limpio y funcional

## Instalación

```bash
npm install
npm run dev
```

## Scripts disponibles

| Comando              | Descripción                                           |
|----------------------|-------------------------------------------------------|
| `npm run dev`        | Inicia el servidor de desarrollo en `localhost:3000`. |
| `npm run build`      | Crea el build de producción.                          |
| `npm run start`      | Arranca el server con el build generado.              |
| `npm run lint`       | Ejecuta ESLint sobre todo el proyecto.                |
| `npm run lint:fix`   | Aplica fixes automáticos de ESLint cuando sea posible.|
| `npm run type-check` | Ejecuta `tsc --noEmit` para validar tipos.            |
| `npm run clean`      | Limpia la carpeta `.next` usando `rimraf`.            |

## Organización del código

```
app/                          # Rutas (App Router de Next.js)
  api/                        # Endpoints mock (REST)
  designs/, dashboard/, ...   # Páginas principales
components/
  ui/                         # Componentes presentacionales reutilizables
  layout/                     # Shell (sidebar, header, etc.)
  features/
    account/                  # Diálogos de perfil/configuración
    designs/                  # Kanban, diálogos y calendario de diseños
lib/
  auth/                       # Helpers de autenticación demo
  data/                       # Mock data centralizada (`data/mock-data.ts`)
  services/                   # Lógica de negocio (ej. asignación automática)
  utils/                      # Helpers de formato/utilidades
```

## Tailwind y PostCSS

- Las directivas `@tailwind base/components/utilities` se procesan vía PostCSS (`postcss.config.js`).
- Para evitar falsos positivos de VS Code con `@tailwind`, se incluye `.vscode/settings.json` con `css.lint.unknownAtRules: "ignore"`.
- `tailwind.config.ts` ya indexa `app/`, `components/` y `content` para el purge.

## Datos demo

Los mocks viven en `lib/data/mock-data.ts` y alimentan tanto las páginas (`app/*`) como los servicios en `lib/services/designs/assignment.ts`.
Puedes ampliarlos rápidamente para prototipos mientras se integra Supabase.