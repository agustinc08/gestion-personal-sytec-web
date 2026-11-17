# Migración a VPS-05

## Cómo quedó en VPS-05

- CI (`.github/workflows/ci.yml`, con `sytec-pjn/ci-workflows`): push a `dev` construye `dev-<sha7>` y lo despliega; push a `main` construye `prod-<sha7>`; prod (y rollback) se despliega con *Run workflow* indicando el tag.
- El prefijo y la URL de la API se fijan en el build (`BASE_PATH`, `VITE_API_URL`) desde las variables del repo `APP_PATH_*` y `API_PATH_*`: prod `/gestion-personal-sytec/` + `/gestion-personal-sytec-api`, dev `/gestion-personal-sytec-dev/` + `/gestion-personal-sytec-api-dev`. Sin variables quedan los de prod.
- Imagen: build con Vite servido por nginx en el puerto 80 (en VPS-04 era `vite preview` en el 3000). Traefik (compose en `deploy/`) saca el prefijo y rutea la API directo a su contenedor.
