import logoUrl from '../assets/logo.png'
import { fechaCorta } from './fechas.js'
import { estadoInfo } from './semaforo.js'
import { etiquetaCategoria } from './categorias.js'

const COLOR = {
  ink: [23, 50, 75],
  gris: [100, 116, 139],
  texto: [51, 65, 85],
  oro: [249, 185, 54],
  verde: [37, 168, 101],
  amarillo: [230, 165, 34],
  rojo: [217, 90, 90],
  ninguno: [203, 213, 225],
  fondo: [241, 245, 249],
}

const pct = (t) => (t.total ? `${Math.round((t.correctas / t.total) * 100)}%` : '—')

async function logoComoDataUrl() {
  const blob = await (await fetch(logoUrl)).blob()
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result)
    lector.onerror = reject
    lector.readAsDataURL(blob)
  })
}

export const nombreArchivoInforme = (nombre) =>
  `informe-${nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.pdf`

// Arma y descarga el informe para la familia. `r` es la respuesta de /alumnos/:id/resumen.
export async function descargarInformePdf(r, { conNota = false } = {}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const M = 18
  const ancho = 210 - M * 2
  let y = M

  const salto = (alto) => {
    if (y + alto > 285) {
      doc.addPage()
      y = M
    }
  }
  const texto = (
    t,
    { tam = 10.5, color = COLOR.texto, negrita = false, x = M, w = ancho } = {},
  ) => {
    doc
      .setFont('helvetica', negrita ? 'bold' : 'normal')
      .setFontSize(tam)
      .setTextColor(...color)
    const lineas = doc.splitTextToSize(t, w)
    const alto = lineas.length * tam * 0.4
    salto(alto)
    doc.text(lineas, x, y + tam * 0.3)
    y += alto + 1.5
  }
  const titulo = (t, color = COLOR.ink) => {
    y += 3
    texto(t, { tam: 12.5, negrita: true, color })
  }
  const lista = (items) => items.forEach((i) => texto(`•  ${i}`, { x: M + 2, w: ancho - 4 }))

  // Encabezado
  try {
    doc.addImage(await logoComoDataUrl(), 'PNG', M, y, 34, 12.5)
  } catch {
    texto('Lectur', { tam: 18, negrita: true, color: COLOR.ink })
  }
  doc
    .setFont('helvetica', 'normal')
    .setFontSize(9.5)
    .setTextColor(...COLOR.gris)
  doc.text('Resumen de lectura para la familia', 210 - M, y + 5, { align: 'right' })
  doc.text(fechaCorta(r.fecha), 210 - M, y + 10, { align: 'right' })
  y += 16
  doc.setFillColor(...COLOR.oro).rect(M, y, ancho, 1, 'F')
  y += 7

  texto(r.alumno.nombre, { tam: 20, negrita: true, color: COLOR.ink })
  texto(`${r.alumno.grado}° grado · Docente: ${r.docente}`, { color: COLOR.gris })
  y += 2

  // Tres indicadores
  const info = estadoInfo(r.estado)
  const colorEstado = COLOR[r.estado] ?? COLOR.ninguno
  const cajas = [
    ['Lecturas completadas', String(r.lecturas)],
    ['Promedio en cuestionarios', r.promedio === null ? '—' : `${r.promedio.toFixed(1)} / 10`],
    ['Estado actual', info.etiqueta],
  ]
  const wCaja = (ancho - 8) / 3
  salto(22)
  cajas.forEach(([rotulo, valor], i) => {
    const x = M + i * (wCaja + 4)
    doc.setFillColor(...COLOR.fondo).roundedRect(x, y, wCaja, 20, 2, 2, 'F')
    doc
      .setFont('helvetica', 'normal')
      .setFontSize(8.5)
      .setTextColor(...COLOR.gris)
    doc.text(rotulo, x + 3, y + 6)
    doc
      .setFont('helvetica', 'bold')
      .setFontSize(14)
      .setTextColor(...COLOR.ink)
    if (i === 2) {
      doc.setFillColor(...colorEstado).circle(x + 5, y + 14, 1.8, 'F')
      doc.text(valor, x + 9, y + 15.5)
    } else {
      doc.text(valor, x + 3, y + 15.5)
    }
  })
  y += 24

  if (r.conCuestionario > 0) {
    titulo('Cómo comprende')
    texto(
      `Preguntas sobre lo que el texto dice: ${pct(r.porTipo.literal)} de aciertos. Preguntas sobre lo que el texto sugiere: ${pct(r.porTipo.inferencial)} de aciertos.`,
    )
  }
  if (r.fortalezas.length) {
    titulo('Fortalezas', COLOR.verde)
    lista(r.fortalezas)
  }
  if (r.sugerencias.length) {
    titulo('Cómo acompañar desde casa')
    lista(r.sugerencias)
  }

  if (r.ultimas.length) {
    titulo('Últimas lecturas')
    const col = [M, M + 88, M + 114, M + 138]
    salto(8)
    doc
      .setFont('helvetica', 'bold')
      .setFontSize(9)
      .setTextColor(...COLOR.gris)
    ;['Texto', 'Fecha', 'Correctas', 'Estado'].forEach((h, i) => doc.text(h, col[i], y + 3))
    y += 5
    doc.setDrawColor(...COLOR.ninguno).line(M, y, M + ancho, y)
    y += 1.5
    for (const u of r.ultimas) {
      const nombre = u.categoria ? `${u.titulo} (${etiquetaCategoria(u.categoria)})` : u.titulo
      const lineas = doc.splitTextToSize(nombre, 84)
      const alto = Math.max(lineas.length * 4.2, 5)
      salto(alto + 1)
      doc
        .setFont('helvetica', 'normal')
        .setFontSize(9.5)
        .setTextColor(...COLOR.texto)
      doc.text(lineas, col[0], y + 3.2)
      doc.text(fechaCorta(u.fecha), col[1], y + 3.2)
      doc.text(`${u.correctas}/${u.total}`, col[2], y + 3.2)
      doc.text(estadoInfo(u.estado).etiqueta, col[3], y + 3.2)
      y += alto + 1
      doc.setDrawColor(...COLOR.fondo).line(M, y, M + ancho, y)
      y += 1
    }
  }

  if (r.practicas > 0) {
    titulo('Por iniciativa propia')
    texto(
      `Eligió leer ${r.practicas} ${r.practicas === 1 ? 'texto' : 'textos'} por su cuenta. Su mejor racha fue de ${r.racha.mejor} ${r.racha.mejor === 1 ? 'día' : 'días'} seguidos.`,
    )
  }
  if (r.palabras.total > 0) {
    titulo('Palabras que buscó en el diccionario')
    texto(r.palabras.top.join(', '))
  }
  if (conNota && r.nota) {
    titulo('Comentario de la docente')
    texto(r.nota)
  }

  y += 4
  salto(12)
  doc.setDrawColor(...COLOR.ninguno).line(M, y, M + ancho, y)
  y += 2
  texto(
    'Este resumen es orientativo: muestra cómo viene el proceso de lectura y no reemplaza la evaluación de la docente.',
    { tam: 8.5, color: COLOR.gris },
  )

  doc.save(nombreArchivoInforme(r.alumno.nombre))
}
