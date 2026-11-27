import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * La guía de instalar ya no viaja en el arranque (presupuesto, 23 nov 2026):
 * se pide en cuanto sale el aviso, con su reintento. Lo de fuera no cambia: el
 * botón la abre. Y si no llega, el aviso sigue ahí sin tirar la aplicación.
 *
 *   I1  | el aviso sale y se pulsa «cómo instalar» | se abre la guía
 *   I2  | la guía no llega ni al reintentar        | el aviso sigue; nada más
 *   I3  | y luego se pulsa «cómo instalar»         | se pide otra vez; si llega,
 *       |                                          | se abre (CodeRabbit, #1229)
 *   I4  | llegó bien y se pulsa                    | no se vuelve a pedir
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../../hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => ({
    canInstall: true,
    isIOS: true,
    iosInstallRoute: 'safari-iphone',
    isDesktopSafari: false,
    install: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

afterEach(() => {
  vi.doUnmock('./InstallInstructionsModal');
  vi.resetModules();
  vi.useRealTimers();
});

describe('InstallBanner · la guía de instalar, diferida', () => {
  it('I1 · el botón abre la guía', async () => {
    const { default: InstallBanner } = await import('./InstallBanner');
    render(<InstallBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'installModal.howTo' }));

    expect(await screen.findByRole('dialog')).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });

  it('I2 · si la guía no llega ni al reintentar, el aviso sigue y no se rompe nada', async () => {
    vi.useFakeTimers();
    let intentos = 0;
    vi.doMock('./InstallInstructionsModal', () => {
      intentos += 1;
      throw new Error('sin red');
    });
    const { default: InstallBanner } = await import('./InstallBanner');
    render(<InstallBanner />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(intentos).toBe(2);
    expect(screen.getByTestId('install-banner')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('I3 · tras ese fallo, pulsar «cómo instalar» la pide otra vez y, si llega, se abre', async () => {
    vi.useFakeTimers();
    let intentos = 0;
    vi.doMock('./InstallInstructionsModal', async () => {
      intentos += 1;
      if (intentos <= 2) throw new Error('sin red');
      return vi.importActual('./InstallInstructionsModal');
    });
    const { default: InstallBanner } = await import('./InstallBanner');
    render(<InstallBanner />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(intentos).toBe(2);

    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: 'installModal.howTo' }));

    expect(await screen.findByRole('dialog')).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(intentos).toBe(3);
  });

  it('I4 · si llegó bien, pulsar no la vuelve a pedir: se abre en el acto', async () => {
    const { default: InstallBanner } = await import('./InstallBanner');
    render(<InstallBanner />);
    // La guía llega mientras el aviso está a la vista, antes de pulsar
    await act(async () => {
      await vi.dynamicImportSettled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'installModal.howTo' }));

    // Sin esperar: pedirla otra vez la dejaría un instante sin pintar
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });
});
