import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router';

/**
 * Las pantallas de estado del acceso, con uno de nuestros dibujos en vez de un
 * círculo de color con una X roja o un check, el botón principal en lima y una
 * sola salida a cada sitio (Agustín, 26 nov 2026).
 *
 *   caso | qué                                           | se ve
 *   -----|-----------------------------------------------|--------------------
 *   S1   | Verificar, Restablecer, Google, ¿Olvidaste?   | con EstadoDeAcceso,
 *        | y Confirmar cambio de correo                  | sin los círculos ni
 *        |                                               | los colores de antes
 *   S2   | Verificar, el enlace no vale                  | el búnker, y UNA
 *        |                                               | salida a la portada
 *   S3   | Verificar, verificado sin sesión              | el green
 *   S4   | Verificar, mientras comprueba                 | una salida a la portada
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (clave) => clave, i18n: { language: 'es' } }),
}));
vi.mock('../composition', () => ({
  verifyEmailUseCase: { execute: vi.fn() },
  resendVerificationLinkUseCase: { execute: vi.fn() },
}));

const { verifyEmailUseCase } = await import('../composition');
const { default: VerifyEmail } = await import('./VerifyEmail');

const abrir = (url = '/verify-email?token=tok') => {
  window.history.replaceState(null, '', url);
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </BrowserRouter>,
  );
};

describe('pantallas de estado del acceso', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it.each([
    'src/pages/VerifyEmail.jsx',
    'src/pages/ResetPassword.jsx',
    'src/pages/GoogleCallback.jsx',
    'src/pages/ForgotPassword.jsx',
    'src/pages/ConfirmEmailChange.jsx',
  ])('S1 %s cuenta su estado con EstadoDeAcceso y sin lo de antes', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    expect(fuente).toContain('<EstadoDeAcceso');
    expect(fuente).not.toMatch(
      /bg-(red|green|yellow|amber)-100|text-(red|green|yellow|amber)-[67]00|bg-primary\b|bg-gray-(50|100)\b/,
    );
  });

  it('S2 un enlace que no vale: el búnker y una sola salida a la portada', async () => {
    verifyEmailUseCase.execute.mockRejectedValue(
      Object.assign(new Error('x'), { status: 400 }),
    );
    const { container } = abrir();

    await screen.findByText('verifyEmail.errorTitle', {}, { timeout: 4000 });
    expect(container.querySelector('[data-dibujo="bunker"]')).toBeTruthy();
    const aLaPortada = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/');
    expect(aLaPortada).toHaveLength(1);
  });

  it('S3 verificado sin sesión: el green', async () => {
    verifyEmailUseCase.execute.mockResolvedValue({});
    const { container } = abrir();

    await screen.findByText('verifyEmail.successTitle', {}, { timeout: 4000 });
    expect(container.querySelector('[data-dibujo="green"]')).toBeTruthy();
  });

  it('S4 mientras comprueba hay salida a la portada', async () => {
    // Con una red lenta la comprobación puede tardar: antes había siempre un
    // «Volver al inicio», y no se puede quedar sin salida (revisión, 26 nov)
    verifyEmailUseCase.execute.mockReturnValue(new Promise(() => {}));
    abrir();

    const volver = await screen.findByRole('link', {
      name: /verifyEmail.backToHome/,
    });
    expect(volver).toHaveAttribute('href', '/');
  });
});
