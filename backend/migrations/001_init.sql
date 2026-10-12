-- Esquema inicial de Lectur (Sprint 2)

CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL CHECK (rol IN ('docente', 'alumno')),
  grado         TEXT,
  -- Solo para alumnos: el docente a cargo del alumno.
  docente_id    INTEGER REFERENCES usuarios (id) ON DELETE SET NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- autor_id NULL = texto precargado del sistema (visible para todos los docentes).
-- autor_id con valor = texto propio de ese docente (privado).
CREATE TABLE textos (
  id        SERIAL PRIMARY KEY,
  titulo    TEXT NOT NULL,
  cuerpo    TEXT NOT NULL,
  nivel     TEXT CHECK (nivel IN ('facil', 'intermedio', 'dificil')),
  autor_id  INTEGER REFERENCES usuarios (id) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE preguntas (
  id        SERIAL PRIMARY KEY,
  texto_id  INTEGER NOT NULL REFERENCES textos (id) ON DELETE CASCADE,
  orden     INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  tipo      TEXT NOT NULL CHECK (tipo IN ('literal', 'inferencial')),
  opciones  JSONB NOT NULL,
  correcta  INTEGER NOT NULL CHECK (correcta >= 0),
  UNIQUE (texto_id, orden)
);

-- Un texto asignado a un alumno. El docente decide si lleva cuestionario o no.
CREATE TABLE asignaciones (
  id              SERIAL PRIMARY KEY,
  texto_id        INTEGER NOT NULL REFERENCES textos (id) ON DELETE RESTRICT,
  alumno_id       INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  docente_id      INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  con_cuestionario BOOLEAN NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada')),
  creada_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completada_en   TIMESTAMPTZ
);
CREATE INDEX asignaciones_alumno_idx ON asignaciones (alumno_id);
CREATE INDEX asignaciones_docente_idx ON asignaciones (docente_id);

-- Resultado del cuestionario (solo existe para asignaciones con cuestionario).
-- Este es el dato que alimenta el semáforo.
CREATE TABLE resultados (
  id                  SERIAL PRIMARY KEY,
  asignacion_id       INTEGER NOT NULL UNIQUE REFERENCES asignaciones (id) ON DELETE CASCADE,
  puntaje             NUMERIC(3, 1) NOT NULL CHECK (puntaje >= 0 AND puntaje <= 10),
  correctas           INTEGER NOT NULL,
  total               INTEGER NOT NULL,
  literal_completo    BOOLEAN NOT NULL,
  inferencial_completo BOOLEAN NOT NULL,
  respuestas          JSONB NOT NULL,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nota opcional del docente sobre un alumno (una por par docente-alumno).
CREATE TABLE notas (
  id             SERIAL PRIMARY KEY,
  alumno_id      INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  docente_id     INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  texto          TEXT NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alumno_id, docente_id)
);

-- Diccionario: base propia (definiciones simples para primer ciclo) y caché
-- de las definiciones traídas de la fuente externa.
-- palabra_norm es la palabra en minúsculas y sin tildes: se usa para buscar.
CREATE TABLE definiciones (
  id          SERIAL PRIMARY KEY,
  palabra_norm TEXT NOT NULL UNIQUE,
  palabra     TEXT NOT NULL,
  significado TEXT NOT NULL,
  fuente      TEXT NOT NULL CHECK (fuente IN ('propia', 'externa')),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
