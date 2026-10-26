import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { TarjetaRacha } from '../components/Racha.jsx'
import Mascota from '../components/Mascota.jsx'
import { Estrellas } from '../components/Festejo.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { SIN_CATEGORIA, categoria } from '../lib/categorias.js'
import { estrellasDe, saludo } from '../lib/logros.js'

function Bienvenida({ nombre, pendientes }) {
  return (
    <section className="hero relative overflow-hidden rounded-3xl bg-linear-to-br from-brand via-sky-600 to-indigo-600 p-6 text-white shadow-[0_8px_0_rgb(5_98_170/0.25)] sm:p-8">
      <div
        aria-hidden="true"
        className="decorativo absolute -right-10 -top-10 size-48 rounded-full bg-white/10"
      />
      <div
        aria-hidden="true"
        className="decorativo absolute -bottom-16 right-32 size-40 rounded-full bg-white/10"
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl">
            {saludo()}, {nombre}! <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-lg font-semibold text-sky-50">
            {pendientes === 0
              ? '¡Leíste todo lo que te dejaron! ¿Querés practicar con más textos?'
              : pendientes === 1
                ? 'Tenés 1 lectura esperándote. ¡Vamos!'
                : `Tenés ${pendientes} lecturas esperándote. ¡Vamos!`}
          </p>
        </div>
        <Mascota className="size-28 shrink-0 animate-flotar sm:size-36" />
      </div>
    </section>
  )
}

function TarjetaLectura({ a, i }) {
  const c = categoria(a.categoria) ?? SIN_CATEGORIA
  return (
    <Link
      to={`/alumno/lectura/${a.id}`}
      className={`tarjeta-saltarina tarjeta group flex animate-aparecer flex-col overflow-hidden border-slate-200 bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/40 ${c.borde}`}
      style={{ animationDelay: `${i * 0.07}s` }}
    >
      <div className={`flex h-24 items-center justify-center ${c.fondo}`} aria-hidden="true">
        <span className="text-6xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
          {c.emoji}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-xl leading-tight">{a.titulo}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Categoria valor={a.categoria} />
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {a.conCuestionario ? '❓ Con preguntas' : '📖 Solo lectura'}
          </span>
        </div>
        <span className="boton-juego mt-auto inline-flex items-center justify-center gap-1 self-end rounded-2xl bg-gold px-5 py-2.5 font-extrabold text-ink">
          ¡A leer! <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  )
}

export default function AlumnoActividades() {
  const { usuario } = useAuth()
  const [items, setItems] = useState(null)
  const [racha, setRacha] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .actividades()
      .then((r) => setItems(r.actividades))
      .catch((e) => setError(e.message))
    api
      .racha()
      .then(setRacha)
      .catch(() => {})
  }, [])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!items) return <Cargando />

  const pendientes = items.filter((a) => a.estado === 'pendiente')
  const hechas = items.filter((a) => a.estado === 'completada')
  const nombre = usuario.nombre?.trim().split(/\s+/)[0] ?? ''

  return (
    <div className="space-y-8">
      <Bienvenida nombre={nombre} pendientes={pendientes.length} />
      {racha && <TarjetaRacha racha={racha} />}

      <section className="space-y-4" aria-labelledby="titulo-pendientes">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-pendientes" className="text-2xl">
            <span aria-hidden="true">📚</span> Mis lecturas
          </h2>
          <Link
            to="/alumno/practica"
            className="boton-juego rounded-2xl border-2 border-orange-200 bg-white px-4 py-2 font-bold text-orange-700 hover:bg-orange-50"
          >
            <span aria-hidden="true">🎯</span> Practicar con más textos
          </Link>
        </div>
        {pendientes.length === 0 ? (
          <Tarjeta className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-5xl" aria-hidden="true">
              🎉
            </span>
            <p className="titulo-juego text-xl">No tenés lecturas pendientes. ¡Buen trabajo!</p>
            <p className="text-slate-600">
              Cuando tu docente te deje una nueva, va a aparecer acá.
            </p>
          </Tarjeta>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendientes.map((a, i) => (
              <TarjetaLectura key={a.id} a={a} i={i} />
            ))}
          </div>
        )}
      </section>

      {hechas.length > 0 && (
        <section className="space-y-3" aria-labelledby="titulo-completadas">
          <h2 id="titulo-completadas" className="text-xl text-slate-700">
            <span aria-hidden="true">✅</span> Completadas
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {hechas.map((a) => {
              const c = categoria(a.categoria) ?? SIN_CATEGORIA
              return (
                <li key={a.id}>
                  <Tarjeta className="flex items-center gap-3 py-3">
                    <span
                      aria-hidden="true"
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xl ${c.fondo}`}
                    >
                      {c.emoji}
                    </span>
                    <span className="min-w-0 flex-1 font-bold">{a.titulo}</span>
                    {a.aciertos ? (
                      <span className="flex flex-col items-end text-xs text-slate-600">
                        <Estrellas cantidad={estrellasDe(a.aciertos)} tamano="text-base" />
                        {a.aciertos.correctas} de {a.aciertos.total} correctas
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-success">Leída ✓</span>
                    )}
                  </Tarjeta>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
