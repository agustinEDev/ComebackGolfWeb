/**
 * Antes que nada, una vez por carga: lo guardado con las claves de antes del cambio
 * de nombre pasa a las nuevas o se borra (utils/clavesDeLaMarcaVieja). Va antes de
 * la purga de los golpes perdidos, para que vea también los rescatados.
 */
import { recogeLasClavesViejas } from '../utils/clavesDeLaMarcaVieja';

recogeLasClavesViejas();
