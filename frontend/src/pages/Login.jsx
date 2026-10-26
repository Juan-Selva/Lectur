import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { Boton, Campo, Mensaje, Tarjeta } from '../components/ui.jsx'
import Mascota from '../components/Mascota.jsx'
import { useAuth } from '../lib/auth.jsx'

const DIBUJOS = [
  { e: '📚', c: 'left-[8%] top-[12%]', d: '0s' },
  { e: '⭐', c: 'right-[10%] top-[18%]', d: '1s' },
  { e: '✏️', c: 'left-[12%] bottom-[14%]', d: '2s' },
  { e: '🌈', c: 'right-[8%] bottom-[10%]', d: '0.5s' },
]

export default function Login() {
  const { entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const u = await entrar(email, password)
      navigate(u.rol === 'docente' ? '/docente' : '/alumno', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="tema-alumno relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-sky-100 via-white to-amber-100 p-4">
      <div aria-hidden="true" className="decorativo pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-20 size-72 rounded-full bg-sky-300/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-pink-300/40 blur-3xl" />
        {DIBUJOS.map((d) => (
          <span
            key={d.e}
            className={`absolute animate-flotar text-4xl opacity-40 sm:text-5xl ${d.c}`}
            style={{ animationDelay: d.d }}
          >
            {d.e}
          </span>
        ))}
      </div>
      <div className="w-full max-w-sm">
        <Mascota className="relative z-10 mx-auto -mb-6 size-28 animate-flotar" />
        <Tarjeta className="space-y-4 p-7 pt-9 shadow-[0_10px_0_rgb(8_117_201/0.12)]">
          <img src={logo} alt="Lectur" className="mx-auto h-14 w-auto" />
          <p className="text-center font-semibold text-slate-600">
            ¡Hola! Qué bueno verte por acá. <span aria-hidden="true">👋</span>
            <br />
            Ingresá con tu cuenta de docente o de alumno.
          </p>
          <form onSubmit={enviar} className="space-y-3">
            <Campo
              id="email"
              etiqueta="Email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Campo
              id="password"
              etiqueta="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Mensaje>{error}</Mensaje>
            <Boton type="submit" className="w-full" disabled={enviando}>
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </Boton>
          </form>
          <p className="text-center text-xs text-slate-500">
            <Link to="/privacidad" className="hover:underline">
              Privacidad
            </Link>{' '}
            ·{' '}
            <Link to="/terminos" className="hover:underline">
              Términos de uso
            </Link>
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}
