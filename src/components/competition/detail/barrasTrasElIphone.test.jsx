import { describe, it, expect, vi, beforeEach } from 'vitest';
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
 * Lo que salió en la pasada del iPhone del 22 nov 2026 (tabla aprobada por
 * Agustín el 23 nov), bloque a bloque.
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

const LARGO = 'Real Club de Golf de la Herrería de San Lorenzo de El Escorial';
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
      golfCourseName: LARGO,
      tee: 'BLUE',
      source: 'OWN',
      options: ['BLUE', 'RED'],
      ownTee: 'BLUE',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  m.leer.mockResolvedValue(BARRAS);
  m.fijadas.mockResolvedValue([]);
});

/**
 * A1–A3 · «Mis barras»: cada campo un bloque, el nombre arriba y debajo la
 * barra, el motivo y «Cambiar», siempre a la izquierda; la general en su
 * bloque, arriba; una línea fina entre campos.
 */
describe('A · «Mis barras», un bloque por campo', () => {
  const pinta = async () => {
    render(<MisBarras inscripcion={{ id: 'e1' }} puedeCambiar />);
    return screen.findByTestId('mis-barras');
  };

  it('A1: la general es el primer bloque, y cada campo va detrás, en orden', async () => {
    await pinta();
    const bloques = screen.getAllByTestId(/^mi-barra-/);
    expect(bloques.map((b) => b.dataset.testid)).toEqual([
      'mi-barra-general',
      'mi-barra-g1',
      'mi-barra-g2',
    ]);
  });

  it('A1: el nombre, arriba y en gris; debajo, la barra, el motivo y «Cambiar»', async () => {
    await pinta();
    for (const id of ['mi-barra-general', 'mi-barra-g1', 'mi-barra-g2']) {
      const bloque = screen.getByTestId(id);
      const [nombre, valor] = bloque.children;
      // Nombre y valor apilados: el bloque no es una fila repartida
      expect(bloque.children).toHaveLength(2);
      expect(bloque.className).not.toMatch(/justify-between|flex/);
      expect(nombre.tagName).toBe('DT');
      expect(nombre.className).toContain('text-tinta-suave');
      expect(valor.tagName).toBe('DD');
      // Todo a la izquierda, sin repartir a los lados
      expect(valor.className).not.toMatch(/justify-(between|end|center)/);
      expect(within(valor).getByRole('button')).toBeInTheDocument();
    }
    expect(screen.getByTestId('mi-barra-g2').children[1]).toHaveTextContent(
      'golfCourses:form.teeColors.BLUE· competitions:tees.source.OWN',
    );
  });

  it('A2: una línea fina entre bloques', async () => {
    await pinta();
    const lista = screen.getByTestId('mi-barra-general').parentElement;
    expect(lista.className).toMatch(/divide-y/);
  });

  it('A3: un nombre largo se parte y no empuja nada a los lados', async () => {
    await pinta();
    const nombre = screen.getByText(LARGO);
    expect(nombre.className).toMatch(/break-words/);
    expect(nombre.className).toMatch(/min-w-0/);
    const valor = screen.getByTestId('mi-barra-g2').children[1];
    expect(valor.className).toMatch(/flex-wrap/);
  });
});

/**
 * C2–C3 · en una fila «Sin barra», quitar el cambio propio solo se ofrece si
 * lo hay (`own_tee`); sin nada que quitar ni barra elegida, «Guardar» no se
 * puede pulsar y nunca dice «Barra guardada» sin cambiar nada.
 */
