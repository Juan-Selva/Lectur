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

const filtro = (cursoId) => (cursoId ? `?cursoId=${cursoId}` : '')

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  aceptarTerminos: () => request('POST', '/auth/aceptar-terminos', { acepto: true }),

  // docente
  textos: () => request('GET', '/textos'),
  texto: (id) => request('GET', `/textos/${id}`),
  crearTexto: (d) => request('POST', '/textos', d),
  duplicarTexto: (id) => request('POST', `/textos/${id}/duplicar`),
  borrarTexto: (id) => request('DELETE', `/textos/${id}`),
  editarTexto: (id, d) => request('PUT', `/textos/${id}`, d),
  cursos: () => request('GET', '/cursos'),
  crearCurso: (d) => request('POST', '/cursos', d),
  editarCurso: (id, d) => request('PUT', `/cursos/${id}`, d),
  alumnosCurso: (id) => request('GET', `/cursos/${id}/alumnos`),
  borrarCurso: (id) => request('DELETE', `/cursos/${id}`),
  semaforo: (cursoId, grado) => {
    const q = new URLSearchParams()
    if (cursoId) q.set('cursoId', cursoId)
    if (grado) q.set('grado', grado)
    const qs = q.toString()
    return request('GET', `/docente/semaforo${qs ? `?${qs}` : ''}`)
  },
  importarAlumnos: (d) => request('POST', '/docente/alumnos/importar', d),
  crearAlumno: (d) => request('POST', '/docente/alumnos', d),
  alumno: (id) => request('GET', `/docente/alumnos/${id}`),
  editarAlumno: (id, d) => request('PUT', `/docente/alumnos/${id}`, d),
  passwordAlumno: (id, password) => request('PUT', `/docente/alumnos/${id}/password`, { password }),
  borrarAlumno: (id) => request('DELETE', `/docente/alumnos/${id}`),
  borrarDatosAlumno: (id) => request('DELETE', `/docente/alumnos/${id}/datos`),
  alertas: (cursoId) => request('GET', `/docente/alertas${filtro(cursoId)}`),
  alertaVista: (d) => request('POST', '/docente/alertas/vista', d),
  alertasVistas: (cursoId) => request('POST', `/docente/alertas/vistas${filtro(cursoId)}`),
  alertasConfig: () => request('GET', '/docente/alertas/config'),
  guardarAlertasConfig: (c) => request('PUT', '/docente/alertas/config', c),
  rachaAlumno: (id) => request('GET', `/docente/alumnos/${id}/racha`),
  habilidadesAlumno: (id) => request('GET', `/docente/alumnos/${id}/habilidades`),
  practicasAlumno: (id) => request('GET', `/docente/alumnos/${id}/practicas`),
  historialAlumno: (id) => request('GET', `/docente/alumnos/${id}/historial`),
  palabrasAlumno: (id) => request('GET', `/docente/alumnos/${id}/palabras`),
  palabrasCurso: (cursoId) => request('GET', `/docente/palabras${filtro(cursoId)}`),
  resumen: (id) => request('GET', `/docente/alumnos/${id}/resumen`),
  reasignar: (id, d) => request('PATCH', `/docente/asignaciones/${id}`, d),
  cancelar: (id) => request('DELETE', `/docente/asignaciones/${id}`),
  asignar: (d) => request('POST', '/docente/asignaciones', d),
  guardarNota: (alumnoId, texto) => request('PUT', `/docente/alumnos/${alumnoId}/nota`, { texto }),

  // alumno
  actividades: () => request('GET', '/alumno/actividades'),
  racha: () => request('GET', '/alumno/racha'),
  practicaTextos: () => request('GET', '/alumno/practica/textos'),
  practicaTexto: (id) => request('GET', `/alumno/practica/textos/${id}`),
  practicaCompletar: (id, respuestas) =>
    request('POST', `/alumno/practica/textos/${id}/completar`, { respuestas }),
  historial: () => request('GET', '/alumno/historial'),
  actividad: (id) => request('GET', `/alumno/actividades/${id}`),
  completar: (id, respuestas) =>
    request('POST', `/alumno/actividades/${id}/completar`, { respuestas }),

  // ambos
  definir: (palabra) => request('GET', `/diccionario?palabra=${encodeURIComponent(palabra)}`),
}
