import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * En «Requiere tu atención», la línea que dice de qué torneo es cada aviso se
 * corta con puntos suspensivos (`truncate`). Pero un texto solo se corta si
 * TODOS los contenedores flexibles hasta la fila le dejan encoger (`min-w-0`):
 * con uno que no, el nombre largo de un torneo ensanchaba la página entera,
 * 408 px en un móvil de 390, y aparecía scroll lateral en Inicio (visto el 26
 * nov 2026 con «kexa21-Asistente scratch publica»).
 *
 *   #   qué                                        | por qué
 *   ----|-------------------------------------------|-----------------------------
 *   D1  toda línea que se corta va en una columna   | si no, `truncate` no corta
 *       de texto que puede encoger                  |
 *   D2  y esa columna, en un grupo (icono + texto)  | es el eslabón que faltaba
 *       que también puede encoger                   |
 *   D3  el icono no se aplasta al encoger el texto  | cede el texto, no el icono
 */
const fuente = readFileSync(
  resolve(process.cwd(), 'src/components/dashboard/PendingActionsCard.jsx'),
  'utf8',
).split('\n');

// Por cada línea que se corta: las cajas que la envuelven, de dentro afuera
// (la columna del texto, el icono de al lado y el grupo de los dos, que es un
// `<div>` o el propio botón)
const cortadas = fuente
  .map((linea, i) => ({ linea, i }))
  .filter(({ linea }) => /<p className="truncate /.test(linea))
  .map(({ i }) => {
    const cajas = fuente
      .slice(Math.max(0, i - 16), i)
      .filter((l) => /^\s*className="|<div className=/.test(l));
    return {
      i: i + 1,
      columna: cajas.at(-1),
      icono: cajas.at(-2),
      grupo: cajas.at(-3),
    };
  });

describe('«Requiere tu atención» no ensancha la página', () => {
  it('hay líneas que se cortan, y se miran todas', () => {
    expect(cortadas.length).toBeGreaterThanOrEqual(3);
  });

  it.each(cortadas)(
    'D1 · línea $i: su columna de texto puede encoger',
    ({ columna }) => {
      expect(columna).toMatch(/className="min-w-0(?: text-left)?"/);
    },
  );

  it.each(cortadas)(
    'D2 · línea $i: el grupo de icono y texto puede encoger',
    ({ grupo }) => {
      expect(grupo).toMatch(
        /className="flex min-w-0 (?:flex-1 )?items-center gap-3/,
      );
    },
  );

  it.each(cortadas)('D3 · línea $i: el icono no se aplasta', ({ icono }) => {
    expect(icono).toMatch(/className="shrink-0 p-2 bg-tarjeta rounded-lg"/);
  });
});
