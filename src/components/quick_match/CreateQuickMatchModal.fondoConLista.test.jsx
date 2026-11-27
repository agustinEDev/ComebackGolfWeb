import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import CreateQuickMatchModal from './CreateQuickMatchModal';

/**
 * El buscador de campos de verdad dentro del asistente (/code-review, 23 nov
 * 2026): con su lista abierta, tocar fuera cerraba la lista Y el asistente.
 * Ahora, como con su Escape, el primer toque es de la lista; el siguiente
 * cierra el asistente. Y Escape, igual: el primero cierra la lista y el
 * siguiente el asistente (CodeRabbit, FE #1229).
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es' },
  }),
}));

const mockList = vi.fn();
vi.mock('../../composition', () => ({
  listGolfCoursesUseCase: { execute: (...a) => mockList(...a) },
  createAndStartQuickMatchUseCase: { execute: vi.fn() },
  listFriendsUseCase: {
    execute: () => Promise.resolve({ friendships: [], totalCount: 0 }),
  },
  getGolfCourseUseCase: { execute: () => Promise.resolve({ tees: [] }) },
  listMyQuickMatchesUseCase: {
    execute: () => Promise.resolve({ quickMatches: [] }),
  },
}));

const yo = { id: 'user-1', country_code: 'ES', display_name: 'Yo' };

const tocar = (donde) => {
  fireEvent.mouseDown(donde);
  fireEvent.mouseUp(donde);
  fireEvent.click(donde);
};

describe('CreateQuickMatchModal · tocar fuera con la lista de campos abierta', () => {
  beforeEach(() => {
    mockList.mockResolvedValue({
      courses: [{ id: 'c1', name: 'Real Club de Golf', tees: [] }],
      total: 1,
    });
  });

  it('el primer toque cierra solo la lista; el siguiente, el asistente', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CreateQuickMatchModal
          onClose={onClose}
          onStarted={vi.fn()}
          currentUser={yo}
        />
      </MemoryRouter>,
    );
    const buscador = screen.getByRole('combobox');
    fireEvent.focus(buscador);
    await waitFor(() =>
      expect(buscador).toHaveAttribute('aria-expanded', 'true'),
    );
    const fondo = screen.getByRole('dialog', {
      name: 'create.title',
    }).parentElement;

    tocar(fondo);

    expect(buscador).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();

    tocar(fondo);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // CodeRabbit, FE #1229: Escape con la lista abierta cerraba el asistente
  it('Escape con la lista abierta cierra solo la lista; el siguiente, el asistente', async () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <CreateQuickMatchModal
          onClose={onClose}
          onStarted={vi.fn()}
          currentUser={yo}
        />
      </MemoryRouter>,
    );
    const buscador = screen.getByRole('combobox');
    fireEvent.focus(buscador);
    await waitFor(() =>
      expect(buscador).toHaveAttribute('aria-expanded', 'true'),
    );

    fireEvent.keyDown(buscador, { key: 'Escape' });

    expect(buscador).toHaveAttribute('aria-expanded', 'false');
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(buscador, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