describe('C · quitar el cambio propio, solo si lo hay', () => {
  const sinBarra = (ownTee, options = ['BLUE', 'RED']) => ({
    generalTee: 'YELLOW',
    defaultTee: 'YELLOW',
    courses: [
      {
        golfCourseId: 'g3',
        golfCourseName: 'Aldeamayor',
        tee: null,
        source: 'NONE',
        options,
        ownTee,
      },
    ],
  });
  const abre = () =>
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );

  it('C2: sin cambio propio y sin elegir, «Guardar» desactivado', async () => {
    m.leer.mockResolvedValue(sinBarra(null));
    abre();
    await screen.findByTestId('fila-barra-g3');
    expect(screen.getByTestId('guardar-g3')).toBeDisabled();
    fireEvent.click(screen.getByTestId('guardar-g3'));
    expect(m.campo).not.toHaveBeenCalled();
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('C2: con un cambio propio que ya no vale, se puede quitar', async () => {
    m.leer.mockResolvedValue(sinBarra('GOLD'));
    m.campo.mockResolvedValue({ teeColor: null });
    abre();
    await screen.findByTestId('fila-barra-g3');
    expect(screen.getByTestId('guardar-g3')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('guardar-g3'));
    await waitFor(() => expect(m.campo).toHaveBeenCalledWith('e1', 'g3', null));
  });

  it('C2: sin opciones y sin cambio propio, ni selector ni «Guardar»', async () => {
    m.leer.mockResolvedValue(sinBarra(null, []));
    abre();
    const fila = await screen.findByTestId('fila-barra-g3');
    expect(within(fila).queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByTestId('guardar-g3')).not.toBeInTheDocument();
  });

  it('C2: sin opciones pero con cambio propio, se puede quitar', async () => {
    m.leer.mockResolvedValue(sinBarra('GOLD', []));
    abre();
    await screen.findByTestId('fila-barra-g3');
    expect(screen.getByTestId('guardar-g3')).not.toBeDisabled();
  });

  it('C3: sin cambio propio, eligiendo una barra sí se guarda', async () => {
    m.leer.mockResolvedValue(sinBarra(null));
    abre();
    const fila = await screen.findByTestId('fila-barra-g3');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: 'RED' },
    });
    expect(screen.getByTestId('guardar-g3')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('guardar-g3'));
    await waitFor(() =>
      expect(m.campo).toHaveBeenCalledWith('e1', 'g3', 'RED'),
    );
  });
});

/**
 * D1–D2 · «Cambiar tu barra en {campo}» abre el modal ya desplazado a la fila
 * de ese campo, sin dar el foco a su selector ni mover la página de detrás;
 * «Cambiar tu barra general» lo abre arriba.
 */
describe('D · abrir mis barras en el campo que se cambia', () => {
  const POS = { titulo: 0, fondo: 40, filaG2: 700 };
  const rect = (top) => ({
    top,
    bottom: top + 10,
    left: 0,
    right: 0,
    width: 0,
    height: 10,
    x: 0,
    y: top,
  });
  const conPosiciones = () =>
    vi
      .spyOn(globalThis.Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        if (this.getAttribute('role') === 'dialog') return rect(POS.fondo);
        if (this.dataset?.testid === 'fila-barra-g2') return rect(POS.filaG2);
        return rect(0);
      });
  const abre = async (nombre) => {
    render(<MisBarras inscripcion={{ id: 'e1' }} puedeCambiar />);
    await screen.findByTestId('mis-barras');
    fireEvent.click(screen.getByRole('button', { name: nombre }));
    await screen.findByTestId('fila-barra-g2');
    return screen.getByRole('dialog');
  };

  it('D1: «Cambiar tu barra en {campo}» deja su fila arriba, en el fondo del modal', async () => {
    const posiciones = conPosiciones();
    const scrollIntoView = vi.spyOn(
      globalThis.Element.prototype,
      'scrollIntoView',
    );
    const fondo = await abre(
      `competitions:tees.changeOn {"course":"${LARGO}"}`,
    );
    // La fila queda a 16 px del borde de arriba del fondo
    await waitFor(() => expect(fondo.scrollTop).toBe(700 - 40 - 16));
    // Sin `scrollIntoView`, que desplazaría también la página de detrás
    expect(scrollIntoView).not.toHaveBeenCalled();
    posiciones.mockRestore();
    scrollIntoView.mockRestore();
  });

  it('D1: el foco va al título, no al selector de esa fila', async () => {
    await abre(`competitions:tees.changeOn {"course":"${LARGO}"}`);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        document.getElementById('barras-del-jugador-titulo'),
      ),
    );
    expect(document.activeElement.tagName).not.toBe('SELECT');
  });

  it('D1: se desplaza una sola vez: lo que el jugador mueva después no se pisa', async () => {
    const posiciones = conPosiciones();
    const fondo = await abre(
      `competitions:tees.changeOn {"course":"${LARGO}"}`,
    );
    await waitFor(() => expect(fondo.scrollTop).toBe(644));
    fondo.scrollTop = 0;
    // Tras guardar se vuelven a leer las barras (otras, nuevas): no vuelve a
    // la fila
    m.leer.mockResolvedValue({ ...BARRAS, courses: [...BARRAS.courses] });
    m.campo.mockResolvedValue({ teeColor: 'RED' });
    fireEvent.change(
      within(screen.getByTestId('fila-barra-g2')).getByRole('combobox'),
      { target: { value: 'RED' } },
    );
    fireEvent.click(screen.getByTestId('guardar-g2'));
    await waitFor(() => expect(m.leer).toHaveBeenCalledTimes(3));
    expect(fondo.scrollTop).toBe(0);
    posiciones.mockRestore();
  });

  it('D1: si el fondo ya estaba algo desplazado, lo suma (la fila queda igual de arriba)', async () => {
    const posiciones = conPosiciones();
    render(<MisBarras inscripcion={{ id: 'e1' }} puedeCambiar />);
    await screen.findByTestId('mis-barras');
    // Las barras del modal tardan: mientras, el jugador ya movió el fondo
    let suelta;
    m.leer.mockImplementationOnce(
      () =>
        new Promise((r) => {
          suelta = () => r(BARRAS);
        }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: `competitions:tees.changeOn {"course":"${LARGO}"}`,
      }),
    );
    const fondo = screen.getByRole('dialog');
    await waitFor(() => expect(suelta).toBeDefined());
    fondo.scrollTop = 100;
    suelta();
    await screen.findByTestId('fila-barra-g2');
    await waitFor(() => expect(fondo.scrollTop).toBe(100 + 644));
    posiciones.mockRestore();
  });

  it('D2: «Cambiar tu barra general» lo abre arriba', async () => {
    const posiciones = conPosiciones();
    const fondo = await abre('competitions:tees.changeGeneral');
    await new Promise((r) => setTimeout(r, 20));
    expect(fondo.scrollTop).toBe(0);
    expect(document.activeElement).toBe(
      document.getElementById('barras-del-jugador-titulo'),
    );
    posiciones.mockRestore();
  });
});

