import { AL_PASAR, COLOR_DE_LO_ELEGIDO } from '../ui/clasesDeComportamiento';

/**
 * El fondo del hueco para anotar (FE #725): el siguiente, relleno; los demás,
 * vacíos y con contorno. Aparte del componente para que el refresco en caliente
 * siga funcionando.
 *
 * Con la marca ComeBack Golf los distingue la forma —relleno o contorno—, y no
 * un anillo del mismo color que el relleno, que no se veía.
 */
export const clasesDelHueco = (siguiente) =>
  siguiente
    ? `border-[1.5px] ${COLOR_DE_LO_ELEGIDO} ${AL_PASAR}`
    : `border-[1.5px] border-tinta text-tinta ${AL_PASAR}`;
