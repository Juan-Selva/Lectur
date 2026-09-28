// Historia de usuario 4 — Semáforo docente (pantalla de muestra).
// Datos hardcodeados en semaforoMock.json: todavía NO está conectado a los
// resultados reales del cuestionario del alumno. Eso queda para un sprint
// posterior, cuando haya backend/base de datos.
//
// La nota es opcional: el docente decide si anota algo o no. Por eso solo
// dos alumnos de ejemplo tienen nota cargada (uno con mal desempeño, uno a
// seguir); el resto muestra un botón "Agregar nota" en vez de texto.
import alumnos from '../data/semaforoMock.json'

const estadoStyles = {
  verde: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amarillo: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  rojo: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const estadoLabel = {
  verde: 'En nivel',
  amarillo: 'A seguir',
  rojo: 'Atención',
}

export default function Docente() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Semáforo del grado</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-700 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-amber-50 text-amber-900">
            <tr>
              <th className="px-4 py-3 font-medium">Alumno</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Última actividad</th>
              <th className="px-4 py-3 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {alumnos.map((alumno) => {
              const estilos = estadoStyles[alumno.estado]
              return (
                <tr key={alumno.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{alumno.nombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${estilos.badge}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${estilos.dot}`} />
                      {estadoLabel[alumno.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{alumno.ultimaActividad}</td>
                  <td className="px-4 py-3">
                    {alumno.nota ? (
                      <span className="text-slate-500">{alumno.nota}</span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full border border-dashed border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-50"
                      >
                        + Agregar nota
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
