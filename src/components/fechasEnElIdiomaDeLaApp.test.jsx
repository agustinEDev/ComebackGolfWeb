import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/**
 * FE #1238 · las fechas, en el idioma de la aplicación y no en el del
 * navegador. Con la app en inglés y el navegador en español, la agenda decía
 * «lun, 23 nov 2026». Los tests corren con el `Intl` de Node (inglés), así que
 * la casilla que delata el fallo es la de la app en español: sin el arreglo,
 * sale en inglés.
 *
 *   #   pieza                     | idioma de la app | qué se ve
 *   ----|---------------------------|------------------|---------------------------
 *   A1  ronda de la agenda        | en               | «Mon, Nov 23, 2026»
 *   A2  ronda de la agenda        | es               | «lun, 23 nov 2026»
 *   A3  ronda, cambia el idioma   | en → es          | pasa a español sin recargar
 *   A4  ronda sin fecha o mala    | es               | ninguna fecha
 *   A5  amigo desde / solicitado  | en / es          | 2/19/2026 / 19/2/2026
 *       invitación respondida     | en / es          | idem, con y sin clave
 *       creada (ajustes)          | en / es          | idem
 *   A6  amigo / creada, sin fecha | es               | ni la frase ni el campo
 *       legible                   |                  | vacíos: no se pintan
 *
 * El navegador en un idioma que la app no tiene (francés) lo resuelve la
 * configuración de i18n para toda la app: config.idiomaDelDocumento.test.
 */
const idioma = vi.hoisted(() => ({ actual: 'en' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave) => clave,
    i18n: { language: idioma.actual },
  }),
}));

vi.mock('./ui/Avatar', () => ({ default: () => null }));

import RoundCard from './schedule/RoundCard';
import FriendCard from './friend/FriendCard';
import InvitationCard from './invitation/InvitationCard';
import AjustesDeLaCompeticion from './competition/detail/AjustesDeLaCompeticion';

const ronda = (roundDate) => ({
  id: 'r1',
  roundDate,
  sessionType: 'MORNING',
  matchFormat: 'FOURBALL',
  status: 'PENDING_TEAMS',
  golfCourseId: 'g1',
  matches: [],
});

const conPlantilla = (clave, opciones) =>
  opciones ? `${clave} ${opciones.date}` : clave;

const ui = (r) => (
  <RoundCard
    round={r}
    canEdit={false}
    isExpanded={false}
    onToggleExpand={() => {}}
    golfCourses={[{ id: 'g1', name: 'Altea' }]}
    playerNameMap={{}}
    playerHandicapMap={{}}
    teamNames={{}}
    t={(clave) => clave}
  />
);

// El mediodía UTC cae el mismo día en cualquier huso de España o América
const RESPONDIDA = '2026-02-19T12:00:00Z';
const EN = '2/19/2026';
const ES = '19/2/2026';

beforeEach(() => {
  idioma.actual = 'en';
});

describe('Fecha de la ronda en la agenda (#1238)', () => {
  it('A1: con la app en inglés, en inglés', () => {
    render(ui(ronda('2026-11-23')));

    expect(screen.getByText(/Mon, Nov 23, 2026/)).toBeInTheDocument();
  });

  it('A2: con la app en español, en español aunque el navegador no lo esté', () => {
    idioma.actual = 'es';
    render(ui(ronda('2026-11-23')));

    expect(screen.getByText(/lun, 23 nov 2026/)).toBeInTheDocument();
  });

  it('A3: al cambiar de idioma, la fecha cambia sin recargar', () => {
    const { rerender } = render(ui(ronda('2026-11-23')));
    expect(screen.getByText(/Mon, Nov 23, 2026/)).toBeInTheDocument();

    idioma.actual = 'es';
    rerender(ui(ronda('2026-11-23')));

    expect(screen.getByText(/lun, 23 nov 2026/)).toBeInTheDocument();
  });

  it.each([null, '23/11/2026'])(
    'A4: una ronda sin fecha o con una que no se lee (%s) no pinta ninguna',
    (dia) => {
      idioma.actual = 'es';
      const { container } = render(ui(ronda(dia)));

      expect(container).not.toHaveTextContent(/Invalid|lun|2026/);
    },
  );
});

describe('Las demás fechas, también en el idioma de la app (#1238)', () => {
  const amistad = {
    id: 'f-1',
    otherUserId: 'u-9',
    otherUserName: 'Ana García',
    status: 'ACCEPTED',
    createdAt: '2026-01-01T12:00:00Z',
    respondedAt: RESPONDIDA,
  };

  const invitacion = (status) => ({
    id: 'inv-2',
    competitionId: 'comp-1',
    competitionName: 'Summer Cup',
    inviterName: 'John Creator',
    inviteeEmail: 'player@example.com',
    status,
    isPending: false,
    isAccepted: status === 'ACCEPTED',
    isDeclined: status === 'DECLINED',
    isExpired: false,
    respondedAt: RESPONDIDA,
  });

  const casos = [
    [
      'amigo desde',
      () => (
        <MemoryRouter>
          <FriendCard friendship={amistad} mode="friend" t={conPlantilla} />
        </MemoryRouter>
      ),
    ],
    [
      'solicitado el',
      () => (
        <MemoryRouter>
          <FriendCard
            friendship={{ ...amistad, createdAt: RESPONDIDA }}
            mode="incoming"
            t={conPlantilla}
          />
        </MemoryRouter>
      ),
    ],
    [
      // CANCELLED tiene su propia clave de texto (CLAVE_DE_LA_FECHA)
      'invitación retirada (con su clave)',
      () => (
        <MemoryRouter>
          <InvitationCard
            invitation={invitacion('CANCELLED')}
            mode="player"
            t={conPlantilla}
          />
        </MemoryRouter>
      ),
    ],
    [
      'invitación aceptada (sin clave propia)',
      () => (
        <MemoryRouter>
          <InvitationCard
            invitation={invitacion('ACCEPTED')}
            mode="player"
            t={conPlantilla}
          />
        </MemoryRouter>
      ),
    ],
    [
      'competición creada',
      () => (
        <AjustesDeLaCompeticion
          competition={{ createdAt: RESPONDIDA }}
          t={(clave) => clave}
          conClasificacion={false}
        />
      ),
    ],
  ];

  it.each(casos)('A5: %s, en inglés con la app en inglés', (_, pinta) => {
    render(pinta());

    expect(screen.getByText(new RegExp(EN))).toBeInTheDocument();
  });

  it.each(casos)('A5: %s, en español con la app en español', (_, pinta) => {
    idioma.actual = 'es';
    render(pinta());

    expect(screen.getByText(new RegExp(ES))).toBeInTheDocument();
  });

  it.each([
    ['amigo desde', 'friend'],
    ['solicitado el', 'incoming'],
  ])('A6: %s sin fecha legible, sin la frase', (_, mode) => {
    idioma.actual = 'es';
    const { container } = render(
      <MemoryRouter>
        <FriendCard
          friendship={{ ...amistad, createdAt: 'no', respondedAt: null }}
          mode={mode}
          t={conPlantilla}
        />
      </MemoryRouter>,
    );

    expect(container).not.toHaveTextContent(/card\.(friendsSince|requestedAt)/);
  });

  it('A6: competición sin fecha de creación legible, sin el campo', () => {
    idioma.actual = 'es';
    render(
      <AjustesDeLaCompeticion
        competition={{ createdAt: null }}
        t={(clave) => clave}
        conClasificacion={false}
      />,
    );

    expect(
      screen.queryByText('detail.settings.created'),
    ).not.toBeInTheDocument();
  });
});
