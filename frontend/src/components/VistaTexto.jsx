import Enunciado from './Enunciado.jsx'
import { Boton, Categoria, Modal } from './ui.jsx'
import { etiquetaGrado } from '../lib/grados.js'
import { etiquetaHabilidad } from '../lib/habilidades.js'

// Un texto con sus preguntas y las respuestas correctas, solo para leer (el docente lo consulta
// antes de asignarlo). `onDuplicar` es opcional: si viene, se ofrece "Editar" (copia el texto a Mis textos).
export default function VistaTexto({ datos, onCerrar, onDuplicar }) {
  const { texto, preguntas } = datos
  return (
    <Modal titulo={texto.titulo} onCerrar={onCerrar}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Categoria valor={texto.categoria} />
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {etiquetaGrado(texto.grado)}
          </span>
          {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'}
        </div>
        {texto.autor && <p className="text-sm text-slate-600">Autor: {texto.autor}</p>}
        <p className="whitespace-pre-line text-base leading-relaxed">{texto.cuerpo}</p>

        <section className="space-y-3" aria-label="Preguntas">
          <h3 className="font-bold">Cuestionario</h3>
          {preguntas.length === 0 && (
            <p className="text-sm text-slate-500">Este texto no tiene preguntas.</p>
          )}
          {preguntas.map((p, i) => (
            <div key={p.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
              <p className="font-semibold">
                {i + 1}. <Enunciado texto={p.enunciado} />
              </p>
              <p className="text-xs text-slate-500">
                {etiquetaHabilidad(p.habilidad)} ·{' '}
                {p.formato === 'orden' ? 'Ordenar' : 'Opción múltiple'}
              </p>
              {p.formato === 'orden' ? (
                <>
                  <p className="text-sm text-slate-600">Orden correcto:</p>
                  <ol className="list-decimal space-y-0.5 pl-6 text-sm">
                    {p.opciones.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ol>
                </>
              ) : (
                <ul className="space-y-1 text-sm">
                  {p.opciones.map((o, k) => (
                    <li
                      key={k}
                      className={
                        k === p.correcta
                          ? 'rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-800'
                          : 'px-2 py-1'
                      }
                    >
                      {k === p.correcta && <span aria-label="Respuesta correcta">✓ </span>}
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-2">
          {onDuplicar && (
            <Boton variante="suave" onClick={onDuplicar}>
              Editar
            </Boton>
          )}
          <Boton onClick={onCerrar}>Cerrar</Boton>
        </div>
      </div>
    </Modal>
  )
}
