import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

// `t` y el objeto que devuelve `useTranslation`, ESTABLES: la carga de la
// pantalla es un `useCallback` que depende de `t`, así que devolviendo una
// función nueva en cada render se recargaba sin parar —247 veces en 400 ms— y
// el diálogo se volvía a montar entre dos pulsaciones
const t = (clave, params) => {
  if (params?.team) return `${clave}_${params.team}`;
  if (params?.count !== undefined) return `${clave}_${params.count}`;
  return clave;
};
const traduccion = { i18n: { language: 'es' }, t };
vi.mock('react-i18next', () => ({ useTranslation: () => traduccion }));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        () =>
        ({ children, ...props }) => <div {...props}>{children}</div>,
    },
  ),
}));

vi.mock('../../components/layout/HeaderAuth', () => ({ default: () => null }));
// Constantes, no objetos nuevos en cada render: la carga de esta pantalla
// depende del usuario, así que devolver uno distinto cada vez la relanza sin
// parar (ya nos pasó el 22 sep con `useAuth` en otra pantalla)
// Quién mira: se cambia por prueba, pero el MISMO objeto en cada render
const QUIEN = vi.hoisted(() => ({
  sesion: { user: { id: 'org' }, loading: false },
  roles: { isAdmin: false, isCreator: true, isLoading: false },
}));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => QUIEN.sesion }));
vi.mock('../../hooks/useUserRoles', () => ({
  useUserRoles: () => QUIEN.roles,
}));
vi.mock('../../components/ui/FullScreenLoader', () => ({
  default: () => null,
}));
vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockDetalle = vi.fn();
const mockAgenda = vi.fn();
const mockInscripciones = vi.fn();
const mockCubrir = vi.fn();
const mockFormar = vi.fn();
const mockDeshacer = vi.fn();

vi.mock('../../composition', () => ({
  getCompetitionDetailUseCase: { execute: (...a) => mockDetalle(...a) },
  getScheduleUseCase: { execute: (...a) => mockAgenda(...a) },
  getCompetitionGolfCoursesUseCase: { execute: vi.fn().mockResolvedValue([]) },
  listEnrollmentsUseCase: { execute: (...a) => mockInscripciones(...a) },
  assignTeamsUseCase: { execute: (...a) => mockFormar(...a) },
  undoTeamsUseCase: { execute: (...a) => mockDeshacer(...a) },
  fillCaptainUseCase: { execute: (...a) => mockCubrir(...a) },
  createRoundUseCase: { execute: vi.fn() },
  updateRoundUseCase: { execute: vi.fn() },
  deleteRoundUseCase: { execute: vi.fn() },
  generateMatchesUseCase: { execute: vi.fn() },
  updateMatchStatusUseCase: { execute: vi.fn() },
  declareWalkoverUseCase: { execute: vi.fn() },
  reassignPlayersUseCase: { execute: vi.fn() },
  getMatchDetailUseCase: { execute: vi.fn() },
}));

const SchedulePage = (await import('./SchedulePage')).default;

const COMPETICION = {
  hasTeams: true,
  id: 'comp-1',
  name: 'Ryder de los amigos',
  status: 'CLOSED',
  creatorId: 'org',
  team1Name: 'Europa',
  team2Name: 'América',
  maxPlayingHandicap: null,
  captains: { teamA: null, teamB: null, viceTeamA: null, viceTeamB: null },
};
const EQUIPOS = {
  teamAPlayerIds: ['ana'],
  teamBPlayerIds: ['bea'],
  mode: 'DRAFT',
};
const INSCRITOS = [
  { userId: 'ana', userName: 'Ana Alba', status: 'APPROVED' },
  { userId: 'bea', userName: 'Bea Blanco', status: 'APPROVED' },
];

const pintar = () =>
  render(
    <MemoryRouter initialEntries={['/creator/competitions/comp-1/schedule']}>
      <Routes>
        <Route
          path="/creator/competitions/:id/schedule"
          element={<SchedulePage />}
        />
      </Routes>
    </MemoryRouter>,
  );

