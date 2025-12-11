# PH Sport Dashboard

Dashboard para el equipo de diseño de PH Sport.

## Características

- **Gestión de Diseños**: Kanban, lista y vistas de calendario.
- **Backend Real**: Integración completa con Supabase (PostgreSQL).
- **Autenticación**: Sistema de usuarios y roles (Manager/Designer) vía Supabase Auth.
- **Asignación Inteligente**: Algoritmo de reparto de tareas basado en carga de trabajo.
- **UI Moderna**: Tailwind CSS, Shadcn UI, Framer Motion.

## Requisitos Previos

- Node.js 18+
- Cuenta de Supabase

## Configuración

1.  Clonar el repositorio.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Configurar variables de entorno en `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    ```
4.  Iniciar servidor de desarrollo:
    ```bash
    npm run dev
    ```

## Scripts disponibles

| Comando              | Descripción                                           |
| -------------------- | ----------------------------------------------------- |
| `npm run dev`        | Inicia el servidor de desarrollo en `localhost:3000`. |
| `npm run build`      | Crea el build de producción.                          |
| `npm run start`      | Arranca el server con el build generado.              |
| `npm run lint`       | Ejecuta ESLint sobre todo el proyecto.                |
| `npm run type-check` | Valida tipos TypeScript.                              |

## Organización del código

```
app/                          # Rutas (App Router) & API Routes
  api/                        # Endpoints reales (conectan con DB)
  dashboard/                  # Vista Manager
  my-week/                    # Vista Designer
components/
  ui/                         # Componentes base (Shadcn)
  features/                   # Componentes de negocio (Tableros, Cards)
lib/
  supabase/                   # Cliente y utilidades de conexión
  services/                   # Lógica de negocio server-side
  hooks/                      # Hooks de react (data fetching)
```
