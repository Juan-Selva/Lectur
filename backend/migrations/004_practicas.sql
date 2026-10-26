-- Práctica libre: el alumno elige por su cuenta textos de Lectur.
-- Va aparte de las asignaciones: no entra en el semáforo, pero cuenta para la racha.

CREATE TABLE practicas (
  id            SERIAL PRIMARY KEY,
  alumno_id     INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  texto_id      INTEGER NOT NULL REFERENCES textos (id) ON DELETE CASCADE,
  con_cuestionario BOOLEAN NOT NULL,
  correctas     INTEGER,
  total         INTEGER,
  respuestas    JSONB,
  completada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX practicas_alumno_idx ON practicas (alumno_id, completada_en DESC);