const ORGANIZADOR = {
  sesion: { user: { id: 'org' }, loading: false },
  roles: { isAdmin: false, isCreator: true, isLoading: false },
};
const DE_FUERA = {
  sesion: { user: { id: 'curioso' }, loading: false },
  roles: { isAdmin: false, isCreator: false, isLoading: false },
};
const como = (quien) => Object.assign(QUIEN, quien);

/**
 * Q1 (FE #1225): quien no participa en una Ryder no recibe los equipos (el
 * servidor no le manda `teamAssignment`: no tiene acceso entero), y la
 * agenda le decía «Los equipos aún no han sido asignados» aunque ya lo
 * estuvieran. La ficha sí dice si hay equipos (`teamsAssigned`, de
 * `GET /competitions/{id}`, para cualquiera), así que «no hay equipos» y «no
 * me los enseñan» se distinguen sin pedir nada nuevo al servidor.
 *
 * | #  | Quién mira          | ¿Hay equipos? | ¿Le llegan? | Bloque de equipos           |
 * |----|---------------------|---------------|-------------|-----------------------------|
 * | Q1 | Alguien de fuera    | sí            | no          | no sale (ni que faltan)     |
 * | Q2 | Alguien de fuera    | no            | no          | «aún no asignados», sin botón |
 * | Q3 | El organizador      | no            | —           | «aún no asignados» y su botón |
 * | Q4 | El organizador      | sí            | sí          | los equipos                  |
 * | Q6 | Un jugador         | sí            | sí          | los equipos                  |
 * | Q5 | El organizador      | recién deshechos (la ficha aún dice que sí) | no | «aún no asignados» y su botón |
 */
describe('SchedulePage · equipos que no me enseñan (FE #1225)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInscripciones.mockResolvedValue(INSCRITOS);
  });

  it('Q1: de fuera, con los equipos formados: ni el bloque ni que faltan', async () => {
    como(DE_FUERA);
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: true });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: null,
    });
    pintar();
    await waitFor(() => expect(mockAgenda).toHaveBeenCalled());
    await screen.findByText('Ryder de los amigos');
    expect(screen.queryByText('teams.noTeamsAssigned')).not.toBeInTheDocument();
    expect(screen.queryByText('teams.title')).not.toBeInTheDocument();
  });

  it('Q2: de fuera, sin equipos todavía: se dice que faltan, sin botón', async () => {
    como(DE_FUERA);
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: false });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: null,
    });
    pintar();
    expect(
      await screen.findByText('teams.noTeamsAssigned'),
    ).toBeInTheDocument();
    expect(screen.queryByText('teams.assign')).not.toBeInTheDocument();
  });

  it('Q3: el organizador sin equipos sigue viendo «aún no asignados» y su botón', async () => {
    como(ORGANIZADOR);
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: false });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: null,
    });
    pintar();
    expect(
      await screen.findByText('teams.noTeamsAssigned'),
    ).toBeInTheDocument();
    expect(screen.getByText('teams.assign')).toBeInTheDocument();
  });

  it('Q4: el organizador con equipos los ve', async () => {
    como(ORGANIZADOR);
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: true });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: EQUIPOS,
    });
    pintar();
    expect(await screen.findByText('Ana Alba')).toBeInTheDocument();
    expect(screen.queryByText('teams.noTeamsAssigned')).not.toBeInTheDocument();
  });

  it('Q5: el organizador que acaba de deshacerlos (la ficha aún dice que sí) ve que faltan y su botón', async () => {
    como(ORGANIZADOR);
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: true });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: null,
    });
    pintar();
    expect(
      await screen.findByText('teams.noTeamsAssigned'),
    ).toBeInTheDocument();
    expect(screen.getByText('teams.assign')).toBeInTheDocument();
  });

  it('Q6: un jugador de la Ryder, que sí los recibe, los ve', async () => {
    como({
      sesion: { user: { id: 'ana' }, loading: false },
      roles: { isAdmin: false, isCreator: false, isLoading: false },
    });
    mockDetalle.mockResolvedValue({ ...COMPETICION, teamsAssigned: true });
    mockAgenda.mockResolvedValue({
      days: [],
      rounds: [],
      teamAssignment: EQUIPOS,
    });
    pintar();
    expect(await screen.findByText('Bea Blanco')).toBeInTheDocument();
  });
});
