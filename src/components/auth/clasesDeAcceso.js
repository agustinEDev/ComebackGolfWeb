import {
  AL_PULSAR_BOTON,
  AL_PULSAR_ENLACE,
  PRINCIPAL,
  SECUNDARIO,
} from '../ui/clasesDeBoton';

/**
 * Las clases de los botones de las pantallas de acceso (26 nov 2026).
 *
 * La acción principal de cada pantalla, en lima con el texto en Forest, como
 * «Partida rápida» en Inicio, y cuadrada y sin borde, como los botones de los
 * correos (Agustín, 26 nov 2026): la marca reserva la lima para el
 * botón principal, y cada pantalla de acceso tiene uno solo. Se lee igual en
 * claro y en oscuro.
 */
// Ancho entero, como el resto de la tarjeta
export const BOTON_PRINCIPAL = `w-full py-3.5 ${PRINCIPAL} ${AL_PULSAR_BOTON}`;

export const ENLACE_PRINCIPAL = `block w-full py-3.5 ${PRINCIPAL} ${AL_PULSAR_ENLACE}`;

export const ENLACE_SECUNDARIO = `block w-full py-3 ${SECUNDARIO} ${AL_PULSAR_ENLACE}`;

// La tarjeta del formulario, en arena sobre el fondo de la app. Con menos relleno
// en el móvil: a 360 px «Registrarse con Google» no cabía en una línea. Y todos
// sus campos con el fondo de la app: el de correo era transparente (arena) y el
// de contraseña traía el suyo, así que se veían distintos. Los desactivados
// conservan el suyo: este selector pesa más que su `disabled:bg-*`
export const TARJETA_DE_ACCESO =
  "bg-tarjeta border border-contorno rounded-tarjeta shadow-sm p-5 sm:p-8 [&_input:not([type='checkbox']):not([type='radio']):not(:disabled)]:bg-fondo [&_select:not(:disabled)]:bg-fondo";
