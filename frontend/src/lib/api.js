const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
const CLAVE = 'lectur.token'

export const getToken = () => localStorage.getItem(CLAVE)
export const setToken = (t) => (t ? localStorage.setItem(CLAVE, t) : localStorage.removeItem(CLAVE))

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

let alVencerSesion = () => {}
export const onSesionVencida = (fn) => (alVencerSesion = fn)

async function request(metodo, ruta, body) {
  let res
  try {
    res = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Probá de nuevo en un rato.')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && getToken()) alVencerSesion()
    throw new ApiError(res.status, data?.error ?? 'Ocurrió un error inesperado')
  }
  return data
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),

  // docente
  textos: () => request('GET', '/textos'),
  texto: (id) => request('GET', `/textos/${id}`),
  crearTexto: (d) => request('POST', '/textos', d),
  borrarTexto: (id) => request('DELETE', `/textos/${id}`),
  semaforo: () => request('GET', '/docente/semaforo'),
  crearAlumno: (d) => request('POST', '/docente/alumnos', d),
  asignar: (d) => request('POST', '/docente/asignaciones', d),
  guardarNota: (alumnoId, texto) => request('PUT', `/docente/alumnos/${alumnoId}/nota`, { texto }),

  // alumno
  actividades: () => request('GET', '/alumno/actividades'),
  actividad: (id) => request('GET', `/alumno/actividades/${id}`),
  completar: (id, respuestas) =>
    request('POST', `/alumno/actividades/${id}/completar`, { respuestas }),

  // ambos
  definir: (palabra) => request('GET', `/diccionario?palabra=${encodeURIComponent(palabra)}`),
}
