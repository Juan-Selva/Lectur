-- Habilidad que mide cada pregunta. `tipo` (literal / inferencial) se mantiene y se deriva de la habilidad.
ALTER TABLE preguntas
  ADD COLUMN habilidad TEXT NOT NULL DEFAULT 'dato_explicito'
    CHECK (habilidad IN ('dato_explicito', 'inferencia', 'estructura', 'idea_principal', 'vocabulario_contexto', 'convenciones'));

-- Preguntas que ya existían: según su tipo actual.
UPDATE preguntas SET habilidad = 'inferencia' WHERE tipo = 'inferencial';
