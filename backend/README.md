# Lectur — Backend

API en Node 22 + Express 5 + PostgreSQL. Roles `docente` y `alumno`, textos con cuestionario opcional, semáforo, notas y diccionario.

## Con Docker (recomendado)

```bash
docker compose up --build -d
docker compose exec api node src/seed.js --demo   # textos, definiciones y usuarios de prueba
```

API en http://localhost:3000/api/health

## Sin Docker

Necesitás un PostgreSQL local y un `.env` (copiá `.env.example`).

```bash
npm install
npm run seed:demo   # aplica migraciones y carga datos de prueba
npm run dev
```

## Usuarios de prueba (solo desarrollo)

Contraseña de todos: `lectur1234`

- Docente: `docente@lectur.test`
- Alumnos: `mateo@lectur.test`, `sofia@lectur.test`, `lucas@lectur.test`

## Endpoints

| Método | Ruta | Rol |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/registro-docente` | — |
| GET | `/api/auth/me` | todos |
| GET/POST | `/api/textos`, GET/PUT/DELETE `/api/textos/:id` (PUT solo textos propios) | docente |
| POST | `/api/docente/alumnos` | docente |
| GET/PUT/DELETE | `/api/docente/alumnos/:id` | docente |
| PUT | `/api/docente/alumnos/:id/password` | docente |
| GET | `/api/docente/alumnos/:id/historial` (detalle por pregunta) | docente |
| GET | `/api/docente/alumnos/:id/palabras`, `/api/docente/palabras` (curso) | docente |
| GET | `/api/docente/alumnos/:id/resumen` (resumen para familias) | docente |
| PATCH/DELETE | `/api/docente/asignaciones/:id` (reasignar / cancelar pendientes) | docente |
| GET | `/api/alumno/historial` | alumno |
| GET | `/api/docente/semaforo` | docente |
| POST | `/api/docente/asignaciones` | docente |
| PUT | `/api/docente/alumnos/:id/nota` (texto vacío borra la nota) | docente |
| GET | `/api/alumno/actividades`, `/api/alumno/actividades/:id` | alumno |
| POST | `/api/alumno/actividades/:id/completar` | alumno |
| GET | `/api/diccionario?palabra=...` | todos |

## Categorías

Los textos tienen categoría: ficción, historia, deporte, ciencia, naturaleza o biografía (hay biografías como la de Messi y Belgrano).

## Semáforo

Puntaje = aciertos / total × 10. `>= 7` En nivel (verde), `>= 4` A seguir (amarillo), `< 4` Atención (rojo). Sin cuestionario → "Sin eval.".

## Diccionario

Primero busca en la base propia (definiciones simples para primer ciclo). Si no está, consulta la RAE mediante la librería no oficial `rae-api` y guarda el resultado (`fuente = externa`). Si la RAE no responde, devuelve "no encontrada". Se puede desactivar con `DICCIONARIO_EXTERNO=false`.

## Tests

`npm test` levanta un PostgreSQL real embebido (no hace falta Docker) y prueba el flujo completo.
