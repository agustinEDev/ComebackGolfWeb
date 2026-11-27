import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import AvisoDeMudanza, { CLAVE_DE_LA_VUELTA } from './AvisoDeMudanza';
import { COLA_VACIADA } from '../../services/vaciadoDeLaCola';
import { DOMINIO_ANTIGUO } from '../../utils/mudanza';

/**
 * El aviso de la mudanza, en el dominio viejo (Agustín, 27 nov 2026).
 *
 *   caso | qué                                   | resultado
 *   -----|---------------------------------------|--------------------------------
 *   A1   | en el dominio nuevo                   | nada
 *   A2   | app instalada en el viejo             | pantalla con los cuatro pasos y
 *        |                                       | «Ir a la app nueva» a la portada
 *   A3   | en el navegador                       | la versión corta, a la misma ruta
 *   A4   | los dos                               | dicen que se entra con la misma
 *        |                                       | cuenta
 *   A5   | con hoyos sin enviar                  | no deja irse: dice cuántas
 *        |                                       | partidas y «Ver cuáles» lleva a
 *        |                                       | Inicio, donde está su aviso
 *   A6   | se vacía la cola con el aviso abierto | ya deja irse
 *   A7   | «Ahora no», Escape o tocar fuera      | se cierra y vuelve mañana
 *   A8   | ya aplazado hoy                       | no sale
 *   A9   | anotando                              | no sale
 *   A10  | es un diálogo con nombre, y retiene   | para el lector de pantalla y el
 *        | el foco                               | teclado
 *   A11  | sin sesión, o lo de otra cuenta       | no bloquea: no se puede enviar
 *   A12  | lo de una partida que ya no existe    | no cuenta: no se vacía nunca
 *   A13  | pulsar «Ir»                           | vuelve mañana: al volver a la
 *        |                                       | app vieja no la tapa
 *   A14  | con la app abierta, al día siguiente  | vuelve a salir
 */
const estado = vi.hoisted(() => ({ pendientes: [] }));
const sesion = vi.hoisted(() => ({ user: { id: 'u-1' } }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, o) => (o?.count != null ? `${k}·${o.count}` : k),
  }),
}));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => sesion }));
vi.mock('../../utils/scoringOfflineQueue', () => ({
  // Como la de verdad: sin usuario, todo; con usuario, lo suyo y lo huérfano
  resumenPorPartida: (userId) =>
    userId == null
      ? estado.pendientes
      : estado.pendientes.filter((p) => (p.userId ?? userId) === userId),
}));

const Donde = () => <p data-testid="donde">{useLocation().pathname}</p>;

