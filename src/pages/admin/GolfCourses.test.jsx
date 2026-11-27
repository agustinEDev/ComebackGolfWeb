// src/pages/admin/GolfCourses.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import GolfCourses from './GolfCourses';
import customToast from '../../utils/toast';

// Lo que devuelven ahora `useTranslation` y `useAuth`: el mismo objeto salvo
// cuando una prueba cambia de idioma o trae otro objeto de usuario
const { ACTUAL, TRADUCCION, ADMIN } = vi.hoisted(() => ({
  ACTUAL: { traduccion: null, user: null },
  TRADUCCION: { t: (key) => key, i18n: { language: 'es' } },
  ADMIN: {
    id: 'admin-1',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ACTUAL.traduccion ?? TRADUCCION,
}));

vi.mock('../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// El usuario, UNO para toda la prueba: la página carga la lista en un efecto
// que depende de `user`, y un objeto nuevo en cada render la recargaba sin fin.
// Mientras recarga, el modal se desmonta y se vuelve a montar, y con carga un
// Escape caía en ese hueco y se perdía (FE #624)
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: ACTUAL.user ?? ADMIN, loading: false }),
}));

vi.mock('../../components/layout/HeaderAuth', () => ({
  default: () => <div data-testid="header-auth">Header</div>,
}));

const mockList = vi.fn();
const mockGetById = vi.fn();

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
vi.mock('../../composition', () => ({
  listGolfCoursesUseCase: { execute: (...args) => mockList(...args) },
  getGolfCourseUseCase: { execute: (...args) => mockGetById(...args) },
  createGolfCourseAdminUseCase: { execute: (...args) => mockCreate(...args) },
  updateGolfCourseUseCase: { execute: (...args) => mockUpdate(...args) },
}));

