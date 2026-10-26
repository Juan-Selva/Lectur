-- Alertas al docente. Las alertas se calculan en el momento a partir de los datos;
-- acá solo se guarda la configuración de cada docente y cuáles marcó como vistas.

CREATE TABLE alertas_config (
  docente_id INTEGER PRIMARY KEY REFERENCES usuarios (id) ON DELETE CASCADE,
  config     JSONB NOT NULL
);

-- `clave` identifica la ocurrencia concreta de una alerta (por ejemplo, el último resultado
-- o la fecha de la última lectura): si el problema se repite, la clave cambia y vuelve a avisar.
CREATE TABLE alertas_vistas (
  id         SERIAL PRIMARY KEY,
  docente_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  alumno_id  INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  clave      TEXT NOT NULL,
  vista_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (docente_id, alumno_id, tipo, clave)
);
