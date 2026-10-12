import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { Cargando } from './components/ui.jsx'
import { useAuth } from './lib/auth.jsx'
import AlumnoActividades from './pages/AlumnoActividades.jsx'
import AlumnoLectura from './pages/AlumnoLectura.jsx'
import Diccionario from './pages/Diccionario.jsx'
import DocenteAsignar from './pages/DocenteAsignar.jsx'
import DocenteSemaforo from './pages/DocenteSemaforo.jsx'
import DocenteTextos from './pages/DocenteTextos.jsx'
import Login from './pages/Login.jsx'

function Privada({ rol, children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol !== rol)
    return <Navigate to={usuario.rol === 'docente' ? '/docente' : '/alumno'} replace />
  return children
}

function Inicio() {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  return <Navigate to={usuario.rol === 'docente' ? '/docente' : '/alumno'} replace />
}

export default function App() {
  const { usuario } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={usuario ? <Inicio /> : <Login />} />
      <Route
        element={
          <Privada rol="docente">
            <Layout />
          </Privada>
        }
      >
        <Route path="/docente" element={<DocenteSemaforo />} />
        <Route path="/docente/asignar" element={<DocenteAsignar />} />
        <Route path="/docente/textos" element={<DocenteTextos />} />
      </Route>
      <Route
        element={
          <Privada rol="alumno">
            <Layout />
          </Privada>
        }
      >
        <Route path="/alumno" element={<AlumnoActividades />} />
        <Route path="/alumno/lectura/:id" element={<AlumnoLectura />} />
        <Route path="/alumno/diccionario" element={<Diccionario />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
