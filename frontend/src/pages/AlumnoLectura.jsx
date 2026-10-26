import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import AjustesLectura from '../components/AjustesLectura.jsx'
import DiccionarioRapido from '../components/DiccionarioRapido.jsx'
import { Flama } from '../components/Racha.jsx'
import { nombreHito } from '../lib/racha.js'
import { api } from '../lib/api.js'

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
      <Tarjeta className="space-y-3 text-center">
        <h1 className="text-2xl font-bold">¡Terminaste!</h1>
        {final.aciertos ? (
          <p className="text-lg">
            Respondiste bien {final.aciertos.correctas} de {final.aciertos.total} preguntas.
          </p>
        ) : (
          <p className="text-lg">Lectura completada.</p>
        )}
        {final.racha && final.racha.actual > 0 && (
          <p className="flex items-center justify-center gap-2 text-lg font-semibold">
            <Flama className="size-6" />
            Racha de {final.racha.actual} {final.racha.actual === 1 ? 'día' : 'días'}
          </p>
        )}
        {final.racha?.nuevoHito && (
          <p className="rounded-xl bg-gold/30 px-4 py-3 font-semibold" role="status">
            ★ ¡Nueva insignia: {nombreHito(final.racha.nuevoHito)}!
          </p>
        )}
        <Link
          to={practica ? '/alumno/practica' : '/alumno'}
          className="inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white"
        >
          {practica ? 'Elegir otro texto' : 'Volver a mis lecturas'}
        </Link>
      </Tarjeta>
    )
  }

  if (fase === 'preguntas') {
    const completo = preguntas.every((p) => respuestas[p.id] !== undefined)
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{actividad.titulo}</h1>
          <div className="flex items-center gap-2">
            <DiccionarioRapido className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft">
              Diccionario
            </DiccionarioRapido>
            <AjustesLectura />
          </div>
        </div>
        {preguntas.map((p, i) => (
          <Tarjeta key={p.id}>
            <fieldset>
              <legend className="lectura mb-3 font-semibold">
                {i + 1}. {p.enunciado}
              </legend>
              <div className="space-y-2">
                {p.opciones.map((o, k) => (
                  <label
                    key={k}
                    className={`lectura flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
                      respuestas[p.id] === k
                        ? 'border-brand bg-brand-soft'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`p${p.id}`}
                      checked={respuestas[p.id] === k}
                      onChange={() => setRespuestas({ ...respuestas, [p.id]: k })}
                      className="size-4 accent-brand"
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          </Tarjeta>
        ))}
        <Mensaje>{error}</Mensaje>
        <div className="flex justify-between">
          <Boton variante="suave" onClick={() => setFase('lectura')}>
            Volver al texto
          </Boton>
          <Boton
            disabled={!completo || enviando}
            onClick={() =>
              enviar(preguntas.map((p) => ({ preguntaId: p.id, opcion: respuestas[p.id] })))
            }
          >
            {enviando ? 'Enviando…' : 'Terminar'}
          </Boton>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{actividad.titulo}</h1>
        <div className="flex items-center gap-2">
          <DiccionarioRapido className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-soft">
            Diccionario
          </DiccionarioRapido>
          <AjustesLectura />
        </div>
      </div>
      <Tarjeta>
        <p className="lectura whitespace-pre-line">{actividad.cuerpo}</p>
      </Tarjeta>
      <p className="text-sm text-slate-600">
        ¿Hay una palabra que no entendés? Buscala en el{' '}
        <DiccionarioRapido className="font-semibold text-brand underline">
          diccionario
        </DiccionarioRapido>
        .
      </p>
      <Mensaje>{error}</Mensaje>
      <div className="flex flex-wrap justify-end gap-2">
        {practica && actividad.conCuestionario && (
          <Boton variante="suave" disabled={enviando} onClick={() => enviar([])}>
            {enviando ? 'Guardando…' : 'Terminé de leer'}
          </Boton>
        )}
        {actividad.conCuestionario ? (
          <Boton variante="dorado" onClick={() => setFase('preguntas')}>
            Responder preguntas
          </Boton>
        ) : (
          <Boton variante="dorado" disabled={enviando} onClick={() => enviar([])}>
            {enviando ? 'Guardando…' : 'Terminé de leer'}
          </Boton>
        )}
      </div>
    </div>
  )
}
