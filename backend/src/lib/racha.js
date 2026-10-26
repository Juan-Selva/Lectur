// Racha: días seguidos en los que el alumno completó al menos una lectura.
// Sábado y domingo sin lectura no cortan la racha; si lee, ese día suma.
const DIA = 86400000
export const HITOS = [3, 7, 14, 30]

const aMs = (fecha) =>
  Date.UTC(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1, Number(fecha.slice(8, 10)))
const aFecha = (ms) => new Date(ms).toISOString().slice(0, 10)
const esFinDeSemana = (ms) => [0, 6].includes(new Date(ms).getUTCDay())

// Fecha de hoy (YYYY-MM-DD) en la zona horaria dada.
export function hoyEn(zona, ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora)
}

// `fechas`: días (YYYY-MM-DD) con actividad. `hoy`: día actual (YYYY-MM-DD).
export function calcularRacha(fechas, hoy) {
  const activos = new Set(fechas)
  const hoyMs = aMs(hoy)
  const activaHoy = activos.has(hoy)

  // Si hoy todavía no leyó, la racha sigue viva mirando desde ayer.
  let actual = 0
  let cursor = hoyMs - (activaHoy ? 0 : DIA)
  for (;;) {
    if (activos.has(aFecha(cursor))) {
      actual += 1
      cursor -= DIA
    } else if (esFinDeSemana(cursor)) {
      cursor -= DIA
    } else {
      break
    }
  }

  let mejor = 0
  if (activos.size > 0) {
    const ordenadas = [...activos].sort()
    let corriente = 0
    for (let t = aMs(ordenadas[0]); t <= aMs(ordenadas.at(-1)); t += DIA) {
      if (activos.has(aFecha(t))) {
        corriente += 1
        mejor = Math.max(mejor, corriente)
      } else if (!esFinDeSemana(t)) {
        corriente = 0
      }
    }
  }
  mejor = Math.max(mejor, actual)

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const ms = hoyMs - (6 - i) * DIA
    return { fecha: aFecha(ms), activo: activos.has(aFecha(ms)), finDeSemana: esFinDeSemana(ms) }
  })

  return {
    actual,
    mejor,
    activaHoy,
    enRiesgo: actual > 0 && !activaHoy && !esFinDeSemana(hoyMs),
    hitos: HITOS.map((dias) => ({ dias, logrado: mejor >= dias })),
    proximoHito: HITOS.find((d) => actual < d) ?? null,
    ultimos7,
  }
}

// Hito que se alcanzó entre dos estados (por ejemplo, antes y después de completar una lectura).
export const nuevoHito = (antes, despues) => HITOS.find((d) => despues.mejor >= d && antes.mejor < d) ?? null

// Cantidad de días de clase (lunes a viernes) entre `desde` (sin incluirlo) y `hasta` (incluido).
export function diasHabilesDesde(desde, hasta) {
  let n = 0
  for (let t = aMs(desde) + DIA; t <= aMs(hasta); t += DIA) if (!esFinDeSemana(t)) n += 1
  return n
}
