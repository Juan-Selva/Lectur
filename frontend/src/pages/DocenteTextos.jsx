import { useCallback, useEffect, useState } from 'react'
import { Boton, Campo, Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { CATEGORIAS } from '../lib/categorias.js'

const preguntaVacia = () => ({ enunciado: '', tipo: 'literal', opciones: ['', ''], correcta: 0 })

function Formulario({ inicial, onGuardado, onCancelar }) {
  const editando = Boolean(inicial)
  const [titulo, setTitulo] = useState(inicial?.texto.titulo ?? '')
  const [cuerpo, setCuerpo] = useState(inicial?.texto.cuerpo ?? '')
  const [categoria, setCategoria] = useState(inicial?.texto.categoria ?? '')
  const [preguntas, setPreguntas] = useState(
    (inicial?.preguntas ?? []).map(({ enunciado, tipo, opciones, correcta }) => ({
      enunciado,
      tipo,
      opciones,
      correcta,
    })),
  )
  const [error, setError] = useState('')

  const cambiar = (i, parche) =>
    setPreguntas((ps) => ps.map((p, k) => (k === i ? { ...p, ...parche } : p)))
  const cambiarOpcion = (i, j, v) =>
    cambiar(i, { opciones: preguntas[i].opciones.map((o, k) => (k === j ? v : o)) })

  async function guardar(e) {
    e.preventDefault()
    setError('')
    const datos = { titulo, cuerpo, preguntas, ...(categoria ? { categoria } : {}) }
    try {
      if (editando) await api.editarTexto(inicial.texto.id, datos)
      else await api.crearTexto(datos)
      onGuardado()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Tarjeta>
      <form onSubmit={guardar} className="space-y-4">
        <h2 className="text-lg font-bold">{editando ? 'Editar texto' : 'Nuevo texto'}</h2>
        <Campo
          id="t"
          etiqueta="Título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <label className="block text-sm font-medium">
          Categoría (opcional)
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
          >
            <option value="">Sin categoría</option>
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </label>
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
          <Boton type="submit">{editando ? 'Guardar cambios' : 'Guardar texto'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

export default function DocenteTextos() {
  const [textos, setTextos] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(null) // null | { inicial?: {...} }
  const [filtro, setFiltro] = useState('')

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
  async function editar(id) {
    setError('')
    try {
      const d = await api.texto(id)
      setForm({ inicial: d })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message)
    }
  }

  if (!textos) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  const visibles = textos.filter((t) => !filtro || t.categoria === filtro)
  const fila = (t) => (
    <Tarjeta key={t.id} className="flex items-center justify-between gap-3 py-3">
      <div className="space-y-1">
        <p className="font-semibold">{t.titulo}</p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Categoria valor={t.categoria} />
          {t.cantidad_preguntas} pregunta{t.cantidad_preguntas === 1 ? '' : 's'}
        </div>
      </div>
      {t.propio && (
        <div className="flex gap-2">
          <Boton variante="suave" onClick={() => editar(t.id)}>
            Editar
          </Boton>
          <Boton variante="peligro" onClick={() => borrar(t.id)}>
            Borrar
          </Boton>
        </div>
      )}
    </Tarjeta>
  )
  const chip = (valor, etiqueta) => (
    <button
      key={valor}
      onClick={() => setFiltro(valor)}
      aria-pressed={filtro === valor}
      className={`rounded-full border px-3 py-1 text-sm font-semibold ${filtro === valor ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {etiqueta}
    </button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Textos</h1>
        {!form && <Boton onClick={() => setForm({})}>+ Nuevo texto</Boton>}
      </div>
      <Mensaje>{error}</Mensaje>
      {form && (
        <Formulario
          key={form.inicial?.texto.id ?? 'nuevo'}
          inicial={form.inicial}
          onCancelar={() => setForm(null)}
          onGuardado={() => {
            setForm(null)
            cargar()
          }}
        />
      )}
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
        {chip('', 'Todas')}
        {CATEGORIAS.map((c) => chip(c.valor, c.etiqueta))}
      </div>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Mis textos (privados)
        </h2>
        {visibles.filter((t) => t.propio).map(fila)}
        {!visibles.some((t) => t.propio) && (
          <p className="text-sm text-slate-500">No hay textos propios en esta vista.</p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Textos de Lectur
        </h2>
        {visibles.filter((t) => !t.propio).map(fila)}
        {!visibles.some((t) => !t.propio) && (
          <p className="text-sm text-slate-500">No hay textos en esta categoría.</p>
        )}
      </section>
    </div>
  )
}
