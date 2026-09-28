import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import SeleccionTexto from './pages/SeleccionTexto.jsx'
import Lectura from './pages/Lectura.jsx'
import Cuestionario from './pages/Cuestionario.jsx'
import Resultado from './pages/Resultado.jsx'
import Docente from './pages/Docente.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SeleccionTexto />} />
        <Route path="/leer/:textoId" element={<Lectura />} />
        <Route path="/cuestionario/:textoId" element={<Cuestionario />} />
        <Route path="/resultado" element={<Resultado />} />
        <Route path="/docente" element={<Docente />} />
      </Route>
    </Routes>
  )
}

export default App
