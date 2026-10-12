// Presentación del semáforo (la regla de negocio vive en el backend).
export const ESTADOS = {
  verde: {
    etiqueta: 'En nivel',
    punto: 'bg-success',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  amarillo: {
    etiqueta: 'A seguir',
    punto: 'bg-warning',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  rojo: { etiqueta: 'Atención', punto: 'bg-danger', chip: 'bg-red-50 text-red-800 border-red-200' },
  null: {
    etiqueta: 'Sin eval.',
    punto: 'bg-slate-300',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
  },
}
export const estadoInfo = (estado) => ESTADOS[estado ?? 'null']