// La tabla real necesita demasiado contexto; aquí solo hace falta poder pulsar
// "editar" sobre un campo concreto
vi.mock('../../components/golf_course/GolfCourseTable', () => ({
  default: ({ courses, onEdit, onView }) => (
    <div>
      {courses.map((course) => (
        <div key={course.id}>
          <button onClick={() => onEdit(course)}>editar {course.name}</button>
          <button onClick={() => onView(course)}>ver {course.name}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/golf_course/GolfCourseDetailModal', () => ({
  default: ({ course, onClose }) => (
    <div data-testid="detalle">
      detalle de {course?.name} · hoyos: {(course?.holes || []).length}
      <button onClick={onClose}>cerrar detalle</button>
    </div>
  ),
}));

vi.mock('../../components/golf_course/GolfCourseForm', () => ({
  default: ({ initialData, onSubmit }) => (
    <div data-testid="edit-form">
      hoyos: {(initialData?.holes || []).length}
      <button onClick={() => onSubmit({}).catch(() => {})}>
        guardar campo
      </button>
    </div>
  ),
}));

// Tal como llega en el listado: sin tarjeta
const LISTED = {
  id: 'course-1',
  name: 'Real Club de Golf',
  courseType: 'STANDARD_18',
  tees: [{ color: 'YELLOW' }],
  holes: [],
};

// Tal como llega al pedirlo por su id: con sus 18 hoyos
const FULL = {
  ...LISTED,
  holes: Array.from({ length: 18 }, (_, i) => ({
    holeNumber: i + 1,
    par: 4,
    strokeIndex: i + 1,
  })),
};

describe('GolfCourses (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ACTUAL.traduccion = null;
    ACTUAL.user = null;
    mockList.mockResolvedValue({ courses: [LISTED], total: 1 });
    mockGetById.mockResolvedValue(FULL);
  });

  it('pide el campo entero antes de abrir la edición', async () => {
    render(<GolfCourses embedded />);
    const editar = await screen.findByText('editar Real Club de Golf');

    fireEvent.click(editar);

    await waitFor(() => expect(mockGetById).toHaveBeenCalledWith('course-1'));
  });

  it('el formulario recibe la tarjeta completa, no la del listado', async () => {
    render(<GolfCourses embedded />);
    fireEvent.click(await screen.findByText('editar Real Club de Golf'));

    // Es lo que evita la pérdida: sin los 18 hoyos, el formulario arranca con
    // los suyos por defecto de par 4 y guardar sobrescribe la tarjeta real
    expect(await screen.findByTestId('edit-form')).toHaveTextContent(
      'hoyos: 18',
    );
  });

  it('no abre la edición si el campo no se puede cargar', async () => {
    mockGetById.mockRejectedValue(new Error('boom'));
    render(<GolfCourses embedded />);

    fireEvent.click(await screen.findByText('editar Real Club de Golf'));

    await waitFor(() => expect(mockGetById).toHaveBeenCalled());
    expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
  });

  it('lee los campos de la página que devuelve el listado', async () => {
    render(<GolfCourses embedded />);

    expect(
      await screen.findByText('editar Real Club de Golf'),
    ).toBeInTheDocument();
  });

  describe('detalle del campo', () => {
    it('el ojo abre el detalle en lugar del aviso de «próximamente»', async () => {
      mockGetById.mockResolvedValue(FULL);
      render(<GolfCourses />);

      fireEvent.click(await screen.findByText('ver Real Club de Golf'));

      expect(await screen.findByTestId('detalle')).toHaveTextContent(
        'detalle de Real Club de Golf',
      );
    });

    // El listado no trae la tarjeta, que es justo lo que el detalle enseña
    it('pide el campo entero, no usa el del listado', async () => {
      mockGetById.mockResolvedValue(FULL);
      render(<GolfCourses />);

      fireEvent.click(await screen.findByText('ver Real Club de Golf'));

      await waitFor(() => expect(mockGetById).toHaveBeenCalledWith('course-1'));
      expect(await screen.findByTestId('detalle')).toHaveTextContent(
        'hoyos: 18',
      );
    });

    it('no abre el detalle si el campo no se puede cargar', async () => {
      mockGetById.mockRejectedValue(new Error('boom'));
      render(<GolfCourses />);

      fireEvent.click(await screen.findByText('ver Real Club de Golf'));

      await waitFor(() => expect(mockGetById).toHaveBeenCalled());
      expect(screen.queryByTestId('detalle')).toBeNull();
    });

    it('se cierra', async () => {
      mockGetById.mockResolvedValue(FULL);
      render(<GolfCourses />);

      fireEvent.click(await screen.findByText('ver Real Club de Golf'));
      fireEvent.click(await screen.findByText('cerrar detalle'));

      await waitFor(() => expect(screen.queryByTestId('detalle')).toBeNull());
    });
  });

  // Pasaron a ModalShell el 4 oct 2026: se anuncian con su título, y Escape
  // cierra, que antes no lo hacía
  describe('los modales de crear y editar', () => {
    it('editar se anuncia con su título y se cierra con Escape o tocando fuera', async () => {
      render(<GolfCourses embedded />);
      fireEvent.click(await screen.findByText('editar Real Club de Golf'));

      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveAccessibleName('pages.admin.editCourseTitle');
      // Tocar fuera lo cierra (23 nov 2026); y Escape, también
      fireEvent.mouseDown(dialogo);
      fireEvent.mouseUp(dialogo);
      fireEvent.click(dialogo);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      fireEvent.click(screen.getByText('editar Real Club de Golf'));
      await screen.findByRole('dialog');
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('crear se anuncia con su título y se cierra con Escape o tocando fuera', async () => {
      render(<GolfCourses embedded />);
      fireEvent.click(await screen.findByText('pages.admin.createCourse'));

      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveAccessibleName('pages.admin.createCourseTitle');
      // Tocar fuera lo cierra (23 nov 2026); y Escape, también
      fireEvent.mouseDown(dialogo);
      fireEvent.mouseUp(dialogo);
      fireEvent.click(dialogo);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      fireEvent.click(screen.getByText('pages.admin.createCourse'));
      await screen.findByRole('dialog');
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });
  });

  // Revisión de la PR de los modales: Escape cerraba el modal con el guardado
  // en vuelo; si fallaba, el error no salía en ningún sitio
  describe('Escape (y el fondo) mientras se guarda', () => {
    it.each([
      [
        'crear',
        () => fireEvent.click(screen.getByText('pages.admin.createCourse')),
        mockCreate,
      ],
      [
        'editar',
        () => fireEvent.click(screen.getByText('editar Real Club de Golf')),
        mockUpdate,
      ],
    ])(
      '%s no se cierra con el guardado en vuelo, ni con Escape ni tocando fuera',
      async (_, abrir, guardar) => {
        guardar.mockReturnValue(new Promise(() => {}));
        render(<GolfCourses embedded />);
        await screen.findByText('editar Real Club de Golf');
        abrir();
        fireEvent.click(await screen.findByText('guardar campo'));

        await waitFor(() =>
          expect(screen.getByRole('dialog')).toHaveAttribute(
            'aria-busy',
            'true',
          ),
        );
        fireEvent.keyDown(document, { key: 'Escape' });
        // Ni tocando fuera: el fondo cierra solo cuando cerraría Escape
        fireEvent.mouseDown(screen.getByRole('dialog'));
        fireEvent.mouseUp(screen.getByRole('dialog'));
        fireEvent.click(screen.getByRole('dialog'));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
      },
    );

    it.each([
      [
        'crear',
        () => fireEvent.click(screen.getByText('pages.admin.createCourse')),
        mockCreate,
      ],
      [
        'editar',
        () => fireEvent.click(screen.getByText('editar Real Club de Golf')),
        mockUpdate,
      ],
    ])(
      '%s se puede cerrar otra vez si el guardado falla',
      async (_, abrir, guardar) => {
        guardar.mockRejectedValue(new Error('El servidor no quiso'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<GolfCourses embedded />);
        await screen.findByText('editar Real Club de Golf');
        abrir();
        fireEvent.click(await screen.findByText('guardar campo'));

        await waitFor(() =>
          expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-busy'),
        );
        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      },
    );
  });
});

// Una respuesta que llega cuando la prueba quiere
const aMano = () => {
  let resolver;
  let rechazar;
  const promesa = new Promise((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
};

/**
 * La lista se pide dentro de su efecto: lo de siempre, y lo que llega tarde
 * ya no toca nada.
 *
 *   #      caso                                      | qué pasa
 *   -------|-----------------------------------------|------------------------------
 *   T1-1   cambiar de idioma con la lista cargada   | no se pide otra vez
 *   T1-2   la sesión trae otro objeto de usuario    | se pide otra vez, con la espera
 *   T1-6   la lista no se puede cargar              | el aviso, y se quita la espera
 *   T1-7   crear o editar un campo                  | se pide otra vez, con la espera
 *   T1-14  se sale con la lista pidiéndose          | su respuesta no toca nada
 */
describe('GolfCourses (admin) · la carga de la lista', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ACTUAL.traduccion = null;
    ACTUAL.user = null;
    mockList.mockResolvedValue({ courses: [LISTED], total: 1 });
    mockGetById.mockResolvedValue(FULL);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const OTRO = { ...LISTED, id: 'course-2', name: 'Campo Nuevo' };

  it('T1-1: cambiar de idioma no vuelve a pedir la lista', async () => {
    // Given la lista cargada
    const { rerender } = render(<GolfCourses embedded />);
    await screen.findByText('editar Real Club de Golf');

    // When cambia el idioma
    ACTUAL.traduccion = { t: (key) => key, i18n: { language: 'en' } };
    rerender(<GolfCourses embedded />);
    await act(async () => {});

    // Then no se pide otra vez
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it('T1-2: con otro objeto de usuario se pide otra vez, con la espera mientras', async () => {
    const { rerender } = render(<GolfCourses embedded />);
    await screen.findByText('editar Real Club de Golf');
    const segunda = aMano();
    mockList.mockReturnValueOnce(segunda.promesa);

    ACTUAL.user = { ...ADMIN };
    rerender(<GolfCourses embedded />);

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status')).toBeInTheDocument();
    await act(async () => segunda.resolver({ courses: [OTRO], total: 1 }));
    expect(await screen.findByText('editar Campo Nuevo')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('T1-6: si la lista no se puede cargar, lo dice y quita la espera', async () => {
    // Given la lista falla
    mockList.mockRejectedValue(new Error('sin red'));

    // When se abre la página
    render(<GolfCourses embedded />);

    // Then el aviso traducido (sin estado HTTP no es un motivo), y sin la espera
    await waitFor(() =>
      expect(customToast.error).toHaveBeenCalledWith(
        'pages.admin.errorLoading',
      ),
    );
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(screen.getByText('pages.admin.createCourse')).toBeInTheDocument();
  });

  it('T1-6: sin mensaje, el aviso es el suyo', async () => {
    mockList.mockRejectedValue(new Error(''));

    render(<GolfCourses embedded />);

    await waitFor(() =>
      expect(customToast.error).toHaveBeenCalledWith(
        'pages.admin.errorLoading',
      ),
    );
  });

  it.each([
    [
      'crear',
      () => fireEvent.click(screen.getByText('pages.admin.createCourse')),
      mockCreate,
    ],
    [
      'editar',
      () => fireEvent.click(screen.getByText('editar Real Club de Golf')),
      mockUpdate,
    ],
  ])(
    'T1-7: tras %s, la lista se pide otra vez con la espera',
    async (_, abrir, guardar) => {
      // Given un campo guardado con éxito
      guardar.mockResolvedValue({});
      render(<GolfCourses embedded />);
      await screen.findByText('editar Real Club de Golf');
      const segunda = aMano();
      mockList.mockReturnValueOnce(segunda.promesa);
      abrir();

      // When se guarda
      fireEvent.click(await screen.findByText('guardar campo'));

      // Then se pide otra vez, y se espera hasta tenerla
      await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
      expect(mockList).toHaveBeenLastCalledWith({ approvalStatus: 'APPROVED' });
      expect(screen.getByRole('status')).toBeInTheDocument();
      await act(async () =>
        segunda.resolver({ courses: [LISTED, OTRO], total: 2 }),
      );
      expect(await screen.findByText('editar Campo Nuevo')).toBeInTheDocument();
      expect(screen.queryByRole('status')).toBeNull();
    },
  );

  it('T1-13: pedida dos veces seguidas, la vieja que llega tarde no pisa la nueva', async () => {
    const { rerender } = render(<GolfCourses embedded />);
    await screen.findByText('editar Real Club de Golf');
    const vieja = aMano();
    const nueva = aMano();
    mockList
      .mockReturnValueOnce(vieja.promesa)
      .mockReturnValueOnce(nueva.promesa);
    ACTUAL.user = { ...ADMIN };
    rerender(<GolfCourses embedded />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    ACTUAL.user = { ...ADMIN };
    rerender(<GolfCourses embedded />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(3));

    await act(async () =>
      vieja.resolver({
        courses: [{ ...LISTED, id: 'v', name: 'Campo Viejo' }],
        total: 1,
      }),
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    await act(async () => nueva.resolver({ courses: [OTRO], total: 1 }));
    expect(await screen.findByText('editar Campo Nuevo')).toBeInTheDocument();
    expect(screen.queryByText('editar Campo Viejo')).toBeNull();
  });

  it('T1-13: y si la vieja llega después, tampoco', async () => {
    const { rerender } = render(<GolfCourses embedded />);
    await screen.findByText('editar Real Club de Golf');
    const vieja = aMano();
    const nueva = aMano();
    mockList
      .mockReturnValueOnce(vieja.promesa)
      .mockReturnValueOnce(nueva.promesa);
    ACTUAL.user = { ...ADMIN };
    rerender(<GolfCourses embedded />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
    ACTUAL.user = { ...ADMIN };
    rerender(<GolfCourses embedded />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(3));

    await act(async () => nueva.resolver({ courses: [OTRO], total: 1 }));
    await screen.findByText('editar Campo Nuevo');
    await act(async () =>
      vieja.resolver({
        courses: [{ ...LISTED, id: 'v', name: 'Campo Viejo' }],
        total: 1,
      }),
    );

    expect(screen.getByText('editar Campo Nuevo')).toBeInTheDocument();
    expect(screen.queryByText('editar Campo Viejo')).toBeNull();
  });

  it('T1-14: si se sale con la lista pidiéndose, su fallo no avisa de nada', async () => {
    // Given la lista pidiéndose
    const tarde = aMano();
    mockList.mockReturnValueOnce(tarde.promesa);
    const { unmount } = render(<GolfCourses embedded />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    // When se sale y luego falla
    unmount();
    await act(async () => tarde.rechazar(new Error('tarde')));

    // Then no toca nada
    expect(customToast.error).not.toHaveBeenCalled();
  });
});

/**
 * La lista de campos aprobados cargaba los 805 de golpe y la página medía casi
 * 200.000 px. Ahora, un buscador por nombre y de 25 en 25 con «Ver más»
 * (Agustín, 26 nov 2026). Solo front: la API ya los da todos.
 *
 *   caso | qué                                  | se ve
 *   -----|--------------------------------------|---------------------------
 *   L1   | 61 campos                            | los 25 primeros
 *   L2   | «Ver más»                            | 25 más; al final, sin botón
 *   L3   | buscar «abama» (sin tilde)           | solo «Ábama»
 *   L4   | el total                             | el de todos, no el de la página
 */
describe('GolfCourses · la lista, de 25 en 25 y con buscador', () => {
  const muchos = [
    ...Array.from({ length: 60 }, (_, i) => ({
      ...LISTED,
      id: `c-${i + 1}`,
      name: `Campo ${i + 1}`,
    })),
    { ...LISTED, id: 'c-abama', name: 'Ábama' },
  ];
  const filas = () => screen.queryAllByText(/^editar /);

  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({ courses: muchos, total: muchos.length });
  });

  it('L1 enseña los 25 primeros', async () => {
    render(<GolfCourses />);
    await waitFor(() => expect(filas()).toHaveLength(25));
  });

  it('L2 «Ver más» añade 25, y desaparece cuando ya están todos', async () => {
    render(<GolfCourses />);
    await waitFor(() => expect(filas()).toHaveLength(25));

    fireEvent.click(
      screen.getByRole('button', { name: /pages.admin.showMore/ }),
    );
    expect(filas()).toHaveLength(50);
    fireEvent.click(
      screen.getByRole('button', { name: /pages.admin.showMore/ }),
    );
    expect(filas()).toHaveLength(61);
    expect(
      screen.queryByRole('button', { name: /pages.admin.showMore/ }),
    ).toBeNull();
  });

  it('L3 el buscador no mira tildes ni mayúsculas', async () => {
    render(<GolfCourses />);
    await waitFor(() => expect(filas()).toHaveLength(25));

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'pages.admin.searchByName' }),
      { target: { value: 'ABAMA' } },
    );
    expect(filas().map((b) => b.textContent)).toEqual(['editar Ábama']);
  });

  it('L4 el total es el de todos', async () => {
    render(<GolfCourses />);
    await waitFor(() => expect(filas()).toHaveLength(25));
    expect(screen.getByText('61')).toBeInTheDocument();
  });

  it('L5 una búsqueda sin resultados lo dice, no que no hay campos', async () => {
    render(<GolfCourses />);
    await waitFor(() => expect(filas()).toHaveLength(25));

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'pages.admin.searchByName' }),
      { target: { value: 'zzz' } },
    );
    expect(filas()).toHaveLength(0);
    expect(screen.getByText('pages.admin.noSearchResults')).toBeInTheDocument();
  });
});
