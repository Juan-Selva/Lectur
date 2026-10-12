import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Boton, Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'

export default function AlumnoLectura() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [fase, setFase] = useState('lectura') // lectura | preguntas | final
  const [respuestas, setRespuestas] = useState({})
  const [final, setFinal] = useState(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api
      .actividad(id)
      .then((d) => {
        if (d.actividad.estado === 'completada') navigate('/alumno', { replace: true })
        else setDatos(d)
      })
      .catch((e) => setError(e.message))
  }, [id, navigate])

  async function enviar(rs) {
    setError('')
    setEnviando(true)
    try {
      setFinal(await api.completar(id, rs))
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
        <Link
          to="/alumno"
          className="inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white"
        >
          Volver a mis lecturas
        </Link>
      </Tarjeta>
    )
  }

  if (fase === 'preguntas') {
    const completo = preguntas.every((p) => respuestas[p.id] !== undefined)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{actividad.titulo}</h1>
        {preguntas.map((p, i) => (
          <Tarjeta key={p.id}>
            <fieldset>
              <legend className="mb-3 text-lg font-semibold">
                {i + 1}. {p.enunciado}
              </legend>
              <div className="space-y-2">
                {p.opciones.map((o, k) => (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${
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
      <h1 className="text-2xl font-bold">{actividad.titulo}</h1>
      <Tarjeta>
        <p className="whitespace-pre-line text-xl leading-loose">{actividad.cuerpo}</p>
      </Tarjeta>
      <p className="text-sm text-slate-600">
        ¿Hay una palabra que no entendés? Buscala en el{' '}
        <Link to="/alumno/diccionario" className="font-semibold text-brand underline">
          diccionario
        </Link>
        .
      </p>
      <Mensaje>{error}</Mensaje>
      <div className="flex justify-end">
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
