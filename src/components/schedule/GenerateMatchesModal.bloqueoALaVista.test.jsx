import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GenerateMatchesModal from './GenerateMatchesModal';

/**
 * S1 (23 nov 2026, coordinador): cuando aparece o cambia el motivo por el que
 * no se generaron, el modal lleva su recuadro a la vista. A 360 px, con los
 * emparejamientos a mano, se pulsa «Generar» desde abajo y el recuadro, que
 * va arriba, quedaba fuera. Se desplaza solo la caja del modal: ni la página
 * de detrás ni el foco (el `role="alert"` ya lo anuncia).
 *
 *   antes            | después           | recuadro    | caja
 *   -----------------|-------------------|-------------|------------------------
 *   sin motivo       | motivo            | por encima  | sube hasta 16 px de él
 *   motivo A         | motivo B          | por encima  | sube otra vez
 *   (al abrir)       | motivo            | a la vista  | quieta
 *   sin motivo       | motivo            | a la vista  | quieta
 *   motivo A         | el mismo A        | por encima  | quieta (no salta al
 *                    |                   |             | volver a pintar)
 *   motivo B         | igual, otro objeto| por encima  | quieta (relectura)
 *   motivo B         | otro jugador      | por encima  | sube otra vez
 *   motivo B         | B, otra respuesta | por encima  | sube, y el aviso se
 *                    | (vez + 1)         |             | vuelve a anunciar
 *
 * Se mide con `offsetTop` dentro de la caja (que es `relative`), no con
 * `getBoundingClientRect`: la animación de entrada escala la caja y falsea
 * las medidas en pantalla (/code-review).
 */

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, ...rest }) => {
      void initial;
      void animate;
      void transition;
      return <div {...rest}>{children}</div>;
    },
  },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave }),
}));

const props = {
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  round: { id: 'r-1', matchFormat: 'SINGLES' },
  enrollments: [],
  teamAssignment: { teamAPlayerIds: ['p1'], teamBPlayerIds: ['p2'] },
  isProcessing: false,
  teamNames: { teamA: 'A', teamB: 'B' },
  playerNameMap: new Map(),
  setupMode: 'MANUAL',
  t: (clave) => clave,
};

const MOTIVO_A = { reason: 'NO_TEAMS', players: [] };
const MOTIVO_B = {
  reason: 'NOT_ENOUGH_PLAYERS',
  players: [
    { userId: 'x1', name: 'Xavier', missing: 'ENROLLMENT', teeColor: null },
  ],
};

// Dentro de la caja, el recuadro empieza a 80 px (bajo la cabecera), salvo
// que el test diga otra cosa
let offsetDelRecuadro;
let medidaEnPantalla;
let scrollIntoView;
let scrollTo;
beforeEach(() => {
  offsetDelRecuadro = 80;
  vi.spyOn(
    globalThis.HTMLElement.prototype,
    'offsetTop',
    'get',
  ).mockImplementation(function () {
    return this.dataset?.testid === 'bloqueo-de-partidos'
      ? offsetDelRecuadro
      : 0;
  });
  // Escalada por la animación: si se usara, daría otro desplazamiento
  medidaEnPantalla = vi
    .spyOn(globalThis.Element.prototype, 'getBoundingClientRect')
    .mockImplementation(function () {
      const top = this.dataset?.testid === 'bloqueo-de-partidos' ? -1000 : 0;
      return {
        top,
        bottom: top,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: top,
        toJSON: () => ({}),
      };
    });
  scrollIntoView = vi.fn();
  globalThis.Element.prototype.scrollIntoView = scrollIntoView;
  scrollTo = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.Element.prototype.scrollIntoView;
});

const modal = (bloqueo, vez = 0, extra = {}) => (
  <GenerateMatchesModal
    isOpen
    {...props}
    {...extra}
    bloqueo={bloqueo}
    vezDelBloqueo={vez}
  />
);
const pinta = (bloqueo, vez) => {
  const vista = render(modal(bloqueo, vez));
  const caja = screen.getByTestId('generate-matches-modal');
  caja.scrollTop = 500;
  return { ...vista, caja };
};

describe('GenerateMatchesModal · el motivo, a la vista', () => {
  it('S1: aparece por encima de lo visible: la caja sube hasta él', () => {
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    // El recuadro, a 16 px del borde de arriba de la caja
    expect(caja.scrollTop).toBe(80 - 16);
  });

  it('S1: cambia a otro: vuelve a subir', () => {
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_A, 1));
    caja.scrollTop = 500;
    rerender(modal(MOTIVO_B, 2));
    expect(caja.scrollTop).toBe(64);
  });

  it('S1: sin mover la página de detrás ni el foco', () => {
    const { rerender } = pinta(null);
    const enfocado = document.activeElement;
    rerender(modal(MOTIVO_B, 1));
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(enfocado);
  });

  it('S1: al abrir con uno guardado, arriba del todo, no se mueve', () => {
    render(modal(MOTIVO_A));
    expect(screen.getByTestId('generate-matches-modal').scrollTop).toBe(0);
  });

  it('S1: si ya está a la vista, la caja se queda quieta', () => {
    offsetDelRecuadro = 600;
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    expect(caja.scrollTop).toBe(500);
  });

  it('S1: el mismo motivo pintado otra vez no hace saltar la caja', () => {
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_A, 1));
    caja.scrollTop = 500;
    rerender(modal(MOTIVO_A, 1, { isProcessing: true }));
    expect(caja.scrollTop).toBe(500);
  });

  it('S1: el mismo motivo recién leído (otro objeto igual) tampoco la hace saltar', () => {
    // Cada relectura de la agenda mapea de nuevo: mismo contenido, otro objeto
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    caja.scrollTop = 500;
    rerender(modal(globalThis.structuredClone(MOTIVO_B), 1));
    expect(caja.scrollTop).toBe(500);
  });

  it('S1: el mismo motivo con otro jugador sí es otro: vuelve a subir', () => {
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    caja.scrollTop = 500;
    rerender(
      modal(
        {
          ...MOTIVO_B,
          players: [{ ...MOTIVO_B.players[0], userId: 'x2', name: 'Yago' }],
        },
        1,
      ),
    );
    expect(caja.scrollTop).toBe(64);
  });

  it('S1: otra respuesta con el mismo motivo lo trae otra vez y lo vuelve a anunciar', () => {
    // Reintentar desde abajo y recibir lo mismo: sin esto, no pasaba nada visible
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    const primero = screen.getByRole('alert');
    caja.scrollTop = 500;
    rerender(modal(globalThis.structuredClone(MOTIVO_B), 2));
    expect(caja.scrollTop).toBe(64);
    // Un `role="alert"` nuevo: el lector lo anuncia de nuevo
    expect(screen.getByRole('alert')).not.toBe(primero);
  });

  it('S1: mide dentro de la caja, sin las medidas escaladas de la pantalla', () => {
    offsetDelRecuadro = 600;
    const { rerender, caja } = pinta(null);
    rerender(modal(MOTIVO_B, 1));
    expect(caja.scrollTop).toBe(500);
    expect(medidaEnPantalla).not.toHaveBeenCalled();
    // La caja es la referencia de `offsetTop` del recuadro
    expect(caja.className).toMatch(/(^| )relative( |$)/);
  });
});
