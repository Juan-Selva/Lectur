-- Migración 011: Columnas para enriquecer definiciones acordes a primaria (ejemplo, sinónimos y categoría).
ALTER TABLE definiciones
  ADD COLUMN IF NOT EXISTS ejemplo TEXT,
  ADD COLUMN IF NOT EXISTS sinonimos TEXT,
  ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Limpiar caché externa previa para asegurar que ninguna definición vieja o con marcas adultas persista
DELETE FROM definiciones WHERE fuente = 'externa';

