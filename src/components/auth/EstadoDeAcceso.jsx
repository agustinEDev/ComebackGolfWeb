import { motion } from 'framer-motion';
import DibujoDeMarca from '../ui/DibujoDeMarca';

const TARJETA =
  'w-full max-w-md bg-tarjeta border border-contorno rounded-tarjeta shadow-sm p-6 sm:p-8 text-center';

/**
 * Lo que cuentan las pantallas de estado del acceso: un correo verificado o no,
 * un enlace caducado, un error al entrar con Google, un cambio de correo. Antes
 * cada una pintaba su círculo de color con una X roja o un check; ahora llevan
 * uno de nuestros dibujos de línea: el búnker para lo que salió mal y el green
 * con su bandera para lo que salió bien (Agustín, 26 nov 2026).
 *
 * Las acciones van como hijos: una principal (`ENLACE_PRINCIPAL`) y, si hace
 * falta, otra secundaria; nunca dos que lleven al mismo sitio.
 *
 * `conEntrada` conserva la entrada animada donde ya la había (Restablecer: es
 * la excepción A5 de `sinFundidoAlEntrar.test.js`).
 *
 * @param {object} props
 * @param {'bunker'|'green'} [props.dibujo]
 * @param {import('react').ReactNode} [props.encima] - En lugar del dibujo (la
 *        espera, mientras se comprueba algo)
 * @param {import('react').ReactNode} [props.titulo] - Sin él no hay encabezado
 *        (la pantalla ya tiene el suyo)
 * @param {import('react').ReactNode} [props.texto]
 * @param {1|2} [props.nivel] - El nivel del encabezado del título
 * @param {boolean} [props.pantallaCompleta] - Sin ella, solo la tarjeta (dentro
 *        de otro marco)
 * @param {boolean} [props.conEntrada]
 * @param {import('react').ReactNode} [props.children] - Las acciones, y lo que
 *        vaya entre el texto y ellas
 */
const EstadoDeAcceso = ({
  dibujo,
  encima,
  titulo,
  texto,
  nivel = 2,
  pantallaCompleta = true,
  conEntrada = false,
  children,
}) => {
  const Titulo = nivel === 1 ? 'h1' : 'h2';
  const contenido = (
    <>
      {encima ? (
        <div className="mb-5 flex justify-center">{encima}</div>
      ) : (
        <DibujoDeMarca
          nombre={dibujo}
          className="mx-auto mb-5 h-28 w-28 text-tinta-suave"
        />
      )}
      {titulo && (
        <Titulo className="text-2xl font-bold text-tinta mb-3">{titulo}</Titulo>
      )}
      {texto && <p className="text-tinta-suave mb-6 wrap-anywhere">{texto}</p>}
      {children && <div className="space-y-3">{children}</div>}
    </>
  );
  const tarjeta = conEntrada ? (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={TARJETA}
    >
      {contenido}
    </motion.div>
  ) : (
    <div className={TARJETA}>{contenido}</div>
  );

  if (!pantallaCompleta) return tarjeta;
  return (
    <div className="min-h-screen bg-fondo flex items-center justify-center p-4">
      {tarjeta}
    </div>
  );
};

export default EstadoDeAcceso;
