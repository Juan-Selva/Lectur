import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { Boton, Campo, Mensaje, Tarjeta } from '../components/ui.jsx'
import { useAuth } from '../lib/auth.jsx'

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
    <div className="flex min-h-screen items-center justify-center bg-brand-soft p-4">
      <Tarjeta className="w-full max-w-sm space-y-4 p-7">
        <img src={logo} alt="Lectur" className="mx-auto h-14 w-auto" />
        <p className="text-center text-sm text-slate-600">
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
  )
}
