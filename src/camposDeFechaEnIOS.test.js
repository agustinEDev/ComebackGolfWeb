import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Los campos de fecha no se salen de su tarjeta en el iPhone.
 *
 * Safari de iOS dibuja `input[type="date"]` y `datetime-local` como un control
 * nativo que IMPONE su ancho (318 px en un iPhone 14 donde el de texto mide 292):
 * ni `w-full` ni `min-w-0` ni `max-w-full` lo mueven; quitarle la apariencia
 * nativa, sí. Pasó en crear torneo (FE #648), en el modal de admin y, el 25 nov
 * 2026, en «Programar» de los hándicaps, que nadie había mirado en un iPhone.
 *
 * Ningún navegador de escritorio lo reproduce, ni WebKit: no se puede medir en
 * un test. Lo que se fija es que TODO campo de fecha de la aplicación lleva las
 * clases que lo arreglan, también el que se añada mañana.
 *
 *   #   caso                                   | qué tiene que pasar
 *   ----|------------------------------------------|---------------------------
 *   F1  cada `date` y `datetime-local` de src/  | `appearance-none`, `min-w-0`
 *                                               | y `max-w-full`
 *   F2  hay campos que mirar                    | si la búsqueda no encuentra
 *                                               | ninguno, el test no vale
 */
const RAIZ = resolve(process.cwd(), 'src');

const jsx = () =>
  readdirSync(RAIZ, { recursive: true, withFileTypes: true })
    .filter(
      (f) => f.isFile() && /\.jsx$/.test(f.name) && !/\.test\./.test(f.name),
    )
    .map((f) => resolve(f.parentPath ?? f.path, f.name));

/** Las etiquetas <input …> de fecha de un fichero, enteras. */
const camposDeFecha = (codigo) =>
  [...codigo.matchAll(/<input\b[^]*?\/>/g)]
    .map((m) => m[0])
    .filter((etiqueta) => /type="(date|datetime-local)"/.test(etiqueta));

describe('los campos de fecha en el iPhone', () => {
  const encontrados = jsx().flatMap((fichero) =>
    camposDeFecha(readFileSync(fichero, 'utf8')).map((etiqueta) => ({
      fichero: fichero.replace(`${RAIZ}/`, ''),
      etiqueta,
    })),
  );

  it('F2: la búsqueda encuentra los campos de fecha que hay', () => {
    expect(new Set(encontrados.map((c) => c.fichero))).toEqual(
      new Set([
        'components/admin/AdminEditCompetitionModal.jsx',
        'components/competition/HandicapsDeLaCompeticion.jsx',
        'components/competition/create/FechasDeLaCompeticion.jsx',
      ]),
    );
  });

  it('F1: todos van sin apariencia nativa y sin imponer su ancho', () => {
    for (const { fichero, etiqueta } of encontrados) {
      for (const clase of ['appearance-none', 'min-w-0', 'max-w-full']) {
        expect(etiqueta, `${fichero}: falta ${clase}`).toMatch(
          new RegExp(`className="[^"]*\\b${clase}\\b`),
        );
      }
    }
  });
});
