import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { Cargando } from './components/ui.jsx'
import { useAuth } from './lib/auth.jsx'
import AlumnoActividades from './pages/AlumnoActividades.jsx'
import AlumnoLectura from './pages/AlumnoLectura.jsx'
import Diccionario from './pages/Diccionario.jsx'
import AlumnoPractica from './pages/AlumnoPractica.jsx'
import AlumnoHistorial from './pages/AlumnoHistorial.jsx'
import DocenteAlumno from './pages/DocenteAlumno.jsx'
import DocenteResumen from './pages/DocenteResumen.jsx'
import DocenteAlertas from './pages/DocenteAlertas.jsx'
import { AlertasProvider } from './lib/alertas.jsx'
import DocenteImportar from './pages/DocenteImportar.jsx'
import DocenteCursos from './pages/DocenteCursos.jsx'
import { CursosProvider } from './lib/cursos.jsx'
import DocenteAsignar from './pages/DocenteAsignar.jsx'
import DocentePalabras from './pages/DocentePalabras.jsx'
import DocenteSemaforo from './pages/DocenteSemaforo.jsx'
import DocenteTextos from './pages/DocenteTextos.jsx'
import Login from './pages/Login.jsx'
import AceptarTerminos from './pages/AceptarTerminos.jsx'
import { Privacidad, Terminos } from './pages/Legal.jsx'

function Privada({ rol, children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol !== rol)
    return <Navigate to={usuario.rol === 'docente' ? '/docente' : '/alumno'} replace />
  if (!usuario.terminosAceptados) return <AceptarTerminos />
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
      <Route path="/privacidad" element={<Privacidad />} />
      <Route path="/terminos" element={<Terminos />} />
      <Route
        element={
          <Privada rol="docente">
            <CursosProvider>
              <AlertasProvider>
                <Layout />
              </AlertasProvider>
            </CursosProvider>
          </Privada>
        }
      >
        <Route path="/docente" element={<DocenteSemaforo />} />
        <Route path="/docente/alumnos/:id" element={<DocenteAlumno />} />
        <Route path="/docente/alumnos/:id/resumen" element={<DocenteResumen />} />
        <Route path="/docente/asignar" element={<DocenteAsignar />} />
        <Route path="/docente/palabras" element={<DocentePalabras />} />
        <Route path="/docente/alertas" element={<DocenteAlertas />} />
        <Route path="/docente/importar" element={<DocenteImportar />} />
        <Route path="/docente/cursos" element={<DocenteCursos />} />
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
        <Route path="/alumno/practica" element={<AlumnoPractica />} />
        <Route path="/alumno/practica/:id" element={<AlumnoLectura practica />} />
        <Route path="/alumno/historial" element={<AlumnoHistorial />} />
        <Route path="/alumno/diccionario" element={<Diccionario />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
