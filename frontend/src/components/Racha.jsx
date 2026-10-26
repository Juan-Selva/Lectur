import { emojiHito, nombreHito } from '../lib/racha.js'
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
  const progreso = proximoHito ? Math.min(100, Math.round((actual / proximoHito) * 100)) : 100
  return (
    <Tarjeta className="hero space-y-4 border-orange-200 bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Flama
            className={`size-16 ${actual > 0 ? 'animate-llama drop-shadow-[0_4px_8px_rgb(240_138_0/0.45)]' : ''}`}
            encendida={actual > 0}
          />
          <div>
            <p className="titulo-juego text-4xl leading-none text-orange-700">
              {actual} {actual === 1 ? 'día' : 'días'}
            </p>
            <p className="text-sm font-semibold text-slate-600">
              seguidos leyendo · tu mejor racha: {mejor}
            </p>
          </div>
        </div>
        <ul className="flex gap-1.5" aria-label="Últimos 7 días">
          {ultimos7.map((d, i) => (
            <li
              key={d.fecha}
              title={d.fecha}
              aria-label={`${d.fecha}: ${d.activo ? 'leíste' : 'sin lectura'}`}
              className={`flex size-9 flex-col items-center justify-center rounded-full text-xs font-extrabold ${
                d.activo
                  ? 'animate-aparecer bg-linear-to-br from-amber-300 to-orange-400 text-white shadow-[0_3px_0_rgb(194_65_12/0.35)]'
                  : d.finDeSemana
                    ? 'bg-white/70 text-slate-400'
                    : 'border-2 border-dashed border-orange-200 bg-white text-slate-500'
              }`}
              style={d.activo ? { animationDelay: `${i * 0.06}s` } : undefined}
            >
              {d.activo ? <span aria-hidden="true">✓</span> : null}
              <span className={d.activo ? 'sr-only' : ''}>{diaDeSemana(d.fecha)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="font-bold" role="status">
          {enRiesgo
            ? '🔥 ¡Leé algo hoy para no perder tu racha!'
            : activaHoy
              ? '🎉 ¡Hoy ya leíste! Seguí así.'
              : actual === 0
                ? '✨ Leé algo hoy para empezar tu racha.'
                : '📖 Leé algo hoy para sumar un día.'}
        </p>
        {proximoHito && (
          <div>
            <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
              <span>
                Próxima medalla: {emojiHito(proximoHito)} {nombreHito(proximoHito)}
              </span>
              {actual > 0 && (
                <span>
                  Te {faltan === 1 ? 'falta' : 'faltan'} {faltan}
                </span>
              )}
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-orange-200"
              role="progressbar"
              aria-label="Camino a la próxima medalla"
              aria-valuemin={0}
              aria-valuemax={proximoHito}
              aria-valuenow={actual}
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-amber-300 to-orange-500 transition-all duration-700"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Insignias">
        {hitos.map((h) => (
          <li
            key={h.dias}
            className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-bold ${
              h.logrado
                ? 'border-amber-300 bg-white text-ink shadow-sm'
                : 'border-dashed border-slate-300 text-slate-400'
            }`}
          >
            <span aria-hidden="true" className={h.logrado ? '' : 'opacity-40 grayscale'}>
              {emojiHito(h.dias)}
            </span>
            {nombreHito(h.dias)}
            {!h.logrado && <span className="sr-only">(todavía no)</span>}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Sábado y domingo no cortan tu racha.</p>
    </Tarjeta>
  )
}
