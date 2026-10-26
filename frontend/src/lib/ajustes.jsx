import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  AJUSTES_INICIALES,
  aplicarAjustes,
  cargarAjustes,
  guardarAjustes,
  normalizarAjustes,
} from './ajustes.js'

const AjustesContext = createContext(null)

const inicial = () =>
  cargarAjustes(localStorage, window.matchMedia?.('(prefers-contrast: more)').matches ?? false)

export function AjustesProvider({ children }) {
  const [ajustes, setAjustesState] = useState(() => {
    const a = inicial()
    aplicarAjustes(a) // antes del primer render, para que no haya parpadeo
    return a
  })

  const cambiar = useCallback((parche) => {
    setAjustesState((actual) => {
      const nuevo = normalizarAjustes({ ...actual, ...parche })
      aplicarAjustes(nuevo)
      guardarAjustes(localStorage, nuevo)
      return nuevo
    })
  }, [])
  const restablecer = useCallback(() => cambiar(AJUSTES_INICIALES), [cambiar])

  const valor = useMemo(() => ({ ajustes, cambiar, restablecer }), [ajustes, cambiar, restablecer])
  return <AjustesContext.Provider value={valor}>{children}</AjustesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAjustes = () => useContext(AjustesContext)
