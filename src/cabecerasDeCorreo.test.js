import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Las cabeceras de los correos: una imagen ya compuesta por tipo de correo (el
 * logo sobre un dibujo de la marca), en claro y en oscuro, que el backend
 * nombra una a una como `<sitio>/images/correo/cabecera-<dibujo>.png` y
 * `…-oscuro.png` (su `email_layout.py`, ADR-055). La oscura la enseña Mail de
 * Apple cuando el dispositivo está en oscuro.
 *
 *   #   qué                                     | por qué
 *   ----|-----------------------------------------|--------------------------------
 *   C1  están las doce del backend, y solo esas | una que falte es un correo sin
 *                                               | cabeza; no hay contrato entre
 *                                               | repositorios, así que al añadir
 *                                               | un dibujo allí se añade aquí
 *   C2  miden 1120 × 368                        | el correo fija el ancho (560 al
 *                                               | doble): otra proporción lo deforma
 *   C3  solo llevan sus trozos de imagen        | sin metadatos de quien las hizo
 *   C4  cuelgan de /images/                     | la única carpeta que se sirve con
 *                                               | CORP cross-origin: desde otra, un
 *                                               | webmail no las podría cargar
 *   C5  fuera del precache y de la navegación   | no las usa la app; y abrir una en
 *       del service worker                      | una pestaña no debe dar la app
 */
const CARPETA = 'public/images/correo';
const DIBUJOS = ['bunker', 'carrito', 'gorra', 'guante', 'palos', 'tarjeta'];
const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta));
const png = () =>
  readdirSync(resolve(process.cwd(), CARPETA)).filter((f) =>
    f.endsWith('.png'),
  );

describe('las cabeceras de los correos', () => {
  it('C1: están las doce que pide el backend (clara y oscura), y ninguna más', () => {
    expect(png().sort()).toEqual(
      DIBUJOS.flatMap((d) => [
        `cabecera-${d}-oscuro.png`,
        `cabecera-${d}.png`,
      ]).sort(),
    );
  });

  it('C1: la oscura no es una copia de la clara', () => {
    for (const dibujo of DIBUJOS) {
      const clara = leer(`${CARPETA}/cabecera-${dibujo}.png`);
      const oscura = leer(`${CARPETA}/cabecera-${dibujo}-oscuro.png`);

      expect(oscura.equals(clara), dibujo).toBe(false);
    }
  });

  it('C2: todas miden 1120 × 368', () => {
    for (const fichero of png()) {
      const imagen = leer(`${CARPETA}/${fichero}`);

      expect(
        [imagen.readUInt32BE(16), imagen.readUInt32BE(20)],
        fichero,
      ).toEqual([1120, 368]);
    }
  });

  it('C3: son PNG con solo sus trozos de imagen', () => {
    const PERMITIDOS = new Set(['IHDR', 'PLTE', 'tRNS', 'IDAT', 'IEND']);

    for (const fichero of png()) {
      const imagen = leer(`${CARPETA}/${fichero}`);
      const trozos = [];
      // 8 bytes de firma; cada trozo: 4 de longitud, 4 de tipo, datos, 4 de CRC
      for (let i = 8; i < imagen.length;) {
        trozos.push(imagen.toString('latin1', i + 4, i + 8));
        i += 12 + imagen.readUInt32BE(i);
      }

      expect(
        trozos.filter((t) => !PERMITIDOS.has(t)),
        fichero,
      ).toEqual([]);
      expect(trozos.at(-1), fichero).toBe('IEND');
    }
  });

  it('C4: se sirven desde /images/, que es lo que nginx abre a otros orígenes', () => {
    expect(CARPETA.startsWith('public/images/')).toBe(true);
    expect(leer('nginx.conf').toString()).toMatch(
      /~\^\/images\/\s+cross-origin;/,
    );
  });

  it('C5: ni se precachean ni las contesta la navegación del service worker', () => {
    const config = leer('vite.config.js').toString();

    expect(config).toContain("'images/correo/**',");
    const lista = config.match(
      /navigateFallbackDenylist: \[([\s\S]*?)\n\s*\],/,
    )[1];
    expect(lista).toContain('/^\\/images\\/correo\\//');
  });
});
