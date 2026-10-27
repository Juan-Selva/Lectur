-- Grado al que apunta cada texto: 1, 2 o 3. NULL = sirve para todos los grados.
-- Los textos precargados reciben su grado al correr `npm run seed`.
ALTER TABLE textos
  ADD COLUMN grado SMALLINT CHECK (grado IN (1, 2, 3));
