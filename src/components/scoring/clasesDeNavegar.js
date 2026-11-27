import {
  AL_PASAR,
  AL_PULSAR,
  COLOR_DE_LO_ELEGIDO,
} from '../ui/clasesDeComportamiento';

/**
 * Los dos botones para moverse entre hoyos (ComeBack Golf). «Siguiente» es la
 * acción principal de la pantalla de anotar: Acid Lime con texto Deep Forest.
 * «Anterior», la secundaria: contorno de tinta.
 *
 * En un fichero aparte porque los usan las tres pantallas de anotar (partido,
 * partida de stroke play y partida rápida) y tienen que ser los mismos.
 */
const BASE =
  'min-h-11 min-w-0 inline-flex items-center justify-center gap-1 rounded-boton px-4 py-2 text-sm font-bold';

// Con el relleno del fondo, como «Mapa»: transparente dejaba ver por debajo la
// marca de agua de la pantalla (Agustín, 26 nov 2026). Y desactivado se apagan
// la letra y el contorno, no el botón entero: con `opacity`, el relleno se
// volvería translúcido y el dibujo asomaría justo en el hoyo 1
export const CLASE_DE_ANTERIOR = `${BASE} border-[1.5px] border-tinta bg-fondo text-tinta disabled:border-tinta/40 disabled:text-tinta/40 ${AL_PASAR} ${AL_PULSAR}`;

export const CLASE_DE_SIGUIENTE = `${BASE} border-[1.5px] disabled:opacity-40 ${COLOR_DE_LO_ELEGIDO} ${AL_PASAR}`;
