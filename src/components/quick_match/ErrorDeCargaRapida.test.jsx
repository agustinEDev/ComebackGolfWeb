import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDeCargaRapida from './ErrorDeCargaRapida';

/**
 * El enlace de una partida rápida que ya no existe —borrada, o tirada a la
 * papelera por quien la abre— o que no es tuya daba su aviso con un
 * «Reintentar» que no sirve de nada: reintentar da lo mismo (Agustín, 26 nov
 * 2026). La regla entera, en `noSeArreglaReintentando`.
 *
 *   caso | el fallo                      | el botón
 *   -----|-------------------------------|--------------------------------
 *   N1   | 404 de la API: ya no existe   | volver a mis partidas rápidas
 *   N2   | 403 de la API: no la juegas   | volver a mis partidas rápidas
 *   N3   | otro fallo del servidor       | reintentar
 *   N4   | sin cobertura                 | reintentar, aunque traiga un 404
 *                                          viejo: lo que falta es la señal
 *   N5   | 404 de un intermediario       | reintentar
 */
const t = (clave) => clave;
const conEstado = (status, deLaApi = true) =>
  Object.assign(new Error('x'), { status, deLaApi });
const pinta = (props) => {
  const refetch = vi.fn();
  const alVolver = vi.fn();
  render(
    <ErrorDeCargaRapida
      t={t}
      sondeoSinRespuesta={false}
      refetch={refetch}
      alVolver={alVolver}
      {...props}
    />,
  );
  return { refetch, alVolver };
};

describe('ErrorDeCargaRapida', () => {
  it.each([
    ['N1', 404, 'scoring.errors.notFound'],
    ['N2', 403, 'scoring.errors.forbidden'],
  ])(
    '%s a %s from the API offers going back to my quick matches, not retrying',
    (_caso, status, texto) => {
      const { refetch, alVolver } = pinta({ loadError: conEstado(status) });

      fireEvent.click(
        screen.getByRole('button', { name: 'scoring.backToMyQuickMatches' }),
      );

      expect(alVolver).toHaveBeenCalledTimes(1);
      expect(refetch).not.toHaveBeenCalled();
      expect(
        screen.queryByRole('button', { name: 'scoring.retry' }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('quick-match-scoring-error')).toHaveTextContent(
        texto,
      );
    },
  );

  it.each([
    ['N3', conEstado(500)],
    ['N5', conEstado(404, false)],
  ])('%s still offers retrying', (_caso, loadError) => {
    const { refetch, alVolver } = pinta({ loadError });

    fireEvent.click(screen.getByRole('button', { name: 'scoring.retry' }));

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(alVolver).not.toHaveBeenCalled();
  });

  it('N4 without coverage it offers retrying, even with an old 404', () => {
    const { refetch } = pinta({
      loadError: conEstado(404),
      sondeoSinRespuesta: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'scoring.retry' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
