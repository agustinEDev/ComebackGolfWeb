import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeesCompactos from './TeesCompactos';

// Las iniciales del género salen de los textos: «M»/«F» en español, y lo que
// toque en cada idioma
const INICIALES = {
  'teeInitials.MALE': 'H',
  'teeInitials.FEMALE': 'D',
  // Y los colores, para comprobar el nombre entero que oye el lector
  'form.teeColors.RED': 'Rojas',
  'form.teeColors.BLUE': 'Azules',
  'form.teeColors.YELLOW': 'Amarillas',
};
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => INICIALES[k] ?? k,
    i18n: { language: 'es' },
  }),
}));

/**
 * Los tees de un campo en una línea (Agustín, 26 nov 2026): una píldora por
 * tee y por género hacía de cada fila una columna. Ahora, un punto del color
 * real de cada barra con sus géneros al lado; el nombre entero, para el
 * lector de pantalla.
 */
const TEES = [
  { color: 'RED', teeGender: 'MALE' },
  { color: 'RED', teeGender: 'FEMALE' },
  { color: 'BLUE', teeGender: 'MALE' },
  { color: 'YELLOW', teeGender: 'FEMALE' },
];

describe('TeesCompactos', () => {
  it('T1 un punto por color, con sus géneros al lado, en orden', () => {
    const { container } = render(<TeesCompactos tees={TEES} />);
    const grupos = container.querySelectorAll('[data-testid="grupo-de-tee"]');
    expect(grupos).toHaveLength(3);
    expect([...grupos].map((g) => g.textContent)).toEqual(['H D', 'H', 'D']);
  });

  it('T2 el punto lleva el color real de la barra y es decorativo', () => {
    const { container } = render(<TeesCompactos tees={TEES} />);
    const punto = container.querySelector('[data-testid="grupo-de-tee"] span');
    expect(punto).toHaveAttribute('aria-hidden', 'true');
    expect(punto.style.backgroundColor).not.toBe('');
  });

  it('T3 el lector oye cada tee entero', () => {
    render(
      <TeesCompactos
        tees={[
          ...TEES,
          { color: 'YELLOW', identifier: 'Campeonato', teeGender: 'MALE' },
        ]}
      />,
    );
    // El resumen visible es decorativo: esta lista es lo único que oye el
    // lector, así que cada elemento lleva su nombre entero (CodeRabbit)
    const nombres = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(nombres).toHaveLength(5);
    expect(nombres).toEqual([
      'Rojas (M)',
      'Rojas (F)',
      'Azules (M)',
      'Amarillas (F)',
      'Campeonato (M)',
    ]);
  });

  it('T5 un género repetido en la misma barra sale una vez', () => {
    const { container } = render(
      <TeesCompactos
        tees={[
          { color: 'RED', teeGender: 'MALE' },
          { color: 'RED', teeGender: 'MALE' },
        ]}
      />,
    );
    expect(
      container.querySelector('[data-testid="grupo-de-tee"]').textContent,
    ).toBe('H');
  });

  it('T6 cada grupo en una línea: «M F» no se parte en la columna estrecha', () => {
    const { container } = render(<TeesCompactos tees={TEES} />);
    for (const g of container.querySelectorAll(
      '[data-testid="grupo-de-tee"]',
    )) {
      expect(g.className).toContain('whitespace-nowrap');
    }
  });

  it('T7 los géneros, siempre en el mismo orden: hombre y luego mujer', () => {
    const { container } = render(
      <TeesCompactos
        tees={[
          { color: 'BLUE', teeGender: 'FEMALE' },
          { color: 'BLUE', teeGender: 'MALE' },
        ]}
      />,
    );
    expect(
      container.querySelector('[data-testid="grupo-de-tee"]').textContent,
    ).toBe('H D');
  });

  it('T8 una barra con nombre propio lo enseña: dos amarillas no se confunden', () => {
    const { container } = render(
      <TeesCompactos
        tees={[
          { color: 'YELLOW', identifier: 'Campeonato', teeGender: 'MALE' },
          { color: 'YELLOW', teeGender: 'MALE' },
        ]}
      />,
    );
    const grupos = container.querySelectorAll('[data-testid="grupo-de-tee"]');
    expect([...grupos].map((g) => g.textContent)).toEqual([
      'Campeonato H',
      'H',
    ]);
  });

  it('T4 sin tees no pinta nada', () => {
    const { container } = render(<TeesCompactos tees={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
