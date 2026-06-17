# gestion-personal-sytec-web

Frontend React + Vite + TypeScript. Mantiene la interfaz original y consume la API NestJS.

El login visible y funcional es por `CUIL + contraseña`.

## Instalacion Local

```bash
pnpm install
copy .env.example .env
pnpm run dev
```

La web levanta en `http://localhost:3000`.

## Variables

```env
VITE_API_URL=http://localhost:4000
```

## Build

```bash
pnpm run build
```

## Integracion

- Login: `POST /auth/login`.
- Token JWT: guardado en `localStorage` y enviado como `Authorization: Bearer`.
- Logout: elimina el token local.
- Dashboards: consumen endpoints reales de empleados, proyectos, partes, licencias y paro.
- Runtime eliminado: Firebase, `/api/db`, carga operativa de `db-store.json` y guardado masivo de estado.

## Puertos Locales

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

## Docker

Pendiente para una verificacion posterior. Esta revision local no depende de Docker.
