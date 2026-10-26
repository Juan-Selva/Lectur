-- Aceptación de términos y aviso de privacidad (docentes y, por sus familias, alumnos).
ALTER TABLE usuarios
  ADD COLUMN acepto_terminos_version INTEGER,
  ADD COLUMN acepto_terminos_en      TIMESTAMPTZ;
