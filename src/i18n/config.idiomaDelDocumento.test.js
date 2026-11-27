import { describe, it, expect } from 'vitest';
import i18n from 'i18next';
import './config';

/**
 * FE #1239 · la configuración real de la app engancha `sigueElIdiomaDeLaApp`:
 * sin esto, la pieza podría estar probada y no usarse.
 */
describe('config de i18n · lang del <html>', () => {
  it('cambiar el idioma de la app cambia el lang del documento', async () => {
    await i18n.changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');

    await i18n.changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it.each(['fr', 'fr-FR', 'de'])(
    'con el navegador en un idioma que la app no tiene (%s), i18n.language es el de la app: inglés',
    async (detectado) => {
      await i18n.changeLanguage(detectado);

      // Lo leen ~60 sitios para fechas y números: tiene que ser el que se ve
      expect(i18n.language).toBe('en');
      expect(document.documentElement.lang).toBe('en');
    },
  );

  it('es-ES sigue siendo español', async () => {
    await i18n.changeLanguage('es-ES');

    expect(i18n.language).toMatch(/^es/);
    expect(document.documentElement.lang).toBe('es');
  });
});
