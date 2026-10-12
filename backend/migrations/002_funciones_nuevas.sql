-- Sprint 2 (ampliación): categorías de textos, actividades canceladas y palabras consultadas.

ALTER TABLE textos
  ADD COLUMN categoria TEXT CHECK (categoria IN ('ficcion', 'historia', 'deporte', 'ciencia', 'naturaleza', 'biografia'));

UPDATE textos SET categoria = 'ficcion' WHERE autor_id IS NULL AND titulo IN ('El gato Manchas', 'La lluvia de la tarde');
UPDATE textos SET categoria = 'naturaleza' WHERE autor_id IS NULL AND titulo = 'El huerto de la abuela';

ALTER TABLE asignaciones DROP CONSTRAINT asignaciones_estado_check;
ALTER TABLE asignaciones
  ADD CONSTRAINT asignaciones_estado_check CHECK (estado IN ('pendiente', 'completada', 'cancelada'));

-- Cada búsqueda que hace un alumno en el diccionario (aunque no se encuentre la palabra).
CREATE TABLE consultas (
  id           SERIAL PRIMARY KEY,
  alumno_id    INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  palabra_norm TEXT NOT NULL,
  palabra      TEXT NOT NULL,
  encontrada   BOOLEAN NOT NULL,
  creada_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX consultas_alumno_idx ON consultas (alumno_id, creada_en DESC);
