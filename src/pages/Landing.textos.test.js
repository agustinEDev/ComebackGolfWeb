import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Textos de la portada que no se sostenían (Agustín, 26 nov 2026): la insignia
 * decía «Plataforma #1 de Torneos de Golf», que no se puede afirmar, y el botón
 * final invitaba a una «prueba gratis» de una app que es gratis siempre.
 */
const textos = (idioma) =>
  JSON.parse(
    readFileSync(
      resolve(process.cwd(), `src/i18n/locales/${idioma}/landing.json`),
      'utf8',
    ),
  );

describe('textos de la portada', () => {
  it.each([
    ['es', 'Golf entre amigos', 'Crea tu cuenta gratis'],
    ['en', 'Golf among friends', 'Create your free account'],
  ])('T1 %s: la insignia y el botón final', (idioma, insignia, boton) => {
    const t = textos(idioma);
    expect(t.hero.badge).toBe(insignia);
    expect(t.cta.button).toBe(boton);
  });

  it.each(['es', 'en'])(
    'T2 %s: ni «#1» ni «prueba» en toda la portada',
    (idioma) => {
      const todo = JSON.stringify(textos(idioma));
      expect(todo).not.toMatch(/#1|prueba gratis|free trial/i);
    },
  );
});

/**
 * Las fotos de banco de imágenes de la portada, con sus tarjetas inventadas,
 * dejan paso a capturas de verdad de la app (Agustín, 26 nov 2026).
 */
describe('las imágenes de la portada', () => {
  const fuente = readFileSync(
    resolve(process.cwd(), 'src/pages/Landing.jsx'),
    'utf8',
  );

  it('I1 enseña la app: Inicio arriba y la anotación de un hoyo después', () => {
    expect(fuente).toContain('/images/portada/inicio.webp');
    expect(fuente).toContain('/images/portada/anotacion.webp');
    expect(fuente).toContain('<CapturaDeLaApp');
  });

  it('I2 ni fotos de banco de imágenes ni datos inventados', () => {
    expect(fuente).not.toMatch(
      /hero-tournament|golf-friends|springClassic|nextTournament|easySetup\.short/,
    );
  });

  it.each(['es', 'en'])(
    'I3 %s: los textos inventados ya no existen',
    (idioma) => {
      const t = textos(idioma);
      expect(t.hero).not.toHaveProperty('springClassic');
      expect(t.hero).not.toHaveProperty('nextTournament');
      expect(t.benefits.easySetup).not.toHaveProperty('shortTitle');
    },
  );

  it('I4 ninguna captura se pide sin espera: la de arriba no se ve en el móvil', () => {
    expect(fuente).not.toContain('sinEspera');
  });

  it('I5 el panel final da al foco un color que se ve sobre él', () => {
    // El panel es Forest en claro y arena en oscuro: el anillo de siempre
    // (Forest en claro) no se veía (revisión, 26 nov 2026)
    expect(fuente).toContain('[--cbg-foco:var(--cbg-sobre-contraste)]');
  });
});
