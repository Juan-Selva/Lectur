import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Categoria, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import AjustesLectura from '../components/AjustesLectura.jsx'
import Enunciado from '../components/Enunciado.jsx'
import PreguntaOrden from '../components/PreguntaOrden.jsx'
import { armarRespuesta } from '../lib/preguntas.js'
import DiccionarioRapido from '../components/DiccionarioRapido.jsx'
import Mascota from '../components/Mascota.jsx'
import { Confeti, Estrellas } from '../components/Festejo.jsx'
import { Flama } from '../components/Racha.jsx'
import { emojiHito, nombreHito } from '../lib/racha.js'
import { estrellasDe, mensajeFinal } from '../lib/logros.js'
import { SIN_CATEGORIA, categoria } from '../lib/categorias.js'
import { api } from '../lib/api.js'

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F']
const COLORES_LETRA = [
  'bg-sky-500',
  'bg-amber-400',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-violet-500',
]

// Camino de la actividad: Leer → Preguntas → ¡Listo!
function Pasos({ fase, conCuestionario }) {
  const pasos = [
    { id: 'lectura', emoji: '📖', texto: 'Leer' },
    ...(conCuestionario ? [{ id: 'preguntas', emoji: '❓', texto: 'Preguntas' }] : []),
    { id: 'final', emoji: '🎉', texto: '¡Listo!' },
  ]
  const actual = pasos.findIndex((p) => p.id === fase)
  return (
    <ol
      className="flex items-center justify-center gap-1 sm:gap-2"
      aria-label="Pasos de la lectura"
    >
      {pasos.map((p, i) => (
        <li key={p.id} className="flex items-center gap-1 sm:gap-2">
          {i > 0 && (
            <span
              aria-hidden="true"
              className={`h-1 w-6 rounded-full sm:w-12 ${i <= actual ? 'bg-brand' : 'bg-slate-200'}`}
            />
          )}
          <span
            aria-current={i === actual ? 'step' : undefined}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold ${
              i === actual
                ? 'bg-brand text-white shadow-[0_3px_0_rgb(5_98_170/0.4)]'
                : i < actual
                  ? 'bg-brand-soft text-brand-dark'
                  : 'bg-white text-slate-400 ring-1 ring-slate-200'
            }`}
          >
            <span aria-hidden="true">{i < actual ? '✓' : p.emoji}</span>
            {p.texto}
          </span>
        </li>
      ))}
    </ol>
  )
}

// Barrita fija arriba que se va llenando a medida que se baja por el texto.
function ProgresoLectura() {
  const [avance, setAvance] = useState(0)
  useEffect(() => {
    const medir = () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight
      setAvance(alto <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / alto) * 100)))
    }
    const frame = requestAnimationFrame(medir)
    window.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [])
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-1.5 bg-transparent">
      <div
        className="h-full rounded-r-full bg-linear-to-r from-sky-400 via-amber-300 to-pink-400 transition-[width] duration-150"
        style={{ width: `${avance}%` }}
      />
    </div>
  )
}

function Encabezado({ actividad }) {
  const c = categoria(actividad.categoria) ?? SIN_CATEGORIA
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${c.fondo}`}
        >
          {c.emoji}
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl leading-tight sm:text-3xl">{actividad.titulo}</h1>
          {actividad.autor && <p className="text-sm text-slate-600">Autor: {actividad.autor}</p>}
          <Categoria valor={actividad.categoria} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DiccionarioRapido className="boton-juego rounded-xl border-2 border-emerald-300 bg-white px-3 py-1.5 text-sm font-bold text-emerald-800 hover:bg-emerald-50">
          <span aria-hidden="true">🔍</span> Diccionario
        </DiccionarioRapido>
        <AjustesLectura />
      </div>
    </div>
  )
}

function PantallaFinal({ final, practica }) {
  const estrellas = estrellasDe(final.aciertos)
  const { titulo, texto } = mensajeFinal(final.aciertos)
  return (
    <>
      <Confeti />
      <Tarjeta className="relative space-y-4 overflow-hidden py-8 text-center">
        <Mascota estado="festejo" className="mx-auto size-32 animate-flotar" />
        <h1 className="animate-aparecer text-4xl text-brand-dark">{titulo}</h1>
        {estrellas > 0 && <Estrellas cantidad={estrellas} tamano="text-5xl" animadas />}
        {final.aciertos ? (
          <p className="text-lg font-semibold">
            Respondiste bien {final.aciertos.correctas} de {final.aciertos.total} preguntas.
          </p>
        ) : (
          <p className="text-lg font-semibold">Lectura completada.</p>
        )}
        <p className="text-slate-600">{texto}</p>
        {final.racha && final.racha.actual > 0 && (
          <p className="mx-auto flex w-fit items-center justify-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-lg font-extrabold text-orange-700 ring-2 ring-orange-200">
            <Flama className="size-7 animate-llama" />
            Racha de {final.racha.actual} {final.racha.actual === 1 ? 'día' : 'días'}
          </p>
        )}
        {final.racha?.nuevoHito && (
          <p
            className="mx-auto w-fit animate-brillo rounded-2xl border-2 border-gold bg-amber-50 px-5 py-3 text-lg font-extrabold"
            role="status"
          >
            <span aria-hidden="true" className="mr-1 inline-block animate-saltito text-2xl">
              {emojiHito(final.racha.nuevoHito)}
            </span>
            ¡Nueva insignia: {nombreHito(final.racha.nuevoHito)}!
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            to={practica ? '/alumno/practica' : '/alumno'}
            className="boton-juego inline-block rounded-2xl bg-brand px-6 py-3 font-extrabold text-white"
          >
            {practica ? 'Elegir otro texto' : 'Volver a mis lecturas'}
          </Link>
          {!practica && (
            <Link
              to="/alumno/practica"
              className="boton-juego inline-block rounded-2xl border-2 border-orange-200 bg-white px-6 py-3 font-extrabold text-orange-700"
            >
              <span aria-hidden="true">🎯</span> Seguir practicando
            </Link>
          )}
        </div>
      </Tarjeta>
    </>
  )
}

export default function AlumnoLectura({ practica = false }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [fase, setFase] = useState('lectura') // lectura | preguntas | final
  const [respuestas, setRespuestas] = useState({})
  const [final, setFinal] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (practica) {
      api
        .practicaTexto(id)
        .then((d) =>
          setDatos({
            actividad: {
              id: d.texto.id,
              titulo: d.texto.titulo,
              cuerpo: d.texto.cuerpo,
              categoria: d.texto.categoria,
              autor: d.texto.autor,
              conCuestionario: d.preguntas.length > 0,
              estado: 'pendiente',
            },
            preguntas: d.preguntas,
          }),
        )
        .catch((e) => setError(e.message))
      return
    }
    api
      .actividad(id)
      .then((d) => {
        if (d.actividad.estado === 'completada') navigate('/alumno', { replace: true })
        else setDatos(d)
      })
      .catch((e) => setError(e.message))
  }, [id, navigate, practica])

  // Cada cambio de paso arranca desde arriba de la pantalla.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [fase])

  async function enviar(rs) {
    setError('')
    setEnviando(true)
    try {
      setFinal(await (practica ? api.practicaCompletar(id, rs) : api.completar(id, rs)))
      setFase('final')
    } catch (e) {
      setError(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (error && !datos) return <Mensaje>{error}</Mensaje>
  if (!datos) return <Cargando />
  const { actividad, preguntas } = datos

  if (fase === 'final') {
    return (
      <div className="space-y-6">
        <Pasos fase={fase} conCuestionario={actividad.conCuestionario} />
        <PantallaFinal final={final} practica={practica} />
      </div>
    )
  }

  if (fase === 'preguntas') {
    const respondidas = preguntas.filter((p) => respuestas[p.id] !== undefined).length
    const completo = respondidas === preguntas.length
    return (
      <div className="space-y-5">
        <Pasos fase={fase} conCuestionario={actividad.conCuestionario} />
        <Encabezado actividad={actividad} />

        <div className="sticky top-[4.25rem] z-30 rounded-2xl border-2 border-slate-200 bg-white/95 p-3 backdrop-blur">
          <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
            <span>
              {completo ? '¡Respondiste todas! Ya podés terminar 🎉' : '¿Qué entendiste del texto?'}
            </span>
            <span className="text-slate-600">
              {respondidas} de {preguntas.length}
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Preguntas respondidas"
            aria-valuemin={0}
            aria-valuemax={preguntas.length}
            aria-valuenow={respondidas}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-400 to-sky-500 transition-all duration-500"
              style={{ width: `${(respondidas / preguntas.length) * 100}%` }}
            />
          </div>
        </div>

        {preguntas.map((p, i) => {
          const respondida = respuestas[p.id] !== undefined
          return (
            <Tarjeta
              key={p.id}
              className={`animate-aparecer transition-colors ${respondida ? 'border-emerald-200' : ''}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <fieldset>
                <legend className="lectura mb-4 flex items-start gap-3 font-bold">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold text-white transition-colors ${
                      respondida ? 'bg-success' : 'bg-brand'
                    }`}
                  >
                    {respondida ? '✓' : i + 1}
                  </span>
                  <span>
                    <span className="sr-only">{i + 1}. </span>
                    <Enunciado texto={p.enunciado} />
                  </span>
                </legend>
                {p.formato === 'orden' ? (
                  <PreguntaOrden
                    opciones={p.opciones}
                    valor={respuestas[p.id]}
                    onCambiar={(v) => setRespuestas({ ...respuestas, [p.id]: v })}
                  />
                ) : (
                  <div className="grid gap-2.5">
                    {p.opciones.map((o, k) => {
                      const elegida = respuestas[p.id] === k
                      return (
                        <label
                          key={k}
                          className={`lectura flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30 ${
                            elegida
                              ? 'border-brand bg-brand-soft shadow-[0_3px_0_rgb(8_117_201/0.35)]'
                              : 'border-slate-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`p${p.id}`}
                            checked={elegida}
                            onChange={() => setRespuestas({ ...respuestas, [p.id]: k })}
                            className="sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-base font-extrabold text-white ${
                              elegida
                                ? 'animate-saltito bg-brand'
                                : COLORES_LETRA[k % COLORES_LETRA.length]
                            }`}
                          >
                            {elegida ? '✓' : LETRAS[k]}
                          </span>
                          {o}
                        </label>
                      )
                    })}
                  </div>
                )}
              </fieldset>
            </Tarjeta>
          )
        })}
        <Mensaje>{error}</Mensaje>
        <div className="flex flex-wrap justify-between gap-3">
          <Boton variante="suave" onClick={() => setFase('lectura')}>
            <span aria-hidden="true">📖</span>&nbsp;Volver al texto
          </Boton>
          <Boton
            variante="dorado"
            disabled={!completo || enviando}
            onClick={() => enviar(preguntas.map((p) => armarRespuesta(p, respuestas[p.id])))}
          >
            {enviando ? 'Enviando…' : '¡Terminar! 🏁'}
          </Boton>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <ProgresoLectura />
      <Pasos fase={fase} conCuestionario={actividad.conCuestionario} />
      <Encabezado actividad={actividad} />
      <Tarjeta className="relative border-amber-100 bg-[#fffdf7] p-6 sm:p-10">
        <p className="lectura whitespace-pre-line">{actividad.cuerpo}</p>
      </Tarjeta>
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 ring-2 ring-emerald-100">
        <Mascota className="size-14 shrink-0" />
        <p className="text-slate-700">
          ¿Hay una palabra que no entendés? Buscala en el{' '}
          <DiccionarioRapido className="font-bold text-emerald-800 underline">
            diccionario
          </DiccionarioRapido>
          .
        </p>
      </div>
      <Mensaje>{error}</Mensaje>
      <div className="flex flex-wrap justify-end gap-3">
        {practica && actividad.conCuestionario && (
          <Boton variante="suave" disabled={enviando} onClick={() => enviar([])}>
            {enviando ? 'Guardando…' : 'Terminé de leer'}
          </Boton>
        )}
        {actividad.conCuestionario ? (
          <Boton variante="dorado" onClick={() => setFase('preguntas')}>
            Responder preguntas&nbsp;<span aria-hidden="true">❓</span>
          </Boton>
        ) : (
          <Boton variante="dorado" disabled={enviando} onClick={() => enviar([])}>
            {enviando ? 'Guardando…' : '¡Terminé de leer! 🏁'}
          </Boton>
        )}
      </div>
    </div>
  )
}
