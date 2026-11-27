import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  BOTON_PRINCIPAL,
  ENLACE_PRINCIPAL,
  ENLACE_SECUNDARIO,
  TARJETA_DE_ACCESO,
} from './clasesDeAcceso';

/**
 * El botón principal de las pantallas de acceso salía en tres colores: Deep
 * Forest en el login, lima en el registro en oscuro y verde oliva en el
 * registro en claro. Ahora es uno, en lima con el texto en Forest, como
 * «Partida rápida» en Inicio: la marca reserva la lima para la acción
 * principal, y cada pantalla de acceso tiene una sola (Agustín, 26 nov 2026).
 */
describe('las clases de las pantallas de acceso', () => {
  it('B1 el botón principal: lima, texto Forest, cuadrado y apagado al desactivarse', () => {
    expect(BOTON_PRINCIPAL).toContain('bg-lime');
    expect(BOTON_PRINCIPAL).toContain('text-forest');
    // Cuadrados y sin borde, como los botones de los correos (Agustín, 26 nov
    // 2026): ni píldora ni esquinas redondeadas
    for (const clases of [
      BOTON_PRINCIPAL,
      ENLACE_PRINCIPAL,
      ENLACE_SECUNDARIO,
    ]) {
      expect(clases).toContain('rounded-none');
      expect(clases).not.toMatch(/rounded-(lg|boton|md|xl)|\bborder\b/);
    }
    expect(BOTON_PRINCIPAL).toContain('disabled:opacity-60');
    // `enabled:`: desactivado no responde al puntero
    expect(BOTON_PRINCIPAL).toContain('enabled:hover:');
    // Con la mano: Tailwind 4 deja la flecha en los botones
    expect(BOTON_PRINCIPAL).toContain('enabled:cursor-pointer');
    expect(ENLACE_SECUNDARIO).toContain('cursor-pointer');
  });

  it('B2 el enlace con aspecto de botón principal, igual pero sin `enabled:`', () => {
    expect(ENLACE_PRINCIPAL).toContain('bg-lime');
    expect(ENLACE_PRINCIPAL).toContain('text-forest');
    expect(ENLACE_PRINCIPAL).not.toContain('enabled:');
  });

  it('B3 el secundario no compite: sin borde, con el relleno suave de la app', () => {
    expect(ENLACE_SECUNDARIO).not.toMatch(/\bbg-(lime|forest|primary)/);
    expect(ENLACE_SECUNDARIO).toContain('bg-realce');
    expect(ENLACE_SECUNDARIO).toContain('text-tinta');
  });

  // Cada pantalla con formulario, con su acción principal en lima, y ninguna
  // con los colores de antes
  it.each([
    'src/components/auth/SignInForm.jsx',
    'src/pages/Register.jsx',
    'src/pages/ForgotPassword.jsx',
    'src/pages/ResetPassword.jsx',
    'src/pages/CompleteProfile.jsx',
    'src/pages/AcceptTerms.jsx',
  ])('B4 %s usa el botón principal y no los colores de antes', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    expect(fuente).toContain('BOTON_PRINCIPAL');
    expect(fuente).not.toMatch(/bg-primary\b|bg-primary\/90|bg-accent\b/);
  });

  // La tarjeta del formulario: el lado del formulario lleva ya el fondo de la
  // app, y una tarjeta «blanca» se perdía en él. Con menos relleno en el móvil:
  // a 360 px «Registrarse con Google» no cabía en una línea
  it('B5 la tarjeta, sobre el fondo de la app y con menos relleno en el móvil', () => {
    expect(TARJETA_DE_ACCESO).toContain('bg-tarjeta');
    expect(TARJETA_DE_ACCESO).toContain('border-contorno');
    expect(TARJETA_DE_ACCESO).toContain('p-5 sm:p-8');
    // Todos sus campos con el mismo fondo: el de correo era transparente (arena)
    // y el de contraseña traía el suyo
    // …salvo los desactivados, que conservan el suyo (revisión, 26 nov 2026): el
    // selector de la tarjeta pesa más que el `disabled:bg-*` del propio campo
    expect(TARJETA_DE_ACCESO).toContain(
      "[&_input:not([type='checkbox']):not([type='radio']):not(:disabled)]:bg-fondo",
    );
    expect(TARJETA_DE_ACCESO).toContain('[&_select:not(:disabled)]:bg-fondo');
  });

  it.each([
    'src/pages/Login.jsx',
    'src/pages/Register.jsx',
    'src/pages/ForgotPassword.jsx',
    'src/pages/ResetPassword.jsx',
    'src/pages/AcceptTerms.jsx',
    'src/pages/CompleteProfile.jsx',
  ])('B6 %s pone su formulario en la tarjeta de acceso', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    // Sobre el fondo de la app: en claro `bg-gray-50` es el mismo arena que la
    // tarjeta, y la tarjeta desaparecía (Aceptar términos)
    expect(fuente).not.toContain('min-h-screen bg-gray-50');
    expect(fuente).toContain('TARJETA_DE_ACCESO');
    expect(fuente).not.toContain('bg-white rounded-2xl shadow-xl');
    // La «o» del separador, sobre la tarjeta: con fondo blanco se veía su recuadro
    expect(fuente).not.toContain('px-4 bg-white');
  });

  it('B7 el botón de Google, en una sola línea', () => {
    const fuente = readFileSync(
      resolve(process.cwd(), 'src/components/ui/GoogleSignInButton.jsx'),
      'utf8',
    );
    expect(fuente).toContain('whitespace-nowrap');
    expect(fuente).toContain('rounded-none');
    expect(fuente).not.toMatch(/rounded-(lg|boton)|border-2/);
  });
});
