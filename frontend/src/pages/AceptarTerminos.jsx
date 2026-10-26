import { useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { Boton, Mensaje, Tarjeta } from '../components/ui.jsx'
import { useAuth } from '../lib/auth.jsx'

// Pantalla previa: se muestra hasta que se aceptan los términos vigentes.
export default function AceptarTerminos() {
  const { usuario, aceptarTerminos, salir } = useAuth()
  const esAlumno = usuario.rol === 'alumno'
  const [acepto, setAcepto] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await aceptarTerminos()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-soft p-4">
      <Tarjeta className="w-full max-w-md space-y-4 p-7">
        <img src={logo} alt="Lectur" className="mx-auto h-14 w-auto" />
        {esAlumno ? (
          <>
            <h1 className="text-center text-xl font-bold text-ink">Antes de empezar</h1>
            <p className="text-sm text-slate-700">
              Esta pantalla es para el adulto que acompaña a <strong>{usuario.nombre}</strong>.
              Lectur guarda su nombre, su email y sus lecturas para que su docente pueda seguir cómo
              avanza.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center text-xl font-bold text-ink">
              Bienvenido/a, {usuario.nombre}
            </h1>
            <p className="text-sm text-slate-700">
              Antes de usar Lectur, leé cómo tratamos los datos de los alumnos y cuáles son las
              reglas de uso.
            </p>
          </>
        )}
        <p className="text-sm">
          <Link
            to="/privacidad"
            target="_blank"
            className="font-semibold text-brand hover:underline"
          >
            Aviso de privacidad
          </Link>{' '}
          ·{' '}
          <Link to="/terminos" target="_blank" className="font-semibold text-brand hover:underline">
            Términos de uso
          </Link>
        </p>
        <form onSubmit={enviar} className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
            />
            <span>
              {esAlumno
                ? 'Soy madre, padre o tutor/a, leí el aviso de privacidad y los términos de uso, y los acepto.'
                : 'Leí el aviso de privacidad y los términos de uso, y los acepto.'}
            </span>
          </label>
          <Mensaje>{error}</Mensaje>
          <Boton type="submit" className="w-full" disabled={!acepto || enviando}>
            {enviando ? 'Guardando…' : 'Aceptar y continuar'}
          </Boton>
        </form>
        <button
          onClick={salir}
          className="block w-full text-center text-sm text-slate-500 hover:underline"
        >
          Salir
        </button>
      </Tarjeta>
    </div>
  )
}
