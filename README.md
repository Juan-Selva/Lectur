# Lectur — Frontend (Sprint 1)

Demo funcional del flujo del alumno (asignación de texto simplificada, lectura
y cuestionario de comprensión) más una pantalla de muestra del semáforo
docente, para la primera Review de "Avances del producto".

## Stack

- React + Vite (JavaScript)
- Tailwind CSS v4
- React Router
- lucide-react
- ESLint + Prettier

No hay backend ni base de datos todavía: todo el contenido (textos,
preguntas, datos del semáforo) vive en `src/data/*.json` como mocks. Docker se
suma en un sprint posterior, cuando haya backend real.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`.

Otros comandos:

```bash
npm run build     # build de producción
npm run lint      # ESLint
npm run format    # Prettier (escribe los cambios)
```

## Estructura

```
src/
  components/
    Layout.jsx        # header + navegación entre vista alumno / vista docente
  pages/
    SeleccionTexto.jsx # HU1 — elegir/asignar texto según nivel (simplificado)
    Lectura.jsx         # HU2 — lectura autónoma del texto
    Cuestionario.jsx     # HU3 — cuestionario de comprensión
    Resultado.jsx         # pantalla de cierre tras responder
    Docente.jsx            # HU4 — semáforo docente (datos de muestra, no conectados aún)
  data/
    textos.json         # textos + preguntas por nivel
    semaforoMock.json    # datos de ejemplo para la vista docente
```

## Fuera de alcance de este sprint

- Diccionario integrado
- Asignación automática real de nivel
- Nota del docente por alumno
- Conexión real entre el resultado del cuestionario y el semáforo
- Backend, base de datos y Docker
