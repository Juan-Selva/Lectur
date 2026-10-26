import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { TarjetaRacha } from '../components/Racha.jsx'
import { api } from '../lib/api.js'

export default function AlumnoActividades() {
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

  return (
    <div className="space-y-6">
      {racha && <TarjetaRacha racha={racha} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mis lecturas</h1>
        <Link
          to="/alumno/practica"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Practicar con más textos
        </Link>
      </div>
      <section className="space-y-3" aria-label="Pendientes">
        {pendientes.length === 0 && (
          <Tarjeta className="text-slate-600">No tenés lecturas pendientes. ¡Buen trabajo!</Tarjeta>
        )}
        {pendientes.map((a) => (
          <Link key={a.id} to={`/alumno/lectura/${a.id}`} className="block">
            <Tarjeta className="flex items-center justify-between gap-3 transition hover:border-brand">
              <div>
                <h2 className="text-lg font-bold">{a.titulo}</h2>
                <Categoria valor={a.categoria} />
                <p className="text-sm text-slate-600">
                  {a.conCuestionario ? 'Con preguntas' : 'Solo lectura'}
                </p>
              </div>
              <span className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-ink">Leer</span>
            </Tarjeta>
          </Link>
        ))}
      </section>
      {hechas.length > 0 && (
        <section className="space-y-2" aria-label="Completadas">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Completadas
          </h2>
          {hechas.map((a) => (
            <Tarjeta key={a.id} className="flex items-center justify-between py-3">
              <span className="font-medium">{a.titulo}</span>
              <span className="text-sm text-slate-600">
                {a.aciertos ? `${a.aciertos.correctas} de ${a.aciertos.total} correctas` : 'Leída'}
              </span>
            </Tarjeta>
          ))}
        </section>
      )}
    </div>
  )
}
