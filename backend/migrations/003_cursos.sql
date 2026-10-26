-- Cursos: un docente puede tener varios (por ejemplo "2.° A" y "3.° B").

CREATE TABLE cursos (
  id         SERIAL PRIMARY KEY,
  docente_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  grado      INTEGER NOT NULL CHECK (grado BETWEEN 1 AND 3),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (docente_id, nombre)
);

ALTER TABLE usuarios ADD COLUMN curso_id INTEGER REFERENCES cursos (id) ON DELETE SET NULL;
CREATE INDEX usuarios_curso_idx ON usuarios (curso_id);

-- Alumnos que ya existían: un curso por docente y grado, y se los asigna ahí.
INSERT INTO cursos (docente_id, nombre, grado)
SELECT DISTINCT docente_id, grado || '.° grado', CASE WHEN grado ~ '^[1-3]$' THEN grado::int END
  FROM usuarios
 WHERE rol = 'alumno' AND docente_id IS NOT NULL AND grado ~ '^[1-3]$';

UPDATE usuarios u
   SET curso_id = c.id
  FROM cursos c
 WHERE u.rol = 'alumno'
   AND c.docente_id = u.docente_id
   AND u.grado ~ '^[1-3]$'
   AND c.nombre = u.grado || '.° grado';
