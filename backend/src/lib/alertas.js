import { calcularRacha, diasHabilesDesde } from './racha.js'
import { UMBRAL_AMARILLO } from './semaforo.js'

export const TIPOS_ALERTA = ['rojos_seguidos', 'sin_leer', 'racha_rota', 'caida_puntaje']

export const CONFIG_INICIAL = {
  rojosSeguidos: 2, // cuestionarios rojos seguidos que disparan el aviso
  diasSinLeer: 3, // días de clase sin completar ninguna lectura
  rachaMinima: 3, // racha mínima que, si se pierde, avisa
  caidaPuntos: 3, // puntos que tiene que bajar un resultado respecto del anterior
  tipos: { rojos_seguidos: true, sin_leer: true, racha_rota: true, caida_puntaje: true },
}

const VENTANA_RESULTADOS_DIAS = 30 // un resultado más viejo ya no genera alertas
const VENTANA_RACHA_ROTA = 10 // días de clase desde la última lectura

const aMs = (f) => Date.UTC(Number(f.slice(0, 4)), Number(f.slice(5, 7)) - 1, Number(f.slice(8, 10)))
const diasCorridos = (desde, hasta) => Math.round((aMs(hasta) - aMs(desde)) / 86400000)

// Aplica los valores por defecto a una configuración parcial.
export function completarConfig(parcial) {
  const c = parcial && typeof parcial === 'object' ? parcial : {}
  return {
    ...CONFIG_INICIAL,
    ...Object.fromEntries(
      Object.keys(CONFIG_INICIAL)
        .filter((k) => k !== 'tipos' && k in c)
        .map((k) => [k, c[k]]),
    ),
    tipos: { ...CONFIG_INICIAL.tipos, ...(c.tipos ?? {}) },
  }
}

/**
 * Alertas de un alumno.
 * - resultados: últimos cuestionarios, del más nuevo al más viejo: { id, puntaje, fecha: 'YYYY-MM-DD' }.
 * - fechas: días (YYYY-MM-DD) en que completó alguna lectura.
 * - pendienteDesde: fecha de la asignación pendiente más vieja (o null).
 * - hoy: 'YYYY-MM-DD'.
 */
export function calcularAlertas({ resultados, fechas, pendienteDesde, hoy, config }) {
  const cfg = completarConfig(config)
  const alertas = []
  const recientes = resultados.filter((r) => diasCorridos(r.fecha, hoy) <= VENTANA_RESULTADOS_DIAS)
  const ultimo = recientes[0]
  let hayRojos = false

  if (cfg.tipos.rojos_seguidos && ultimo) {
    const n = cfg.rojosSeguidos
    const ultimos = resultados.slice(0, n)
    if (ultimos.length === n && ultimos.every((r) => r.puntaje < UMBRAL_AMARILLO)) {
      hayRojos = true
      alertas.push({
        tipo: 'rojos_seguidos',
        clave: String(ultimo.id),
        severidad: 'alta',
        fecha: ultimo.fecha,
        detalle: `Los últimos ${n} cuestionarios quedaron en rojo (${ultimos.map((r) => r.puntaje.toFixed(1)).join(', ')} sobre 10).`,
      })
    }
  }

  if (cfg.tipos.caida_puntaje && ultimo && !hayRojos && resultados.length >= 2) {
    const [actual, anterior] = resultados
    const baja = anterior.puntaje - actual.puntaje
    if (
      baja >= cfg.caidaPuntos &&
      actual.puntaje < 7 &&
      diasCorridos(actual.fecha, hoy) <= VENTANA_RESULTADOS_DIAS
    ) {
      alertas.push({
        tipo: 'caida_puntaje',
        clave: String(actual.id),
        severidad: 'media',
        fecha: actual.fecha,
        detalle: `Bajó de ${anterior.puntaje.toFixed(1)} a ${actual.puntaje.toFixed(1)} respecto del cuestionario anterior.`,
      })
    }
  }

  const ultimaLectura = fechas.length ? [...fechas].sort().at(-1) : null
  const base = ultimaLectura ?? pendienteDesde
  if (cfg.tipos.sin_leer && base) {
    const dias = diasHabilesDesde(base, hoy)
    if (dias >= cfg.diasSinLeer) {
      alertas.push({
        tipo: 'sin_leer',
        clave: base,
        severidad: dias >= cfg.diasSinLeer * 2 ? 'alta' : 'media',
        fecha: base,
        detalle: ultimaLectura
          ? `Hace ${dias} días de clase que no completa una lectura.`
          : `Tiene lecturas asignadas hace ${dias} días de clase y todavía no completó ninguna.`,
      })
    }
  }

  if (cfg.tipos.racha_rota && ultimaLectura && calcularRacha(fechas, hoy).actual === 0) {
    const dias = calcularRacha(fechas, ultimaLectura).actual
    const sinLeer = diasHabilesDesde(ultimaLectura, hoy)
    if (dias >= cfg.rachaMinima && sinLeer >= 1 && sinLeer <= VENTANA_RACHA_ROTA) {
      alertas.push({
        tipo: 'racha_rota',
        clave: ultimaLectura,
        severidad: 'media',
        fecha: ultimaLectura,
        detalle: `Perdió una racha de ${dias} días seguidos leyendo.`,
      })
    }
  }

  return alertas
}
