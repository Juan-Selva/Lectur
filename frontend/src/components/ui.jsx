import { useEffect } from 'react'
import { categoria } from '../lib/categorias.js'

export function Boton({ variante = 'primario', className = '', ...props }) {
  const base =
    'boton inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40'
  const v = {
    primario: 'bg-brand text-white hover:bg-brand-dark',
    dorado: 'bg-gold text-ink hover:brightness-95',
    suave: 'border border-slate-200 bg-white text-ink hover:bg-slate-50',
    peligro: 'border border-red-200 bg-white text-danger hover:bg-red-50',
  }[variante]
  return <button className={`${base} ${v} ${className}`} {...props} />
}

export function Tarjeta({ className = '', ...props }) {
  return (
    <div
      className={`tarjeta rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  )
}

export function Campo({ etiqueta, id, className = '', ...props }) {
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink">
      {etiqueta}
      <input
        id={id}
        className={`mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
        {...props}
      />
    </label>
  )
}

export const Mensaje = ({ tipo = 'error', children }) =>
  children ? (
    <p
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3 py-2 text-sm ${
        tipo === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      {children}
    </p>
  ) : null

const PUNTOS = ['bg-sky-400', 'bg-amber-400', 'bg-pink-400']

export const Cargando = () => (
  <div role="status" className="flex flex-col items-center gap-3 py-12 text-slate-500">
    <div className="flex gap-2" aria-hidden="true">
      {PUNTOS.map((c, i) => (
        <span
          key={c}
          className={`size-3.5 animate-bounce rounded-full ${c}`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
    Cargando…
  </div>
)

export function Modal({ titulo, onCerrar, children }) {
  useEffect(() => {
    const f = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onCerrar])
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

export function Categoria({ valor }) {
  const c = categoria(valor)
  return c ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.chip}`}
    >
      <span aria-hidden="true">{c.emoji}</span>
      {c.etiqueta}
    </span>
  ) : null
}
