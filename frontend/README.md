# Lectur — Frontend

React 19 + Vite + Tailwind v4 + React Router. Se conecta a la API (`lectur-backend`) con `fetch` escrito a mano (`src/lib/api.js`).

## Cómo correrlo

1. Levantá el backend (ver `lectur-backend/README.md`) en http://localhost:3000.
2. Copiá `.env.example` a `.env` (la URL de la API está en `VITE_API_URL`).
3. `npm install` y `npm run dev` → http://localhost:5173

## Vistas

- **Alumno**: lecturas asignadas, lectura, cuestionario (si el docente lo asignó), diccionario.
- **Docente**: semáforo del curso con notas opcionales, asignación de textos (con o sin cuestionario), textos precargados y "Mis textos" (propios y privados).

Scripts: `dev`, `build`, `lint`, `format`.
