import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ResumenDeLaCompeticion from './ResumenDeLaCompeticion';

/**
 * La cabecera de la ficha (ComeBack Golf): la portada del torneo con su nombre
 * encima, como en la lista de Torneos, y los datos debajo.
 *
 *   #   caso                              | resultado
 *   ----|---------------------------------|------------------------------------
 *   P1  el nombre                         | es el `<h1>`, en todos los anchos,
 *                                         | en mayúsculas y sobre la portada
 *   P2  un nombre largo o sin espacios    | se parte y se lee entero: la
 *                                         | portada crece con él
 *   P3  estado y visibilidad              | dos cápsulas sobre la portada, las
 *                                         | dos con fondo propio
 *   P4  las fechas                        | bajo el nombre, una sola vez
 *   P5  torneo en juego                   | la tarjeta va en la superficie de
 *                                         | realce; si no, en la de tarjeta
 *   P6  quien lo creó                     | lo ve dicho; los demás, no
 *   P7  jugadores, organizador y países   | cada dato con su etiqueta, en una
 *                                         | lista de términos bien formada
 *   P8  sin países                        | no sale el bloque
 *   P9  la sala de draft                  | para el grupo, con equipos por
 *                                         | formar y los dos capitanes; no para
 *                                         | quien organiza
 */
const t = (clave, p) => (p ? `${clave} ${JSON.stringify(p)}` : clave);

const pinta = (competition = {}, props = {}) =>
  render(
    <MemoryRouter>
      <ResumenDeLaCompeticion
        competition={{
          id: 'c-1',
          name: 'Copa de Otoño',
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          startDate: '2026-11-14',
          endDate: '2026-11-15',
          maxPlayers: 12,
          countries: [{ code: 'ES', name: 'Spain', nameEs: 'España' }],
          creator: { displayName: 'Olegario' },
          ...competition,
        }}
        t={t}
        i18n={{ language: 'es' }}
        isCreator={false}
        canManage={false}
        approvedCount={4}
        fechaDeAperturaLegible={null}
        {...props}
      />
    </MemoryRouter>,
  );

const clases = (el) => el.className.split(/\s+/);

