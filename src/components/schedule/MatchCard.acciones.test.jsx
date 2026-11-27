import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchCard from './MatchCard';
import MatchStatus from '../../domain/value_objects/MatchStatus';

/**
 * Las acciones de un partido (ComeBack Golf, 26 nov 2026): una sola forma y
 * tres tipos, en vez de un color por botón.
 *
 *   #   acción                      | tipo
 *   ----|---------------------------|------------------------------------
 *   A1  iniciar, completar, anotar  | principal: rellena, la que toca ahora
 *   A2  ver detalle, reasignar      | secundaria: contorno de tinta
 *   A3  walkover                    | de aviso: contorno en su color
 *   A4  todas                       | la misma forma, la de la marca
 *   A5  cada una                    | sigue llamando a lo suyo
 *   A6  quien no gestiona           | solo ver detalle y, en juego, anotar
 */
const t = (clave) => clave;

const pinta = (status, props = {}) => {
  const acciones = {
    onStartMatch: vi.fn(),
    onCompleteMatch: vi.fn(),
    onDeclareWalkover: vi.fn(),
    onReassignPlayers: vi.fn(),
    onViewDetail: vi.fn(),
    onScoreMatch: vi.fn(),
  };
  render(
    <MatchCard
      match={{
        id: 'm1',
        matchNumber: 1,
        status,
        teamAPlayers: [],
        teamBPlayers: [],
      }}
      matchFormat="SINGLES"
      canManage
      playerNameMap={new Map()}
      playerHandicapMap={new Map()}
      teamNames={{ teamA: 'A', teamB: 'B' }}
      t={t}
      {...acciones}
      {...props}
    />,
  );
  return acciones;
};

const boton = (clave) => screen.getByRole('button', { name: clave });
const clases = (clave) => boton(clave).className.split(/\s+/);

const PRINCIPAL = ['bg-contraste', 'text-sobre-contraste'];
const SECUNDARIA = ['border-tinta', 'bg-fondo', 'text-tinta'];
const DE_AVISO = ['border-aviso', 'bg-fondo', 'text-aviso'];

describe('MatchCard · las acciones', () => {
  it('A1: iniciar, completar y anotar van rellenas', () => {
    pinta(MatchStatus.SCHEDULED);
    expect(clases('matches.startMatch')).toEqual(
      expect.arrayContaining(PRINCIPAL),
    );
  });

  it('A1b: en juego, completar y anotar', () => {
    pinta(MatchStatus.IN_PROGRESS);

    expect(clases('matches.completeMatch')).toEqual(
      expect.arrayContaining(PRINCIPAL),
    );
    expect(clases('matches.score')).toEqual(expect.arrayContaining(PRINCIPAL));
  });

  it('A2: ver detalle y reasignar, con contorno de tinta y sin relleno de contraste', () => {
    pinta(MatchStatus.SCHEDULED);

    for (const clave of ['matches.viewDetail', 'matches.reassignPlayers']) {
      expect(clases(clave)).toEqual(expect.arrayContaining(SECUNDARIA));
      expect(clases(clave)).not.toContain('bg-contraste');
    }
  });

  it('A3: el walkover, en el color de aviso y sin rellenar', () => {
    pinta(MatchStatus.SCHEDULED);

    expect(clases('matches.walkover')).toEqual(
      expect.arrayContaining(DE_AVISO),
    );
    expect(clases('matches.walkover')).not.toContain('bg-aviso');
  });

  it('A4: todas con la forma de la marca y ningún color suelto', () => {
    pinta(MatchStatus.IN_PROGRESS);

    for (const b of screen.getAllByRole('button')) {
      const c = b.className.split(/\s+/);
      expect(c).toContain('rounded-boton');
      // Ninguna clase de la escala antigua, de la familia que sea: todas
      // llevan su tono en número (`bg-orange-500`, `text-gray-700`…)
      expect(
        c.filter((x) => /(?:bg|text|border|ring)-[a-z]+-\d{2,3}\b/.test(x)),
      ).toEqual([]);
      // Y alto de dedo, como el resto de botones de la app
      expect(c).toContain('min-h-11');
    }
  });

  it.each([
    [MatchStatus.SCHEDULED, 'matches.startMatch', 'onStartMatch', 'm1'],
    [MatchStatus.IN_PROGRESS, 'matches.completeMatch', 'onCompleteMatch', 'm1'],
    [MatchStatus.IN_PROGRESS, 'matches.score', 'onScoreMatch', 'm1'],
    [MatchStatus.SCHEDULED, 'matches.viewDetail', 'onViewDetail', 'm1'],
    [MatchStatus.IN_PROGRESS, 'matches.viewDetail', 'onViewDetail', 'm1'],
  ])('A5: en %s, «%s» llama a %s', (status, clave, accion, id) => {
    const acciones = pinta(status);

    fireEvent.click(boton(clave));

    expect(acciones[accion]).toHaveBeenCalledWith(id);
  });

  it('A5b: reasignar recibe el partido entero', () => {
    const acciones = pinta(MatchStatus.SCHEDULED);

    fireEvent.click(boton('matches.reassignPlayers'));

    expect(acciones.onReassignPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1' }),
    );
  });

  it.each([MatchStatus.SCHEDULED, MatchStatus.IN_PROGRESS])(
    'A5c: en %s, el walkover recibe el partido y nadie más se da por llamado',
    (status) => {
      const acciones = pinta(status);

      fireEvent.click(boton('matches.walkover'));

      expect(acciones.onDeclareWalkover).toHaveBeenCalledTimes(1);
      expect(acciones.onDeclareWalkover).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'm1' }),
      );
      for (const otra of [
        'onStartMatch',
        'onCompleteMatch',
        'onReassignPlayers',
        'onViewDetail',
        'onScoreMatch',
      ])
        expect(acciones[otra]).not.toHaveBeenCalled();
    },
  );

  it('A6: quien no gestiona solo ve el detalle y, en juego, anotar', () => {
    const acciones = pinta(MatchStatus.IN_PROGRESS, { canManage: false });

    expect(
      screen.getAllByRole('button').map((b) => b.textContent.trim()),
    ).toEqual(['matches.viewDetail', 'matches.score']);
    // Son otros botones que los de quien gestiona: también llaman a lo suyo
    fireEvent.click(boton('matches.viewDetail'));
    fireEvent.click(boton('matches.score'));
    expect(acciones.onViewDetail).toHaveBeenCalledWith('m1');
    expect(acciones.onScoreMatch).toHaveBeenCalledWith('m1');
  });

  it('A6b: con el partido sin empezar, quien no gestiona solo ve el detalle', () => {
    pinta(MatchStatus.SCHEDULED, { canManage: false });

    expect(
      screen.getAllByRole('button').map((b) => b.textContent.trim()),
    ).toEqual(['matches.viewDetail']);
  });
});
