import { randomInt } from 'node:crypto'

// Sin letras ni números que se confunden (0/O, 1/l/I).
const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarPassword(largo = 8) {
  let p = ''
  for (let i = 0; i < largo; i++) p += ALFABETO[randomInt(ALFABETO.length)]
  return p
}
