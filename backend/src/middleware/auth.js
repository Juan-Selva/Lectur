import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { HttpError, forbidden } from '../lib/errors.js'

export function firmarToken(usuario) {
  return jwt.sign({ rol: usuario.rol, nombre: usuario.nombre }, config.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: config.jwtExpiresIn,
  })
}

export function autenticar(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const [esquema, token] = header.split(' ')
  if (esquema !== 'Bearer' || !token) return next(new HttpError(401, 'Necesitás iniciar sesión'))

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.usuario = { id: Number(payload.sub), rol: payload.rol, nombre: payload.nombre }
    next()
  } catch {
    next(new HttpError(401, 'Tu sesión venció, volvé a iniciar sesión'))
  }
}

export const requiereRol = (rol) => (req, _res, next) =>
  req.usuario?.rol === rol
    ? next()
    : next(forbidden(`Esta acción es solo para ${rol === 'docente' ? 'docentes' : 'alumnos'}`))
