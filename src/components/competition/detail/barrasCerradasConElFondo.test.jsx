import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import MisBarras from './MisBarras';
import BarrasDelJugadorModal from './BarrasDelJugadorModal';
import BarrasDeLosCamposModal from './BarrasDeLosCamposModal';

/**
 * S2 (23 nov 2026): «Mis barras», «Barras de X» y «Barras de los campos» se
 * cierran con el FONDO mientras guardan. El modal se desmonta y no hay fila
 * donde decirlo: al terminar el guardado sale el aviso, ARRIBA, como los de
 * los modales («Barra guardada» / «Barra quitada», o el error).
 *
 * De punta a punta en la pantalla: el armazón de verdad (`ModalShell` con
 * `alTocarElFondo`), el gesto entero en el fondo y quien abre el modal
 * quitándolo al cerrar, como `MisBarras` y la ficha.
 *
 *   modal                 | acaba            | aviso arriba
 *   ----------------------|------------------|-----------------------------------
 *   Mis barras            | guardada         | tees.saved
 *   Mis barras            | error            | tees.errors.TEE_CHANGE_CLOSED
 *   Barras de X           | quitada          | tees.removed
 *   Barras de los campos  | fijada           | tees.courses.saved
 *   Barras de los campos  | quitada          | tees.courses.removed
 *   Barras de los campos  | error            | tees.errors.FORBIDDEN
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave, v) => (v ? `${clave} ${JSON.stringify(v)}` : clave),
  }),
}));
const m = vi.hoisted(() => ({
  leer: vi.fn(),
  general: vi.fn(),
  campo: vi.fn(),
  delCampo: vi.fn(),
  campos: vi.fn(),
  fijadas: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../../composition/cargarBarras', () => ({
  cargarBarras: () =>
    Promise.resolve({
      getEnrollmentTeesUseCase: { execute: m.leer },
      changeEnrollmentTeeUseCase: { execute: m.general },
      changeEnrollmentCourseTeeUseCase: { execute: m.campo },
      setCompetitionCourseTeeUseCase: { execute: m.delCampo },
      getCompetitionCourseTeesUseCase: { execute: m.fijadas },
    }),
}));
vi.mock('../../../composition', () => ({
  getCompetitionGolfCoursesUseCase: { execute: m.campos },
}));
vi.mock('../../../utils/toast', () => ({ default: m.toast }));
vi.mock('../../../utils/registraElFallo', () => ({ registraElFallo: vi.fn() }));

const ARRIBA = { position: 'top-center' };

const BARRAS = {
  generalTee: 'YELLOW',
  defaultTee: 'YELLOW',
  courses: [
    {
      golfCourseId: 'g1',
      golfCourseName: 'Altea',
      tee: 'YELLOW',
      source: 'GENERAL',
      options: ['YELLOW', 'RED'],
      ownTee: null,
    },
    {
      golfCourseId: 'g2',
      golfCourseName: 'El Escorial',
      tee: 'BLUE',
      source: 'OWN',
      options: ['BLUE', 'RED'],
      ownTee: 'BLUE',
    },
  ],
};

const CAMPOS = [
  {
    golf_course: {
      id: 'g1',
      name: 'Altea',
      tees: [
        { color: 'YELLOW', gender: 'MALE' },
        { color: 'RED', gender: 'FEMALE' },
      ],
    },
  },
];

const fallo = (status, errorCode) =>
  Object.assign(new Error(String(status)), { status, errorCode });

// Un guardado que no acaba hasta que el test lo dice
const enVuelo = (fn) => {
  const vuelo = {};
  fn.mockImplementation(
    () =>
      new Promise((resuelve, rechaza) => {
        vuelo.bien = resuelve;
        vuelo.mal = rechaza;
      }),
  );
  return vuelo;
};

// El gesto entero en el fondo, como un dedo: pulsar, soltar y el clic
const tocarElFondo = () => {
  const fondo = screen.getByRole('dialog');
  fireEvent.mouseDown(fondo);
  fireEvent.mouseUp(fondo);
  fireEvent.click(fondo);
};

const cerradoConElFondo = async () => {
  tocarElFondo();
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  // Aún guardando: nada dicho todavía
  expect(m.toast.success).not.toHaveBeenCalled();
  expect(m.toast.error).not.toHaveBeenCalled();
};

// Quien abre el modal lo quita al cerrarse, como la ficha (CompetitionDetail)
const ConElDelJugador = () => {
  const [abierto, setAbierto] = useState(true);
  return abierto ? (
    <BarrasDelJugadorModal
      inscripcion={{ id: 'e1', userName: 'Ana' }}
      puedeCambiar
      onClose={() => setAbierto(false)}
    />
  ) : null;
};
const ConElDeLosCampos = () => {
  const [abierto, setAbierto] = useState(true);
  return abierto ? (
    <BarrasDeLosCamposModal
      competitionId="c1"
      onClose={() => setAbierto(false)}
    />
  ) : null;
};

beforeEach(() => {
  vi.clearAllMocks();
  m.leer.mockResolvedValue(BARRAS);
  m.fijadas.mockResolvedValue([]);
  m.campos.mockResolvedValue(CAMPOS);
});

describe('S2 · cerrados con el fondo mientras guardan, el aviso sale arriba', () => {
  const abreMisBarras = async () => {
    render(<MisBarras inscripcion={{ id: 'e1' }} puedeCambiar />);
    await screen.findByTestId('mis-barras');
    fireEvent.click(
      screen.getByRole('button', { name: 'competitions:tees.changeGeneral' }),
    );
    await screen.findByTestId('fila-barra-g1');
  };

  const guardaLaGeneral = () => {
    fireEvent.change(screen.getByLabelText('competitions:tees.general'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('guardar-general'));
  };

  it('S2: «Mis barras» guardada: «Barra guardada»', async () => {
    const vuelo = enVuelo(m.general);
    await abreMisBarras();
    guardaLaGeneral();
    await waitFor(() => expect(m.general).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.bien({ id: 'e1', teeColor: 'RED' });

    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.saved',
        ARRIBA,
      ),
    );
    expect(m.toast.error).not.toHaveBeenCalled();
  });

  it('S2: «Mis barras» con error: el error', async () => {
    const vuelo = enVuelo(m.general);
    await abreMisBarras();
    guardaLaGeneral();
    await waitFor(() => expect(m.general).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.mal(fallo(409, 'TEE_CHANGE_CLOSED'));

    await waitFor(() =>
      expect(m.toast.error).toHaveBeenCalledWith(
        'competitions:tees.errors.TEE_CHANGE_CLOSED',
        ARRIBA,
      ),
    );
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('S2: «Barras de X» quitada: «Barra quitada»', async () => {
    const vuelo = enVuelo(m.campo);
    render(<ConElDelJugador />);
    const fila = await screen.findByTestId('fila-barra-g2');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('guardar-g2'));
    await waitFor(() => expect(m.campo).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.bien({ teeColor: null });

    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.removed',
        ARRIBA,
      ),
    );
  });

  it('S2: «Barras de los campos» fijada: «Barra guardada»', async () => {
    const vuelo = enVuelo(m.delCampo);
    render(<ConElDeLosCampos />);
    await screen.findByTestId('fijar-g1:FEMALE');
    fireEvent.change(document.getElementById('barra-g1:FEMALE'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('fijar-g1:FEMALE'));
    await waitFor(() => expect(m.delCampo).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.bien({ gender: 'FEMALE', teeColor: 'RED' });

    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.courses.saved',
        ARRIBA,
      ),
    );
  });

  it('S2: «Barras de los campos» quitada: «Barra quitada»', async () => {
    m.fijadas.mockResolvedValue([
      { golfCourseId: 'g1', gender: 'FEMALE', teeColor: 'RED' },
    ]);
    const vuelo = enVuelo(m.delCampo);
    render(<ConElDeLosCampos />);
    await waitFor(() =>
      expect(screen.getByTestId('quitar-g1:FEMALE')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('quitar-g1:FEMALE'));
    await waitFor(() => expect(m.delCampo).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.bien({ gender: 'FEMALE', teeColor: null });

    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.courses.removed',
        ARRIBA,
      ),
    );
  });

  it('S2: «Barras de los campos» con error: el error', async () => {
    const vuelo = enVuelo(m.delCampo);
    render(<ConElDeLosCampos />);
    await screen.findByTestId('fijar-g1:FEMALE');
    fireEvent.change(document.getElementById('barra-g1:FEMALE'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('fijar-g1:FEMALE'));
    await waitFor(() => expect(m.delCampo).toHaveBeenCalled());

    await cerradoConElFondo();
    vuelo.mal(fallo(403));

    await waitFor(() =>
      expect(m.toast.error).toHaveBeenCalledWith(
        'competitions:tees.errors.FORBIDDEN',
        ARRIBA,
      ),
    );
  });
});
