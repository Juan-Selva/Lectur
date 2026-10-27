import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Campo, Mensaje, Modal, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { useCursos } from '../lib/cursos.jsx'

function ModalCurso({ curso, onCerrar, onListo }) {
  const [nombre, setNombre] = useState(curso?.nombre ?? '')
  const [grado, setGrado] = useState(String(curso?.grado ?? 1))
  const [error, setError] = useState('')
  async function guardar(e) {
    e.preventDefault()
    try {
      const datos = { nombre, grado: Number(grado) }
      if (curso) await api.editarCurso(curso.id, datos)
      else await api.crearCurso(datos)
      onListo()
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <Modal titulo={curso ? 'Editar curso' : 'Nuevo curso'} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-3">
        <Campo
          id="cn"
          etiqueta="Nombre (por ejemplo 2.° A)"
          required
          maxLength={40}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <label className="block text-sm font-medium">
          Grado
          <select
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            {[1, 2, 3].map((g) => (
              <option key={g} value={g}>
                {g}° grado
              </option>
            ))}
          </select>
        </label>
        <Mensaje>{error}</Mensaje>
        <Boton type="submit" className="w-full">
          {curso ? 'Guardar cambios' : 'Crear curso'}
        </Boton>
      </form>
    </Modal>
  )
}

function ModalVerCurso({ curso, onCerrar }) {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .alumnosCurso(curso.id)
      .then(setDatos)
      .catch((e) => setError(e.message))
  }, [curso.id])
  return (
    <Modal titulo={`Curso ${curso.nombre}`} onCerrar={onCerrar}>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          {curso.grado}° grado · {curso.alumnos} alumno{curso.alumnos === 1 ? '' : 's'}
        </p>
        <Mensaje>{error}</Mensaje>
        {!datos && !error && <p className="text-sm text-slate-500">Cargando…</p>}
        {datos?.alumnos.length === 0 && (
          <p className="text-sm text-slate-600">Este curso todavía no tiene alumnos.</p>
        )}
        {datos?.alumnos.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {datos.alumnos.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{a.nombre}</p>
                  <p className="text-sm text-slate-500">{a.email}</p>
                </div>
                <Link
                  to={`/docente/alumnos/${a.id}`}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  Ver ficha
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end">
          <Boton onClick={onCerrar}>Cerrar</Boton>
        </div>
      </div>
    </Modal>
  )
}

export default function DocenteCursos() {
  const { cursos, recargar } = useCursos()
  const [modal, setModal] = useState(null) // null | {} (nuevo) | { curso }
  const [verCurso, setVerCurso] = useState(null) // null | curso
  const [error, setError] = useState('')

  async function borrar(c) {
    if (!window.confirm(`¿Borrar el curso ${c.nombre}?`)) return
    setError('')
    try {
      await api.borrarCurso(c.id)
      recargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Boton onClick={() => setModal({})}>+ Nuevo curso</Boton>
      </div>
      <p className="text-sm text-slate-600">
        Organizá a tus alumnos por curso. Después podés filtrar el semáforo, las palabras y las
        asignaciones desde el selector de curso de arriba.
      </p>
      <Mensaje>{error}</Mensaje>
      {cursos.length === 0 && (
        <Tarjeta className="text-slate-600">Todavía no tenés cursos. Creá el primero.</Tarjeta>
      )}
      {cursos.map((c) => (
        <Tarjeta key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="text-lg font-bold">{c.nombre}</p>
            <p className="text-sm text-slate-500">
              {c.grado}° grado · {c.alumnos} alumno{c.alumnos === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <Boton variante="suave" onClick={() => setVerCurso(c)}>
              Ver curso
            </Boton>
            <Boton variante="suave" onClick={() => setModal({ curso: c })}>
              Editar
            </Boton>
            <Boton variante="peligro" onClick={() => borrar(c)}>
              Borrar
            </Boton>
          </div>
        </Tarjeta>
      ))}
      {verCurso && <ModalVerCurso curso={verCurso} onCerrar={() => setVerCurso(null)} />}
      {modal && (
        <ModalCurso
          curso={modal.curso}
          onCerrar={() => setModal(null)}
          onListo={() => {
            setModal(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}
