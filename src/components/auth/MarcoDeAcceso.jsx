import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import BrandMark, { Wordmark } from '../ui/BrandMark';

/**
 * El marco de las pantallas de acceso: el panel de marca de la izquierda (oculto
 * en el móvil) y, a la derecha, el logo del móvil, la tarjeta de cada pantalla y
 * el «Volver al inicio». Estaba copiado cinco veces (Login, Registro, las dos
 * vistas de ¿Olvidaste la contraseña? y Restablecer); cada copia es ahora unas
 * props, y el DOM, las clases y las animaciones son los mismos que tenían.
 *
 * Las pantallas de acceso conservan su entrada animada: son la excepción A5 de
 * `sinFundidoAlEntrar.test.js` (Agustín, 3 nov 2026).
 *
 * El panel, con la marca (Agustín, 26 nov 2026): Deep Forest liso, el logo en
 * lima, el sello CG grande de marca de agua y las ventajas con iconos de línea
 * en lima. Fuera las fotos de banco de imágenes, las manchas de color, los
 * emojis y la variante verde oliva del Registro: el mismo panel en todas.
 */
/**
 * @param {object} props
 * @param {import('react').ReactNode} props.titulo - Título del panel de marca
 * @param {import('react').ReactNode} props.subtitulo - Subtítulo del panel de marca
 * @param {{ Icono: import('react').ComponentType<any>, text: string }[]} [props.ventajas] -
 *        Lista con su icono de línea; sin ella el panel no la pinta (la vista
 *        «enviado» de ¿Olvidaste…?)
 * @param {import('react').ReactNode} [props.extraDelHeroe] - Lo que va tras la
 *        lista en el panel (las cifras del Registro)
 * @param {boolean} [props.soloAparece] - El contenido entra sin desplazarse (Login)
 * @param {import('react').ReactNode} [props.textoDeVolver] - Texto del enlace a
 *        la portada; sin él no se pinta (la vista «enviado» lleva otra cosa debajo)
 * @param {import('react').ReactNode} props.children - La tarjeta, y lo que vaya
 *        bajo ella antes del «Volver»
 */
const MarcoDeAcceso = ({
  titulo,
  subtitulo,
  ventajas,
  extraDelHeroe,
  soloAparece = false,
  textoDeVolver,
  children,
}) => {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="relative flex min-h-screen w-full bg-fondo">
      <div className="flex w-full">
        {/* El panel de la marca (oculto en el móvil) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          // Pinta sus propios colores en los dos temas: Deep Forest, con el
          // logo y los iconos en lima y el texto en arena. El foco, en lima: en
          // claro es Forest y sobre el panel no se veía
          data-paleta="propia"
          className="hidden lg:flex lg:w-1/2 relative bg-forest overflow-hidden [--cbg-foco:var(--cbg-lime)]"
        >
          {/* El sello CG, grande y tenue, de marca de agua: decorativo */}
          <span
            aria-hidden="true"
            data-testid="sello-del-panel"
            className="pointer-events-none absolute -right-24 -bottom-24 opacity-[0.07] select-none"
          >
            <BrandMark tinta="acid" className="w-[34rem] max-w-none" />
          </span>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-sand w-full">
            {/* Logo */}
            {/* El wordmark en lima: el panel es oscuro. El nombre, para el
                lector de pantalla, en el encabezado */}
            <Link
              to="/"
              className="flex items-center self-start transition-opacity hover:opacity-80"
            >
              <Wordmark className="h-16 w-auto" tinta="acid" />
              <h1 className="sr-only">Comeback Golf</h1>
            </Link>

            {/* Middle Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-black font-poppins mb-4 leading-tight">
                  {titulo}
                </h2>
                <p className="text-xl text-sand/85 leading-relaxed">
                  {subtitulo}
                </p>
              </div>

              {ventajas && (
                <div className="space-y-4 mt-8">
                  {ventajas.map((item, idx) => (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-lg border border-lime/30 flex items-center justify-center text-lime">
                        <item.Icono className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="text-sand/90">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {extraDelHeroe}
            </div>

            {/* Footer */}
            <div className="text-sand/60 text-sm">
              {t('common:footer.copyrightShort', {
                year: new Date().getFullYear(),
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-fondo">
          {/* En Login solo aparece: entrando desplazada, un clic en ese medio
              segundo podía soltarse fuera del botón, que se había movido (QA,
              FE #865-12) */}
          <motion.div
            initial={{ opacity: 0, ...(soloAparece ? {} : { y: 20 }) }}
            animate={{ opacity: 1, ...(soloAparece ? {} : { y: 0 }) }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <Link
              to="/"
              className="flex lg:hidden items-center mb-8 justify-center transition-opacity hover:opacity-80"
            >
              {/* En la tinta del tema: estas pantallas tienen modo oscuro */}
              <Wordmark className="h-16 w-auto" tinta="tema" />
              <h1 className="sr-only">Comeback Golf</h1>
            </Link>

            {children}

            {textoDeVolver && (
              <Link
                to="/"
                className="flex items-center justify-center gap-2 mt-6 text-tinta-suave hover:text-tinta transition-colors group"
              >
                <svg
                  className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-sm font-medium">{textoDeVolver}</span>
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MarcoDeAcceso;
