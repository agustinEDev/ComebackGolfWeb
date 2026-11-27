import { describe, it, expect, beforeEach } from 'vitest';
import i18next from 'i18next';
import { sigueElIdiomaDeLaApp } from './idiomaDelDocumento';

/**
 * FE #1239 · `<html lang>` dice el idioma en que está escrita la página.
 * `index.html` lo dejaba en «en» siempre, así que lectores de pantalla,
 * traductor del navegador y guionado trataban las páginas en español como
 * inglés.
 *
 *   #   arranque / cambio          | lang
 *   ----|----------------------------|------
 *   B6  arranca en es              | es
 *   B7  arranca en en              | en
 *   B8  cambia es → en → es        | en, luego es, al momento
 *   B9  navegador en fr (no la hay)| en: la página se ve en inglés
 *   B10 navegador en es-ES         | es
 *
 * Con un i18next de verdad y un backend que tarda, como el de la app: lo que
 * importa es qué idioma da i18next cuando avisa, no una copia de su regla.
 */
const backendQueTarda = {
  type: 'backend',
  init() {},
  read(idioma, _ns, cb) {
    setTimeout(
      () =>
        ['es', 'en'].includes(idioma)
          ? cb(null, { hola: idioma })
          : cb(new Error(`sin ${idioma}`), null),
      5,
    );
  },
};

const arranca = async (lng) => {
  const i18n = i18next.createInstance();
  const deja = sigueElIdiomaDeLaApp(i18n, document.documentElement);
  await i18n.use(backendQueTarda).init({
    lng,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    partialBundledLanguages: true,
  });
  return { i18n, deja };
};

beforeEach(() => {
  document.documentElement.lang = 'xx';
});

describe('El lang del <html> sigue al idioma de la app (#1239)', () => {
  it('B6: arranca en español, lang="es"', async () => {
    await arranca('es');

    expect(document.documentElement.lang).toBe('es');
  });

  it('B7: arranca en inglés, lang="en"', async () => {
    await arranca('en');

    expect(document.documentElement.lang).toBe('en');
  });

  it('B8: al cambiar de idioma cambia al momento, en los dos sentidos', async () => {
    const { i18n } = await arranca('es');

    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');

    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('B9: un idioma que la app no tiene deja el de la página, inglés', async () => {
    await arranca('fr');

    expect(document.documentElement.lang).toBe('en');
  });

  it('B10: el navegador en es-ES da lang="es"', async () => {
    await arranca('es-ES');

    expect(document.documentElement.lang).toBe('es');
  });

  it('al dejar de seguirlo, un cambio ya no lo toca', async () => {
    const { i18n, deja } = await arranca('es');

    deja();
    await i18n.changeLanguage('en');

    expect(document.documentElement.lang).toBe('es');
  });
});
