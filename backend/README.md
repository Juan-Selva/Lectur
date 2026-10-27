# Lectur — Backend

API en Node 22 + Express 5 + PostgreSQL. Roles `docente` y `alumno`, textos con cuestionario opcional, semáforo, notas y diccionario.

## Con Docker (recomendado)

```bash
docker compose up --build -d
docker compose exec api node src/seed.js --demo   # textos, definiciones y usuarios de prueba
```

API en http://localhost:3000/api/health

Después de cada cambio en el código (o `git pull`) hay que reconstruir la imagen con `docker compose up --build -d`; si no, sigue corriendo la versión anterior.

## Sin Docker

Necesitás un PostgreSQL local y un `.env` (copiá `.env.example`).

```bash
npm install
npm run seed:demo   # aplica migraciones y carga datos de prueba
npm run seed:progreso   # demo: Mateo con 12 días de racha y progreso; Lucas en amarillo; Renata, Joaquín y Camila (3.° B)
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
| GET/POST | `/api/textos`, GET/PUT/DELETE `/api/textos/:id` (PUT solo textos propios), POST `/api/textos/:id/duplicar` (copia un texto de Lectur a "Mis textos" con sus preguntas) | docente |
| GET/POST | `/api/cursos`, PUT/DELETE `/api/cursos/:id` (no se borra un curso con alumnos), GET `/api/cursos/:id/alumnos` (alumnos del curso) | docente |
| POST | `/api/docente/alumnos/importar` (carga masiva: `confirmar: false` valida y muestra vista previa; `true` crea las filas válidas; máx. 100 por archivo) | docente |
| POST | `/api/docente/alumnos` (con `cursoId`; el grado sale del curso) | docente |
| GET/PUT/DELETE | `/api/docente/alumnos/:id` | docente |
| PUT | `/api/docente/alumnos/:id/password` | docente |
| GET | `/api/docente/alumnos/:id/historial` (detalle por pregunta) | docente |
| GET | `/api/docente/alumnos/:id/palabras`, `/api/docente/palabras?cursoId=` (curso) | docente |
| GET | `/api/docente/alumnos/:id/resumen` (resumen para familias) | docente |
| PATCH/DELETE | `/api/docente/asignaciones/:id` (reasignar / cancelar pendientes) | docente |
| GET | `/api/alumno/historial` | alumno |
| GET | `/api/alumno/racha` | alumno |
| GET | `/api/alumno/practica/textos`, `/api/alumno/practica/textos/:id` (práctica libre con textos de Lectur) | alumno |
| POST | `/api/alumno/practica/textos/:id/completar` (no entra en el semáforo, sí en la racha) | alumno |
| GET | `/api/docente/alertas?cursoId=` (alertas vigentes y cantidad sin ver) | docente |
| POST | `/api/docente/alertas/vista`, `/api/docente/alertas/vistas` (marcar una o todas como vistas) | docente |
| GET/PUT | `/api/docente/alertas/config` (umbrales y tipos activos) | docente |
| GET | `/api/docente/alumnos/:id/racha`, `/api/docente/alumnos/:id/practicas` | docente |
| GET | `/api/docente/semaforo?cursoId=` (filtro opcional por curso) | docente |
| POST | `/api/docente/asignaciones` (`alumnoIds` y/o `cursoId` para todo el curso) | docente |
| PUT | `/api/docente/alumnos/:id/nota` (texto vacío borra la nota) | docente |
| GET | `/api/alumno/actividades`, `/api/alumno/actividades/:id` | alumno |
| POST | `/api/alumno/actividades/:id/completar` | alumno |
| POST | `/api/auth/aceptar-terminos` | todos (body `{ "acepto": true }`) |
| DELETE | `/api/docente/alumnos/:id/datos` | docente (borra datos de lectura, conserva la cuenta) |
| GET | `/api/diccionario?palabra=...` | todos |

## Racha

Días seguidos en los que el alumno completó al menos una lectura (asignada o de práctica libre). Sábado y domingo sin lectura no cortan la racha; si lee, ese día suma. Los días se cuentan en hora argentina (`ZONA_HORARIA` para cambiarla). Hitos: 3, 7, 14 y 30 días.

## Alertas al docente

Se calculan en el momento a partir de los datos (no se guardan) y el docente las marca como vistas. Tipos: cuestionarios en rojo seguidos (2 por defecto), días de clase sin completar una lectura (3), racha perdida (racha mínima de 3 días) y caída de puntaje (3 puntos o más, quedando por debajo de 7). Cada docente configura los umbrales y qué tipos recibe. Si el problema se repite, vuelve a avisar aunque la anterior estuviera vista.

## Categorías

Los textos tienen categoría: ficción, historia, deporte, ciencia, naturaleza o biografía (hay biografías como la de Messi y Belgrano).

## Preguntas de ordenar

Cada pregunta tiene un `formato`: `opcion` (opción múltiple) u `orden` (migración 009, `src/lib/preguntas.js`). En las de `orden`, `opciones` guarda de 2 a 6 elementos **en el orden correcto**; el alumno los recibe mezclados (la mezcla es fija por pregunta y nunca coincide con el orden correcto) y responde con `{ preguntaId, orden: [lugares mostrados, en el orden elegido] }`. Se corrige todo o nada y vale como una pregunta más del puntaje. En el resultado se guarda el orden elegido como posiciones originales, y el detalle del docente (`historial`) devuelve `elegidaOrden`. Para resaltar una palabra en un enunciado se la escribe entre asteriscos (`*palabra*`); el frontend la muestra marcada.

## Habilidades

Cada pregunta mide una habilidad: dato explícito, inferencia, estructura, idea principal, vocabulario por contexto o convenciones de escritura (migración 008, `src/lib/habilidades.js`). El `tipo` (literal / inferencial) se deriva de la habilidad; si un cliente solo manda `tipo`, se asume dato explícito o inferencia. `GET /api/docente/semaforo` devuelve, por alumno, `habilidades` (aciertos y total de las actividades asignadas) y `reforzar`, y en `resumen.reforzar` la habilidad que más cuesta entre los alumnos filtrados. `GET /api/docente/alumnos/:id/habilidades` da el desglose de la ficha, y el resumen para familias suma una sugerencia de esa habilidad. Una habilidad solo se marca para reforzar con al menos 4 preguntas respondidas y menos de 70 % de aciertos. `npm run seed` etiqueta las preguntas de los textos precargados.

## Grados

Cada texto tiene un `grado` (1, 2 o 3; sin valor = sirve para todos los grados), que se carga en la migración 007. Los textos precargados reciben su grado en `src/seed-data.js` al correr `npm run seed` o `npm run seed:demo` (también en bases que ya tenían los textos). `GET /api/textos?grado=N` devuelve los de ese grado y los de todos los grados; `GET /api/docente/semaforo?grado=N` filtra alumnos por grado (se combina con `cursoId`); la práctica libre del alumno solo muestra (y solo deja abrir o completar) los textos de su grado y los pensados para todos los grados; los sugeridos salen de ahí. Las lecturas que asigna el docente no tienen esa restricción.

## Semáforo

Puntaje = aciertos / total × 10. `>= 7` En nivel (verde), `>= 4` A seguir (amarillo), `< 4` Atención (rojo). Sin cuestionario → "Sin eval.".

## Diccionario

Primero busca en la base propia (definiciones simples para primer ciclo). La lista vive en `src/diccionario-data.js` (unas 390 palabras agrupadas por tema, con definiciones de una oración y palabras simples) y se carga con `npm run seed` / `npm run seed:demo`; si una palabra ya estaba guardada desde la RAE, la definición propia la reemplaza. Para agregar palabras basta sumar un par `[palabra, significado]` y volver a correr el seed. Cada texto precargado declara su `vocabulario` y un test verifica que todo ese vocabulario esté en el diccionario. Si no está, consulta la RAE mediante la librería no oficial `rae-api` y guarda el resultado (`fuente = externa`). Si la RAE no responde, devuelve "no encontrada". Se puede desactivar con `DICCIONARIO_EXTERNO=false`.

## Tests

`npm test` levanta un PostgreSQL real embebido (no hace falta Docker) y prueba el flujo completo.

## Protección de datos de menores

- **Términos y privacidad:** el frontend sirve `/privacidad` y `/terminos`. Docentes y alumnos tienen que aceptarlos en el primer ingreso (en el caso del alumno lo hace un adulto responsable, con el email que brindó la familia). Se guarda `acepto_terminos_version` y `acepto_terminos_en` (migración 006); `usuario.terminosAceptados` llega en login y `/auth/me`. Si cambian los textos, subir `VERSION_TERMINOS` en `src/lib/terminos.js` y se vuelve a pedir.
- **Borrado:** `DELETE /api/docente/alumnos/:id` elimina al alumno completo; `DELETE /api/docente/alumnos/:id/datos` borra solo actividades, resultados, prácticas, consultas, notas y alertas, en una transacción.
- **Fuente:** Inter se sirve desde la app (`@fontsource/inter`), sin Google Fonts.
- **Limitaciones conocidas:** (1) la aceptación se exige en la interfaz; la API no bloquea el uso si no se aceptó. (2) La RAE se consulta con la librería no oficial `rae-api` (solo se envía la palabra); el aviso legal de rae.es restringe la extracción de contenido, y se cachea el resultado. (3) Falta, fuera del código, la inscripción de la base ante la DNPDP y el consentimiento de las familias gestionado por la escuela. Esto es orientación técnica, no asesoramiento legal.
