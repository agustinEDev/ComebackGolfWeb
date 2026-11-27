import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * En Actividad, lo que aún no se ha visto lleva otro contorno que lo ya visto,
 * además de la marca «Nuevo». Al pasar las tarjetas a los colores de la marca
 * (26 nov 2026) los dos bordes se convirtieron en el mismo y la distinción se
 * perdió sin que ningún test lo notara.
 *
 *   #   tarjeta                   | sin ver            | ya vista
 *   ----|--------------------------|--------------------|------------------
 *   N1  un logro o un aviso       | contorno de tinta  | el de una tarjeta
 *   N2  una solicitud de amistad  | contorno de tinta  | el de una tarjeta
 */
const fuente = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

describe('Lo nuevo de Actividad se distingue de lo ya visto', () => {
  it.each([
    ['N1', 'src/components/feed/ActivityEventCard.jsx', 'tarjeta.nueva'],
    ['N2', 'src/components/feed/FriendRequestCard.jsx', 'solicitud.nueva'],
  ])('%s: %s da un contorno distinto según %s', (_caso, ruta, condicion) => {
    const m = fuente(ruta).match(
      new RegExp(
        `${condicion.replace('.', '\\.')}\\s*\\?\\s*'([\\w-]+)'\\s*:\\s*'([\\w-]+)'`,
      ),
    );

    expect(m, 'la condición sigue en el className').not.toBeNull();
    const [, sinVer, vista] = m;
    expect(sinVer).toBe('border-tinta');
    expect(vista).toBe('border-contorno');
    expect(sinVer).not.toBe(vista);
  });
});
