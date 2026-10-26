// Nombres de las insignias de racha (los hitos los define el backend).
const NOMBRES_HITO = { 3: '3 días', 7: 'Una semana', 14: 'Dos semanas', 30: 'Un mes' }
const EMOJIS_HITO = { 3: '🥉', 7: '🥈', 14: '🥇', 30: '🏆' }

export const nombreHito = (dias) => NOMBRES_HITO[dias] ?? `${dias} días`
export const emojiHito = (dias) => EMOJIS_HITO[dias] ?? '🏅'
