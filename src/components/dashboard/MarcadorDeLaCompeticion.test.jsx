import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarcadorDeLaCompeticion from './MarcadorDeLaCompeticion';
import { enPuntos } from '../../utils/enPuntos';

/**
 * La competición en juego en Inicio: el marcador por equipos y su barra
 * (ComeBack Golf, 24 nov 2026).
 *
 *   #   caso                          | qué se ve
 *   ----|-------------------------------|------------------------------------
 *   P1  8,5 a 7,5                     | «8½» y «7½», con el nombre de cada
 *                                     | equipo encima: el color nunca va solo
 *   P2  puntos enteros                | «9» y «7», sin fracción
 *   P3  barra                         | cada tramo, la parte de sus puntos
 *   P4  0 a 0                         | la barra a medias, sin dividir por 0
 *   P5  lector de pantalla            | la barra dice el marcador con nombres
 *   P6  se toca                       | lleva a la clasificación
 *   P7  nombres largos                | no ensanchan la tarjeta
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave, opciones) =>
      opciones ? `${clave} ${JSON.stringify(opciones)}` : clave,
  }),
}));

const marcador = (extra = {}) => ({
  competitionId: 'c-1',
  competitionName: 'Viaje Algarve',
  teamAName: 'Los del bar',
  teamBName: 'Los del range',
  teamAPoints: 8.5,
  teamBPoints: 7.5,
  ...extra,
});

const pinta = (extra, alAbrir = vi.fn()) =>
  render(
    <MarcadorDeLaCompeticion marcador={marcador(extra)} alAbrir={alAbrir} />,
  );

describe('enPuntos', () => {
  it.each([
    [8.5, '8½'],
    [0.5, '½'],
    [9, '9'],
    [0, '0'],
    [null, '0'],
  ])('%s → %s', (puntos, texto) => {
    expect(enPuntos(puntos)).toBe(texto);
  });
});

describe('MarcadorDeLaCompeticion', () => {
  it('P1: los puntos con su medio, y cada equipo con su nombre', () => {
    pinta();

    const a = screen.getByTestId('equipo-a');
    const b = screen.getByTestId('equipo-b');
    expect(a).toHaveTextContent('Los del bar');
    expect(a).toHaveTextContent('8½');
    expect(b).toHaveTextContent('Los del range');
    expect(b).toHaveTextContent('7½');
    expect(screen.getByText('Viaje Algarve')).toBeInTheDocument();
  });

  it('P2: los puntos enteros van sin fracción', () => {
    pinta({ teamAPoints: 9, teamBPoints: 7 });

    expect(screen.getByTestId('equipo-a')).toHaveTextContent(/9$/);
    expect(screen.getByTestId('equipo-b')).toHaveTextContent(/7$/);
  });

  it('P3: cada tramo de la barra mide la parte de sus puntos', () => {
    pinta({ teamAPoints: 12, teamBPoints: 4 });

    expect(screen.getByTestId('tramo-a')).toHaveStyle({ width: '75%' });
    expect(screen.getByTestId('tramo-b')).toHaveStyle({ width: '25%' });
  });

  it('P4: a cero la barra va a medias', () => {
    pinta({ teamAPoints: 0, teamBPoints: 0 });

    expect(screen.getByTestId('tramo-a')).toHaveStyle({ width: '50%' });
    expect(screen.getByTestId('tramo-b')).toHaveStyle({ width: '50%' });
  });

  it('P5: la barra dice el marcador con los nombres de los equipos', () => {
    pinta();

    expect(screen.getByRole('img')).toHaveAccessibleName(
      /Los del bar.*8½.*Los del range.*7½/,
    );
  });

  it('P6: al tocarla lleva a la clasificación de esa competición', () => {
    const alAbrir = vi.fn();
    pinta({}, alAbrir);

    fireEvent.click(screen.getByRole('button'));

    expect(alAbrir).toHaveBeenCalledWith('c-1');
  });

  it('P7: un nombre largo se corta en su mitad, no ensancha la tarjeta', () => {
    pinta({ teamAName: 'Los que siempre llegan tarde al tee del uno' });

    expect(screen.getByTestId('equipo-a')).toHaveClass('min-w-0');
    expect(
      screen.getByText('Los que siempre llegan tarde al tee del uno'),
    ).toHaveClass('truncate');
  });
});
