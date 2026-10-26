import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Campo, Cargando, Mensaje, Modal, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { InsigniaRacha } from '../components/Racha.jsx'
import { useCursos } from '../lib/cursos.jsx'
import { estadoInfo } from '../lib/semaforo.js'

function ModalNota({ alumno, onCerrar, onGuardada }) {
  const [texto, setTexto] = useState(alumno.nota ?? '')
  const [error, setError] = useState('')
  async function guardar(valor) {
    try {
      await api.guardarNota(alumno.id, valor)
      onGuardada()
    } catch (e) {
      setError(e.message)
    }
  }
  return (
    <Modal titulo={`Nota para ${alumno.nombre}`} onCerrar={onCerrar}>
      <textarea
        aria-label="Nota"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={500}
        rows={4}
        placeholder="Escribí una observación (opcional)"
        className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-3 space-y-3">
        <Mensaje>{error}</Mensaje>
        <div className="flex flex-wrap justify-between gap-2">
          <Boton variante="suave" onClick={() => guardar('')}>
            Dejar sin nota
          </Boton>
          <Boton disabled={!texto.trim()} onClick={() => guardar(texto)}>
            Guardar nota
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

function ModalAlumno({ onCerrar, onCreado }) {
  const { cursos, cursoId } = useCursos()
  const [f, setF] = useState({ nombre: '', email: '', password: '', cursoId: cursoId })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function crear(e) {
    e.preventDefault()
    try {
      await api.crearAlumno({ ...f, cursoId: Number(f.cursoId) })
      onCreado()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Modal titulo="Agregar alumno" onCerrar={onCerrar}>
      {cursos.length === 0 && <Mensaje>Primero creá un curso en la sección Cursos.</Mensaje>}
      <form onSubmit={crear} className="space-y-3">
        <Campo
          id="n"
          etiqueta="Nombre y apellido"
          required
          value={f.nombre}
          onChange={set('nombre')}
        />
        <Campo
          id="e"
          etiqueta="Email"
          type="email"
          required
          value={f.email}
          onChange={set('email')}
        />
        <Campo
          id="p"
          etiqueta="Contraseña (mínimo 8 caracteres)"
          type="text"
          minLength={8}
          required
          value={f.password}
          onChange={set('password')}
        />
        <label className="block text-sm font-medium">
          Curso
          <select
            value={f.cursoId}
            onChange={set('cursoId')}
            required
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            <option value="">Elegí un curso…</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <Mensaje>{error}</Mensaje>
        <Boton type="submit" className="w-full">
          Crear alumno
        </Boton>
      </form>
    </Modal>
  )
}

export default function DocenteSemaforo() {
  const [alumnos, setAlumnos] = useState(null)
  const [error, setError] = useState('')
  const [nota, setNota] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [palabras, setPalabras] = useState([])
  const { cursos, cursoId } = useCursos()
  const cursoActual = cursos.find((c) => String(c.id) === cursoId)

  const cargar = useCallback(() => {
    api
      .semaforo(cursoId)
      .then((r) => setAlumnos(r.alumnos))
      .catch((e) => setError(e.message))
  }, [cursoId])
  useEffect(cargar, [cargar])
  useEffect(() => {
    api
      .palabrasCurso(cursoId)
      .then((r) => setPalabras(r.palabras))
      .catch(() => {})
  }, [cursoId])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!alumnos) return <Cargando />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Semáforo{cursoActual ? ` — ${cursoActual.nombre}` : ' del curso'}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Boton variante="suave" onClick={() => setNuevo(true)}>
            + Agregar alumno
          </Boton>
          <Link
            to="/docente/importar"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            Cargar desde archivo
          </Link>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Se calcula con el último cuestionario resuelto: 7 o más En nivel, de 4 a menos de 7 A
        seguir, menos de 4 Atención. Las lecturas sin cuestionario no generan evaluación.
      </p>
      {alumnos.length === 0 && (
        <Tarjeta className="text-slate-600">Todavía no tenés alumnos. Agregá el primero.</Tarjeta>
      )}
      {alumnos.map((a) => {
        const info = estadoInfo(a.estado)
        return (
          <Tarjeta key={a.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">
                  <Link
                    to={`/docente/alumnos/${a.id}`}
                    className="hover:text-brand hover:underline"
                  >
                    {a.nombre}
                  </Link>
                </h2>
                <p className="text-sm text-slate-500">
                  {a.curso ? `${a.curso} · ` : ''}
                  {a.grado}° grado
                  {a.pendientes > 0 && ` · ${a.pendientes} pendiente${a.pendientes > 1 ? 's' : ''}`}
                </p>
                <InsigniaRacha racha={a.racha} />
              </div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${info.chip}`}
              >
                <span className={`size-2.5 rounded-full ${info.punto}`} aria-hidden="true" />
                {info.etiqueta}
              </span>
            </div>
            {a.ultimo && (
              <p className="text-sm text-slate-700">
                «{a.ultimo.texto}»: {a.ultimo.correctas}/{a.ultimo.total} correctas (
                {a.ultimo.puntaje.toFixed(1)}/10) · Literal{' '}
                {a.ultimo.literalCompleto ? 'completo' : 'incompleto'} · Inferencial{' '}
                {a.ultimo.inferencialCompleto ? 'completo' : 'incompleto'}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
              {a.nota ? (
                <>
                  <p className="flex-1 text-sm text-slate-700">
                    <span className="font-semibold">Nota:</span> {a.nota}
                  </p>
                  <Boton variante="suave" onClick={() => setNota(a)}>
                    Editar nota
                  </Boton>
                </>
              ) : (
                <Boton variante="suave" onClick={() => setNota(a)}>
                  + Agregar nota
                </Boton>
              )}
            </div>
          </Tarjeta>
        )
      })}
      {palabras.length > 0 && (
        <Tarjeta>
          <h2 className="mb-2 font-bold">Palabras más consultadas por el curso</h2>
          <p className="flex flex-wrap gap-2">
            {palabras.slice(0, 10).map((p) => (
              <span
                key={p.palabra}
                className="rounded-full bg-brand-soft px-3 py-1 text-sm text-brand-dark"
              >
                {p.palabra} <span className="text-xs text-slate-500">×{p.veces}</span>
              </span>
            ))}
          </p>
        </Tarjeta>
      )}
      {nota && (
        <ModalNota
          alumno={nota}
          onCerrar={() => setNota(null)}
          onGuardada={() => {
            setNota(null)
            cargar()
          }}
        />
      )}
      {nuevo && (
        <ModalAlumno
          onCerrar={() => setNuevo(false)}
          onCreado={() => {
            setNuevo(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}
