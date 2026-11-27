/**
 * Los colores de comportamiento de la aplicación (ComeBack Golf), en un solo
 * sitio: lo que está elegido y lo que se tiene bajo el puntero se ven igual en
 * todas las pantallas.
 *
 *   estado                 | claro                    | oscuro
 *   -----------------------|--------------------------|------------------------
 *   elegido / pulsado      | Acid Lime, letra Forest  | Acid Lime, letra Forest
 *   bajo el puntero        | Forest, letra Arena      | Arena, letra Forest
 *
 * El borde Forest de lo elegido es para el claro: la lima apenas se separa del
 * Off White (1,13:1) y sin él no se sabría dónde acaba el control. En oscuro es
 * del color del fondo y no se ve.
 *
 * `hover:` solo se aplica donde hay puntero de verdad: en el móvil un toque no
 * deja el control pintado de «encima».
 */
export const FONDO_DE_LO_ELEGIDO = 'bg-lime text-forest';

// Para el control que ya trae su grosor de borde
export const COLOR_DE_LO_ELEGIDO = `${FONDO_DE_LO_ELEGIDO} border-forest`;

// Con su borde, de 1 px: el mismo grosor que el `border` de lo no elegido, para
// que elegir no mueva nada
export const ELEGIDO = `${COLOR_DE_LO_ELEGIDO} border`;

// Para el control sin borde, ni elegido ni sin elegir: el contorno es un anillo
// hacia dentro, que no cambia su tamaño
export const ELEGIDO_CON_ANILLO = `${FONDO_DE_LO_ELEGIDO} ring-1 ring-inset ring-forest`;

// Todo lo que haya dentro, en Forest: los textos secundarios de una tarjeta o
// de una fila son claros en oscuro y sobre la lima no se leerían
export const TEXTO_DE_DENTRO_EN_FOREST = '[&_*]:text-forest';

export const ELEGIDO_CON_TEXTO_DENTRO = `${COLOR_DE_LO_ELEGIDO} ${TEXTO_DE_DENTRO_EN_FOREST}`;

// Un conmutador encendido: el carril en lima con su contorno (un anillo, que no
// mueve la bola) y la bola en Forest
export const CARRIL_ENCENDIDO = 'bg-lime ring-[1.5px] ring-inset ring-forest';
export const BOLA_ENCENDIDA = 'bg-forest';

// `enabled:`: un botón desactivado no responde al puntero
export const AL_PASAR =
  'transition-colors enabled:hover:bg-contraste enabled:hover:text-sobre-contraste';

// Un enlace con aspecto de botón: `:enabled` solo existe en los controles de
// formulario, así que en un enlace el `hover:` va a secas
export const AL_PASAR_EN_ENLACE =
  'transition-colors hover:bg-contraste hover:text-sobre-contraste';

// Mientras se pulsa, antes de que quede elegido. Con `enabled:` como el de
// «encima»: a secas pesaba menos que él y con ratón no se veía nunca
export const AL_PULSAR = 'enabled:active:bg-lime enabled:active:text-forest';

/**
 * Las pestañas, iguales en toda la aplicación: la abierta es lo elegido y se
 * une a su panel (sin borde de abajo); la cerrada lleva un borde transparente
 * del mismo grosor, para que abrir una no mueva a las demás.
 */
export const CLASE_DE_LA_LISTA_DE_PESTANAS =
  'flex border-b-[1.5px] border-tinta';

export const claseDePestana = (abierta) =>
  `rounded-t-lg border-b-0 text-center text-sm ${
    abierta
      ? `font-bold ${ELEGIDO}`
      : `border border-transparent font-medium text-tinta-suave ${AL_PASAR}`
  }`;
