import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * La tabla de campos, compacta (Agustín, 26 nov 2026): el país, solo su código
 * (sin la bandera), y los tees en una línea.
 */
describe('GolfCourseTable', () => {
  const fuente = readFileSync(
    resolve(process.cwd(), 'src/components/golf_course/GolfCourseTable.jsx'),
    'utf8',
  );

  it('P1 el país, solo el código', () => {
    expect(fuente).not.toContain('CountryFlag');
  });

  it('P2 los tees, compactos', () => {
    expect(fuente).toContain('<TeesCompactos');
    expect(fuente).not.toContain('<TeeColorBadge');
  });

  it('P3 la columna de tees, con sitio para dos grupos por línea', () => {
    expect(fuente).toContain('min-w-[9rem]');
  });
});
