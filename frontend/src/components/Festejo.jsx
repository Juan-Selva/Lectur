const COLORES = ['#0875c9', '#f9b936', '#ff6b8b', '#25a865', '#8b5cf6', '#22c3e6', '#ff9f43']

// Papelitos que caen una sola vez. Las posiciones salen del índice (no al azar) para
// que el render sea puro y siempre igual.
export function Confeti({ cantidad = 60 }) {
  return (
    <div className="confeti" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLORES[i % COLORES.length],
            '--espera': `${((i * 13) % 20) / 10}s`,
            '--dur': `${2.6 + ((i * 7) % 15) / 10}s`,
            '--deriva': `${((i * 23) % 120) - 60}px`,
            '--giro': `${360 + ((i * 47) % 720)}deg`,
            borderRadius: i % 3 === 0 ? '50%' : undefined,
          }}
        />
      ))}
    </div>
  )
}

// Fila de estrellas: las ganadas se encienden una tras otra.
export function Estrellas({ cantidad, total = 3, tamano = 'text-2xl', animadas = false }) {
  return (
    <span
      className={`inline-flex gap-0.5 ${tamano}`}
      role="img"
      aria-label={`${cantidad} de ${total} estrellas`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`${i < cantidad ? '' : 'opacity-25 grayscale'} ${animadas && i < cantidad ? 'animate-aparecer' : ''}`}
          style={animadas ? { animationDelay: `${0.4 + i * 0.35}s` } : undefined}
        >
          ⭐
        </span>
      ))}
    </span>
  )
}
