import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  renderHook,
  screen,
  fireEvent,
  act,
  within,
} from '@testing-library/react';
import BarrasPendientesModal from './BarrasPendientesModal';
import { useBarrasPendientes } from '../../hooks/useBarrasPendientes';

// F13: en los modales de barras el aviso sale arriba, sin tapar sus botones
const ARRIBA = { position: 'top-center' };

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave, v) => (v ? `${clave} ${JSON.stringify(v)}` : clave),
  }),
}));
const mocks = vi.hoisted(() => ({
  leer: vi.fn(),
  fijar: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('../../composition/cargarBarras', () => ({
  cargarBarras: () =>
    Promise.resolve({
      getEnrollmentTeesUseCase: { execute: mocks.leer },
      changeEnrollmentCourseTeeUseCase: { execute: mocks.fijar },
    }),
}));
vi.mock('../../utils/toast', () => ({ default: mocks.toast }));
vi.mock('../../utils/registraElFallo', () => ({ registraElFallo: vi.fn() }));

const campo = (id, source, options = ['BLUE', 'RED']) => ({
  golfCourseId: id,
  golfCourseName: `Campo ${id}`,
  tee: null,
  source,
  options,
});

/**
 * F1 · tras apuntarse, los campos sin su barra se piden en el mismo flujo,
 * uno a uno; cerrarlo sin elegir no rompe nada.
 */
describe('useBarrasPendientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solo los campos en NONE con opciones, uno a uno', async () => {
    mocks.leer.mockResolvedValue({
      courses: [
        campo('g1', 'GENERAL'),
        campo('g2', 'NONE'),
        campo('g3', 'NONE', []),
        campo('g4', 'NONE'),
      ],
    });
    mocks.fijar.mockResolvedValue({ teeColor: 'RED' });
    const alGuardar = vi.fn();
    const { result } = renderHook(() => useBarrasPendientes({ alGuardar }));

    await act(() => result.current.comprobar('e1'));
    expect(mocks.leer).toHaveBeenCalledWith('e1');
    expect(result.current.campo.golfCourseId).toBe('g2');

    await act(() => result.current.guardar('RED'));
    expect(mocks.fijar).toHaveBeenCalledWith('e1', 'g2', 'RED');
    // Quedaba otro campo: el aviso va dentro del modal, no en un toast
    // encima (K1, revisión de la pasada del iPhone)
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(result.current.aviso).toEqual({
      tipo: 'ok',
      texto: 'tees.savedOn {"course":"Campo g2"}',
    });
    expect(alGuardar).toHaveBeenCalledTimes(1);
    expect(result.current.campo.golfCourseId).toBe('g4');

    act(() => result.current.saltar());
    expect(result.current.campo).toBeNull();
  });

  it('1: saltar mientras se guarda A no se come B', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('gA', 'NONE'), campo('gB', 'NONE'), campo('gC', 'NONE')],
    });
    let termina;
    mocks.fijar.mockReturnValue(
      new Promise((r) => {
        termina = r;
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));

    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.saltar());
    act(() => result.current.cerrar());
    await act(async () => {
      termina({ teeColor: 'RED' });
      await guardado;
    });

    expect(mocks.fijar).toHaveBeenCalledWith('e1', 'gA', 'RED');
    expect(result.current.campo.golfCourseId).toBe('gB');
  });

  it('1: mientras se guarda, saltar no cambia el campo de la pantalla', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('gA', 'NONE'), campo('gB', 'NONE')],
    });
    mocks.fijar.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));

    act(() => {
      result.current.guardar('RED');
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => result.current.saltar());

    expect(result.current.campo.golfCourseId).toBe('gA');
  });

  it('1: si la lista cambia mientras se guarda, se quita el guardado, no el primero', async () => {
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('gA', 'NONE'), campo('gB', 'NONE')],
    });
    let termina;
    mocks.fijar.mockReturnValue(
      new Promise((r) => {
        termina = r;
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));

    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    // Otra comprobación deja delante otro campo
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('gB', 'NONE'), campo('gA', 'NONE')],
    });
    await act(() => result.current.comprobar('e1'));
    await act(async () => {
      termina({ teeColor: 'RED' });
      await guardado;
    });

    expect(result.current.campo.golfCourseId).toBe('gB');
  });

  it('1: guardando, «Ahora no» está desactivado', () => {
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('competitions:tees.notNow')).toBeDisabled();
  });

  it('CR4: una comprobación que llega tarde no pisa la última', async () => {
    let vieja;
    mocks.leer
      .mockReturnValueOnce(
        new Promise((r) => {
          vieja = r;
        }),
      )
      .mockResolvedValueOnce({ courses: [campo('gNueva', 'NONE')] });
    const { result } = renderHook(() => useBarrasPendientes());

    let primera;
    act(() => {
      primera = result.current.comprobar('e-vieja');
    });
    await act(() => result.current.comprobar('e-nueva'));
    expect(result.current.campo.golfCourseId).toBe('gNueva');

    await act(async () => {
      vieja({ courses: [campo('gVieja', 'NONE')] });
      await primera;
    });
    expect(result.current.campo.golfCourseId).toBe('gNueva');
  });

  it('CR5: el guardado de una inscripción no toca la cola de otra', async () => {
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('gA', 'NONE'), campo('gB', 'NONE')],
    });
    let termina;
    mocks.fijar.mockReturnValue(
      new Promise((r) => {
        termina = r;
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));

    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    // Mientras, otra inscripción con el mismo campo pendiente
    mocks.leer.mockResolvedValueOnce({ courses: [campo('gA', 'NONE')] });
    await act(() => result.current.comprobar('e2'));
    await act(async () => {
      termina({ teeColor: 'RED' });
      await guardado;
    });

    expect(mocks.fijar).toHaveBeenCalledWith('e1', 'gA', 'RED');
    expect(result.current.campo?.golfCourseId).toBe('gA');
  });

  it('sin campos en NONE, nada que pedir', async () => {
    mocks.leer.mockResolvedValue({ courses: [campo('g1', 'COURSE')] });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    expect(result.current.campo).toBeNull();
  });

  it('sin poder leerlas, ni se pide ni se avisa: lo dice la ficha', async () => {
    mocks.leer.mockRejectedValue(new Error('red'));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    expect(result.current.campo).toBeNull();
    expect(mocks.toast.error).not.toHaveBeenCalled();
  });

  it('un rechazo avisa con su texto y se queda en ese campo', async () => {
    mocks.leer.mockResolvedValue({ courses: [campo('g2', 'NONE')] });
    mocks.fijar.mockRejectedValue(
      Object.assign(new Error('422'), {
        status: 422,
        errorCode: 'TEE_NOT_AVAILABLE',
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    // K1: dentro del modal, junto al selector; sin toast encima
    expect(result.current.aviso).toEqual({
      tipo: 'error',
      texto: 'competitions:tees.errors.TEE_NOT_AVAILABLE',
    });
    expect(mocks.toast.error).not.toHaveBeenCalled();
    expect(result.current.campo.golfCourseId).toBe('g2');
    expect(result.current.guardando).toBe(false);
  });

  it('stroke play (conEquipos false): lo pendiente es una partida', async () => {
    mocks.leer.mockResolvedValue({ courses: [campo('g2', 'NONE')] });
    mocks.fijar.mockRejectedValue(
      Object.assign(new Error('422'), {
        status: 422,
        errorCode: 'TEE_NOT_ON_PENDING_COURSE',
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1', { conEquipos: false }));
    await act(() => result.current.guardar('RED'));
    // K1: dentro del modal, junto al selector; sin toast encima
    expect(result.current.aviso).toEqual({
      tipo: 'error',
      texto: 'competitions:tees.errorsStrokePlay.TEE_NOT_ON_PENDING_COURSE',
    });
    expect(mocks.toast.error).not.toHaveBeenCalled();
    expect(result.current.campo.golfCourseId).toBe('g2');
    expect(result.current.guardando).toBe(false);
  });

  it('sin decir la modalidad, una Ryder: lo pendiente es un partido', async () => {
    mocks.leer.mockResolvedValue({ courses: [campo('g2', 'NONE')] });
    mocks.fijar.mockRejectedValue(
      Object.assign(new Error('422'), {
        status: 422,
        errorCode: 'TEE_NOT_ON_PENDING_COURSE',
      }),
    );
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    // K1: dentro del modal, junto al selector; sin toast encima
    expect(result.current.aviso).toEqual({
      tipo: 'error',
      texto: 'competitions:tees.errors.TEE_NOT_ON_PENDING_COURSE',
    });
    expect(mocks.toast.error).not.toHaveBeenCalled();
    expect(result.current.campo.golfCourseId).toBe('g2');
    expect(result.current.guardando).toBe(false);
  });

  it('cerrar deja todos los demás', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    act(() => result.current.cerrar());
    expect(result.current.campo).toBeNull();
  });
});

describe('BarrasPendientesModal', () => {
  const pinta = (props = {}) => {
    const fns = { onGuardar: vi.fn(), onSaltar: vi.fn(), onClose: vi.fn() };
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando={false}
        {...fns}
        {...props}
      />,
    );
    return fns;
  };

  it('dice el campo, ofrece sus opciones y guarda la elegida', () => {
    const { onGuardar } = pinta();
    expect(
      screen.getByText(/competitions:tees.chooseOnCourse .*Campo g2/),
    ).toBeInTheDocument();
    expect(screen.getByText('competitions:tees.save')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('competitions:tees.label'), {
      target: { value: 'BLUE' },
    });
    fireEvent.click(screen.getByText('competitions:tees.save'));
    expect(onGuardar).toHaveBeenCalledWith('BLUE');
  });

  it('9: guardando, no se manda otra vez', () => {
    const { onGuardar } = pinta({ guardando: true });
    fireEvent.change(screen.getByLabelText('competitions:tees.label'), {
      target: { value: 'BLUE' },
    });
    fireEvent.submit(screen.getByLabelText('competitions:tees.label').form);
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('CR3: «Cerrar» sale sin saltar el campo', () => {
    const { onClose, onSaltar } = pinta();
    fireEvent.click(screen.getByText('competitions:tees.close'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSaltar).not.toHaveBeenCalled();
  });

  it('CR3: guardando, «Cerrar» está desactivado', () => {
    pinta({ guardando: true });
    expect(screen.getByText('competitions:tees.close')).toBeDisabled();
  });

  it('E12: las opciones, en el orden de los selectores', () => {
    pinta({ campo: campo('g2', 'NONE', ['RED', 'BLACK', 'WHITE']) });
    expect(
      within(screen.getByLabelText('competitions:tees.label'))
        .getAllByRole('option')
        .map((o) => o.value),
    ).toEqual(['', 'BLACK', 'WHITE', 'RED']);
  });

  it('selector ancho: el texto vacío largo, «Elige una barra»', () => {
    pinta();
    expect(
      within(screen.getByLabelText('competitions:tees.label')).getAllByRole(
        'option',
      )[0],
    ).toHaveTextContent(/^competitions:tees\.choose$/);
  });

  it('«Ahora no» pasa al siguiente; sin campo, nada', () => {
    const { onSaltar } = pinta();
    fireEvent.click(screen.getByText('competitions:tees.notNow'));
    expect(onSaltar).toHaveBeenCalled();
  });

  it('sin campo no se pinta', () => {
    const { container } = render(
      <BarrasPendientesModal
        campo={null}
        guardando={false}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * B1–B3 (pasada del iPhone, 22 nov): al abrir «Elige tu barra en {campo}» el
 * foco va al título, no al selector. En el iPhone, enfocar un `<select>`
 * desplaza la página de detrás hasta él aunque se pida no desplazar (se
 * midió 222 → 3273), y al cerrar la ficha se quedaba abajo.
 */
describe('BarrasPendientesModal · sin mover la página', () => {
  const pinta = () =>
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando={false}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );

  it('B1: al abrir, el foco está en el título y no en el selector', () => {
    pinta();
    const titulo = screen.getByRole('heading', {
      name: /competitions:tees.chooseOnCourse/,
    });
    expect(document.activeElement).toBe(titulo);
    expect(document.activeElement).not.toBe(
      screen.getByLabelText('competitions:tees.label'),
    );
  });

  it('B1: el título se enfoca sin desplazar nada', () => {
    const enfoca = vi.spyOn(globalThis.HTMLElement.prototype, 'focus');
    pinta();
    const titulo = screen.getByRole('heading', {
      name: /competitions:tees.chooseOnCourse/,
    });
    const alTitulo = enfoca.mock.contexts.indexOf(titulo);
    expect(alTitulo).not.toBe(-1);
    expect(enfoca.mock.calls[alTitulo][0]).toEqual({ preventScroll: true });
    enfoca.mockRestore();
  });

  it('B1: el título no entra en el tabulador (tabIndex -1)', () => {
    pinta();
    expect(
      screen.getByRole('heading', { name: /competitions:tees.chooseOnCourse/ }),
    ).toHaveAttribute('tabindex', '-1');
  });

  it('B3: al cerrar, el foco vuelve a donde estaba, sin desplazar', () => {
    const boton = document.createElement('button');
    document.body.appendChild(boton);
    boton.focus();
    const { unmount } = pinta();
    const enfoca = vi.spyOn(globalThis.HTMLElement.prototype, 'focus');
    unmount();
    expect(document.activeElement).toBe(boton);
    expect(enfoca.mock.contexts).toContain(boton);
    expect(enfoca.mock.calls.at(-1)[0]).toEqual({ preventScroll: true });
    enfoca.mockRestore();
    boton.remove();
  });
});

/**
 * K1 en «Elige tu barra en {campo}» (revisión de la pasada del iPhone): ni el
 * error ni el acierto salen en un toast encima del modal. El error, junto al
 * selector; el acierto, si pasa al campo siguiente, como «Guardada en
 * {campo}» dentro; si el modal se cierra (era el último), un toast arriba,
 * que ya no tapa nada.
 */
describe('useBarrasPendientes · el aviso, dentro del modal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('K1: el último campo guardado cierra el modal y entonces sí, un toast', async () => {
    mocks.leer.mockResolvedValue({ courses: [campo('g2', 'NONE')] });
    mocks.fijar.mockResolvedValue({ teeColor: 'RED' });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.campo).toBeNull();
    expect(result.current.aviso).toBeNull();
    expect(mocks.toast.success).toHaveBeenCalledWith('tees.saved', ARRIBA);
  });

  it('K1: «Ahora no» y cerrar quitan el aviso', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE'), campo('g5', 'NONE')],
    });
    mocks.fijar.mockResolvedValue({ teeColor: 'RED' });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso).not.toBeNull();
    act(() => result.current.saltar());
    expect(result.current.aviso).toBeNull();
    mocks.fijar.mockRejectedValueOnce(new Error('sin red'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso.tipo).toBe('error');
    act(() => result.current.cerrar());
    expect(result.current.aviso).toBeNull();
  });

  it('K1: guardar de nuevo quita el error anterior en cuanto empieza', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    mocks.fijar.mockRejectedValueOnce(new Error('sin red'));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso.tipo).toBe('error');
    mocks.fijar.mockImplementationOnce(() => new Promise(() => {}));
    act(() => {
      result.current.guardar('BLUE');
    });
    expect(result.current.aviso).toBeNull();
  });

  it('K1: una comprobación nueva empieza sin aviso', async () => {
    mocks.leer.mockResolvedValue({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    mocks.fijar.mockRejectedValueOnce(new Error('sin red'));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso).not.toBeNull();
    await act(() => result.current.comprobar('e2'));
    expect(result.current.aviso).toBeNull();
  });
});

describe('BarrasPendientesModal · el aviso dentro', () => {
  const pinta = (props = {}) =>
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando={false}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );

  it('K1: el error, como alerta junto al selector', () => {
    pinta({ aviso: { tipo: 'error', texto: 'No se pudo' } });
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('No se pudo');
    // Justo después del selector, en el mismo bloque
    expect(alerta.parentElement).toBe(
      screen.getByLabelText('competitions:tees.label').parentElement,
    );
    // Y no también arriba, en la región de los aciertos
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('K1: «Guardada en {campo}», en una región que está siempre y no cambia al pasar de campo', () => {
    const { rerender } = pinta();
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    expect(region).toHaveAttribute('aria-live', 'polite');
    rerender(
      <BarrasPendientesModal
        campo={campo('g4', 'NONE')}
        guardando={false}
        aviso={{ tipo: 'ok', texto: 'Guardada en Campo g2' }}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Guardada en Campo g2');
  });

  it('K1: al pasar de campo, el selector vuelve a «Elige» y el foco sigue en el título', () => {
    const { rerender } = pinta();
    fireEvent.change(screen.getByLabelText('competitions:tees.label'), {
      target: { value: 'RED' },
    });
    // El foco estaba en el selector del campo anterior, que se va
    screen.getByLabelText('competitions:tees.label').focus();
    rerender(
      <BarrasPendientesModal
        campo={campo('g4', 'NONE')}
        guardando={false}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('competitions:tees.label')).toHaveValue('');
    expect(screen.getByRole('heading')).toHaveTextContent(/Campo g4/);
    expect(document.activeElement).toBe(screen.getByRole('heading'));
  });
});

describe('BarrasPendientesModal · /code-review', () => {
  it('1: vacía, la región de arriba no ocupa sitio (no empuja el título)', () => {
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando={false}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('status').className).toContain('sr-only');
  });
});

/**
 * /code-review: el aviso de un guardado va atado a la inscripción y el campo
 * que se guardaban; y elegir otro color borra el error, como en los otros
 * modales.
 */
describe('useBarrasPendientes · el aviso, de su inscripción y su campo', () => {
  beforeEach(() => vi.clearAllMocks());

  const fallaLuego = () => {
    let falla;
    mocks.fijar.mockImplementationOnce(
      () =>
        new Promise((_, rechaza) => {
          falla = () => rechaza(new Error('sin red'));
        }),
    );
    return () => falla();
  };

  it('6: si entretanto llega otra inscripción, el error de la anterior no se pinta', async () => {
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g2', 'NONE')] });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    const falla = fallaLuego();
    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g7', 'NONE')] });
    await act(() => result.current.comprobar('e2'));
    await act(async () => {
      falla();
      await guardado;
    });
    expect(result.current.campo.golfCourseId).toBe('g7');
    expect(result.current.aviso).toBeNull();
  });

  it('6: si entretanto cambió el campo de la misma inscripción, tampoco', async () => {
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    const falla = fallaLuego();
    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    // Releída: g2 ya tiene barra; queda g4
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g4', 'NONE')] });
    await act(() => result.current.comprobar('e1'));
    await act(async () => {
      falla();
      await guardado;
    });
    expect(result.current.campo.golfCourseId).toBe('g4');
    expect(result.current.aviso).toBeNull();
  });

  it('6: el acierto de otra inscripción tampoco se pinta en la nueva', async () => {
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    let acaba;
    mocks.fijar.mockImplementationOnce(
      () =>
        new Promise((r) => {
          acaba = () => r({ teeColor: 'RED' });
        }),
    );
    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g7', 'NONE')] });
    await act(() => result.current.comprobar('e2'));
    await act(async () => {
      acaba();
      await guardado;
    });
    expect(result.current.campo.golfCourseId).toBe('g7');
    expect(result.current.aviso).toBeNull();
  });

  it('6: con un solo campo, su acierto tardío no sale como toast encima del modal de otra inscripción', async () => {
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g2', 'NONE')] });
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    let acaba;
    mocks.fijar.mockImplementationOnce(
      () =>
        new Promise((r) => {
          acaba = () => r({ teeColor: 'RED' });
        }),
    );
    let guardado;
    act(() => {
      guardado = result.current.guardar('RED');
    });
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g7', 'NONE')] });
    await act(() => result.current.comprobar('e2'));
    await act(async () => {
      acaba();
      await guardado;
    });
    // El modal abierto es el de e2: ni toast ni aviso del de e1
    expect(result.current.campo.golfCourseId).toBe('g7');
    expect(mocks.toast.success).not.toHaveBeenCalled();
    expect(result.current.aviso).toBeNull();
  });

  it('6: sin carreras, el error sigue en su campo', async () => {
    mocks.leer.mockResolvedValueOnce({
      courses: [campo('g2', 'NONE'), campo('g4', 'NONE')],
    });
    mocks.fijar.mockRejectedValueOnce(new Error('sin red'));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso).toEqual({
      tipo: 'error',
      texto: 'competitions:tees.errors.generic',
    });
  });

  it('5: limpiarAviso borra el error', async () => {
    mocks.leer.mockResolvedValueOnce({ courses: [campo('g2', 'NONE')] });
    mocks.fijar.mockRejectedValueOnce(new Error('sin red'));
    const { result } = renderHook(() => useBarrasPendientes());
    await act(() => result.current.comprobar('e1'));
    await act(() => result.current.guardar('RED'));
    expect(result.current.aviso).not.toBeNull();
    act(() => result.current.limpiarAviso());
    expect(result.current.aviso).toBeNull();
  });
});

describe('BarrasPendientesModal · elegir borra el error', () => {
  it('5: al elegir otro color, se pide borrar el aviso', () => {
    const onElegir = vi.fn();
    render(
      <BarrasPendientesModal
        campo={campo('g2', 'NONE')}
        guardando={false}
        aviso={{ tipo: 'error', texto: 'No se pudo' }}
        onElegir={onElegir}
        onGuardar={vi.fn()}
        onSaltar={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('competitions:tees.label'), {
      target: { value: 'BLUE' },
    });
    expect(onElegir).toHaveBeenCalledTimes(1);
  });
});
