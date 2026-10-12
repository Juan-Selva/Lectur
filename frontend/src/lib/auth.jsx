import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, onSesionVencida, setToken } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(getToken()))

  const salir = useCallback(() => {
    setToken(null)
    setUsuario(null)
  }, [])

  useEffect(() => {
    onSesionVencida(salir)
    if (!getToken()) return
    api
      .me()
      .then((r) => setUsuario(r.usuario))
      .catch(salir)
      .finally(() => setCargando(false))
  }, [salir])

  const entrar = useCallback(async (email, password) => {
    const r = await api.login(email, password)
    setToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }, [])

  const valor = useMemo(
    () => ({ usuario, cargando, entrar, salir }),
    [usuario, cargando, entrar, salir],
  )
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
