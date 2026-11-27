import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import NextMatchBanner from './NextMatchBanner';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) =>
      options?.opponents
        ? `${key}:${options.opponents}`
        : options
          ? `${key} ${JSON.stringify(options)}`
          : key,
    i18n: { language: 'es' },
  }),
}));

const match = {
  id: 'match-1',
  competitionName: 'Ryder Cup Amigos',
  matchFormat: 'SINGLES',
  roundDate: '2026-08-10',
  sessionType: 'MORNING',
  golfCourseName: 'St Andrews',
  partnerNames: [],
  opponentNames: ['Ana Soto'],
};

const renderBanner = (props = {}) =>
  render(
    <MemoryRouter>
      <NextMatchBanner {...props} />
    </MemoryRouter>,
  );

describe('NextMatchBanner', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the tournament and who the match is against', () => {
    renderBanner({ match });

    expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
      'Ryder Cup Amigos',
    );
    expect(screen.getByText('nextMatch.versus:Ana Soto')).toBeInTheDocument();
  });

  it('shows where and when it is played', () => {
    renderBanner({ match });

    expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
      'St Andrews',
    );
    expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
      'nextMatch.session.MORNING',
    );
  });

  it('opens the scoring page for that match', () => {
    renderBanner({ match });

    fireEvent.click(screen.getByTestId('next-match-banner'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/player/matches/match-1/scoring',
    );
  });

  describe('una partida de stroke play (FE #824, PR 7)', () => {
    const partida = {
      id: 'g-1',
      esPartidaDeFranja: true,
      competitionId: 'c-1',
      competitionName: 'Medal de octubre',
      roundDate: '2026-08-10',
      sessionType: 'MORNING',
      teeTime: '08:10',
      matchNumber: 2,
      partnerNames: ['Ana', 'Bea'],
    };

    it('12 (QA del 11 oct 2026): si le pasaron a esta partida, lo dice con su hora', () => {
      renderBanner({ match: { ...partida, broughtIn: true } });

      expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
        'nextMatch.broughtIn {"numero":2}',
      );
    });

    it('12: si no, no', () => {
      renderBanner({ match: partida });

      expect(screen.getByTestId('next-match-banner')).not.toHaveTextContent(
        'nextMatch.broughtIn',
      );
    });

    it('se nombra como partida, con su hora y sus compañeros', () => {
      renderBanner({ match: partida });

      const banner = screen.getByTestId('next-match-banner');
      expect(banner).toHaveTextContent('nextMatch.teeGroup {"numero":2}');
      expect(banner).toHaveTextContent('Medal de octubre');
      expect(banner).toHaveTextContent('08:10');
      expect(banner).toHaveTextContent(
        'nextMatch.withPartners {"partners":"Ana, Bea"}',
      );
      expect(banner).not.toHaveTextContent('nextMatch.versus');
    });

    it('QA de la release: una compañera retirada, marcada, como en la tarjeta', () => {
      renderBanner({
        match: {
          ...partida,
          partners: [
            { name: 'Ana', withdrawn: true, teeGender: 'FEMALE' },
            { name: 'Bea', withdrawn: false, teeGender: null },
          ],
        },
      });

      expect(screen.getByTestId('next-match-banner').textContent).toContain(
        'upcomingMatches.withdrawnPartner {\\"nombre\\":\\"Ana\\",\\"context\\":\\"female\\"}, Bea',
      );
    });

    it('la cabecera dice «tu próxima partida» (pasada)', () => {
      renderBanner({ match: partida });

      expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
        'nextMatch.labelTeeGroup',
      );
      expect(screen.getByTestId('next-match-banner')).not.toHaveTextContent(
        /nextMatch\.label$|nextMatch\.label[^T]/,
      );
    });

    it('lleva a anotar su partida, con la competición', () => {
      renderBanner({ match: partida });

      fireEvent.click(screen.getByTestId('next-match-banner'));

      expect(mockNavigate).toHaveBeenCalledWith(
        '/player/groups/g-1/scoring?competition=c-1',
      );
    });
  });

  /**
   * FE #615: sin poder preguntar no se sabe si hay partido. Ofrecer «¿partido
   * improvisado?» ahí es decir que no lo hay, a quien quizá lo tiene en una hora.
   */
  describe('when the matches could not be asked for', () => {
    it('says so instead of offering a quick match', () => {
      renderBanner({ match: null, sinRespuesta: true });

      expect(screen.getByTestId('next-match-sin-respuesta')).toHaveTextContent(
        'nextMatch.sinRespuestaTitle',
      );
    });

    it('still shows a match it remembers', () => {
      renderBanner({ match, sinRespuesta: true });

      expect(screen.getByTestId('next-match-banner')).toHaveTextContent(
        'Ryder Cup Amigos',
      );
    });

    it('a remembered match says it may be out of date', () => {
      // Lo mismo que avisa «Mis próximos partidos»: si el calendario cambió, el
      // banner enseña un partido que ya no toca como si fuera el de ahora
      renderBanner({ match, desdeMemoria: true });

      expect(screen.getByTestId('next-match-desde-memoria')).toHaveTextContent(
        'nextMatch.desdeMemoria',
      );
    });

    it('a fresh match does not', () => {
      renderBanner({ match });

      expect(
        screen.queryByTestId('next-match-desde-memoria'),
      ).not.toBeInTheDocument();
    });
  });

  describe('with no match scheduled', () => {
    /**
     * Sin próximo partido, el hueco no pinta nada (Agustín, 26 nov 2026). Antes
     * se convertía en una tarjeta «¿Partido improvisado?» que llevaba a crear
     * una partida rápida, pero justo debajo está el botón lima de «Partida
     * rápida», que hace lo mismo: eran dos llamadas seguidas a la misma cosa.
     */
    it('paints nothing: the quick match button right below already does it', () => {
      const { container } = renderBanner({ match: null });

      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByTestId('next-match-banner')).not.toBeInTheDocument();
    });

    it.each(['es', 'en'])('its texts are gone from the %s locale', (idioma) => {
      const textos = JSON.parse(
        readFileSync(
          resolve(process.cwd(), `src/i18n/locales/${idioma}/dashboard.json`),
          'utf8',
        ),
      ).nextMatch;

      expect(textos).not.toHaveProperty('emptyTitle');
      expect(textos).not.toHaveProperty('emptyDescription');
      expect(textos).not.toHaveProperty('emptyAction');
    });
  });

  it('reserves no gap while loading: nothing jumps for who has no match', () => {
    // Mientras se pregunta no se reserva sitio (Agustín, 26 nov 2026). Antes
    // había un hueco de la altura del banner, que al saberse que no hay partido
    // —lo normal— desaparecía, y el botón de partida rápida y todo lo de
    // debajo subían de golpe unos 100 px justo cuando se iban a tocar. Ahora
    // solo se mueve algo si SÍ hay partido, y solo la primera vez: después se
    // recuerda la última respuesta
    const { container } = renderBanner({ match: null, isLoading: true });

    expect(container).toBeEmptyDOMElement();
  });

  it('still paints nothing while loading even with a match from before', () => {
    // El panel no manda `isLoading` si tiene un partido recordado; si lo
    // mandara, mandaría el hueco: no un banner a medias
    const { container } = renderBanner({ match, isLoading: true });

    expect(container).toBeEmptyDOMElement();
  });

  it('survives a match with no opponents named', () => {
    renderBanner({ match: { ...match, opponentNames: [] } });

    expect(screen.getByTestId('next-match-banner')).toBeInTheDocument();
  });
});
