import { badRequest } from './errors.js'

export function parsear(schema, datos) {
  const r = schema.safeParse(datos)
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `${i.path.join('.') || 'datos'}: ${i.message}`).join('; ')
    throw badRequest(`Datos inválidos (${detalle})`)
  }
  return r.data
}
