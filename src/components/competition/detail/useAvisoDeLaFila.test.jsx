import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { useAvisoDeLaFila } from './useAvisoDeLaFila';
import AvisoDeLaFila, { AlertaDeAviso, RegionDeAviso } from './AvisoDeLaFila';

const m = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../utils/toast', () => ({ default: m.toast }));

beforeEach(() => vi.clearAllMocks());

// S2 (23 nov 2026): cerrado el modal, el aviso sale arriba
const ARRIBA = { position: 'top-center' };

/**
 * A2 (revisión de arquitectura): el aviso de un guardado en su fila, una sola
 * pieza para los modales de barras. Con el modal abierto, en la fila; si ya
 * se cerró, no hay fila: un toast.
 */
describe('useAvisoDeLaFila', () => {
  it('A2: abierto, el aviso queda para su fila y solo para ella', () => {
    const { result } = renderHook(() => useAvisoDeLaFila());
    act(() =>
      result.current.avisar({ clave: 'g1', tipo: 'ok', texto: 'Guardada' }),
    );
    expect(result.current.de('g1')).toMatchObject({
      clave: 'g1',
      tipo: 'ok',
      texto: 'Guardada',
    });
    expect(result.current.de('g2')).toBeNull();
    expect(result.current.resultado.clave).toBe('g1');
    expect(m.toast.success).not.toHaveBeenCalled();
  });

  it('A2: limpiar una fila solo quita el suyo; sin clave, cualquiera', () => {
    const { result } = renderHook(() => useAvisoDeLaFila());
    act(() =>
      result.current.avisar({ clave: 'g1', tipo: 'error', texto: 'Mal' }),
    );
    act(() => result.current.limpiar('g2'));
    expect(result.current.de('g1')).not.toBeNull();
    act(() => result.current.limpiar('g1'));
    expect(result.current.de('g1')).toBeNull();
    act(() =>
      result.current.avisar({ clave: 'g1', tipo: 'error', texto: 'Mal' }),
    );
    act(() => result.current.limpiar());
    expect(result.current.resultado).toBeNull();
  });

  it('A2: cerrado el modal, un acierto va en un toast con su texto suelto', () => {
    const { result, unmount } = renderHook(() => useAvisoDeLaFila());
    const { avisar } = result.current;
    unmount();
    avisar({
      clave: 'g1',
      tipo: 'ok',
      texto: 'Guardada',
      textoSiCerrado: 'Barra guardada',
    });
    expect(m.toast.success).toHaveBeenCalledWith('Barra guardada', ARRIBA);
    expect(m.toast.error).not.toHaveBeenCalled();
  });

  it('A2: cerrado el modal, un error va en un toast de error', () => {
    const { result, unmount } = renderHook(() => useAvisoDeLaFila());
    const { avisar } = result.current;
    unmount();
    avisar({ clave: 'g1', tipo: 'error', texto: 'No se pudo' });
    expect(m.toast.error).toHaveBeenCalledWith('No se pudo', ARRIBA);
    expect(m.toast.success).not.toHaveBeenCalled();
  });
});

/**
 * 4 (revisión): para que VoiceOver lo anuncie, cada fila tiene su región
 * `status` montada siempre y cambia solo su texto; los errores, en `alert`.
 */
describe('AvisoDeLaFila', () => {
  it('4: sin nada que decir, la región ya está, vacía y viva', () => {
    render(<AvisoDeLaFila resultado={null} />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('4: el acierto va en la MISMA región, que solo cambia su texto', () => {
    const { rerender } = render(<AvisoDeLaFila resultado={null} />);
    const region = screen.getByRole('status');
    rerender(<AvisoDeLaFila resultado={{ tipo: 'ok', texto: 'Guardada' }} />);
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Guardada');
  });

  it('4: el error va en una alerta, y la región sigue, vacía', () => {
    render(
      <AvisoDeLaFila resultado={{ tipo: 'error', texto: 'No se pudo' }} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});

/**
 * /code-review: vacía, la región no ocupa sitio (en un `space-y` empujaba lo
 * de debajo 16 px) pero sigue montada; la misma pieza sirve suelta.
 */
describe('AvisoDeLaFila · sin ocupar sitio vacía', () => {
  it('1-2: vacía, fuera del flujo (sr-only), montada y viva', () => {
    render(<AvisoDeLaFila resultado={null} />);
    const region = screen.getByRole('status');
    expect(region.className).toContain('sr-only');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('1-2: con texto, se ve', () => {
    render(<AvisoDeLaFila resultado={{ tipo: 'ok', texto: 'Guardada' }} />);
    expect(screen.getByRole('status').className).not.toContain('sr-only');
  });

  it('7: la región y la alerta, también por separado', () => {
    render(
      <>
        <RegionDeAviso texto="Hecho" testId="r" />
        <AlertaDeAviso texto="Mal" />
        <AlertaDeAviso texto={null} />
      </>,
    );
    expect(screen.getByTestId('r')).toHaveAttribute('role', 'status');
    expect(screen.getByTestId('r')).toHaveTextContent('Hecho');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Mal');
  });

  it('3: el aviso guarda también su texto suelto', () => {
    const { result } = renderHook(() => useAvisoDeLaFila());
    act(() =>
      result.current.avisar({
        clave: 'g1',
        tipo: 'ok',
        texto: 'Quitada',
        textoSiCerrado: 'Barra quitada',
      }),
    );
    expect(result.current.resultado.textoSiCerrado).toBe('Barra quitada');
  });
});
