import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { CATEGORIAS } from '../lib/categorias.js'

const NIVELES = { facil: 'Fácil', intermedio: 'Intermedio', dificil: 'Difícil' }

function TarjetaTexto({ t }) {
  return (
    <Link to={`/alumno/practica/${t.id}`} className="block">
      <Tarjeta className="flex items-center justify-between gap-3 transition hover:border-brand">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">{t.titulo}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Categoria valor={t.categoria} />
            {NIVELES[t.nivel]}
            {t.cantidadPreguntas > 0 ? ' · con preguntas' : ''}
            {t.leido && <span className="font-semibold text-success">· Ya lo leíste</span>}
          </div>
        </div>
        <span className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink">Leer</span>
      </Tarjeta>
    </Link>
  )
}

export default function AlumnoPractica() {
  const [textos, setTextos] = useState(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    api
      .practicaTextos()
      .then((r) => setTextos(r.textos))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!textos) return <Cargando />

  const sugeridos = textos.filter((t) => t.sugerido)
  const visibles = textos.filter((t) => !filtro || t.categoria === filtro)
  const chip = (valor, etiqueta) => (
    <button
      key={valor}
      onClick={() => setFiltro(valor)}
      aria-pressed={filtro === valor}
      className={`rounded-full border px-3 py-1 text-sm font-semibold ${
        filtro === valor
          ? 'border-brand bg-brand text-white'
          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {etiqueta}
    </button>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Practicar</h1>
        <p className="text-slate-600">
          Elegí los textos que quieras para seguir leyendo. Cada lectura cuenta para tu racha.
        </p>
      </div>

      {sugeridos.length > 0 && !filtro && (
        <section className="space-y-3" aria-label="Para vos">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Para vos</h2>
          {sugeridos.map((t) => (
            <TarjetaTexto key={t.id} t={t} />
          ))}
        </section>
      )}

      <section className="space-y-3" aria-label="Todos los textos">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Todos los textos
        </h2>
        <div className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          {chip('', 'Todos')}
          {CATEGORIAS.map((c) => chip(c.valor, c.etiqueta))}
        </div>
        {visibles.length === 0 && (
          <Tarjeta className="text-slate-600">No hay textos en esta categoría.</Tarjeta>
        )}
        {visibles.map((t) => (
          <TarjetaTexto key={t.id} t={t} />
        ))}
      </section>
    </div>
  )
}
