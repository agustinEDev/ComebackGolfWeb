import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'es' } }),
}));

/**
 * Las piezas compartidas, con la marca (Agustín, 27 nov 2026):
 *
 *   pieza                       | antes                         | ahora
 *   ----------------------------|-------------------------------|--------------------------
 *   ventana de instalar         | botón Deep Forest redondeado  | botón principal en lima
 *   banner de instalar          | franja verde #15803d          | Deep Forest en los dos
 *                               | con botón blanco              | temas, botón lima, línea
 *                               |                               | lima arriba y foco lima
 *   fuerza de la contraseña     | rojo, amarillo, azul, verde   | error, aviso, éxito
 *   requisitos de la contraseña | verde suelto                  | éxito
 */
const fuente = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

describe('las piezas compartidas, con la marca', () => {
  it.each([
    'src/components/ui/InstallInstructionsModal.jsx',
    'src/components/ui/InstallBanner.jsx',
  ])('X1 %s usa el botón principal de la marca', (ruta) => {
    // En el `className` del botón, no solo en el import
    expect(fuente(ruta)).toMatch(/className=\{`[^`]*\$\{PRINCIPAL\}/);
  });

  it('X2 el banner va en Deep Forest en los dos temas, con el foco que se ve', () => {
    // En oscuro la franja de contraste es arena, y la lima sobre arena no se
    // distinguía (1,1:1); el foco tampoco se veía en ningún tema (revisión)
    const banner = fuente('src/components/ui/InstallBanner.jsx');
    expect(banner).toContain('bg-forest text-sand');
    expect(banner).toContain('[--cbg-foco:var(--cbg-lime)]');
    expect(banner).toContain('border-lime');
    expect(banner).not.toMatch(
      /bg-contraste|(bg|text|border|ring)-(green|white)\b|(bg|text|border|ring)-green-/,
    );
  });

  it.each([
    'src/components/ui/InstallInstructionsModal.jsx',
    'src/components/ui/InstallBanner.jsx',
    'src/components/ui/PasswordRequirements.jsx',
    'src/components/ui/PasswordStrengthMeter.jsx',
    'src/components/ui/PasswordStrengthIndicator.jsx',
  ])('X3 %s sin colores sueltos', (ruta) => {
    expect(fuente(ruta)).not.toMatch(
      /\b(bg|text|border|ring|fill|stroke)-(red|green|yellow|blue|amber|primary|gray)(-[0-9]{2,3})?\b|\b(bg|fill)-white\b/,
    );
  });

  // Cada nivel con su color, pintado de verdad: débil en error, media en
  // aviso, buena y fuerte en éxito (Agustín, 27 nov 2026)
  it.each([
    // 8 caracteres puntúan 1: débil
    ['débil', 'abcdefgh', 'bg-error'],
    ['fuerte', 'Comeback-Golf-2026!xyz', 'bg-exito'],
  ])('X4 la barra de una contraseña %s, en %s', async (_n, clave, color) => {
    const { render } = await import('@testing-library/react');
    const { default: PasswordStrengthIndicator } =
      await import('./PasswordStrengthIndicator');
    const { container } = render(
      <PasswordStrengthIndicator password={clave} />,
    );
    expect(container.innerHTML).toContain(color);
  });
});
