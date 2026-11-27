import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import QuickMatchHoleSelector from '../quick_match/QuickMatchHoleSelector';
import RejillaDeHoyos from './RejillaDeHoyos';
import { CLASE_DE_ANTERIOR, CLASE_DE_SIGUIENTE } from './clasesDeNavegar';

/**
 * La rejilla de hoyos es UNA sola pieza para las tres anotaciones (Agustín, 26
 * nov 2026). Estaba copiada en el selector de los partidos y en el de la
 * partida rápida, y un arreglo del primero (el aro del hoyo en juego pisaba al
 * hoyo de debajo, FE #1257) no llegó al segundo. Cada selector solo decide el
 * ESTADO de cada hoyo; el dibujo es de la rejilla.
 *
 *   #   qué                                        | por qué
 *   ----|-------------------------------------------|------------------------------
 *   R1  ningún selector pinta su propia rejilla     | dos copias se separan solas
 *   R2  rápida: el hoyo en juego, en lima y con aro | como en los partidos
 *   R3  rápida: las dos filas separadas             | el aro sobresale 4 px
 *   R4  rápida: los demás responden al puntero      | y no llevan lima ni aro
 *   R5  rápida: cada estado conserva su forma, y su | vacío, a medias y completo
 *       nombre en `data-estado`                     | se distinguen sin el color
 *   R6  rápida: el hoyo en juego conserva la forma  | a medias y completo no se
 *       de su estado                                | confunden al estar encima
 *   R7  las casillas de solo contorno llevan el    | sin relleno, la marca de agua
 *       relleno del fondo; la cerrada, el suyo     | asomaba por dentro del hoyo
 *   R8  el hoyo en juego se anuncia como el actual  | el aro y la lima solo se ven
 *       y solo él                                   |
 *   A1  «Anterior» lleva relleno del fondo          | transparente dejaba ver la
 *                                                   | marca de agua por debajo
 *   A2  «Siguiente» sigue en lima, y desactivado se | no cambia
 *       atenúa entero                               |
 */
const leer = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const clasesDe = (id) =>
  screen.getByTestId(id).className.split(/\s+/).filter(Boolean);
const rapida = (extra = {}) =>
  render(
    <QuickMatchHoleSelector
      currentHole={5}
      onSelect={() => {}}
      expectedScoreIdGroups={[['p-1'], ['p-2']]}
      holeScores={[
        { holeNumber: 3, participantId: 'p-1', score: 4 },
        { holeNumber: 3, participantId: 'p-2', score: 5 },
        { holeNumber: 4, participantId: 'p-1', score: 4 },
      ]}
      {...extra}
    />,
  );

describe('la rejilla de hoyos, una sola', () => {
  it('R1: ningún selector pinta su propia rejilla', () => {
    for (const ruta of [
      'src/components/scoring/HoleSelector.jsx',
      'src/components/quick_match/QuickMatchHoleSelector.jsx',
    ]) {
      const fuente = leer(ruta);
      expect(fuente).toMatch(/<RejillaDeHoyos\b/);
      // Ni rejilla ni aro propios (el punto de «sin guardar» sí lleva su reborde)
      expect(fuente).not.toMatch(/grid-cols|gap-|ring-2|ring-offset|bg-lime/);
    }
  });

  it('R2: en la rápida, el hoyo en juego va en lima y con aro', () => {
    rapida();

    const clases = clasesDe('quick-match-hole-btn-5');
    expect(clases).toEqual(
      expect.arrayContaining([
        'bg-lime',
        'text-forest',
        'ring-2',
        'ring-tinta',
        'ring-offset-2',
        'ring-offset-fondo',
      ]),
    );
    expect(clases.some((c) => c.includes('hover:'))).toBe(false);
  });

  it('R3: en la rápida, las dos filas se separan para el aro', () => {
    rapida();

    const clases = clasesDe('quick-match-hole-selector');
    expect(clases).toContain('gap-y-2.5');
    expect(clases).not.toContain('gap-1');
  });

  it('R4: en la rápida, los demás responden al puntero y no llevan lima ni aro', () => {
    rapida();

    const clases = clasesDe('quick-match-hole-btn-1');
    expect(clases).not.toContain('bg-lime');
    expect(clases).not.toContain('ring-2');
    expect(clases).toContain('enabled:hover:bg-contraste');
  });

  it('R5: en la rápida, cada estado conserva su forma y su nombre', () => {
    rapida();

    const boton = (n) => screen.getByTestId(`quick-match-hole-btn-${n}`);
    expect(boton(1).dataset.estado).toBe('empty');
    expect(boton(4).dataset.estado).toBe('partial');
    expect(boton(3).dataset.estado).toBe('complete');
    expect(clasesDe('quick-match-hole-btn-1')).toEqual(
      expect.arrayContaining(['border', 'border-borde', 'text-tinta-suave']),
    );
    expect(clasesDe('quick-match-hole-btn-4')).toEqual(
      expect.arrayContaining(['border-[1.5px]', 'border-tinta', 'text-tinta']),
    );
    expect(clasesDe('quick-match-hole-btn-3')).toEqual(
      expect.arrayContaining(['bg-contraste', 'text-sobre-contraste']),
    );
  });

  it('R6: en la rápida, el hoyo en juego conserva la forma de su estado', () => {
    const contorno = (hoyo) => {
      const { unmount } = rapida({ currentHole: hoyo });
      const c = clasesDe(`quick-match-hole-btn-${hoyo}`)
        .filter((x) => x.startsWith('border'))
        .sort()
        .join(' ');
      unmount();
      return c;
    };

    expect(contorno(1)).toBe('');
    expect(contorno(4)).toBe('border-[1.5px] border-forest');
    expect(contorno(3)).toBe('border-[3px] border-forest');

    // Y completo en juego, sin el relleno de su estado bajo la lima
    rapida({ currentHole: 3 });
    expect(clasesDe('quick-match-hole-btn-3')).not.toContain('bg-contraste');
  });
});

