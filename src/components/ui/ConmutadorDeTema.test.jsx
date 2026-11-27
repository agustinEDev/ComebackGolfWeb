import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * El conmutador de tema (sol y luna) y el hook que lo alimenta.
 *
 *   #   caso                         | qué pasa
 *   ----|------------------------------|-----------------------------------
 *   K1  en claro                     | el botón ofrece pasar a oscuro
 *   K2  se pulsa                     | pasa a oscuro, y ofrece volver
 *   K3  el sistema cambia solo       | el botón se entera sin recargar
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave }),
}));

let sistemaOscuro;
let oyentes;
let ConmutadorDeTema;

beforeEach(async () => {
  vi.resetModules();
  sistemaOscuro = false;
  oyentes = new Set();
  const almacen = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k) => almacen.get(k) ?? null,
    setItem: (k, v) => almacen.set(k, String(v)),
    removeItem: (k) => almacen.delete(k),
  });
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return sistemaOscuro;
    },
    addEventListener: (_, f) => oyentes.add(f),
    removeEventListener: (_, f) => oyentes.delete(f),
  }));
  (await import('../../utils/tema')).arrancaElTema();
  ConmutadorDeTema = (await import('./ConmutadorDeTema')).default;
});

afterEach(() => vi.unstubAllGlobals());

const boton = () => screen.getByTestId('conmutador-de-tema');

describe('ConmutadorDeTema', () => {
  it('K1: en claro ofrece pasar a oscuro, con un nombre que dice lo que hará', () => {
    render(<ConmutadorDeTema />);

    expect(boton()).toHaveAccessibleName('theme.switchToDark');
  });

  it('K2: al pulsarlo cambia el tema y ofrece volver', () => {
    render(<ConmutadorDeTema />);

    fireEvent.click(boton());

    expect(document.documentElement.dataset.tema).toBe('oscuro');
    expect(boton()).toHaveAccessibleName('theme.switchToLight');
  });

  it('K3: si el sistema cambia de tema, el botón se entera', () => {
    render(<ConmutadorDeTema />);

    act(() => {
      sistemaOscuro = true;
      for (const f of oyentes) f({ matches: true });
    });

    expect(boton()).toHaveAccessibleName('theme.switchToLight');
  });

  it('mide 44 px: un dedo lo acierta', () => {
    render(<ConmutadorDeTema />);

    expect(boton().className.split(' ')).toEqual(
      expect.arrayContaining(['h-11', 'w-11']),
    );
  });
});
