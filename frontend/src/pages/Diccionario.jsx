import BuscadorPalabras from '../components/BuscadorPalabras.jsx'
import Mascota from '../components/Mascota.jsx'

export default function Diccionario() {
  return (
    <div className="space-y-6">
      <section className="hero flex items-center justify-between gap-4 rounded-3xl border-2 border-emerald-200 bg-linear-to-br from-emerald-100 via-teal-50 to-sky-100 p-6">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="animate-flotar text-6xl">
            🔍
          </span>
          <div>
            <h1 className="text-3xl">Diccionario</h1>
            <p className="font-semibold text-slate-700">
              Escribí una palabra para saber qué significa.
            </p>
          </div>
        </div>
        <Mascota className="hidden size-24 shrink-0 sm:block" />
      </section>
      <BuscadorPalabras />
    </div>
  )
}
