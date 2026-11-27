import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * La marca vieja no vuelve al repo (27 nov 2026, Agustín: «eliminemos todo lo
 * referente a la marca»).
 *
 *   M1 ningún fichero nombra la marca vieja, salvo las excepciones de abajo
 *   M2 el modo de juego Ryder (`ryderCup.team1Name`, `RYDER_CUP`, «estilo Ryder») se queda
 *   M3 el dominio viejo vive en UNA constante (`DOMINIO_ANTIGUO`, utils/mudanza.js); fuera
 *      de ella solo lo nombran el vigía de cabeceras, que lo comprueba en producción, y
 *      el título del aviso de mudanza, que explica el cambio de nombre
 *
 * Los números de issue anteriores a los repos nuevos (BE #…, FE #…) son de los repos
 * archivados.
 */

// Los nombres de la marca, se escriban como se escriban
const NOMBRE =
  /ryder[ _-]?cup[ _-]?(friends|am\b|web)|rydercupfriends|rydercupam|ryder ?cup (amateur )?manager|ryderclub/i;
// Las claves y los nombres técnicos, solo en minúsculas: `ryderCup.` es el modo de juego
const CLAVE = /rydercup[-:._]|\brydercup\b|RYDERCUP-/;

// Dónde se permite y qué: una expresión con la línea permitida, o `null` para el
// fichero entero (los que comprueban que la marca NO sale, y la historia)
const EXCEPCIONES = {
  // M3: la constante del dominio viejo
  'src/utils/mudanza.js':
    /^export const DOMINIO_ANTIGUO = 'rydercupfriends\.com';$/,
  // M3: el aviso de mudanza dice cómo se llamaba
  'src/i18n/locales/es/common.json':
    /^\s*"titulo": "RyderCupFriends ahora se llama /,
  'src/i18n/locales/en/common.json':
    /^\s*"titulo": "RyderCupFriends is now called /,
  // M3: el vigía comprueba las cabeceras de los dos dominios en producción
  '.github/scripts/cabeceras_de_produccion.json':
    /^\s*"https:\/\/www\.rydercupfriends\.com",$/,
  '.github/scripts/test_cabeceras_de_produccion.py':
    /"https:\/\/(www|api)\.rydercupfriends\.com"/,
  // M3: security.txt se sirve en los dos dominios y cada uno es Canonical
  'public/.well-known/security.txt':
    /^Canonical: https:\/\/www\.rydercupfriends\.com\/\.well-known\/security\.txt$/,
  '.github/scripts/test_endurecimiento.py':
    /"https:\/\/www\.rydercupfriends\.com\/\.well-known\/security\.txt"/,
  // La pasada única que rescata o borra lo guardado con el prefijo viejo
  'src/utils/clavesDeLaMarcaVieja.js': /rydercup-/,
  'src/utils/clavesDeLaMarcaVieja.test.js': null,
  // Comprueban que la marca vieja NO sale en los textos
  'src/i18n/nombreDeLaMarca.test.js': null,
  'src/pages/public/LegalNotice.test.jsx': null,
  'src/pages/public/textosLegales.test.jsx': null,
  // La historia: el CHANGELOG se empieza de nuevo en los repos nuevos
  'CHANGELOG.md': null,
  'src/sinLaMarcaVieja.test.js': null,
};

const raiz = process.cwd();
const ficheros = () =>
  execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f && EXCEPCIONES[f] !== null)
    .filter((f) => !/\.(png|jpe?g|webp|gif|ico|woff2?|ttf|pdf|zip)$/i.test(f));

const nombraLaMarca = (linea) => NOMBRE.test(linea) || CLAVE.test(linea);

describe('sin la marca vieja', () => {
  it('M1: ningún fichero del repo la nombra fuera de las excepciones', () => {
    const encontrados = [];
    for (const fichero of ficheros()) {
      let texto;
      try {
        texto = readFileSync(resolve(raiz, fichero), 'utf8');
      } catch {
        continue;
      }
      const permitida = EXCEPCIONES[fichero];
      texto.split('\n').forEach((linea, i) => {
        if (permitida?.test(linea)) return;
        if (nombraLaMarca(linea))
          encontrados.push(`${fichero}:${i + 1}: ${linea.trim()}`);
      });
    }
    expect(encontrados).toEqual([]);
  });

  it.each([
    'rydercupfriends.com',
    'RyderCupFriends',
    'RyderCupAm',
    'RyderCupWeb #880',
    'Ryder Cup Friends',
    'ryder-cup-friends',
    'Ryder Cup Manager',
    "localStorage.getItem('rydercup-ultimo-panel')",
    'rydercup:cola-vaciada',
    'RYDERCUP-FRONTEND-23',
  ])('M1: %s cuenta como la marca vieja', (texto) => {
    expect(nombraLaMarca(texto)).toBe(true);
  });

  it.each([
    'competition.ryderCup.team1Name',
    'RYDER_CUP',
    'TournamentType.RYDER_CUP',
    'el formato estilo Ryder',
    'ryder_cup_setup',
  ])('M2: %s es el modo de juego, no la marca', (texto) => {
    expect(nombraLaMarca(texto)).toBe(false);
  });

  it('M3: el dominio viejo, solo en su constante', () => {
    const mudanza = readFileSync(resolve(raiz, 'src/utils/mudanza.js'), 'utf8');
    const lineas = mudanza.split('\n').filter((l) => /rydercupfriends/.test(l));
    expect(lineas).toEqual([
      "export const DOMINIO_ANTIGUO = 'rydercupfriends.com';",
    ]);
  });
});
