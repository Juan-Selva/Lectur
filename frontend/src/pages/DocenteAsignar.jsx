import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'

export default function DocenteAsignar() {
  const [textos, setTextos] = useState(null)
  const [alumnos, setAlumnos] = useState(null)
  const [textoId, setTextoId] = useState('')
  const [sel, setSel] = useState([])
  const [conCuestionario, setCon] = useState(true)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    Promise.all([api.textos(), api.semaforo()])
      .then(([t, s]) => {
        setTextos(t.textos)
        setAlumnos(s.alumnos)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (!textos || !alumnos) return error ? <Mensaje>{error}</Mensaje> : <Cargando />

  const texto = textos.find((t) => String(t.id) === textoId)
  const sinPreguntas = texto && texto.cantidad_preguntas === 0
  const cuestionario = conCuestionario && !sinPreguntas
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function asignar() {
    setError('')
    setOk('')
    try {
      const r = await api.asignar({
        textoId: Number(textoId),
        alumnoIds: sel,
        conCuestionario: cuestionario,
      })
      setOk(`Asignaste el texto a ${r.asignadas} alumno${r.asignadas > 1 ? 's' : ''}.`)
      setSel([])
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Asignar lectura</h1>
      <Tarjeta className="space-y-4">
        <label className="block text-sm font-medium">
          Texto
          <select
            value={textoId}
            onChange={(e) => setTextoId(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base"
          >
            <option value="">Elegí un texto…</option>
            <optgroup label="Mis textos">
              {textos
                .filter((t) => t.propio)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Textos de Lectur">
              {textos
                .filter((t) => !t.propio)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
        <p className="text-sm text-slate-600">
          ¿No está el que necesitás?{' '}
          <Link to="/docente/textos" className="font-semibold text-brand underline">
            Escribí uno propio
          </Link>
          .
        </p>

        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={cuestionario}
            disabled={sinPreguntas}
            onChange={(e) => setCon(e.target.checked)}
          />
          Con cuestionario (genera evaluación en el semáforo)
        </label>
        {sinPreguntas && (
          <p className="text-sm text-slate-500">
            Este texto no tiene preguntas, se asignará solo para leer.
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Alumnos</legend>
          {alumnos.length === 0 && (
            <p className="text-sm text-slate-500">Todavía no tenés alumnos.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {alumnos.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={sel.includes(a.id)}
                  onChange={() => toggle(a.id)}
                />
                {a.nombre}
              </label>
            ))}
          </div>
          {alumnos.length > 0 && (
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-brand hover:underline"
              onClick={() => setSel(sel.length === alumnos.length ? [] : alumnos.map((a) => a.id))}
            >
              {sel.length === alumnos.length ? 'Quitar todos' : 'Elegir todos'}
            </button>
          )}
        </fieldset>
        <Mensaje>{error}</Mensaje>
        <Mensaje tipo="ok">{ok}</Mensaje>
        <Boton disabled={!textoId || sel.length === 0} onClick={asignar}>
          Asignar
        </Boton>
      </Tarjeta>
    </div>
  )
}
