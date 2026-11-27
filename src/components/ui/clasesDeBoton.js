/**
 * Los botones de la marca, en un solo sitio (26 nov 2026): cuadrados y sin
 * borde, como los de los correos (Agustín). Los usan las pantallas de acceso y
 * las páginas públicas; cada sitio pone el tamaño.
 *
 * - `PRINCIPAL`: la acción principal, en lima con el texto en Forest. La marca
 *   reserva la lima para el botón principal; se lee igual en claro y en oscuro.
 * - `SECUNDARIO`: la otra salida, en el relleno suave de la app (salvia en
 *   claro, Forest Medium en oscuro), para no competir con la principal.
 */
export const PRINCIPAL =
  'rounded-none font-bold bg-lime text-forest text-center transition-[filter,opacity]';

// Lo que no tiene vuelta (borrar, rechazar): el rojo de error de la app con su
// texto de contraste, que se lee en los dos temas. La marca no tiene un rojo
export const PELIGRO =
  'rounded-none font-bold bg-error text-sobre-contraste text-center transition-[filter,opacity]';

// El primer paso de algo que no tiene vuelta (descartar, borrar): avisa en
// rojo sin el peso del botón que lo confirma
export const PELIGRO_SUAVE =
  'rounded-none font-semibold bg-error-suave text-error text-center transition-[filter,opacity]';

export const SECUNDARIO =
  'rounded-none font-semibold bg-realce text-tinta text-center transition-[filter]';

// `enabled:`: un botón desactivado (mientras se envía) no responde al puntero
export const AL_PULSAR_BOTON =
  'enabled:cursor-pointer enabled:hover:brightness-95 enabled:active:brightness-90 disabled:opacity-60 disabled:cursor-not-allowed';

// Un enlace con aspecto de botón: `:enabled` no existe en un enlace
export const AL_PULSAR_ENLACE =
  'cursor-pointer hover:brightness-95 active:brightness-90';

// Lo que aún no se puede elegir (los «Próximamente» de Precios): apagado, sin
// el relleno de un secundario, que lo hacía parecer una opción válida
export const NO_DISPONIBLE =
  'rounded-none font-semibold text-center bg-linea text-tinta-suave cursor-not-allowed';