const CAMPOS_DE_LA_COMPETICION = [
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
  {
    golf_course: {
      id: 'g2',
      name: LARGO,
      tees: [
        { color: 'YELLOW', gender: 'MALE' },
        { color: 'RED', gender: 'FEMALE' },
      ],
    },
  },
];
const abreLosCampos = async () => {
  m.campos.mockResolvedValue(CAMPOS_DE_LA_COMPETICION);
  render(<BarrasDeLosCamposModal competitionId="c1" onClose={vi.fn()} />);
  await screen.findByTestId('fijar-g1:FEMALE');
};

/**
 * E1–E2 · «Barras de los campos» más compacto: con dos campos cabe entero y
 * centrado en un iPhone 13 (390×664) y un SE (375×667), medido en WebKit; con
 * más, se sigue desplazando hasta «Cerrar». Aquí, las piezas de ese alto.
 */
describe('E · «Barras de los campos», compacto', () => {
  it('E1: menos aire entre bloques y dentro de cada campo', async () => {
    await abreLosCampos();
    const titulo = screen.getByRole('heading', {
      name: 'competitions:tees.courses.title',
    });
    expect(titulo.parentElement.className).toContain('space-y-3');
    const campo = screen.getByText('Altea').closest('section');
    expect(campo.className).toContain('py-2');
    expect(campo.className).not.toContain('p-3');
  });

  it('E1: la explicación, en letra pequeña', async () => {
    await abreLosCampos();
    expect(
      screen.getByText('competitions:tees.courses.hint').className,
    ).toContain('text-xs');
  });

  it('E1: cada género pegado a su campo, y «Cerrar» sin margen de más', async () => {
    await abreLosCampos();
    const genero = screen.getByLabelText('competitions:tees.courses.forWomen', {
      selector: '#barra-g1\\:FEMALE',
    }).parentElement.parentElement;
    expect(genero.className).toBe('mt-1');
    const cerrar = screen.getByRole('button', {
      name: 'competitions:tees.close',
    });
    expect(cerrar.parentElement.className).not.toContain('pt-2');
  });

  it('E2: sigue con el fondo desplazable (4-5 campos llegan a «Cerrar»)', async () => {
    await abreLosCampos();
    expect(screen.getByRole('dialog').className).toContain('overflow-y-auto');
  });
});

/**
 * F1 · a 320 px el selector pasa a su línea y «Fijar» y «Quitar», juntos,
 * debajo: el selector tiene un ancho mínimo con sitio para el color más
 * largo, y nunca se encoge hasta cortarlo.
 */
describe('F · el selector nunca corta un color', () => {
  it('F1: el selector tiene un ancho mínimo y crece; no se encoge a cero', async () => {
    await abreLosCampos();
    const selector = document.getElementById('barra-g1:FEMALE');
    expect(selector.className).toContain('min-w-[7.25rem]');
    expect(selector.className).toContain('flex-1');
    expect(selector.className).not.toContain('min-w-0');
  });

  it('F1: «Fijar» y «Quitar» van juntos, en un grupo que no se parte', async () => {
    await abreLosCampos();
    const fijar = screen.getByTestId('fijar-g1:FEMALE');
    const quitar = screen.getByTestId('quitar-g1:FEMALE');
    expect(fijar.parentElement).toBe(quitar.parentElement);
    expect(fijar.parentElement.className).toContain('shrink-0');
    // Y el grupo va al lado del selector, en la fila que se parte
    const fila = fijar.parentElement.parentElement;
    expect(fila).toBe(document.getElementById('barra-g1:FEMALE').parentElement);
    expect(fila.className).toContain('flex-wrap');
  });
});

