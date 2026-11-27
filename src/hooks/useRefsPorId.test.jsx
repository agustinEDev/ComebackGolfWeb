import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRefsPorId } from './useRefsPorId';

/**
 * /code-review: refs de las filas por id, estables. Una ref de callback nueva
 * en cada render hace que React la suelte (con null) y la vuelva a poner en
 * cada pintado.
 */
describe('useRefsPorId', () => {
  it('8: la ref de un id es la misma en cada render', () => {
    const { result, rerender } = renderHook(() => useRefsPorId());
    const primera = result.current.refDe('g1');
    rerender();
    expect(result.current.refDe('g1')).toBe(primera);
    // Y quien las da, también: puede ir en las dependencias de un efecto
    const antes = result.current;
    rerender();
    expect(result.current).toBe(antes);
    expect(result.current.refDe('g2')).not.toBe(primera);
  });

  it('8: guarda el elemento de cada id y lo suelta al desmontarse', () => {
    const { result } = renderHook(() => useRefsPorId());
    const fila = document.createElement('section');
    result.current.refDe('g1')(fila);
    expect(result.current.elemento('g1')).toBe(fila);
    expect(result.current.elemento('g2')).toBeUndefined();
    result.current.refDe('g1')(null);
    expect(result.current.elemento('g1')).toBeUndefined();
  });
});
