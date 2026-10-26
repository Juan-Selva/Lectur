import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from './api.js'

const AlertasContext = createContext(null)

// Cantidad de alertas sin ver (para la campanita). Se actualiza al entrar y al cambiar de pantalla.
export function AlertasProvider({ children }) {
  const [noVistas, setNoVistas] = useState(0)
  const { pathname } = useLocation()

  const recargar = useCallback(
    () =>
      api
        .alertas()
        .then((r) => setNoVistas(r.noVistas))
        .catch(() => {}),
    [],
  )
  useEffect(() => {
    recargar()
  }, [recargar, pathname])

  const valor = useMemo(() => ({ noVistas, recargar }), [noVistas, recargar])
  return <AlertasContext.Provider value={valor}>{children}</AlertasContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAlertas = () => useContext(AlertasContext)
