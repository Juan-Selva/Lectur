import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import { Tarjeta } from '../components/ui.jsx'

function Pagina({ titulo, children }) {
  return (
    <div className="min-h-screen bg-brand-soft p-4">
      <div className="mx-auto max-w-2xl space-y-4 py-4">
        <Link to="/" className="inline-block">
          <img src={logo} alt="Lectur" className="h-10 w-auto" />
        </Link>
        <Tarjeta className="space-y-4 p-6 leading-relaxed text-slate-700">
          <h1 className="text-2xl font-bold text-ink">{titulo}</h1>
          {children}
        </Tarjeta>
        <p className="text-center text-sm text-slate-500">
          <Link to="/privacidad" className="hover:underline">
            Privacidad
          </Link>{' '}
          ·{' '}
          <Link to="/terminos" className="hover:underline">
            Términos de uso
          </Link>
        </p>
      </div>
    </div>
  )
}

const H = ({ children }) => <h2 className="pt-2 text-lg font-bold text-ink">{children}</h2>

export function Privacidad() {
  return (
    <Pagina titulo="Aviso de privacidad">
      <p>
        Lectur es una herramienta para que los docentes de primer ciclo detecten dificultades de
        comprensión lectora. Como sus usuarios son chicos y chicas, cuidamos sus datos y guardamos
        solo lo necesario.
      </p>
      <H>Qué datos guardamos</H>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Del alumno: nombre, grado o curso y el email que brindó su familia, que se usa para
          ingresar.
        </li>
        <li>
          De su uso: las lecturas que hace, las respuestas a las preguntas, el puntaje, los días que
          lee y las palabras que busca en el diccionario.
        </li>
        <li>
          Del docente: nombre, email, las notas que escribe sobre sus alumnos y los textos que
          carga.
        </li>
      </ul>
      <H>Para qué los usamos</H>
      <p>
        Solo para mostrar al docente cómo viene cada chico (el semáforo, las alertas y el resumen
        para las familias) y para que el alumno vea su historial y su racha. No se usan para
        publicidad ni se venden.
      </p>
      <H>Quién los ve</H>
      <p>
        Cada alumno es visible para el docente que lo dio de alta, y el alumno ve sus propios datos.
        No se ceden a terceros. Los docentes no ven alumnos de otros docentes.
      </p>
      <H>Servicio externo del diccionario</H>
      <p>
        Si una palabra no está en el diccionario propio de Lectur, se consulta la RAE mediante una
        librería no oficial. Solo se envía la palabra buscada, sin nombre ni otros datos del alumno,
        y el resultado se guarda para no repetir la consulta. Es una limitación conocida del
        proyecto.
      </p>
      <H>Tus derechos</H>
      <p>
        La familia puede pedir al docente o a la escuela ver, corregir o borrar los datos del
        alumno. El docente puede corregir el nombre, el email o el curso desde la ficha del alumno,
        borrar sus datos de lectura conservando la cuenta, o eliminar al alumno por completo.
      </p>
      <H>Seguridad</H>
      <p>
        Las contraseñas se guardan cifradas y el acceso está separado por rol. Ningún sistema es
        infalible: por eso pedimos no cargar en Lectur información que no sea necesaria.
      </p>
      <p className="text-sm text-slate-500">
        Lectur es un proyecto académico (UADE). Este aviso es informativo y no reemplaza la
        autorización de la escuela ni el consentimiento de las familias.
      </p>
    </Pagina>
  )
}

export function Terminos() {
  return (
    <Pagina titulo="Términos de uso">
      <H>Qué es el semáforo</H>
      <p>
        El semáforo (verde, amarillo y rojo) es una ayuda orientativa para el docente. No es un
        diagnóstico ni reemplaza la evaluación de un profesional. Cada docente interpreta los
        resultados con su criterio.
      </p>
      <H>Responsabilidad del docente</H>
      <p>
        El docente se asegura de contar con la autorización de la escuela y de las familias antes de
        dar de alta a un alumno, y de cargar el email que ellas brindaron.
      </p>
      <H>Aceptación de la familia</H>
      <p>
        La primera vez que un alumno entra a Lectur, un adulto responsable (madre, padre o tutor)
        debe leer el aviso de privacidad y estos términos, y aceptarlos. Sin esa aceptación el
        alumno no puede usar la plataforma.
      </p>
      <H>Uso de la plataforma</H>
      <p>
        Las cuentas son personales. Hay que cuidar la contraseña y avisar al docente si se perdió.
        Los datos de cada alumno se usan solo con fines educativos.
      </p>
      <H>Cambios</H>
      <p>Si estos textos cambian, se vuelve a pedir la aceptación en el siguiente ingreso.</p>
    </Pagina>
  )
}
