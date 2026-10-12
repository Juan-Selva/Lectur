import { useCallback, useEffect, useState } from 'react'
import { Boton, Campo, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'

const preguntaVacia = () => ({ enunciado: '', tipo: 'literal', opciones: ['', ''], correcta: 0 })

function Formulario({ onGuardado, onCancelar }) {
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [preguntas, setPreguntas] = useState([])
  const [error, setError] = useState('')

  const cambiar = (i, parche) =>
    setPreguntas((ps) => ps.map((p, k) => (k === i ? { ...p, ...parche } : p)))
  const cambiarOpcion = (i, j, v) =>
    cambiar(i, { opciones: preguntas[i].opciones.map((o, k) => (k === j ? v : o)) })

  async function guardar(e) {
    e.preventDefault()
    setError('')
    try {
      await api.crearTexto({ titulo, cuerpo, preguntas })
      onGuardado()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={guardar} className="space-y-4">
        <Campo
          id="t"
          etiqueta="Título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <label className="block text-sm font-medium">
          Texto
          <textarea
            required
            minLength={20}
            rows={6}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 p-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Preguntas (opcional)</h3>
          {preguntas.map((p, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <Campo
                id={`q${i}`}
                etiqueta={`Pregunta ${i + 1}`}
                required
                value={p.enunciado}
                onChange={(e) => cambiar(i, { enunciado: e.target.value })}
              />
              <select
                aria-label="Tipo"
                value={p.tipo}
                onChange={(e) => cambiar(i, { tipo: e.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="literal">Literal</option>
                <option value="inferencial">Inferencial</option>
              </select>
              {p.opciones.map((o, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`c${i}`}
                    aria-label={`Opción ${j + 1} correcta`}
                    checked={p.correcta === j}
                    onChange={() => cambiar(i, { correcta: j })}
                    className="size-4 accent-success"
                  />
                  <input
                    aria-label={`Opción ${j + 1}`}
                    required
                    value={o}
                    onChange={(e) => cambiarOpcion(i, j, e.target.value)}
                    placeholder={`Opción ${j + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div className="flex gap-3 text-sm">
                {p.opciones.length < 4 && (
                  <button
                    type="button"
                    className="font-semibold text-brand"
                    onClick={() => cambiar(i, { opciones: [...p.opciones, ''] })}
                  >
                    + Opción
                  </button>
                )}
                <button
                  type="button"
                  className="font-semibold text-danger"
                  onClick={() => setPreguntas(preguntas.filter((_, k) => k !== i))}
                >
                  Quitar pregunta
                </button>
              </div>
              <p className="text-xs text-slate-500">Marcá con el círculo la opción correcta.</p>
            </div>
          ))}
          {preguntas.length < 10 && (
            <Boton
              type="button"
              variante="suave"
              onClick={() => setPreguntas([...preguntas, preguntaVacia()])}
            >
              + Agregar pregunta
            </Boton>
          )}
        </div>

        <Mensaje>{error}</Mensaje>
        <div className="flex justify-end gap-2">
          <Boton type="button" variante="suave" onClick={onCancelar}>
            Cancelar
          </Boton>
          <Boton type="submit">Guardar texto</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

export default function DocenteTextos() {
  const [textos, setTextos] = useState(null)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)

  const cargar = useCallback(() => {
    api
      .textos()
      .then((r) => setTextos(r.textos))
      .catch((e) => setError(e.message))
  }, [])
  useEffect(cargar, [cargar])

  async function borrar(id) {
    setError('')
    try {
      await api.borrarTexto(id)
      cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!textos) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  const fila = (t) => (
    <Tarjeta key={t.id} className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-semibold">{t.titulo}</p>
        <p className="text-sm text-slate-500">
          {t.cantidad_preguntas} pregunta{t.cantidad_preguntas === 1 ? '' : 's'}
        </p>
      </div>
      {t.propio && (
        <Boton variante="peligro" onClick={() => borrar(t.id)}>
          Borrar
        </Boton>
      )}
    </Tarjeta>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Textos</h1>
        {!creando && <Boton onClick={() => setCreando(true)}>+ Nuevo texto</Boton>}
      </div>
      <Mensaje>{error}</Mensaje>
      {creando && (
        <Formulario
          onCancelar={() => setCreando(false)}
          onGuardado={() => {
            setCreando(false)
            cargar()
          }}
        />
      )}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Mis textos (privados)
        </h2>
        {textos.filter((t) => t.propio).map(fila)}
        {!textos.some((t) => t.propio) && (
          <p className="text-sm text-slate-500">Todavía no escribiste ninguno.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Textos de Lectur
        </h2>
        {textos.filter((t) => !t.propio).map(fila)}
      </section>
    </div>
  )
}
