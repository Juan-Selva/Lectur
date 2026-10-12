import 'dotenv/config'

const isTest = process.env.NODE_ENV === 'test'

function required(name, fallbackForDev) {
  const value = process.env[name]
  if (value) return value
  if (fallbackForDev !== undefined && process.env.NODE_ENV !== 'production') return fallbackForDev
  throw new Error(`Falta la variable de entorno ${name}`)
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/lectur'),
  jwtSecret: required('JWT_SECRET', 'secreto-solo-para-desarrollo'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // Si es 'false', no se consulta la fuente externa del diccionario.
  diccionarioExterno: (process.env.DICCIONARIO_EXTERNO ?? (isTest ? 'false' : 'true')) !== 'false',
}
