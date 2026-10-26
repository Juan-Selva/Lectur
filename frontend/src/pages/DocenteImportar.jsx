import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { aCsv, descargarCsv, leerArchivo, PLANTILLA } from '../lib/archivoAlumnos.js'
import { useCursos } from '../lib/cursos.jsx'

export default function DocenteImportar() {
  const { cursos, cursoId: filtro, recargar } = useCursos()
  const [cursoId, setCursoId] = useState(filtro)
  const [filas, setFilas] = useState(null)
  const [archivo, setArchivo] = useState('')
  const [prev, setPrev] = useState(null)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const inputRef = useRef(null)

  const datos = (extra = {}) => ({
    filas,
    ...(cursoId ? { cursoId: Number(cursoId) } : {}),
    ...extra,
  })

  async function previsualizar(f, c) {
    setError('')
    setTrabajando(true)
    try {
      setPrev(await api.importarAlumnos({ filas: f, ...(c ? { cursoId: Number(c) } : {}) }))
    } catch (e) {
      setError(e.message)
      setPrev(null)
    } finally {
      setTrabajando(false)
    }
  }

  async function elegirArchivo(e) {
    const a = e.target.files?.[0]
    if (!a) return
    setError('')
    setResultado(null)
    setPrev(null)
    setFilas(null)
    setArchivo(a.name)
    try {
      const f = await leerArchivo(a)
      setFilas(f)
      await previsualizar(f, cursoId)
    } catch (err) {
      setError(err.message)
    }
  }

  async function cambiarCurso(valor) {
    setCursoId(valor)
    if (filas) await previsualizar(filas, valor)
  }

  async function confirmar() {
    setError('')
    setTrabajando(true)
    try {
      setResultado(await api.importarAlumnos(datos({ confirmar: true })))
      setPrev(null)
      setFilas(null)
      setArchivo('')
      if (inputRef.current) inputRef.current.value = ''
      recargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setTrabajando(false)
    }
  }

  const credenciales = resultado?.creados.filter((c) => c.password) ?? []
  const descargarCredenciales = () =>
    descargarCsv(
      'credenciales-alumnos.csv',
      aCsv(
        ['nombre', 'email', 'curso', 'contraseña'],
        resultado.creados.map((c) => [
          c.nombre,
          c.email,
          c.curso,
          c.password ?? '(la definió el docente)',
        ]),
      ),
    )

  return (
    <div className="space-y-4">
      <Link to="/docente" className="text-sm font-semibold text-brand hover:underline print:hidden">
        ← Volver al semáforo
      </Link>
      <h1 className="text-2xl font-bold print:hidden">Cargar alumnos desde un archivo</h1>

      {resultado ? (
        <Tarjeta className="space-y-4">
          <h2 className="text-lg font-bold">
            Se crearon {resultado.creados.length} alumno{resultado.creados.length === 1 ? '' : 's'}
          </h2>
          {resultado.omitidas > 0 && (
            <p className="text-sm text-slate-600">
              {resultado.omitidas} fila{resultado.omitidas === 1 ? '' : 's'} con errores no se
              importaron.
            </p>
          )}
          {credenciales.length > 0 && (
            <>
              <Mensaje tipo="ok">
                Guardá estas contraseñas ahora: no se vuelven a mostrar. Entregáselas a cada alumno.
              </Mensaje>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Alumno</th>
                    <th className="py-2 font-medium">Email</th>
                    <th className="py-2 font-medium">Curso</th>
                    <th className="py-2 font-medium">Contraseña</th>
                  </tr>
                </thead>
                <tbody>
                  {credenciales.map((c) => (
                    <tr key={c.email} className="border-b border-slate-100">
                      <td className="py-2">{c.nombre}</td>
                      <td className="py-2">{c.email}</td>
                      <td className="py-2">{c.curso}</td>
                      <td className="py-2 font-mono font-semibold">{c.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="flex flex-wrap gap-2 print:hidden">
            {credenciales.length > 0 && (
              <>
                <Boton onClick={descargarCredenciales}>Descargar credenciales (CSV)</Boton>
                <Boton variante="suave" onClick={() => window.print()}>
                  Imprimir
                </Boton>
              </>
            )}
            <Link
              to="/docente"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Ir al semáforo
            </Link>
            <Boton variante="suave" onClick={() => setResultado(null)}>
              Cargar otro archivo
            </Boton>
          </div>
        </Tarjeta>
      ) : (
        <>
          <Tarjeta className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>
                Descargá la plantilla y completala (o usá tu propio archivo .csv o .xlsx con las
                columnas <strong>nombre</strong> y <strong>email</strong>).
              </li>
              <li>
                La columna <strong>curso</strong> es opcional si elegís un curso abajo. La columna{' '}
                <strong>password</strong> también: si la dejás vacía, se genera una.
              </li>
              <li>
                Subí el archivo, revisá la vista previa e importá. Máximo 100 alumnos por archivo.
              </li>
            </ol>
            <Boton
              variante="suave"
              onClick={() => descargarCsv('plantilla-alumnos.csv', PLANTILLA)}
            >
              Descargar plantilla (CSV)
            </Boton>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Curso para las filas sin curso
                <select
                  value={cursoId}
                  onChange={(e) => cambiarCurso(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
                >
                  <option value="">Ninguno (el archivo trae el curso)</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Archivo (.csv o .xlsx)
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={elegirArchivo}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:font-semibold file:text-brand-dark"
                />
              </label>
            </div>
            {cursos.length === 0 && (
              <p className="text-sm text-slate-600">
                Primero creá tus cursos en la sección{' '}
                <Link to="/docente/cursos" className="font-semibold text-brand underline">
                  Cursos
                </Link>
                .
              </p>
            )}
            <Mensaje>{error}</Mensaje>
          </Tarjeta>

          {trabajando && <p className="text-center text-slate-500">Procesando…</p>}

          {prev && (
            <Tarjeta className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Vista previa — {archivo}</h2>
                  <p className="text-sm text-slate-600">
                    {prev.validas} lista{prev.validas === 1 ? '' : 's'} para importar
                    {prev.conErrores > 0 && ` · ${prev.conErrores} con errores (no se importarán)`}
                  </p>
                </div>
                <Boton disabled={prev.validas === 0 || trabajando} onClick={confirmar}>
                  Importar {prev.validas} alumno{prev.validas === 1 ? '' : 's'}
                </Boton>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3 font-medium">Fila</th>
                      <th className="py-2 pr-3 font-medium">Nombre</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Curso</th>
                      <th className="py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prev.filas.map((f) => (
                      <tr
                        key={f.indice}
                        className={`border-b border-slate-100 ${f.estado === 'error' ? 'bg-red-50' : ''}`}
                      >
                        <td className="py-2 pr-3 text-slate-400">{f.indice + 2}</td>
                        <td className="py-2 pr-3">{f.nombre || '—'}</td>
                        <td className="py-2 pr-3">{f.email || '—'}</td>
                        <td className="py-2 pr-3">{f.curso ?? '—'}</td>
                        <td className="py-2">
                          {f.estado === 'ok' ? (
                            <span className="font-semibold text-success">✓ Lista</span>
                          ) : (
                            <span className="text-danger">✗ {f.errores.join('. ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          )}
        </>
      )}
    </div>
  )
}
