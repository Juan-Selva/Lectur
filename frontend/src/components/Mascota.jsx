// Lechu, el búho lector que acompaña al alumno. Es decorativo: no lo leen los lectores de pantalla.
// estado: 'feliz' (con su libro) | 'festejo' (alas arriba y ojos sonrientes)
export default function Mascota({ estado = 'feliz', className = 'size-28' }) {
  const festejo = estado === 'festejo'
  return (
    <svg viewBox="0 0 120 130" className={className} aria-hidden="true">
      {/* orejitas */}
      <path d="M30 34 L22 8 L48 24 Z" fill="#0562aa" />
      <path d="M90 34 L98 8 L72 24 Z" fill="#0562aa" />
      {/* alas */}
      {festejo ? (
        <>
          <path d="M26 62 Q4 46 8 18 Q26 34 34 58 Z" fill="#3a9be0" />
          <path d="M94 62 Q116 46 112 18 Q94 34 86 58 Z" fill="#3a9be0" />
        </>
      ) : (
        <>
          <path d="M24 64 Q12 88 28 108 Q34 84 24 64 Z" fill="#0562aa" />
          <path d="M96 64 Q108 88 92 108 Q86 84 96 64 Z" fill="#0562aa" />
        </>
      )}
      {/* cuerpo y panza */}
      <ellipse cx="60" cy="72" rx="38" ry="46" fill="#0875c9" />
      <ellipse cx="60" cy="86" rx="25" ry="28" fill="#eaf5fc" />
      <path
        d="M49 80 q4 4 8 0 M63 80 q4 4 8 0 M56 92 q4 4 8 0"
        stroke="#9cc9ea"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* ojos */}
      <circle cx="44" cy="50" r="15" fill="#fff" />
      <circle cx="76" cy="50" r="15" fill="#fff" />
      {festejo ? (
        <path
          d="M36 52 q8 -9 16 0 M68 52 q8 -9 16 0"
          stroke="#17324b"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <g className="parpadeo">
          <circle cx="46" cy="51" r="7" fill="#17324b" />
          <circle cx="74" cy="51" r="7" fill="#17324b" />
          <circle cx="48.5" cy="48.5" r="2.5" fill="#fff" />
          <circle cx="76.5" cy="48.5" r="2.5" fill="#fff" />
        </g>
      )}
      {/* cachetes y pico */}
      <circle cx="31" cy="66" r="5" fill="#ff8fa3" opacity="0.7" />
      <circle cx="89" cy="66" r="5" fill="#ff8fa3" opacity="0.7" />
      <path d="M54 62 L66 62 L60 71 Z" fill="#f9b936" />
      {/* patitas */}
      <path
        d="M48 117 v6 M44 123 h8 M72 117 v6 M68 123 h8"
        stroke="#f9b936"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* libro abierto */}
      {!festejo && (
        <g>
          <path
            d="M60 100 Q46 93 30 97 V114 Q46 110 60 117 Z"
            fill="#fff"
            stroke="#f9b936"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M60 100 Q74 93 90 97 V114 Q74 110 60 117 Z"
            fill="#fff"
            stroke="#f9b936"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M37 103 h14 M37 108 h12 M69 103 h14 M71 108 h12"
            stroke="#c7d6e4"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  )
}
