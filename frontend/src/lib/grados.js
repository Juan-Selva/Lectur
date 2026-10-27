// División por grado (primer ciclo). `grado` es 1, 2 o 3; sin valor (null) = todos los grados.
export const GRADOS = [1, 2, 3]

export const etiquetaGrado = (g) => (g ? `${g}.º grado` : 'Todos los grados')

// Textos de un grado: los de ese grado y los pensados para todos. Sin grado elegido, todos.
export const textosDeGrado = (textos, grado) =>
  grado ? textos.filter((t) => t.grado == null || t.grado === grado) : textos

// Valor de un <select> ('' | '1' | '2' | '3') a lo que espera la API (null | 1 | 2 | 3).
export const gradoDeSelect = (valor) => (valor === '' || valor == null ? null : Number(valor))
