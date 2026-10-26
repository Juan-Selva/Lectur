import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { CATEGORIAS, SIN_CATEGORIA, categoria } from '../lib/categorias.js'

// El nivel se muestra como una plantita que crece.
const NIVELES = {
  facil: { texto: 'Fácil', emoji: '🌱' },
  intermedio: { texto: 'Intermedio', emoji: '🌿' },
  dificil: { texto: 'Difícil', emoji: '🌳' },
}

function TarjetaTexto({ t, i }) {
  const c = categoria(t.categoria) ?? SIN_CATEGORIA
  const nivel = NIVELES[t.nivel]
  return (
    <Link
      to={`/alumno/practica/${t.id}`}
      className={`tarjeta-saltarina tarjeta group flex animate-aparecer items-center gap-4 border-slate-200 bg-white p-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${c.borde}`}
      style={{ animationDelay: `${Math.min(i, 10) * 0.05}s` }}
    >
      <span
        aria-hidden="true"
        className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-4xl transition-transform group-hover:rotate-6 group-hover:scale-110 ${c.fondo}`}
      >
        {c.emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <h3 className="text-lg leading-tight">{t.titulo}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-600">
          <Categoria valor={t.categoria} />
          {nivel && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5">
              <span aria-hidden="true">{nivel.emoji}</span> {nivel.texto}
            </span>
          )}
          {t.cantidadPreguntas > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5">
              <span aria-hidden="true">❓</span> con preguntas
            </span>
          )}
          {t.leido && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
              ✓ Ya lo leíste
            </span>
          )}
        </div>
      </div>
      <span className="boton-juego hidden shrink-0 rounded-2xl bg-gold px-4 py-2 font-extrabold text-ink sm:inline-block">
        Leer
      </span>
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
  const chip = (valor, etiqueta, emoji, colores) => (
    <button
      key={valor}
      onClick={() => setFiltro(valor)}
      aria-pressed={filtro === valor}
      className={`flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition hover:-translate-y-0.5 ${
        filtro === valor
          ? `border-ink/20 ${colores} shadow-[0_3px_0_rgb(23_50_75/0.2)]`
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span aria-hidden="true" className="text-lg">
        {emoji}
      </span>
      {etiqueta}
    </button>
  )

  return (
    <div className="space-y-8">
      <section className="hero flex items-center gap-4 rounded-3xl border-2 border-orange-200 bg-linear-to-br from-orange-100 via-amber-50 to-pink-100 p-6">
        <span aria-hidden="true" className="animate-flotar text-6xl">
          🎯
        </span>
        <div>
          <h1 className="text-3xl">Practicar</h1>
          <p className="font-semibold text-slate-700">
            Elegí los textos que quieras para seguir leyendo. Cada lectura cuenta para tu racha.
          </p>
        </div>
      </section>

      {sugeridos.length > 0 && !filtro && (
        <section className="space-y-3" aria-labelledby="titulo-sugeridos">
          <h2 id="titulo-sugeridos" className="text-xl">
            <span aria-hidden="true">✨</span> Para vos
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {sugeridos.map((t, i) => (
              <TarjetaTexto key={t.id} t={t} i={i} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4" aria-labelledby="titulo-todos">
        <h2 id="titulo-todos" className="text-xl">
          <span aria-hidden="true">📚</span> Todos los textos
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          {chip('', 'Todos', '🌈', 'bg-sky-100 text-sky-900')}
          {CATEGORIAS.map((c) => chip(c.valor, c.etiqueta, c.emoji, c.chip))}
        </div>
        {visibles.length === 0 && (
          <Tarjeta className="text-center text-slate-600">
            <span aria-hidden="true" className="mb-1 block text-4xl">
              🔭
            </span>
            No hay textos en esta categoría.
          </Tarjeta>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {visibles.map((t, i) => (
            <TarjetaTexto key={t.id} t={t} i={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
