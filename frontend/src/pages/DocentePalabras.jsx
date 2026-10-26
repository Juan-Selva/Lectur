import { useEffect, useState } from 'react'
import { Cargando, Mensaje, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { useCursos } from '../lib/cursos.jsx'

export default function DocentePalabras() {
  const [palabras, setPalabras] = useState(null)
  const [error, setError] = useState('')
  const { cursoId } = useCursos()

  useEffect(() => {
    api
      .palabrasCurso(cursoId)
      .then((r) => setPalabras(r.palabras))
      .catch((e) => setError(e.message))
  }, [cursoId])

  if (!palabras) return error ? <Mensaje>{error}</Mensaje> : <Cargando />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Palabras más buscadas</h1>
      <p className="text-sm text-slate-600">
        Palabras que tus alumnos buscaron en el diccionario. Las más repetidas pueden indicar
        vocabulario que conviene trabajar en clase. Para ver las de un alumno en particular, entrá a
        su ficha desde el Semáforo.
      </p>
      {palabras.length === 0 ? (
        <Tarjeta className="text-slate-600">Todavía no hay palabras buscadas.</Tarjeta>
      ) : (
        <Tarjeta className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-5 py-3 font-medium">#</th>
                <th className="px-5 py-3 font-medium">Palabra</th>
                <th className="px-5 py-3 font-medium">Veces buscada</th>
                <th className="px-5 py-3 font-medium">Alumnos</th>
              </tr>
            </thead>
            <tbody>
              {palabras.map((p, i) => (
                <tr key={p.palabra} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3 text-base font-semibold">{p.palabra}</td>
                  <td className="px-5 py-3">{p.veces}</td>
                  <td className="px-5 py-3">{p.alumnos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </div>
  )
}
