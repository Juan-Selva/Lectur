import { nombreHito } from '../lib/racha.js'
import { Tarjeta } from './ui.jsx'

const FLAMA =
  'M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z'

export function Flama({ className = 'size-6', encendida = true }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill={encendida ? '#f08a00' : '#cbd5e1'}
        fillRule="evenodd"
        clipRule="evenodd"
        d={FLAMA}
      />
    </svg>
  )
}

const DIAS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const diaDeSemana = (fecha) => DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]

// Número de días seguidos, con una llama chica (para tarjetas del docente).
export function InsigniaRacha({ racha }) {
  if (!racha) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700"
      title={`Mejor racha: ${racha.mejor} días`}
    >
      <Flama className="size-4" encendida={racha.actual > 0} />
      {racha.actual} {racha.actual === 1 ? 'día' : 'días'} seguidos
    </span>
  )
}

export function TarjetaRacha({ racha }) {
  const { actual, mejor, activaHoy, enRiesgo, hitos, proximoHito, ultimos7 } = racha
  const faltan = proximoHito ? proximoHito - actual : 0
  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Flama className="size-12" encendida={actual > 0} />
          <div>
            <p className="text-3xl font-bold leading-none">
              {actual} {actual === 1 ? 'día' : 'días'}
            </p>
            <p className="text-sm text-slate-600">seguidos leyendo · tu mejor racha: {mejor}</p>
          </div>
        </div>
        <ul className="flex gap-1.5" aria-label="Últimos 7 días">
          {ultimos7.map((d) => (
            <li
              key={d.fecha}
              title={d.fecha}
              aria-label={`${d.fecha}: ${d.activo ? 'leíste' : 'sin lectura'}`}
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                d.activo
                  ? 'bg-gold text-ink'
                  : d.finDeSemana
                    ? 'bg-slate-100 text-slate-400'
                    : 'border border-slate-300 text-slate-500'
              }`}
            >
              {diaDeSemana(d.fecha)}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm font-medium" role="status">
        {enRiesgo
          ? '¡Leé algo hoy para no perder tu racha!'
          : activaHoy
            ? '¡Hoy ya leíste! Seguí así.'
            : actual === 0
              ? 'Leé algo hoy para empezar tu racha.'
              : 'Leé algo hoy para sumar un día.'}
        {proximoHito && actual > 0 && ` Te faltan ${faltan} para "${nombreHito(proximoHito)}".`}
      </p>

      <ul className="flex flex-wrap gap-2" aria-label="Insignias">
        {hitos.map((h) => (
          <li
            key={h.dias}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              h.logrado ? 'border-gold bg-gold/30 text-ink' : 'border-slate-200 text-slate-400'
            }`}
          >
            {h.logrado ? '★ ' : ''}
            {nombreHito(h.dias)}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Sábado y domingo no cortan tu racha.</p>
    </Tarjeta>
  )
}
