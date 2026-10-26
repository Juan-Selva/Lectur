import { useState } from 'react'
import { ESPACIADOS, TAMANOS } from '../lib/ajustes.js'
import { useAjustes } from '../lib/ajustes.jsx'
import { Boton, Modal } from './ui.jsx'

function Opciones({ titulo, lista, valor, onElegir }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{titulo}</legend>
      <div className="flex flex-wrap gap-2">
        {lista.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            onClick={() => onElegir(o.id)}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              valor === o.id
                ? 'border-brand bg-brand text-white'
                : 'border-slate-300 bg-white text-ink hover:bg-slate-50'
            }`}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Panel({ onCerrar }) {
  const { ajustes, cambiar, restablecer } = useAjustes()
  return (
    <Modal titulo="Ajustar la lectura" onCerrar={onCerrar}>
      <div className="space-y-5">
        <Opciones
          titulo="Tamaño de la letra"
          lista={TAMANOS}
          valor={ajustes.tamano}
          onElegir={(tamano) => cambiar({ tamano })}
        />
        <Opciones
          titulo="Espacio entre líneas, letras y palabras"
          lista={ESPACIADOS}
          valor={ajustes.espaciado}
          onElegir={(espaciado) => cambiar({ espaciado })}
        />
        <Opciones
          titulo="Colores"
          lista={[
            { id: 'normal', etiqueta: 'Normales' },
            { id: 'alto', etiqueta: 'Alto contraste' },
          ]}
          valor={ajustes.contraste}
          onElegir={(contraste) => cambiar({ contraste })}
        />
        <div>
          <p className="mb-2 text-sm font-semibold">Así se va a ver</p>
          <p className="lectura rounded-xl border border-slate-200 bg-white p-4">
            El gato Manchas se sienta en la ventana y mira a los pájaros.
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <Boton variante="suave" onClick={restablecer}>
            Volver a lo normal
          </Boton>
          <Boton onClick={onCerrar}>Listo</Boton>
        </div>
      </div>
    </Modal>
  )
}

// Botón que abre el panel de ajustes de lectura. `compacto` es para el encabezado.
export default function AjustesLectura({ compacto = false }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Ajustar la lectura: tamaño de letra, espaciado y contraste"
        className={
          compacto
            ? 'rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm font-bold text-ink hover:bg-slate-50'
            : 'rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50'
        }
      >
        {compacto ? 'Aa' : 'Aa  Ajustar la lectura'}
      </button>
      {abierto && <Panel onCerrar={() => setAbierto(false)} />}
    </>
  )
}
