-- Formato de cada pregunta: 'opcion' (opción múltiple, lo de siempre) u 'orden' (ordenar pasos).
-- En las de orden, `opciones` guarda los elementos en el orden correcto; el alumno los recibe mezclados.
ALTER TABLE preguntas
  ADD COLUMN formato TEXT NOT NULL DEFAULT 'opcion' CHECK (formato IN ('opcion', 'orden'));