describe('ResumenDeLaCompeticion · la portada', () => {
  it('P1: el nombre es el h1 de la pantalla, en mayúsculas y a la vista en todos los anchos', () => {
    pinta();

    const titulos = screen.getAllByRole('heading', { level: 1 });
    expect(titulos).toHaveLength(1);
    expect(titulos[0]).toHaveTextContent('Copa de Otoño');
    expect(clases(titulos[0])).toContain('uppercase');
    // Ni oculto en el móvil ni solo en escritorio: la cabecera ya no lo pinta
    expect(clases(titulos[0])).not.toContain('hidden');
    expect(clases(titulos[0]).some((c) => c.endsWith(':hidden'))).toBe(false);
    // Sobre la portada: color fijo, no el del tema
    expect(clases(titulos[0])).toContain('text-sand');
  });

  it('P2: un nombre largo se parte y se lee entero', () => {
    const { container } = pinta({ name: 'X'.repeat(100) });

    const titulo = screen.getByRole('heading', { level: 1 });
    expect(clases(titulo)).toContain('wrap-anywhere');
    // Sin recorte: la cabecera ya no repite el nombre, y cortado no se podría
    // leer en ningún otro sitio de la ficha
    expect(clases(titulo).some((c) => c.startsWith('line-clamp'))).toBe(false);
    expect(titulo).toHaveTextContent('X'.repeat(100));
    // La portada crece con él: alto mínimo, no fijo
    const portada = container.querySelector('svg').parentElement;
    expect(clases(portada).some((c) => /^h-\d/.test(c))).toBe(false);
    expect(clases(portada)).toContain('min-h-44');
  });

  it('P3: el estado y la visibilidad, en dos cápsulas', () => {
    pinta({ status: 'IN_PROGRESS', visibility: 'PRIVATE' });

    expect(screen.getByText('status.IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByTestId('visibilidad-competicion')).toHaveTextContent(
      'detail.visibilityPrivate',
    );
  });

  it('P3c: la de visibilidad lleva fondo: arriba el velo es fino y un contorno solo no se leía', () => {
    pinta();

    const capsula = clases(screen.getByTestId('visibilidad-competicion'));
    expect(capsula.some((c) => c.startsWith('bg-forest'))).toBe(true);
    expect(capsula).toContain('text-sand');
  });

  it('P3b: pública, lo dice', () => {
    pinta({ visibility: 'PUBLIC' });

    expect(screen.getByTestId('visibilidad-competicion')).toHaveTextContent(
      'detail.visibilityPublic',
    );
  });

  it('P4: las fechas salen una sola vez, bajo el nombre', () => {
    const { container } = pinta();

    const fechas = [...container.querySelectorAll('p')].filter((p) =>
      /2026/.test(p.textContent),
    );
    expect(fechas).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 }).nextElementSibling).toBe(
      fechas[0],
    );
  });

  it('P5: en juego va en la superficie de realce; si no, en la de tarjeta', () => {
    const { container, unmount } = pinta({ status: 'IN_PROGRESS' });
    expect(clases(container.firstChild)).toContain('bg-realce');
    expect(container.firstChild).toHaveAttribute('data-en-juego', 'true');
    unmount();

    const otra = pinta({ status: 'ACTIVE' });
    expect(clases(otra.container.firstChild)).toContain('bg-tarjeta');
    expect(otra.container.firstChild).not.toHaveAttribute('data-en-juego');
  });

  it('P6: a quien lo creó se le dice; a los demás, no', () => {
    const { unmount } = pinta({}, { isCreator: true });
    expect(screen.getByText('detail.creator')).toBeInTheDocument();
    unmount();

    pinta({}, { isCreator: false });
    expect(screen.queryByText('detail.creator')).toBeNull();
  });

  it('P7: jugadores, organizador y países, cada uno con su etiqueta', () => {
    pinta();

    const dato = (etiqueta) =>
      within(screen.getByText(etiqueta).parentElement).getByRole('definition');
    expect(dato('detail.players')).toHaveTextContent('4 / 12');
    expect(dato('detail.organizedBy')).toHaveTextContent('Olegario');
    expect(screen.getByText('detail.countries')).toBeInTheDocument();
    expect(screen.getByText('España')).toBeInTheDocument();
  });

  it('P7c: cada término y su valor son hijos directos de su grupo, dentro de la lista', () => {
    const { container } = pinta();

    const lista = container.querySelector('dl');
    const grupos = [...lista.children];
    expect(grupos.length).toBeGreaterThanOrEqual(2);
    for (const grupo of grupos) {
      expect(grupo.tagName).toBe('DIV');
      expect([...grupo.children].map((hijo) => hijo.tagName)).toEqual([
        'DT',
        'DD',
      ]);
    }
  });

  it('P7b: sin tope de jugadores, infinito', () => {
    pinta({ maxPlayers: null });

    expect(
      within(screen.getByText('detail.players').parentElement).getByRole(
        'definition',
      ),
    ).toHaveTextContent('4 / ∞');
  });

  it('P8: sin países no sale su bloque', () => {
    pinta({ countries: [] });

    expect(screen.queryByText('detail.countries')).toBeNull();
  });

  const conDraft = {
    setupMode: 'RYDER_CUP',
    status: 'CLOSED',
    teamsAssigned: false,
    captains: { teamA: 'u-1', teamB: 'u-2' },
  };

  it('P9: la sala de draft, para el grupo, con los capitanes y sin equipos', () => {
    pinta(conDraft);

    expect(screen.getByTestId('ir-a-la-sala-de-draft')).toHaveAttribute(
      'href',
      '/competitions/c-1/draft',
    );
  });

  it.each([
    ['a quien organiza', {}, { canManage: true }],
    ['con los equipos formados', { teamsAssigned: true }, {}],
    ['sin un capitán', { captains: { teamA: 'u-1', teamB: null } }, {}],
    ['con la inscripción abierta', { status: 'ACTIVE' }, {}],
  ])('P9: no se ofrece %s', (_caso, competition, props) => {
    pinta({ ...conDraft, ...competition }, props);

    expect(screen.queryByTestId('ir-a-la-sala-de-draft')).toBeNull();
  });
});
