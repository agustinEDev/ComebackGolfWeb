import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

/**
 * Lista de ajustes al estilo de una aplicacion movil (FE #324).
 *
 * Sustituye a la botonera de colores del perfil: filas de ancho completo con
 * icono, etiqueta y chevron, agrupadas bajo un encabezado. Una fila no compite
 * por la atencion como lo hacia un boton solido, asi que el color queda libre
 * para lo unico que deberia destacar en cada grupo.
 */

export const SettingsGroup = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wider text-tinta-suave">
      {title}
    </h3>
    <div className="overflow-hidden rounded-tarjeta border border-contorno bg-tarjeta divide-y divide-linea">
      {children}
    </div>
  </section>
);

/**
 * Fila de la lista. Navega con `to` (enlace) o ejecuta `onClick` (boton): lo
 * que va a otra pantalla debe ser un enlace de verdad para que el navegador
 * ofrezca abrir en otra pestana y los lectores de pantalla lo anuncien como tal.
 */
export const SettingsRow = ({
  icon: Icon,
  label,
  to,
  onClick,
  tone = 'default',
}) => {
  const toneClasses =
    tone === 'danger'
      ? 'text-error active:bg-fondo'
      : 'text-tinta active:bg-fondo';

  const content = (
    <>
      <span className="flex items-center gap-3">
        {Icon && (
          <Icon
            className={`h-5 w-5 ${tone === 'danger' ? 'text-error' : 'text-tinta-suave'}`}
            aria-hidden="true"
          />
        )}
        <span className="text-sm font-medium">{label}</span>
      </span>
      {/* El chevron promete "esto te lleva a otra pantalla". Cerrar sesion no
          lleva a ninguna, asi que en el tono destructivo no se pinta */}
      {tone !== 'danger' && (
        <ChevronRight className="h-4 w-4 text-tinta-suave" aria-hidden="true" />
      )}
    </>
  );

  // 44px: minimo de zona tactil, el mismo que se aplico a la navegacion inferior
  const className = `flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left transition-colors ${toneClasses}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};

/**
 * Fila que no navega: aloja un control propio a la derecha (el selector de
 * idioma, el interruptor de publicar) en lugar del chevron.
 *
 * `description` es para un control cuyo efecto no cabe en la etiqueta. El
 * `min-w-0` del bloque de texto no es decorativo: sin él, un hijo de flex mide
 * lo que mide su contenido y una descripción larga empuja al control fuera de
 * la fila en pantallas estrechas (FE #351).
 */
export const SettingsControlRow = ({
  icon: Icon,
  label,
  description,
  children,
}) => (
  <div className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3">
    <span className="flex min-w-0 items-center gap-3 text-tinta">
      {Icon && (
        <Icon
          className="h-5 w-5 shrink-0 text-tinta-suave"
          aria-hidden="true"
        />
      )}
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-tinta-suave">
            {description}
          </span>
        )}
      </span>
    </span>
    {children}
  </div>
);