// S2 (23 nov 2026): cerrado el modal, el aviso sale arriba
const ARRIBA = { position: 'top-center' };

const fallo = (status, errorCode) =>
  Object.assign(new Error(String(status)), { status, errorCode });

/**
 * K1 · en los modales de barras el aviso de guardado sale DENTRO, en la fila
 * guardada («Guardada»/«Quitada»), y los errores también: ningún toast encima
 * del modal. Si el guardado acaba con el modal ya cerrado, entonces sí, un
 * toast (de un modal se sale siempre, 4 oct 2026).
 */
describe('K · el aviso, en la fila guardada', () => {
  const abreLasDelJugador = async () => {
    const fns = { onClose: vi.fn() };
    const vista = render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        {...fns}
      />,
    );
    await screen.findByTestId('fila-barra-g1');
    return { ...fns, ...vista };
  };

  it('K1: guardar la general dice «Guardada» en su fila, sin toast', async () => {
    m.general.mockResolvedValue({ id: 'e1', teeColor: 'BLUE' });
    await abreLasDelJugador();
    fireEvent.change(screen.getByLabelText('competitions:tees.general'), {
      target: { value: 'BLUE' },
    });
    fireEvent.click(screen.getByTestId('guardar-general'));
    const fila = screen.getByTestId('fila-barra-general');
    expect(
      await within(fila).findByText('competitions:tees.rowSaved'),
    ).toHaveAttribute('role', 'status');
    expect(m.toast.success).not.toHaveBeenCalled();
    expect(m.toast.error).not.toHaveBeenCalled();
    // Solo en esa fila
    expect(
      within(screen.getByTestId('fila-barra-g1')).queryByText(
        'competitions:tees.rowSaved',
      ),
    ).not.toBeInTheDocument();
  });

  it('K1: quitar el cambio propio de un campo dice «Quitada» en su fila', async () => {
    m.campo.mockResolvedValue({ teeColor: null });
    await abreLasDelJugador();
    const fila = screen.getByTestId('fila-barra-g2');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('guardar-g2'));
    expect(
      await within(screen.getByTestId('fila-barra-g2')).findByText(
        'competitions:tees.rowRemoved',
      ),
    ).toBeInTheDocument();
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('K1: un error sale en la fila, como alerta, sin toast', async () => {
    m.campo.mockRejectedValue(fallo(409, 'TEE_CHANGE_CLOSED'));
    await abreLasDelJugador();
    const fila = screen.getByTestId('fila-barra-g1');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('guardar-g1'));
    expect(
      await within(screen.getByTestId('fila-barra-g1')).findByRole('alert'),
    ).toHaveTextContent('competitions:tees.errors.TEE_CHANGE_CLOSED');
    expect(m.toast.error).not.toHaveBeenCalled();
  });

  it('K1: elegir otra vez en esa fila quita el aviso', async () => {
    m.campo.mockRejectedValue(fallo(409, 'TEE_CHANGE_CLOSED'));
    await abreLasDelJugador();
    const selector = within(screen.getByTestId('fila-barra-g1')).getByRole(
      'combobox',
    );
    fireEvent.change(selector, { target: { value: 'RED' } });
    fireEvent.click(screen.getByTestId('guardar-g1'));
    await within(screen.getByTestId('fila-barra-g1')).findByRole('alert');
    fireEvent.change(selector, { target: { value: 'BLUE' } });
    expect(
      within(screen.getByTestId('fila-barra-g1')).queryByRole('alert'),
    ).not.toBeInTheDocument();
  });

  it('K1: cerrado el modal antes de acabar, el aviso va en un toast', async () => {
    let falla;
    m.campo.mockImplementation(
      () =>
        new Promise((_, rechaza) => {
          falla = () => rechaza(fallo(409, 'TEE_CHANGE_CLOSED'));
        }),
    );
    const { unmount } = await abreLasDelJugador();
    const fila = screen.getByTestId('fila-barra-g1');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('guardar-g1'));
    await waitFor(() => expect(falla).toBeDefined());
    unmount();
    falla();
    await waitFor(() =>
      expect(m.toast.error).toHaveBeenCalledWith(
        'competitions:tees.errors.TEE_CHANGE_CLOSED',
        ARRIBA,
      ),
    );
  });

  it('K1: cerrado antes de acabar bien, también un toast', async () => {
    let acaba;
    m.campo.mockImplementation(
      () =>
        new Promise((resuelve) => {
          acaba = () => resuelve({ teeColor: 'RED' });
        }),
    );
    const { unmount } = await abreLasDelJugador();
    const fila = screen.getByTestId('fila-barra-g1');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('guardar-g1'));
    await waitFor(() => expect(acaba).toBeDefined());
    unmount();
    acaba();
    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.saved',
        ARRIBA,
      ),
    );
  });

  it('K1: «Barras de los campos»: «Guardada» en la fila de ese campo y género', async () => {
    m.delCampo.mockResolvedValue({ gender: 'FEMALE', teeColor: 'RED' });
    await abreLosCampos();
    fireEvent.change(document.getElementById('barra-g1:FEMALE'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('fijar-g1:FEMALE'));
    const fila = screen.getByTestId('fila-g1:FEMALE');
    expect(
      await within(fila).findByText('competitions:tees.rowSaved'),
    ).toHaveAttribute('role', 'status');
    // La región de la otra fila está, pero callada
    expect(
      within(screen.getByTestId('fila-g1:MALE')).getByRole('status'),
    ).toBeEmptyDOMElement();
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('K1: «Barras de los campos»: «Quitada» al quitar, y el error en la fila', async () => {
    m.fijadas.mockResolvedValue([
      { golfCourseId: 'g1', gender: 'FEMALE', teeColor: 'RED' },
    ]);
    m.delCampo.mockResolvedValueOnce({ gender: 'FEMALE', teeColor: null });
    await abreLosCampos();
    await waitFor(() =>
      expect(screen.getByTestId('quitar-g1:FEMALE')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('quitar-g1:FEMALE'));
    expect(
      await within(screen.getByTestId('fila-g1:FEMALE')).findByText(
        'competitions:tees.rowRemoved',
      ),
    ).toBeInTheDocument();
    m.delCampo.mockRejectedValueOnce(fallo(403));
    fireEvent.change(document.getElementById('barra-g2:MALE'), {
      target: { value: 'YELLOW' },
    });
    fireEvent.click(screen.getByTestId('fijar-g2:MALE'));
    expect(
      await within(screen.getByTestId('fila-g2:MALE')).findByRole('alert'),
    ).toHaveTextContent('competitions:tees.errors.FORBIDDEN');
    expect(m.toast.error).not.toHaveBeenCalled();
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('K1: «Barras de los campos»: cerrado antes de acabar, el aviso va en un toast', async () => {
    let acaba;
    m.delCampo.mockImplementation(
      () =>
        new Promise((resuelve) => {
          acaba = () => resuelve({ gender: 'FEMALE', teeColor: 'RED' });
        }),
    );
    m.campos.mockResolvedValue(CAMPOS_DE_LA_COMPETICION);
    const { unmount } = render(
      <BarrasDeLosCamposModal competitionId="c1" onClose={vi.fn()} />,
    );
    await screen.findByTestId('fijar-g1:FEMALE');
    fireEvent.change(document.getElementById('barra-g1:FEMALE'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('fijar-g1:FEMALE'));
    await waitFor(() => expect(acaba).toBeDefined());
    unmount();
    acaba();
    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.courses.saved',
        ARRIBA,
      ),
    );
  });

  it('K1: «Barras de los campos»: sin poder leer lo fijado, se dice dentro, sin toast', async () => {
    m.fijadas.mockRejectedValue(fallo(500));
    await abreLosCampos();
    expect(await screen.findByTestId('campos-sin-cargar')).toBeInTheDocument();
    expect(m.toast.error).not.toHaveBeenCalled();
  });
});

/**
 * L1 · si guardar la barra general da error, el selector vuelve a la que
 * tenía.
 */
describe('L · un error al guardar la general', () => {
  it('L1: el selector vuelve a la barra que tenía', async () => {
    m.general.mockRejectedValue(fallo(409, 'TEE_CHANGE_CLOSED'));
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    const general = await screen.findByLabelText('competitions:tees.general');
    expect(general).toHaveValue('YELLOW');
    fireEvent.change(general, { target: { value: 'BLUE' } });
    expect(general).toHaveValue('BLUE');
    fireEvent.click(screen.getByTestId('guardar-general'));
    await within(screen.getByTestId('fila-barra-general')).findByRole('alert');
    expect(general).toHaveValue('YELLOW');
    expect(screen.getByTestId('guardar-general')).toBeDisabled();
  });

  it('L1: guardando bien, se queda en la nueva', async () => {
    m.general.mockResolvedValue({ id: 'e1', teeColor: 'BLUE' });
    m.leer
      .mockResolvedValueOnce(BARRAS)
      .mockResolvedValueOnce({ ...BARRAS, generalTee: 'BLUE' });
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    const general = await screen.findByLabelText('competitions:tees.general');
    fireEvent.change(general, { target: { value: 'BLUE' } });
    fireEvent.click(screen.getByTestId('guardar-general'));
    await within(screen.getByTestId('fila-barra-general')).findByRole('status');
    // Releída, la general ya es la nueva
    await waitFor(() =>
      expect(screen.getByLabelText('competitions:tees.general')).toHaveValue(
        'BLUE',
      ),
    );
  });
});

/**
 * 2 (revisión): guardado bien y la relectura falla: la confirmación no se
 * pierde con las filas, sale encima del «No se pudieron leer las barras».
 */
describe('Guardado bien y relectura fallida', () => {
  it('2: «Barra guardada» sigue a la vista, encima del aviso de no poder leer', async () => {
    m.general.mockResolvedValue({ id: 'e1', teeColor: 'BLUE' });
    m.leer.mockResolvedValueOnce(BARRAS).mockRejectedValueOnce(fallo(500));
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(
      await screen.findByLabelText('competitions:tees.general'),
      {
        target: { value: 'BLUE' },
      },
    );
    fireEvent.click(screen.getByTestId('guardar-general'));
    const sinCargar = await screen.findByTestId('barras-sin-cargar');
    const aviso = screen.getByTestId('barras-guardadas-sin-releer');
    expect(aviso).toHaveTextContent('competitions:tees.saved');
    expect(aviso).toHaveAttribute('role', 'status');
    // Encima del bloque de no poder leer
    expect(
      aviso.compareDocumentPosition(sinCargar) &
        globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('2: sin haber guardado, la región está callada aunque no se puedan leer', async () => {
    m.leer.mockRejectedValue(fallo(500));
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    await screen.findByTestId('barras-sin-cargar');
    expect(
      screen.getByTestId('barras-guardadas-sin-releer'),
    ).toBeEmptyDOMElement();
  });
});

/**
 * 4 (revisión): cada fila de los dos modales tiene su región `status`
 * montada desde el principio; al guardar cambia solo su texto.
 */
describe('Las regiones de aviso, montadas siempre', () => {
  it('4: en las barras del jugador, la misma región antes y después de guardar', async () => {
    m.general.mockResolvedValue({ id: 'e1', teeColor: 'BLUE' });
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    await screen.findByTestId('fila-barra-general');
    const region = within(screen.getByTestId('fila-barra-general')).getByRole(
      'status',
    );
    expect(region).toBeEmptyDOMElement();
    fireEvent.change(screen.getByLabelText('competitions:tees.general'), {
      target: { value: 'BLUE' },
    });
    fireEvent.click(screen.getByTestId('guardar-general'));
    await waitFor(() =>
      expect(region).toHaveTextContent('competitions:tees.rowSaved'),
    );
    expect(region.isConnected).toBe(true);
  });

  it('4: en las barras de los campos, igual', async () => {
    m.delCampo.mockResolvedValue({ gender: 'FEMALE', teeColor: 'RED' });
    await abreLosCampos();
    const region = within(screen.getByTestId('fila-g1:FEMALE')).getByRole(
      'status',
    );
    expect(region).toBeEmptyDOMElement();
    fireEvent.change(document.getElementById('barra-g1:FEMALE'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('fijar-g1:FEMALE'));
    await waitFor(() =>
      expect(region).toHaveTextContent('competitions:tees.rowSaved'),
    );
    expect(region.isConnected).toBe(true);
  });
});

describe('Revisión · lo que quedaba sin fijar', () => {
  it('2: guardado y releído bien, el aviso va en la fila, no arriba', async () => {
    m.general.mockResolvedValue({ id: 'e1', teeColor: 'BLUE' });
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(
      await screen.findByLabelText('competitions:tees.general'),
      {
        target: { value: 'BLUE' },
      },
    );
    fireEvent.click(screen.getByTestId('guardar-general'));
    await within(screen.getByTestId('fila-barra-general')).findByText(
      'competitions:tees.rowSaved',
    );
    expect(
      screen.getByTestId('barras-guardadas-sin-releer'),
    ).toBeEmptyDOMElement();
  });

  it('K1: al guardar otra fila, el error de la anterior se va en cuanto empieza', async () => {
    m.campo.mockRejectedValueOnce(fallo(409, 'TEE_CHANGE_CLOSED'));
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    const filaG1 = await screen.findByTestId('fila-barra-g1');
    fireEvent.change(within(filaG1).getByRole('combobox'), {
      target: { value: 'RED' },
    });
    fireEvent.click(screen.getByTestId('guardar-g1'));
    await within(screen.getByTestId('fila-barra-g1')).findByRole('alert');
    // La siguiente se queda en vuelo
    m.campo.mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.change(
      within(screen.getByTestId('fila-barra-g2')).getByRole('combobox'),
      { target: { value: 'RED' } },
    );
    fireEvent.click(screen.getByTestId('guardar-g2'));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('fila-barra-g1')).queryByRole('alert'),
      ).not.toBeInTheDocument(),
    );
  });

  it('K1: «Barras de los campos»: quitada con el modal ya cerrado, su toast de quitada', async () => {
    m.fijadas.mockResolvedValue([
      { golfCourseId: 'g1', gender: 'FEMALE', teeColor: 'RED' },
    ]);
    let acaba;
    m.delCampo.mockImplementation(
      () =>
        new Promise((resuelve) => {
          acaba = () => resuelve({ gender: 'FEMALE', teeColor: null });
        }),
    );
    m.campos.mockResolvedValue(CAMPOS_DE_LA_COMPETICION);
    const { unmount } = render(
      <BarrasDeLosCamposModal competitionId="c1" onClose={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('quitar-g1:FEMALE')).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByTestId('quitar-g1:FEMALE'));
    await waitFor(() => expect(acaba).toBeDefined());
    unmount();
    acaba();
    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.courses.removed',
        ARRIBA,
      ),
    );
  });
});

/**
 * F1 (revisión): «{color} (ya no disponible en este campo)» medía 325 px en
 * WebKit y el selector, 106-202: se cortaba a cualquier ancho, también en su
 * propia línea. El selector dice solo el color y la marca va debajo, en una
 * línea que se parte.
 */
describe('F · la fijada que ya no está, sin cortar', () => {
  const conFijadaQueNoEsta = async () => {
    m.fijadas.mockResolvedValue([
      { golfCourseId: 'g1', gender: 'FEMALE', teeColor: 'GOLD' },
    ]);
    await abreLosCampos();
    await waitFor(() =>
      expect(document.getElementById('barra-g1:FEMALE')).toHaveValue('GOLD'),
    );
  };

  it('F1: en el selector, el color solo', async () => {
    await conFijadaQueNoEsta();
    const selector = document.getElementById('barra-g1:FEMALE');
    expect(selector.options[selector.selectedIndex].text).toBe(
      'golfCourses:form.teeColors.GOLD',
    );
  });

  it('F1: «ya no disponible», debajo de la fila, en un texto que se parte', async () => {
    await conFijadaQueNoEsta();
    const nota = within(screen.getByTestId('fila-g1:FEMALE')).getByText(
      'competitions:tees.notAvailableHere {"color":"golfCourses:form.teeColors.GOLD"}',
    );
    expect(nota.tagName).toBe('P');
    expect(nota.className).toContain('break-words');
    // Fuera de la fila del selector y los botones
    expect(nota.parentElement).toBe(screen.getByTestId('fila-g1:FEMALE'));
  });

  it('F1: sin fijada que falte, no hay nota', async () => {
    await abreLosCampos();
    expect(
      screen.queryByText(/competitions:tees.notAvailableHere/),
    ).not.toBeInTheDocument();
  });
});

/**
 * A3 (revisión de arquitectura): el desplazamiento a la fila del campo no
 * busca por `data-testid` (un selector CSS): va por un mapa de refs por
 * `golfCourseId`. Con un id que rompería un selector, sigue funcionando.
 */
describe('D · la fila del campo, por su ref', () => {
  it('A3: un id de campo con comillas y corchetes también lleva a su fila', async () => {
    const RARO = 'g"2]';
    m.leer.mockResolvedValue({
      ...BARRAS,
      courses: [
        BARRAS.courses[0],
        { ...BARRAS.courses[1], golfCourseId: RARO },
      ],
    });
    const posiciones = vi
      .spyOn(globalThis.Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function () {
        const top =
          this.getAttribute('role') === 'dialog'
            ? 40
            : this.dataset?.testid === `fila-barra-${RARO}`
              ? 700
              : 0;
        return {
          top,
          bottom: top + 10,
          left: 0,
          right: 0,
          width: 0,
          height: 10,
          x: 0,
          y: top,
        };
      });
    render(<MisBarras inscripcion={{ id: 'e1' }} puedeCambiar />);
    await screen.findByTestId('mis-barras');
    fireEvent.click(
      screen.getByRole('button', {
        name: `competitions:tees.changeOn {"course":"${LARGO}"}`,
      }),
    );
    await screen.findByTestId(`fila-barra-${RARO}`);
    await waitFor(() =>
      expect(screen.getByRole('dialog').scrollTop).toBe(700 - 40 - 16),
    );
    posiciones.mockRestore();
  });
});

/**
 * F1 también en las barras de un jugador («Mis barras», «Barras de X»): su
 * barra propia que el campo ya no tiene, solo con el color en el selector y
 * «{color} (ya no disponible en este campo)» debajo, en un texto que se parte.
 */
describe('F · la barra propia que ya no está, sin cortar', () => {
  const conPropiaQueNoEsta = async () => {
    m.leer.mockResolvedValue({
      ...BARRAS,
      courses: [
        {
          golfCourseId: 'g3',
          golfCourseName: 'Aldeamayor',
          tee: 'GOLD',
          source: 'OWN',
          options: ['BLUE', 'RED'],
          ownTee: 'GOLD',
        },
      ],
    });
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    return screen.findByTestId('fila-barra-g3');
  };

  it('F1: en el selector, el color solo', async () => {
    const fila = await conPropiaQueNoEsta();
    const selector = within(fila).getByRole('combobox');
    expect(selector).toHaveValue('GOLD');
    expect(selector.options[selector.selectedIndex].text).toBe(
      'golfCourses:form.teeColors.GOLD',
    );
  });

  it('F1: «ya no disponible», debajo, en un texto que se parte, fuera de la fila del selector', async () => {
    const fila = await conPropiaQueNoEsta();
    const nota = within(fila).getByText(
      'competitions:tees.notAvailableHere {"color":"golfCourses:form.teeColors.GOLD"}',
    );
    expect(nota.tagName).toBe('P');
    expect(nota.className).toContain('break-words');
    expect(nota.parentElement).toBe(fila);
  });

  it('F1: sin barra propia que falte, no hay nota', async () => {
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    await screen.findByTestId('fila-barra-g1');
    expect(
      screen.queryByText(/competitions:tees.notAvailableHere/),
    ).not.toBeInTheDocument();
  });

  it('F1: sin poder cambiarla, ni selector ni nota (el valor ya dice cuál es)', async () => {
    m.leer.mockResolvedValue({
      ...BARRAS,
      courses: [
        {
          golfCourseId: 'g3',
          golfCourseName: 'Aldeamayor',
          tee: 'GOLD',
          source: 'OWN',
          options: ['BLUE', 'RED'],
          ownTee: 'GOLD',
        },
      ],
    });
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar={false}
        onClose={vi.fn()}
      />,
    );
    const fila = await screen.findByTestId('fila-barra-g3');
    expect(within(fila).queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      within(fila).queryByText(/competitions:tees.notAvailableHere/),
    ).not.toBeInTheDocument();
  });
});

describe('/code-review · avisos que no ocupan sitio y «Barra quitada»', () => {
  it('2: sin nada que decir, la región de arriba no ocupa sitio', async () => {
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    await screen.findByTestId('fila-barra-g1');
    expect(
      screen.getByTestId('barras-guardadas-sin-releer').className,
    ).toContain('sr-only');
  });

  it('3: quitada bien y releída mal, dice «Barra quitada», no «guardada»', async () => {
    m.campo.mockResolvedValue({ teeColor: null });
    m.leer.mockResolvedValueOnce(BARRAS).mockRejectedValueOnce(fallo(500));
    render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    const fila = await screen.findByTestId('fila-barra-g2');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('guardar-g2'));
    await screen.findByTestId('barras-sin-cargar');
    const aviso = screen.getByTestId('barras-guardadas-sin-releer');
    expect(aviso).toHaveTextContent('competitions:tees.removed');
    expect(aviso.className).not.toContain('sr-only');
  });

  it('3: y cerrado el modal tras quitar, el toast dice «Barra quitada»', async () => {
    let acaba;
    m.campo.mockImplementation(
      () =>
        new Promise((r) => {
          acaba = () => r({ teeColor: null });
        }),
    );
    const { unmount } = render(
      <BarrasDelJugadorModal
        inscripcion={{ id: 'e1', userName: 'Ana' }}
        puedeCambiar
        onClose={vi.fn()}
      />,
    );
    const fila = await screen.findByTestId('fila-barra-g2');
    fireEvent.change(within(fila).getByRole('combobox'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByTestId('guardar-g2'));
    await waitFor(() => expect(acaba).toBeDefined());
    unmount();
    acaba();
    await waitFor(() =>
      expect(m.toast.success).toHaveBeenCalledWith(
        'competitions:tees.removed',
        ARRIBA,
      ),
    );
  });
});

describe('/code-review · «Barras de los campos» sin poder leerlas', () => {
  it('4: el bloque de no poder leer se anuncia (alerta)', async () => {
    m.fijadas.mockRejectedValue(fallo(500));
    await abreLosCampos();
    expect(await screen.findByTestId('campos-sin-cargar')).toHaveAttribute(
      'role',
      'alert',
    );
  });
});
