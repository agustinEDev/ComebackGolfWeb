import { describe, it, expect } from 'vitest';
import { noSeArreglaReintentando } from './noSeArreglaReintentando';

/**
 * Cuándo una pantalla de anotación que no ha podido cargar NO ofrece
 * «Reintentar» sino volver a la lista: cuando nuestra API ha dicho que esa
 * partida no existe (404) o no es tuya (403). Reintentar daría lo mismo
 * (Agustín, 26 nov 2026).
 *
 *   caso | el fallo                                | ¿volver?
 *   -----|-----------------------------------------|---------
 *   R1   | 404 de la API                           | sí
 *   R2   | 403 de la API                           | sí
 *   R3   | 404 o 403 de un intermediario           | no: reintentar
 *   R4   | 500 de la API                           | no
 *   R5   | sin respuesta (sin cobertura)           | no
 *   R6   | 404 de la API pero el sondeo no contesta| no: falta la señal
 *   R7   | el estado viene en `response.status`    | como si viniera arriba
 *   R8   | sin error                               | no
 *   R9   | 403 de la API con código propio (CSRF,  | no: ese se arregla
 *        | términos sin aceptar)                   | de otra manera
 */
const de = (status, deLaApi = true) =>
  Object.assign(new Error('x'), { status, deLaApi });

describe('noSeArreglaReintentando', () => {
  it.each([
    ['R1', de(404), false, true],
    ['R2', de(403), false, true],
    ['R3 404', de(404, false), false, false],
    ['R3 403', de(403, false), false, false],
    ['R4', de(500), false, false],
    ['R5', Object.assign(new Error('Failed to fetch')), false, false],
    ['R6', de(404), true, false],
    [
      'R7',
      Object.assign(new Error('x'), {
        response: { status: 404 },
        deLaApi: true,
      }),
      false,
      true,
    ],
    ['R8', null, false, false],
    [
      'R9 CSRF',
      Object.assign(de(403), { errorCode: 'CSRF_VALIDATION_FAILED' }),
      false,
      false,
    ],
    [
      'R9 términos',
      Object.assign(de(403), { errorCode: 'TERMS_NOT_ACCEPTED' }),
      false,
      false,
    ],
    [
      'R1 con errorCode nulo',
      Object.assign(de(404), { errorCode: null }),
      false,
      true,
    ],
  ])('%s', (_caso, error, sondeoSinRespuesta, esperado) => {
    expect(noSeArreglaReintentando(error, sondeoSinRespuesta)).toBe(esperado);
  });
});
