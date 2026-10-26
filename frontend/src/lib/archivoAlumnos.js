import Papa from 'papaparse'

// Lectura de archivos de alumnos (CSV o Excel .xlsx) a filas { nombre, email, curso, password }.
export const MAX_FILAS = 100

const sinTildes = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

const ALIAS = {
  nombre: ['nombre', 'nombre y apellido', 'alumno', 'apellido y nombre', 'nombres'],
  email: ['email', 'e-mail', 'correo', 'mail', 'correo electronico'],
  curso: ['curso', 'seccion', 'division'],
  password: ['password', 'contrasena', 'clave'],
}

function columnaDe(encabezados, campo) {
  return encabezados.findIndex((h) => ALIAS[campo].includes(sinTildes(h)))
}

// `matriz` es un arreglo de filas (la primera son los encabezados).
export function filasDesdeMatriz(matriz) {
  const vacias = (f) => f.every((c) => String(c ?? '').trim() === '')
  const filas = matriz.filter((f) => !vacias(f))
  if (filas.length === 0) throw new Error('El archivo está vacío.')
  const [encabezados, ...datos] = filas
  const col = Object.fromEntries(Object.keys(ALIAS).map((k) => [k, columnaDe(encabezados, k)]))
  if (col.nombre < 0 || col.email < 0) {
    throw new Error(
      'No encontré las columnas "nombre" y "email" en la primera fila. Usá la plantilla.',
    )
  }
  const valor = (f, k) => (col[k] >= 0 ? String(f[col[k]] ?? '').trim() : '')
  return datos.map((f) => ({
    nombre: valor(f, 'nombre'),
    email: valor(f, 'email'),
    curso: valor(f, 'curso'),
    password: valor(f, 'password'),
  }))
}

export async function leerArchivo(archivo) {
  const nombre = archivo.name.toLowerCase()
  let matriz
  if (nombre.endsWith('.csv') || nombre.endsWith('.txt')) {
    const texto = await archivo.text()
    const r = Papa.parse(texto.replace(/^\uFEFF/, ''), { skipEmptyLines: 'greedy' })
    matriz = r.data
  } else if (nombre.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser')
    matriz = await readSheet(archivo)
  } else if (nombre.endsWith('.xls')) {
    throw new Error(
      'Los archivos .xls antiguos no se pueden leer. Guardalo como .xlsx o .csv desde Excel.',
    )
  } else {
    throw new Error('Formato no compatible. Subí un archivo .csv o .xlsx.')
  }
  const filas = filasDesdeMatriz(matriz)
  if (filas.length === 0) throw new Error('El archivo no tiene alumnos debajo de los encabezados.')
  if (filas.length > MAX_FILAS)
    throw new Error(
      `El archivo tiene ${filas.length} alumnos. El máximo es ${MAX_FILAS} por archivo.`,
    )
  return filas
}

const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
export const aCsv = (encabezados, filas) =>
  '\uFEFF' + [encabezados, ...filas].map((f) => f.map(escapar).join(',')).join('\r\n')

export function descargarCsv(nombreArchivo, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export const PLANTILLA = aCsv(
  ['nombre', 'email', 'curso', 'password'],
  [
    ['Ana Gómez', 'ana@ejemplo.com', '2.° A', ''],
    ['Beto Ruiz', 'beto@ejemplo.com', '2.° A', ''],
  ],
)
