import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Boton, Cargando, Mensaje, Modal, Tarjeta } from '../components/ui.jsx'
import { api } from '../lib/api.js'
import { useAlertas } from '../lib/alertas.jsx'
import { useCursos } from '../lib/cursos.jsx'
import { fechaCorta } from '../lib/fechas.js'

const TIPOS = {
  rojos_seguidos: 'Cuestionarios en rojo',
  caida_puntaje: 'Caída de puntaje',
  sin_leer: 'Sin leer',
  racha_rota: 'Racha perdida',
}
const SEVERIDAD = {
  alta: { punto: 'bg-danger', texto: 'Urgente' },
  media: { punto: 'bg-warning', texto: 'A mirar' },
}

function ModalConfig({ onCerrar }) {
  const [c, setC] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .alertasConfig()
      .then((r) => setC(r.config))
      .catch((e) => setError(e.message))
  }, [])

  const numero = (k) => (e) => setC({ ...c, [k]: Number(e.target.value) })
  const tipo = (k) => (e) => setC({ ...c, tipos: { ...c.tipos, [k]: e.target.checked } })
  async function guardar(e) {
    e.preventDefault()
    setError('')
    try {
      await api.guardarAlertasConfig(c)
      onCerrar(true)
    } catch (err) {
      setError(err.message)
    }
  }
  const campo = (k, etiqueta, min, max, paso = 1) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{etiqueta}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={paso}
        value={c[k]}
        onChange={numero(k)}
        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right"
      />
    </label>
  )
  const check = (k, etiqueta) => (
    <label className="flex items-center gap-3 text-sm font-medium">
      <input
        type="checkbox"
        className="size-4 accent-brand"
        checked={c.tipos[k]}
        onChange={tipo(k)}
      />
      {etiqueta}
    </label>
  )

  return (
    <Modal titulo="Configurar avisos" onCerrar={() => onCerrar(false)}>
      {!c ? (
        error ? (
          <Mensaje>{error}</Mensaje>
        ) : (
          <Cargando />
        )
      ) : (
        <form onSubmit={guardar} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold">Qué avisos querés recibir</legend>
            {check('rojos_seguidos', 'Cuestionarios en rojo seguidos')}
            {check('caida_puntaje', 'Caída fuerte de puntaje')}
            {check('sin_leer', 'Días sin leer')}
            {check('racha_rota', 'Racha perdida')}
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-semibold">Cuándo avisar</legend>
            {campo('rojosSeguidos', 'Cuestionarios en rojo seguidos', 2, 5)}
            {campo('caidaPuntos', 'Puntos que baja el resultado', 1, 9, 0.5)}
            {campo('diasSinLeer', 'Días de clase sin leer', 1, 15)}
            {campo('rachaMinima', 'Racha mínima para avisar si se pierde', 2, 30)}
          </fieldset>
          <Mensaje>{error}</Mensaje>
          <Boton type="submit" className="w-full">
            Guardar
          </Boton>
        </form>
      )}
    </Modal>
  )
}

export default function DocenteAlertas() {
  const { cursoId } = useCursos()
  const { recargar } = useAlertas()
  const [alertas, setAlertas] = useState(null)
  const [error, setError] = useState('')
  const [conVistas, setConVistas] = useState(false)
  const [config, setConfig] = useState(false)

  const cargar = useCallback(() => {
    api
      .alertas(cursoId)
      .then((r) => setAlertas(r.alertas))
      .catch((e) => setError(e.message))
  }, [cursoId])
  useEffect(cargar, [cargar])

  async function marcar(a) {
    try {
      await api.alertaVista({ alumnoId: a.alumnoId, tipo: a.tipo, clave: a.clave })
      cargar()
      recargar()
    } catch (e) {
      setError(e.message)
    }
  }
  async function marcarTodas() {
    try {
      await api.alertasVistas(cursoId)
      cargar()
      recargar()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!alertas) return error ? <Mensaje>{error}</Mensaje> : <Cargando />
  const nuevas = alertas.filter((a) => !a.vista)
  const visibles = conVistas ? alertas : nuevas

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Alertas</h1>
        <div className="flex flex-wrap gap-2">
          <Boton variante="suave" onClick={() => setConfig(true)}>
            Configurar avisos
          </Boton>
          <Boton variante="suave" disabled={nuevas.length === 0} onClick={marcarTodas}>
            Marcar todas como vistas
          </Boton>
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Avisos sobre alumnos que pueden necesitar acompañamiento. Son una señal orientativa: la
        decisión es tuya. Si el problema se repite, el aviso vuelve a aparecer.
      </p>
      <Mensaje>{error}</Mensaje>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 accent-brand"
          checked={conVistas}
          onChange={(e) => setConVistas(e.target.checked)}
        />
        Mostrar también las ya vistas
      </label>

      {visibles.length === 0 && (
        <Tarjeta className="text-slate-600">
          {nuevas.length === 0 && alertas.length > 0
            ? 'No tenés avisos nuevos.'
            : 'No hay avisos por ahora. ¡Todo en orden!'}
        </Tarjeta>
      )}
      {visibles.map((a) => (
        <Tarjeta
          key={`${a.alumnoId}-${a.tipo}-${a.clave}`}
          className={`space-y-2 ${a.vista ? 'opacity-70' : ''}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold">
                <Link
                  to={`/docente/alumnos/${a.alumnoId}`}
                  className="hover:text-brand hover:underline"
                >
                  {a.alumno}
                </Link>
                {a.curso && (
                  <span className="ml-2 text-sm font-medium text-slate-500">{a.curso}</span>
                )}
              </p>
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span
                  className={`size-2.5 rounded-full ${SEVERIDAD[a.severidad].punto}`}
                  aria-hidden="true"
                />
                {SEVERIDAD[a.severidad].texto} · {TIPOS[a.tipo]}
                <span className="font-normal text-slate-500">· {fechaCorta(a.fecha)}</span>
              </p>
            </div>
            {a.vista ? (
              <span className="text-sm text-slate-500">Vista</span>
            ) : (
              <Boton variante="suave" onClick={() => marcar(a)}>
                Marcar como vista
              </Boton>
            )}
          </div>
          <p className="text-sm text-slate-700">{a.detalle}</p>
        </Tarjeta>
      ))}

      {config && (
        <ModalConfig
          onCerrar={(cambio) => {
            setConfig(false)
            if (cambio) {
              cargar()
              recargar()
            }
          }}
        />
      )}
    </div>
  )
}
