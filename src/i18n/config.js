import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { sigueElIdiomaDeLaApp } from './idiomaDelDocumento';

// Custom backend para lazy loading de traducciones
// Reduce bundle inicial de ~313 KB a ~40 KB (solo carga common en idioma detectado)
const LazyBackend = {
  type: 'backend',

  init() {
    // No-op - required by i18next backend interface
  },

  read(language, namespace, callback) {
    // Dynamic import solo del archivo necesario
    import(`./locales/${language}/${namespace}.json`)
      .then((module) => {
        callback(null, module.default);
      })
      .catch((error) => {
        console.warn(`Failed to load ${language}/${namespace}:`, error);
        callback(error, null);
      });
  },
};

// Antes de `init`: así también llega el idioma detectado al arrancar (FE #1239)
sigueElIdiomaDeLaApp(i18n);

i18n
  .use(LazyBackend) // Custom backend para lazy loading
  .use(LanguageDetector) // Detecta idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    fallbackLng: 'en', // Idioma por defecto si no se detecta
    // Los que tiene la app (FE #1238). Sin esto, con el navegador en francés la
    // app se veía en inglés pero `i18n.language` decía «fr», y las fechas y
    // números que lo leen salían en francés. `es-ES` sigue valiendo: es español
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true,
    defaultNS: 'common', // Namespace por defecto
    ns: [
      'common',
      'auth',
      'landing',
      'dashboard',
      'profile',
      'competitions',
      'devices',
      'golfCourses',
      'schedule',
      'pricing',
      'contact',
      'legal',
      'invitations',
      'scoring',
      'friends',
      'quickMatch',
      'admin',
      'feed',
      'playerProfile',
    ], // Namespaces disponibles

    // Lazy loading configuration
    partialBundledLanguages: true, // Permite cargar parcialmente los idiomas

    detection: {
      // Orden de detección: localStorage -> navigator
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // Guardar selección en localStorage
    },

    // Hay traducciones vacías a propósito (un texto que en ese sitio no lleva
    // nada). i18next 27 las trata como ausentes y pinta la clave: con esto se
    // pintan vacías, como hasta la 26. Lo vigila traduccionVacia.test.js
    returnEmptyString: true,

    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },

    react: {
      useSuspense: false, // Evita problemas con SSR
    },
  });