const pinta = ({
  host = `www.${DOMINIO_ANTIGUO}`,
  instalada = true,
  ruta = '/dashboard',
} = {}) =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <AvisoDeMudanza host={host} instalada={instalada} />
              <Donde />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('AvisoDeMudanza', () => {
  let guardado;
  beforeEach(() => {
    guardado = {};
    vi.stubGlobal('localStorage', {
      getItem: (k) => guardado[k] ?? null,
      setItem: (k, v) => {
        guardado[k] = String(v);
      },
      removeItem: (k) => delete guardado[k],
    });
    estado.pendientes = [];
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 27, 12));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('A1 en el dominio nuevo no sale', () => {
    pinta({ host: 'www.comebackgolf.com' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('A2/A4/A10 la app instalada: los pasos, la misma cuenta y a la portada nueva', () => {
    pinta();
    const aviso = screen.getByRole('dialog', { name: 'mudanza.titulo' });
    expect(aviso).toHaveAttribute('aria-modal', 'true');
    for (const paso of ['abrir', 'instalar', 'entrar', 'borrar']) {
      expect(screen.getByText(`mudanza.pasos.${paso}`)).toBeInTheDocument();
    }
    const ir = screen.getByRole('link', { name: 'mudanza.ir' });
    expect(ir).toHaveAttribute('href', 'https://www.comebackgolf.com/');
    expect(ir).toHaveAttribute('target', '_blank');
    expect(ir).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('A3/A4 en el navegador: la versión corta, a la misma página', () => {
    pinta({ instalada: false, ruta: '/competitions/7?x=1' });
    expect(screen.queryByText('mudanza.pasos.abrir')).toBeNull();
    expect(screen.getByText('mudanza.navegador')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'mudanza.irNavegador' }),
    ).toHaveAttribute('href', 'https://www.comebackgolf.com/competitions/7');
  });

  it('A5 con hoyos sin enviar no deja irse, y «Ver cuáles» lleva a Inicio', () => {
    estado.pendientes = [{ matchId: 'm1' }, { matchId: 'm2' }];
    pinta({ ruta: '/feed' });
    expect(screen.queryByRole('link', { name: 'mudanza.ir' })).toBeNull();
    expect(screen.getByText('mudanza.pendientes·2')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'mudanza.esperando' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'mudanza.verCuales' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('donde')).toHaveTextContent('/dashboard');
  });

  it('A11 sin sesión no bloquea, ni con lo de otra cuenta', () => {
    estado.pendientes = [{ matchId: 'm1', userId: 'otra' }];
    sesion.user = null;
    pinta();
    expect(
      screen.getByRole('link', { name: 'mudanza.ir' }),
    ).toBeInTheDocument();
    sesion.user = { id: 'u-1' };
  });

  it('A12 lo de una partida que ya no existe no cuenta', () => {
    estado.pendientes = [{ matchId: 'm1', desaparecida: true }];
    pinta();
    expect(
      screen.getByRole('link', { name: 'mudanza.ir' }),
    ).toBeInTheDocument();
  });

  it('A13 pulsar «Ir» lo aparta hasta mañana', () => {
    pinta();
    fireEvent.click(screen.getByRole('link', { name: 'mudanza.ir' }));
    expect(guardado[CLAVE_DE_LA_VUELTA]).toBe('2026-11-28');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('A14 con la app abierta, al día siguiente vuelve a salir', () => {
    pinta();
    fireEvent.click(screen.getByRole('button', { name: 'mudanza.ahoraNo' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    vi.setSystemTime(new Date(2026, 10, 28, 9));
    act(() => {
      window.dispatchEvent(new globalThis.CustomEvent(COLA_VACIADA));
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('A10 el foco entra en el aviso', () => {
    pinta();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(
      true,
    );
  });

  it('A6 al vaciarse la cola, ya deja irse', () => {
    estado.pendientes = [{ matchId: 'm1' }];
    pinta();
    expect(screen.queryByRole('link', { name: 'mudanza.ir' })).toBeNull();
    estado.pendientes = [];
    act(() => {
      window.dispatchEvent(new globalThis.CustomEvent(COLA_VACIADA));
    });
    expect(
      screen.getByRole('link', { name: 'mudanza.ir' }),
    ).toBeInTheDocument();
  });

  it.each([
    [
      '«Ahora no»',
      () =>
        fireEvent.click(
          screen.getByRole('button', { name: 'mudanza.ahoraNo' }),
        ),
    ],
    [
      'Escape',
      () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' }),
    ],
    [
      'tocar fuera de la columna',
      () => {
        const fondo = screen.getByRole('dialog').parentElement;
        fireEvent.mouseDown(fondo);
        fireEvent.mouseUp(fondo);
        fireEvent.click(fondo);
      },
    ],
  ])('A7 %s lo cierra y vuelve mañana', (_n, cierra) => {
    pinta();
    cierra();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(guardado[CLAVE_DE_LA_VUELTA]).toBe('2026-11-28');
  });

  it('A8 ya aplazado hoy, no sale', () => {
    guardado[CLAVE_DE_LA_VUELTA] = '2026-11-28';
    pinta();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('A9 anotando, no sale', () => {
    pinta({ ruta: '/quick-matches/q1/scoring' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
