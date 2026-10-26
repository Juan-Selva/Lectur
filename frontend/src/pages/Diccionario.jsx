import BuscadorPalabras from '../components/BuscadorPalabras.jsx'

export default function Diccionario() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Diccionario</h1>
      <p className="text-slate-600">Escribí una palabra para saber qué significa.</p>
      <BuscadorPalabras />
    </div>
  )
}
