/**
 * Mantiene `<html lang>` en el idioma en que se ve la aplicación (FE #1239).
 *
 * `index.html` lo trae fijo en «en», y lectores de pantalla, traductor del
 * navegador y guionado trataban las páginas en español como inglés. Vale el
 * idioma RESUELTO de i18next, no el detectado: con el navegador en francés la
 * página se ve en inglés, y con `es-ES`, en `es`. i18next ya lo sabe cuando
 * avisa del cambio, también en el primero, el de la detección al arrancar; por
 * eso hay que llamarlo antes de `init`.
 *
 * @param {import('i18next').i18n} i18n
 * @param {HTMLElement} [raiz] - el `<html>`
 * @returns {() => void} deja de seguirlo
 */
export const sigueElIdiomaDeLaApp = (
  i18n,
  raiz = globalThis.document?.documentElement,
) => {
  if (!raiz) return () => {};
  const ponElIdioma = () => {
    if (i18n.resolvedLanguage) raiz.lang = i18n.resolvedLanguage;
  };
  i18n.on('languageChanged', ponElIdioma);
  ponElIdioma();
  return () => i18n.off('languageChanged', ponElIdioma);
};