describe('la rejilla, por dentro', () => {
  const ESTADOS = { 1: 'empty', 2: 'pending', 3: 'validated', 4: 'mismatch' };
  const pintar = (enJuego = 9) =>
    render(
      <RejillaDeHoyos
        currentHole={enJuego}
        onSelect={() => {}}
        estadoDe={(hoyo) => ESTADOS[hoyo] ?? 'empty'}
        testId="rejilla"
        testIdDelHoyo={(hoyo) => `hoyo-${hoyo}`}
      />,
    );

  it('R7: las casillas de solo contorno llevan el relleno del fondo', () => {
    pintar();

    for (const hoyo of [1, 2, 4]) {
      const clases = clasesDe(`hoyo-${hoyo}`);
      expect(clases).toContain('bg-fondo');
      expect(clases).not.toContain('bg-transparent');
      // Y siguen respondiendo al puntero, que va después y gana al relleno
      expect(clases).toContain('enabled:hover:bg-contraste');
    }
    // La cerrada ya tenía el suyo, y no lleva los dos
    expect(clasesDe('hoyo-3')).toContain('bg-contraste');
    expect(clasesDe('hoyo-3')).not.toContain('bg-fondo');
  });

  it('R7b: en juego manda la lima, sin el relleno del fondo debajo', () => {
    for (const hoyo of [1, 2, 3, 4]) {
      const { unmount } = pintar(hoyo);
      const clases = clasesDe(`hoyo-${hoyo}`);
      expect(clases).toContain('bg-lime');
      expect(clases).not.toContain('bg-fondo');
      expect(clases).not.toContain('bg-contraste');
      unmount();
    }
  });

  it('R8: el hoyo en juego se anuncia como el actual, y solo él', () => {
    pintar(2);

    expect(screen.getByTestId('hoyo-2')).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(
      screen
        .getAllByRole('button')
        .filter((b) => b.hasAttribute('aria-current')),
    ).toHaveLength(1);
  });
});

describe('los botones de moverse entre hoyos', () => {
  it('A1: «Anterior» lleva el relleno del fondo, no es transparente', () => {
    const clases = CLASE_DE_ANTERIOR.split(/\s+/);
    expect(clases).toContain('bg-fondo');
    expect(clases).not.toContain('bg-transparent');
    expect(clases.some((c) => /^bg-fondo\//.test(c))).toBe(false);
    // Desactivado se apagan la letra y el contorno; el relleno sigue opaco
    expect(clases).toEqual(
      expect.arrayContaining([
        'disabled:border-tinta/40',
        'disabled:text-tinta/40',
      ]),
    );
    expect(clases.some((c) => /^disabled:opacity/.test(c))).toBe(false);
    // Sigue siendo la secundaria: contorno de tinta
    expect(clases).toEqual(
      expect.arrayContaining(['border-tinta', 'text-tinta']),
    );
  });

  it('A2: «Siguiente» sigue en lima', () => {
    expect(CLASE_DE_SIGUIENTE.split(/\s+/)).toEqual(
      expect.arrayContaining(['bg-lime', 'text-forest', 'disabled:opacity-40']),
    );
  });
});
