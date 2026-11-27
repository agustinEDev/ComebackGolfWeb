import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  PRINCIPAL,
  SECUNDARIO,
  PELIGRO,
  AL_PULSAR_BOTON,
  AL_PULSAR_ENLACE,
} from './clasesDeBoton';
import {
  BOTON_PRINCIPAL,
  ENLACE_PRINCIPAL,
  ENLACE_SECUNDARIO,
} from '../auth/clasesDeAcceso';

/**
 * Los botones de la marca, en un solo sitio (26 nov 2026): cuadrados y sin
 * borde, como los de los correos. El principal en lima con el texto en Forest;
 * el secundario, en el relleno suave de la app. Los usan las pantallas de
 * acceso y las páginas públicas.
 */
describe('clases de botón', () => {
  it('K1 el principal: lima, texto Forest, cuadrado y sin borde', () => {
    expect(PRINCIPAL).toContain('bg-lime');
    expect(PRINCIPAL).toContain('text-forest');
    expect(PRINCIPAL).toContain('rounded-none');
    expect(PRINCIPAL).not.toMatch(/\bborder\b|rounded-(lg|md|xl|boton)/);
  });

  it('K2 el secundario: relleno suave, cuadrado y sin borde', () => {
    expect(SECUNDARIO).toContain('bg-realce');
    expect(SECUNDARIO).toContain('rounded-none');
    expect(SECUNDARIO).not.toMatch(/\bborder\b|bg-lime/);
  });

  it('K3 al pulsar: un botón desactivado no responde; un enlace, sí', () => {
    expect(AL_PULSAR_BOTON).toContain('enabled:hover:');
    expect(AL_PULSAR_BOTON).toContain('disabled:opacity-60');
    expect(AL_PULSAR_ENLACE).not.toContain('enabled:');
    expect(AL_PULSAR_ENLACE).toContain('cursor-pointer');
  });

  it('K4 los del acceso salen de aquí', () => {
    expect(BOTON_PRINCIPAL).toContain(PRINCIPAL);
    expect(ENLACE_PRINCIPAL).toContain(PRINCIPAL);
    expect(ENLACE_SECUNDARIO).toContain(SECUNDARIO);
  });

  it.each([
    'src/components/layout/Header.jsx',
    'src/pages/Landing.jsx',
    'src/pages/public/Pricing.jsx',
    'src/pages/public/Contact.jsx',
    'src/pages/public/NotFound.jsx',
  ])('K5 %s usa los botones de la marca, no los de antes', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    expect(fuente).toMatch(/\bPRINCIPAL\b/);
    expect(fuente).not.toMatch(
      /bg-primary text-white|bg-accent text-white|bg-white text-primary|bg-gray-100 text-gray-900|bg-gray-300 text-gray-500/,
    );
  });

  it('K6 los «Próximamente» de Precios se ven apagados, no como un secundario', () => {
    // En salvia parecían una opción válida (revisión, 26 nov 2026)
    const fuente = readFileSync(
      resolve(process.cwd(), 'src/pages/public/Pricing.jsx'),
      'utf8',
    );
    expect(fuente.match(/NO_DISPONIBLE/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it('K7 el de peligro (borrar, rechazar): el rojo de error, cuadrado y sin borde', () => {
    // La marca no tiene un rojo propio: el de error de la app, con su texto de
    // contraste, que se lee en los dos temas (Agustín, 26 nov 2026)
    expect(PELIGRO).toContain('bg-error');
    expect(PELIGRO).toContain('text-sobre-contraste');
    expect(PELIGRO).toContain('rounded-none');
    expect(PELIGRO).not.toMatch(/\bborder\b|bg-red-/);
  });

  it.each([
    'src/pages/admin/AdminPanel.jsx',
    'src/pages/admin/HoleReviews.jsx',
    'src/pages/admin/PendingGolfCourses.jsx',
    'src/pages/admin/GolfCourses.jsx',
    'src/components/admin/EditUserModal.jsx',
    'src/components/admin/ManageAccountModal.jsx',
    'src/components/admin/AdminEditCompetitionModal.jsx',
    'src/components/admin/hoyos/RevisarHoyo.jsx',
    'src/components/admin/hoyos/TodosLosCampos.jsx',
  ])('K8 %s usa los botones de la marca, no los de antes', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    expect(fuente).toMatch(/\b(PRINCIPAL|SECUNDARIO|PELIGRO)\b/);
    expect(fuente).not.toMatch(
      /bg-primary text-white|bg-primary px-4 text-sm font-semibold text-white|bg-red-600 text-white|bg-gray-100 text-gray-900|text-gray-700 rounded-lg|border border-gray-300 text-gray-700|text-gray-700 border border-gray-300|bg-primary-50 border border-primary-200/,
    );
  });

  // Los recuadros del panel (cifras de Solicitudes, avisos de error y de
  // cuidado de las ventanas) iban en pasteles sueltos; ahora, en las
  // superficies y los tonos suaves de la app, que se leen en oscuro (26 nov)
  it.each([
    'src/pages/admin/PendingGolfCourses.jsx',
    'src/components/admin/ManageAccountModal.jsx',
    'src/components/admin/AdminEditCompetitionModal.jsx',
    'src/components/admin/EditUserModal.jsx',
    'src/components/admin/hoyos/RevisarHoyo.jsx',
  ])('K9 %s sin recuadros en pasteles sueltos', (ruta) => {
    const fuente = readFileSync(resolve(process.cwd(), ruta), 'utf8');
    expect(fuente).not.toMatch(
      /bg-(yellow|blue|amber|red|green)-50 (border|p-|rounded)|rounded-lg bg-amber-50|border-2 bg-amber-50|text-amber-[0-9]|border-amber-|ring-amber-|ring-red-|text-red-700|border-red-600|bg-red-50/,
    );
  });

  it('K10 los botones de la revisión de hoyos siguen viéndose desactivados', () => {
    // Al recortar su clase base se perdió `disabled:opacity-*` en los que no
    // usan las clases de la marca (revisión, 26 nov 2026)
    const fuente = readFileSync(
      resolve(process.cwd(), 'src/components/admin/hoyos/RevisarHoyo.jsx'),
      'utf8',
    );
    const base = fuente.match(/const BOTON =\s*'([^']+)'/)[1];
    expect(base).toMatch(/disabled:opacity-/);
    expect(base).toContain('font-semibold');
  });
});
