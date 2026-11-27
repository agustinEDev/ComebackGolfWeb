import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Las tarjetas de resultados dejan ver la marca de agua (Agustín, 26 nov 2026:
 * eligió el 65 % entre tres muestras). En el partido y en la partida rápida es
 * UNA pieza, `TarjetaVertical`; la partida de stroke play pinta las suyas,
 * `TarjetasDeLaPartida`.
 *
 *   #   qué                                       | por qué
 *   ----|------------------------------------------|--------------------------------
 *   T1  cada franja pinta UN fondo al 65 %, y la   | con uno en la caja y otro
 *       caja ninguno                               | encima pasaba un 12 %, no un 35
 *   T2  las dos tablas pintan con esta tarjeta, y  | si una copia la suya, se queda
 *       las de la partida van también al 65 %      | opaca sin que nadie lo note
 *   T3  la letra no se toca                        | lo translúcido es el fondo: con
 *                                                  | `opacity` se apagarían los golpes
 *   T4  la mejor bola sigue opaca                  | su contraste dependía del fondo
 */
const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const sinComentarios = (codigo) =>
  codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('la tarjeta de resultados, translúcida', () => {
  const fuente = sinComentarios(
    leer('src/components/scoring/TarjetaVertical.jsx'),
  );
  const fondos = fuente.match(/(?<![\w:-])bg-[\w-]+(?:\/\d+)?/g) ?? [];

  it('T1: cada franja pinta un fondo al 65 %, y la caja ninguno', () => {
    expect([...fondos].sort()).toEqual([
      // la fila de los títulos y cada fila de hoyo
      'bg-fondo/65',
      'bg-fondo/65',
      // la cabecera sin equipo y las filas de suma
      'bg-tarjeta/65',
      'bg-tarjeta/65',
      'bg-team-a-suave/65',
      'bg-team-b-suave/65',
    ]);
    // La caja, sin fondo: lo ponen sus franjas
    expect(fuente).toMatch(
      /className="rounded-xl border border-linea overflow-hidden"/,
    );
  });

  it('T2: las dos tablas pintan con esta tarjeta, y las de la partida van al 65 %', () => {
    for (const ruta of [
      'src/components/scoring/ScorecardTable.jsx',
      'src/components/quick_match/QuickMatchScorecardTable.jsx',
    ]) {
      expect(leer(ruta), ruta).toMatch(/<TarjetaVertical\b/);
    }
    // La partida de stroke play pinta las suyas (`cards`)
    expect(
      sinComentarios(leer('src/components/scoring/TarjetasDeLaPartida.jsx')),
    ).toMatch(/rounded-lg border bg-fondo\/65 p-3/);
  });

  it('T4: la mejor bola sigue opaca, en vez del fondo de la fila', () => {
    expect(fuente).toMatch(
      /h\.mejorBola \? CLASE_DE_MEJOR_BOLA : 'bg-fondo\/65'/,
    );
    expect(leer('src/components/scoring/claseDeMejorBola.js')).toMatch(
      /'bg-mejor-bola /,
    );
  });

  it('T3: la letra no se toca', () => {
    expect(fuente).not.toMatch(/(?<![\w:-])opacity-\d+/);
    expect(fuente).not.toMatch(/text-[\w-]+\/\d+/);
  });
});
