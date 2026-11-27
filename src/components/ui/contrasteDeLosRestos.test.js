import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Lo que se leía mal en la pasada por todas las pantallas (27 nov 2026):
 *
 *   caso | dónde                         | antes                    | ahora
 *   -----|-------------------------------|--------------------------|------------------------
 *   R1   | contador de las pestañas de   | gris sobre la pestaña    | el color de su pestaña
 *        | Amigos                        | activa en lima (1,6:1 en oscuro)   |
 *   R2   | «(Opcional)» del registro     | gris claro (3,1:1)       | tinta suave
 *   R3   | «Selecciona tu país» y el     | gris claro (3,9:1)       | tinta suave
 *        | prefijo de cada país          |                          |
 */
const fuente = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

describe('contraste de lo que quedaba', () => {
  it('R1 el contador de las pestañas de Amigos no fija su propio color', () => {
    const contador = fuente('src/pages/player/FriendsPage.jsx').match(
      /<span className="([^"]*min-w-\[1\.25rem\][^"]*)">/,
    );
    expect(contador).not.toBeNull();
    // Ninguna clase de color de texto: solo el tamaño (`text-xs`)
    expect(
      contador[1].split(/\s+/).filter((clase) => clase.startsWith('text-')),
    ).toEqual(['text-xs']);
  });

  it('R2 el registro sin grises claros, con «(Opcional)» en tinta suave', () => {
    const registro = fuente('src/pages/Register.jsx');
    // En ningún orden de clases ni con ningún prefijo (placeholder:, hover:)
    expect(registro).not.toMatch(/\btext-gray-[1-4]00\b/);
    expect(
      registro.match(/<span className="text-tinta-suave font-normal">/g),
    ).toHaveLength(2);
  });

  it('R3 el país sin grises claros; el prefijo de la elegida, sin color propio', () => {
    const pais = fuente('src/components/ui/CountryAutocomplete.jsx');
    expect(pais).not.toMatch(/\btext-gray-[1-4]00\b/);
    expect(pais).toMatch(
      /selectedCountry \? 'text-gray-900' : 'text-tinta-suave'/,
    );
    // Si la elegida pintara tinta suave, competiría con su Forest (1,3:1)
    expect(pais).toMatch(/country\.code === value \? '' : 'text-tinta-suave'/);
  });
});
