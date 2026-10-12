import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Boton, Cargando, Mensaje } from '../components/ui.jsx'
import { fechaCorta } from '../lib/fechas.js'
import logo from '../assets/logo.png'
import { api } from '../lib/api.js'
import { estadoInfo } from '../lib/semaforo.js'
import { etiquetaCategoria } from '../lib/categorias.js'

const pct = (t) => (t.total ? `${Math.round((t.correctas / t.total) * 100)}%` : '—')

export default function DocenteResumen() {
  const { id } = useParams()
  const [r, setR] = useState(null)
  const [error, setError] = useState('')
  const [conNota, setConNota] = useState(false)

  useEffect(() => {
    api
      .resumen(id)
      .then(setR)
      .catch((e) => setError(e.message))
  }, [id])

  if (error) return <Mensaje>{error}</Mensaje>
  if (!r) return <Cargando />
  const info = estadoInfo(r.estado)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={`/docente/alumnos/${id}`}
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← Volver al alumno
        </Link>
        <div className="flex items-center gap-4">
          {r.nota && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                checked={conNota}
                onChange={(e) => setConNota(e.target.checked)}
              />
              Incluir mi nota
            </label>
          )}
          <Boton onClick={() => window.print()}>Imprimir / guardar PDF</Boton>
        </div>
      </div>

      <article className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <header className="flex items-center justify-between border-b-4 border-gold pb-4">
          <img src={logo} alt="Lectur" className="h-12 w-auto" />
          <div className="text-right text-sm text-slate-600">
            <p>Resumen de lectura para la familia</p>
            <p>{fechaCorta(r.fecha)}</p>
          </div>
        </header>

        <section>
          <h1 className="text-2xl font-bold">{r.alumno.nombre}</h1>
          <p className="text-slate-600">
            {r.alumno.grado}° grado · Docente: {r.docente}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Lecturas completadas</p>
            <p className="text-2xl font-bold">{r.lecturas}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Promedio en cuestionarios</p>
            <p className="text-2xl font-bold">
              {r.promedio === null ? '—' : `${r.promedio.toFixed(1)} / 10`}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Estado actual</p>
            <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold">
              <span className={`size-3 rounded-full ${info.punto}`} aria-hidden="true" />
              {info.etiqueta}
            </p>
          </div>
        </section>

        {r.conCuestionario > 0 && (
          <section>
            <h2 className="mb-2 font-bold">Cómo comprende</h2>
            <p className="text-sm text-slate-700">
              Preguntas sobre lo que el texto dice: <strong>{pct(r.porTipo.literal)}</strong> de
              aciertos. Preguntas sobre lo que el texto sugiere:{' '}
              <strong>{pct(r.porTipo.inferencial)}</strong> de aciertos.
            </p>
          </section>
        )}

        {r.fortalezas.length > 0 && (
          <section>
            <h2 className="mb-2 font-bold text-success">Fortalezas</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {r.fortalezas.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}
        {r.sugerencias.length > 0 && (
          <section>
            <h2 className="mb-2 font-bold text-brand-dark">Cómo acompañar desde casa</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {r.sugerencias.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        {r.ultimas.length > 0 && (
          <section>
            <h2 className="mb-2 font-bold">Últimas lecturas</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-1 font-medium">Texto</th>
                  <th className="py-1 font-medium">Fecha</th>
                  <th className="py-1 font-medium">Correctas</th>
                  <th className="py-1 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {r.ultimas.map((u, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-1.5">
                      {u.titulo}
                      {u.categoria && (
                        <span className="text-slate-500"> ({etiquetaCategoria(u.categoria)})</span>
                      )}
                    </td>
                    <td className="py-1.5">{fechaCorta(u.fecha)}</td>
                    <td className="py-1.5">
                      {u.correctas}/{u.total}
                    </td>
                    <td className="py-1.5">{estadoInfo(u.estado).etiqueta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {r.palabras.total > 0 && (
          <section>
            <h2 className="mb-2 font-bold">Palabras que buscó en el diccionario</h2>
            <p className="text-sm text-slate-700">{r.palabras.top.join(', ')}</p>
          </section>
        )}

        {conNota && r.nota && (
          <section className="rounded-xl bg-brand-soft p-4">
            <h2 className="mb-1 font-bold">Comentario de la docente</h2>
            <p className="text-sm">{r.nota}</p>
          </section>
        )}

        <footer className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          Este resumen es orientativo: muestra cómo viene el proceso de lectura y no reemplaza la
          evaluación de la docente.
        </footer>
      </article>
    </div>
  )
}
