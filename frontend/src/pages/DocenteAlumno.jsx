import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Campo, Categoria, Cargando, Mensaje, Modal, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { InsigniaRacha } from '../components/Racha.jsx'
import { useCursos } from '../lib/cursos.jsx'
import { fechaCorta } from '../lib/fechas.js'
import { estadoInfo } from '../lib/semaforo.js'
import { descargarInformePdf } from '../lib/informePdf.js'

function Detalle({ resultado }) {
  const info = estadoInfo(resultado.estado)
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
      <p className="font-semibold">
        <span
          className={`mr-2 inline-block size-2.5 rounded-full ${info.punto}`}
          aria-hidden="true"
        />
        {info.etiqueta} · {resultado.puntaje.toFixed(1)}/10
      </p>
      <ul className="space-y-2">
        {resultado.preguntas.map((p, i) => (
          <li key={i}>
            <p>
              <span className={p.acierto ? 'font-bold text-success' : 'font-bold text-danger'}>
                {p.acierto ? '✓' : '✗'}
              </span>{' '}
              {p.enunciado} <span className="text-xs text-slate-500">({p.tipo})</span>
            </p>
            {!p.acierto && (
              <p className="ml-5 text-slate-600">
                Respondió: «{p.opciones[p.elegida] ?? '—'}» · Correcta: «{p.opciones[p.correcta]}»
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ModalReasignar({ actividad, alumnos, onCerrar, onListo }) {
  const [alumnoId, setAlumnoId] = useState(String(actividad.alumnoId))
  const [con, setCon] = useState(actividad.conCuestionario)
  const [error, setError] = useState('')
  async function guardar() {
    try {
      await api.reasignar(actividad.id, { alumnoId: Number(alumnoId), conCuestionario: con })
      onListo()
    } catch (e) {
      setError(e.message)
    }
  }
  return (
    <Modal titulo="Reasignar actividad" onCerrar={onCerrar}>
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Alumno
          <select
            value={alumnoId}
            onChange={(e) => setAlumnoId(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={con}
            onChange={(e) => setCon(e.target.checked)}
          />
          Con cuestionario
        </label>
        <Mensaje>{error}</Mensaje>
        <Boton className="w-full" onClick={guardar}>
          Guardar cambios
        </Boton>
      </div>
    </Modal>
  )
}

function Historial({ alumnoId }) {
  const [datos, setDatos] = useState(null)
  const [alumnos, setAlumnos] = useState([])
  const [abierto, setAbierto] = useState(null)
  const [reasignando, setReasignando] = useState(null)
  const [error, setError] = useState('')
  const cargar = useCallback(() => {
    Promise.all([api.historialAlumno(alumnoId), api.semaforo()])
      .then(([h, s]) => {
        setDatos(h)
        setAlumnos(s.alumnos)
      })
      .catch((e) => setError(e.message))
  }, [alumnoId])
  useEffect(cargar, [cargar])

  async function cancelar(id) {
    if (!window.confirm('¿Cancelar esta actividad? El alumno ya no la va a ver.')) return
    try {
      await api.cancelar(id)
      cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!datos) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  return (
    <div className="space-y-3">
      <Mensaje>{error}</Mensaje>
      {datos.actividades.length === 0 && (
        <Tarjeta className="text-slate-600">Todavía no tiene lecturas asignadas.</Tarjeta>
      )}
      {datos.actividades.map((a) => (
        <Tarjeta key={a.id} className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <h3 className="font-bold">{a.texto.titulo}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Categoria valor={a.texto.categoria} />
                {a.estado === 'pendiente'
                  ? `Pendiente · asignada el ${fechaCorta(a.creadaEn)}`
                  : `Completada el ${fechaCorta(a.completadaEn)}`}
                · {a.conCuestionario ? 'con cuestionario' : 'solo lectura'}
              </div>
            </div>
            {a.resultado && (
              <span className="text-sm font-semibold">
                {a.resultado.correctas}/{a.resultado.total} correctas
              </span>
            )}
          </div>
          {a.resultado && (
            <>
              <button
                className="text-sm font-semibold text-brand hover:underline"
                onClick={() => setAbierto(abierto === a.id ? null : a.id)}
              >
                {abierto === a.id ? 'Ocultar detalle' : 'Ver detalle por pregunta'}
              </button>
              {abierto === a.id && <Detalle resultado={a.resultado} />}
            </>
          )}
          {a.estado === 'pendiente' && (
            <div className="flex gap-2 pt-2">
              <Boton
                variante="suave"
                onClick={() =>
                  setReasignando({
                    id: a.id,
                    alumnoId: Number(alumnoId),
                    conCuestionario: a.conCuestionario,
                  })
                }
              >
                Reasignar
              </Boton>
              <Boton variante="peligro" onClick={() => cancelar(a.id)}>
                Cancelar
              </Boton>
            </div>
          )}
        </Tarjeta>
      ))}
      {reasignando && (
        <ModalReasignar
          actividad={reasignando}
          alumnos={alumnos}
          onCerrar={() => setReasignando(null)}
          onListo={() => {
            setReasignando(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function LecturasLibres({ alumnoId }) {
  const [lista, setLista] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .practicasAlumno(alumnoId)
      .then((r) => setLista(r.practicas))
      .catch((e) => setError(e.message))
  }, [alumnoId])
  if (!lista) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Textos que el alumno eligió leer por su cuenta. No entran en el semáforo, pero muestran su
        interés por leer.
      </p>
      {lista.length === 0 && (
        <Tarjeta className="text-slate-600">Todavía no eligió ninguna lectura libre.</Tarjeta>
      )}
      {lista.map((p) => (
        <Tarjeta key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="space-y-1">
            <p className="font-semibold">{p.titulo}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Categoria valor={p.categoria} />
              {fechaCorta(p.fecha)}
            </div>
          </div>
          <span className="text-sm text-slate-600">
            {p.aciertos ? `${p.aciertos.correctas}/${p.aciertos.total} correctas` : 'Solo lectura'}
          </span>
        </Tarjeta>
      ))}
    </div>
  )
}

function Palabras({ alumnoId }) {
  const [palabras, setPalabras] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .palabrasAlumno(alumnoId)
      .then((r) => setPalabras(r.palabras))
      .catch((e) => setError(e.message))
  }, [alumnoId])
  if (!palabras) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  if (palabras.length === 0)
    return (
      <Tarjeta className="text-slate-600">Todavía no buscó palabras en el diccionario.</Tarjeta>
    )
  return (
    <Tarjeta>
      <p className="mb-3 text-sm text-slate-600">
        Palabras que buscó en el diccionario. Las más repetidas pueden indicar vocabulario difícil.
      </p>
      <ul className="divide-y divide-slate-100">
        {palabras.map((p) => (
          <li key={p.palabra} className="flex items-center justify-between py-2">
            <span className="font-medium">
              {p.palabra}
              {!p.encontrada && (
                <span className="ml-2 text-xs text-slate-500">(no encontrada)</span>
              )}
            </span>
            <span className="text-sm text-slate-600">
              {p.veces} {p.veces === 1 ? 'vez' : 'veces'} · {fechaCorta(p.ultima)}
            </span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}

function Datos({ alumno, onGuardado }) {
  const navigate = useNavigate()
  const { cursos, recargar } = useCursos()
  const [f, setF] = useState({
    nombre: alumno.nombre,
    email: alumno.email,
    cursoId: alumno.cursoId ? String(alumno.cursoId) : '',
  })
  const [pass, setPass] = useState('')
  const [msg, setMsg] = useState({ tipo: 'ok', texto: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const avisar = (tipo, texto) => setMsg({ tipo, texto })

  async function guardar(e) {
    e.preventDefault()
    try {
      await api.editarAlumno(alumno.id, {
        nombre: f.nombre,
        email: f.email,
        ...(f.cursoId ? { cursoId: Number(f.cursoId) } : { grado: Number(alumno.grado) }),
      })
      recargar()
      avisar('ok', 'Datos guardados.')
      onGuardado()
    } catch (err) {
      avisar('error', err.message)
    }
  }
  async function cambiarPass(e) {
    e.preventDefault()
    try {
      await api.passwordAlumno(alumno.id, pass)
      setPass('')
      avisar('ok', 'Contraseña actualizada.')
    } catch (err) {
      avisar('error', err.message)
    }
  }
  async function borrar() {
    if (
      !window.confirm(
        `¿Eliminar a ${alumno.nombre}? Se borran también sus lecturas, resultados y notas. No se puede deshacer.`,
      )
    )
      return
    try {
      await api.borrarAlumno(alumno.id)
      navigate('/docente', { replace: true })
    } catch (err) {
      avisar('error', err.message)
    }
  }

  async function borrarDatos() {
    if (
      !window.confirm(
        `¿Borrar los datos de lectura de ${alumno.nombre}? Se borran sus actividades, resultados, lecturas libres, notas y palabras consultadas. La cuenta se mantiene. No se puede deshacer.`,
      )
    )
      return
    try {
      await api.borrarDatosAlumno(alumno.id)
      avisar('ok', 'Se borraron los datos de lectura.')
    } catch (err) {
      avisar('error', err.message)
    }
  }

  return (
    <div className="space-y-4">
      <Mensaje tipo={msg.tipo}>{msg.texto}</Mensaje>
      <Tarjeta>
        <form onSubmit={guardar} className="space-y-3">
          <h3 className="font-bold">Datos del alumno</h3>
          <Campo
            id="dn"
            etiqueta="Nombre y apellido"
            required
            value={f.nombre}
            onChange={set('nombre')}
          />
          <Campo
            id="de"
            etiqueta="Email"
            type="email"
            required
            value={f.email}
            onChange={set('email')}
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
          <Boton type="submit">Guardar</Boton>
        </form>
      </Tarjeta>
      <Tarjeta>
        <form onSubmit={cambiarPass} className="space-y-3">
          <h3 className="font-bold">Cambiar contraseña</h3>
          <Campo
            id="dp"
            etiqueta="Nueva contraseña (mínimo 8 caracteres)"
            type="text"
            minLength={8}
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <Boton type="submit" variante="suave">
            Cambiar contraseña
          </Boton>
        </form>
      </Tarjeta>
      <Tarjeta className="space-y-2 border-red-200">
        <h3 className="font-bold text-danger">Borrar datos de lectura</h3>
        <p className="text-sm text-slate-600">
          Borra sus actividades, resultados, lecturas libres, notas y palabras consultadas, y deja
          la cuenta activa. Sirve, por ejemplo, para empezar de cero o ante un pedido de la familia.
        </p>
        <Boton variante="peligro" onClick={borrarDatos}>
          Borrar datos de lectura
        </Boton>
      </Tarjeta>
      <Tarjeta className="space-y-2 border-red-200">
        <h3 className="font-bold text-danger">Eliminar alumno</h3>
        <p className="text-sm text-slate-600">
          Se borran también sus lecturas, resultados, notas y palabras consultadas.
        </p>
        <Boton variante="peligro" onClick={borrar}>
          Eliminar alumno
        </Boton>
      </Tarjeta>
    </div>
  )
}

const TABS = [
  ['historial', 'Historial'],
  ['libres', 'Lecturas libres'],
  ['palabras', 'Palabras consultadas'],
  ['datos', 'Datos'],
]

export default function DocenteAlumno() {
  const { id } = useParams()
  const [alumno, setAlumno] = useState(null)
  const [racha, setRacha] = useState(null)
  const [tab, setTab] = useState('historial')
  const [error, setError] = useState('')

  const [descargando, setDescargando] = useState(false)

  async function descargarInforme() {
    setDescargando(true)
    try {
      await descargarInformePdf(await api.resumen(id))
    } catch (e) {
      setError(e.message)
    } finally {
      setDescargando(false)
    }
  }

  const cargar = useCallback(() => {
    api
      .alumno(id)
      .then((r) => setAlumno(r.alumno))
      .catch((e) => setError(e.message))
  }, [id])
  useEffect(cargar, [cargar])
  useEffect(() => {
    api
      .rachaAlumno(id)
      .then(setRacha)
      .catch(() => {})
  }, [id])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!alumno) return <Cargando />

  return (
    <div className="space-y-4">
      <Link to="/docente" className="text-sm font-semibold text-brand hover:underline">
        ← Volver al semáforo
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{alumno.nombre}</h1>
          <p className="text-slate-600">
            {alumno.curso ? `${alumno.curso} · ` : ''}
            {alumno.grado}° grado · {alumno.email}
          </p>
          <InsigniaRacha racha={racha} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/docente/alumnos/${id}/resumen`}
            className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:brightness-95"
          >
            Resumen para la familia
          </Link>
          <button
            onClick={descargarInforme}
            disabled={descargando}
            className="rounded-xl border border-brand px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            {descargando ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      </div>
      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {TABS.map(([k, e]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === k ? 'border-brand text-brand-dark' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            {e}
          </button>
        ))}
      </div>
      {tab === 'historial' && <Historial alumnoId={id} />}
      {tab === 'libres' && <LecturasLibres alumnoId={id} />}
      {tab === 'palabras' && <Palabras alumnoId={id} />}
      {tab === 'datos' && <Datos alumno={alumno} onGuardado={cargar} />}
    </div>
  )
}
