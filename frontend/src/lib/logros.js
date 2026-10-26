// Estrellas (de 1 a 3) según las respuestas correctas de un cuestionario.
// Sin cuestionario no hay estrellas: devuelve 0.
export function estrellasDe(aciertos) {
  if (!aciertos || !aciertos.total) return 0
  const proporcion = aciertos.correctas / aciertos.total
  if (proporcion === 1) return 3
  if (proporcion >= 0.6) return 2
  return 1
}

// Mensaje de ánimo para la pantalla final: siempre positivo, aunque haya errores.
export function mensajeFinal(aciertos) {
  const e = estrellasDe(aciertos)
  if (e === 0) return { titulo: '¡Terminaste de leer!', texto: 'Cada lectura te hace más fuerte.' }
  if (e === 3) return { titulo: '¡Perfecto!', texto: 'Respondiste todo bien. ¡Sos un genio!' }
  if (e === 2) return { titulo: '¡Muy bien!', texto: 'Casi todo bien. ¡Seguí así!' }
  return { titulo: '¡Buen intento!', texto: 'Practicando vas a mejorar cada día.' }
}

// Saludo según la hora del día.
export function saludo(hora = new Date().getHours()) {
  if (hora < 6 || hora >= 20) return '¡Buenas noches'
  if (hora < 13) return '¡Buen día'
  return '¡Buenas tardes'
}
