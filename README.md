# Lectur (Sprint 2)

Aplicación funcional con vista de docente y vista de alumno (con login), backend propio, base de datos y diccionario integrado, para la segunda Review de "Avances del producto". El docente asigna lecturas (con o sin cuestionario), el alumno lee y responde, y el semáforo docente se calcula con los resultados reales de los cuestionarios.

## Stack

- React + Vite (JavaScript)
- Tailwind CSS v4
- React Router
- ESLint + Prettier
- Node + Express (API REST, login por rol con JWT, validación con Zod)
- PostgreSQL (migraciones y datos de prueba)
- Diccionario: base propia + consulta a la RAE con la librería no oficial `rae-api` (si la RAE no responde, el diccionario dice que no encontró la palabra)
- Docker (`docker-compose` levanta la base de datos y la API)

Ya no hay mocks: textos, preguntas, resultados y palabras consultadas viven en PostgreSQL. Los 13 textos precargados (6 categorías) y los usuarios de prueba se cargan con el seed.

## Qué incluye

### Alumno

- Login y vista solo de sus lecturas
- Lectura del texto sin límite de tiempo y con posibilidad de volver al texto desde las preguntas
- Cuestionario con preguntas literales e inferenciales: no se puede enviar con preguntas sin responder y, una vez enviado, no se puede modificar
- Historial: ve en qué preguntas acertó, sin ver las respuestas correctas
- Diccionario opcional: busca en la base propia y, si la palabra no está, en la RAE (lo encontrado queda guardado)

### Docente

- Semáforo por alumno con datos reales: En nivel (7 o más), A seguir (de 4 a menos de 7) o Atención (menos de 4), según el último cuestionario. Si la lectura no tuvo cuestionario, figura como "Sin eval."
- Asignación manual de lecturas (texto precargado o propio, con o sin cuestionario) a uno o varios alumnos, con opción de reasignar o cancelar
- Textos y preguntas propios
- Gestión de alumnos e historial de respuestas por pregunta
- Nota del docente por alumno
- Palabras más buscadas en el diccionario
- Resumen para la familia imprimible, por alumno

## Cómo correrlo

Backend:

```bash
cd backend
docker compose up --build -d
docker compose exec api node src/seed.js --demo
```

La imagen de la API copia el código al construirse: después de cada `git pull` (o de cambiar algo en `backend/`) volvé a correr `docker compose up --build -d` desde `backend/`. Si no, sigue corriendo la versión anterior y aparecen errores como "Ruta inexistente".

Para comprobar que la API está levantada, abrí `http://localhost:3000/api/health` (responde `{"ok":true}`).

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abrí `http://localhost:5173`.

Usuarios de prueba (contraseña `lectur1234`):

- Docente: `docente@lectur.test`
- Alumnos: `mateo@lectur.test`, `sofia@lectur.test`, `lucas@lectur.test`

Otros comandos:

```bash
npm run build     # build de producción (frontend)
npm run lint      # ESLint
npm run format    # Prettier (escribe los cambios)
npm test          # 13 pruebas automáticas (backend)
```

## Estructura

```
backend/
  migrations/
    001_init.sql              # usuarios, textos, preguntas, asignaciones, resultados, diccionario
    002_funciones_nuevas.sql  # categorías, cancelación de actividades, palabras consultadas
  src/
    routes/                   # auth, textos, docente, docenteAlumnos, alumno, diccionario
    lib/                      # semaforo, resumen, diccionario, validar, errors
    middleware/               # login por rol
    seed.js / seed-data.js    # textos precargados y usuarios de prueba
  test/
    api.test.mjs              # 13 pruebas automáticas
  docker-compose.yml          # base de datos + API

frontend/src/
  components/
    Layout.jsx                # header + navegación según el rol
    ui.jsx                    # componentes de interfaz compartidos
  pages/
    Login.jsx
    AlumnoActividades.jsx     # lecturas asignadas
    AlumnoLectura.jsx         # lectura y cuestionario
    AlumnoHistorial.jsx       # historial del alumno
    Diccionario.jsx           # diccionario integrado
    DocenteSemaforo.jsx       # semáforo del curso + notas por alumno
    DocenteAsignar.jsx        # asignar lecturas manualmente
    DocenteTextos.jsx         # textos precargados y propios
    DocenteAlumno.jsx         # ficha e historial del alumno
    DocenteResumen.jsx        # resumen imprimible para la familia
    DocentePalabras.jsx       # palabras más buscadas
  lib/                        # api, auth, semáforo, categorías, fechas
```

## Fuera de alcance de este sprint

- Asignación automática de nivel por alumno (hoy el docente elige qué lee cada uno)
- Mostrar al alumno un único texto activo según su nivel (hoy ve la lista de lecturas que le asignaron)
- Actualización automática del semáforo sin recargar la pantalla
- Resumen agregado del grado completo
- Validar que los textos propios tengan al menos una pregunta literal y una inferencial
