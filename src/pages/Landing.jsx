import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useNavigationType } from 'react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, Share, Trophy, Users, Zap } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';
import { useStandalone } from '../hooks/useStandalone';
import { ARRANCO_EN_LA_PORTADA } from '../utils/appStartup';
import FullScreenLoader from '../components/ui/FullScreenLoader';
import { laPantallaEstaLista } from '../utils/cortinaDeArranque';
import InstallInstructionsModal from '../components/ui/InstallInstructionsModal';
import TituloDeLaPortada from '../components/landing/TituloDeLaPortada';
import { useEntryMotion } from '../hooks/useEntryMotion';
import {
  fadeInUp,
  slideUp,
  staggerContainer,
  getEntryProps,
  getRevealProps,
} from '../utils/animations';
import { marcaDeAguaDelMonograma } from '../utils/marcaDeAgua';
import {
  AL_PULSAR_BOTON,
  PRINCIPAL,
  SECUNDARIO,
} from '../components/ui/clasesDeBoton';
import CapturaDeLaApp from '../components/ui/CapturaDeLaApp';

const Landing = () => {
  const { t, ready: textosListos } = useTranslation('landing');
  const { t: tCommon, ready: textosComunesListos } = useTranslation('common');
  const navigate = useNavigate();
  const {
    canInstall,
    isIOS,
    iosInstallRoute,
    isDesktopSafari,
    isInstalled,
    install,
  } = useInstallPrompt();
  const esAplicacionInstalada = useStandalone();
  // Solo el ARRANQUE, no cualquier visita a `/`: dentro de la aplicación
  // instalada el logo de la cabecera y «Características» apuntan a `/` y a
  // `/#features`, y sin esta condición rebotaban al panel desde Términos o
  // Privacidad dejando la portada inalcanzable.
  //
  // Son dos preguntas distintas y hacen falta las dos. `ARRANCO_EN_LA_PORTADA`
  // mira por dónde se entró, que se decide en el arranque. El tipo de
  // navegación distingue esa entrada de una llegada por enlace dentro de la
  // aplicación: la primera es `POP` y un enlace es `PUSH`, así que quien se
  // registre desde la portada y luego pulse el logo ya no sale rebotado.
  //
  // Ninguna de las dos escribe nada aquí: la marca se anota al cargar el
  // paquete, y un render descartado y reintentado no puede consumirla en
  // silencio.
  const tipoDeNavegacion = useNavigationType();
  const esElArranque = ARRANCO_EN_LA_PORTADA && tipoDeNavegacion === 'POP';
  // Arrancando la aplicacion instalada, esta pantalla no se pinta: manda al
  // formulario. Hay que saberlo ANTES del aviso a la cortina
  const vaAlAcceso = esAplicacionInstalada && esElArranque;
  const comprobandoSesion = useRedirectIfAuthenticated({
    enabled: esAplicacionInstalada && esElArranque,
    // Igual que `/start`: sin este, un arranque sin cobertura agotaba aqui los
    // cinco segundos de la comprobacion, redirigia al formulario y alli se
    // gastaban otros cinco. Diez segundos para entrar a anotar en el campo
    entrarSinRed: true,
  });
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const { animateEntry, animateOnScroll } = useEntryMotion();

  // Abrir la aplicacion desde su icono con la sesion abierta lleva al panel, no
  // a la portada: quien la tiene instalada ya sabe lo que es y solo quiere
  // entrar. En el navegador la portada se sigue viendo con sesion, que es donde
  // tiene sentido enseñarla o compartirla.
  //
  // Se reutiliza el hook del login y no `useAuth` por lo que documenta el
  // propio hook: en una pagina publica el interceptor NO refresca ante un 401
  // de `/current-user`, y esta —`/`— es publica. Con `useAuth`, abrir la
  // aplicacion pasados los 15 minutos del access dejaba a un usuario con
  // sesion renovable mirando la portada, que es justo lo que esto arregla.
  //
  // Y mientras comprueba no se pinta la portada: apareceria entera para
  // desaparecer un segundo despues.
  // El aviso a la cortina del arranque (FE #485). La portada tambien es puerta
  // de entrada: los iconos instalados ANTES de FE #465 llevan `/` cocido como
  // ruta de arranque —iOS guarda la URL al crear el acceso directo y no la
  // cambia al cambiar el manifiesto—, asi que para esa gente el arranque sigue
  // pasando por aqui. Sin esto, la cortina se retiraba nada mas llegar y todo
  // el arreglo no les hacia nada.
  //
  // Con sesion NO se avisa: `useRedirectIfAuthenticated` deja `comprobandoSesion`
  // arriba mientras redirige al panel, y alli se avisa cuando toca. Los textos
  // cuentan como carga, igual que en las otras dos pantallas.
  //
  // Sin preguntar si la aplicacion esta instalada, al reves que `AppStart`: alli
  // hace falta porque en el navegador esa ruta redirige y no llega a pintarse.
  // Aqui no: en el navegador la cortina ya se ha retirado sola —no se sostiene
  // fuera de la aplicacion instalada— y avisar es no hacer nada.
  useEffect(() => {
    // Y NO cuando esta pantalla va a redirigir: avisar ahi levantaba la cortina
    // antes de que existiera `/start`, y ademas daba el arranque por terminado,
    // asi que la espera de la pantalla siguiente salia en su cara clara a media
    // sesion —el defecto de FE #492— y sus textos podian leerse en crudo
    if (vaAlAcceso) return;

    if (!comprobandoSesion && textosListos && textosComunesListos) {
      laPantallaEstaLista();
    }
  }, [vaAlAcceso, comprobandoSesion, textosListos, textosComunesListos]);

  if (comprobandoSesion) {
    return <FullScreenLoader />;
  }

  // Arrancando la aplicacion instalada, al formulario y no a la portada. Los
  // iconos anteriores a FE #465 abren por aqui —iOS guarda la URL al crear el
  // acceso directo y no la cambia al cambiar el manifiesto—, asi que quien no
  // tenga sesion se quedaba mirando la pagina de marketing al abrir SU
  // aplicacion. Dentro, la portada solo debe verse pulsando su enlace del pie,
  // y eso llega como navegacion `PUSH`, que `esElArranque` distingue.
  //
  // Alcanza a MAS que a los iconos viejos, y es a proposito: cualquier entrada
  // en `/` desde la aplicacion instalada cuenta, incluido un enlace compartido
  // que Android abra dentro de ella. Quien lo reciba vera el acceso en vez de la
  // portada que le querian enseñar, y llegara a ella por «que es esto». Se
  // asume: dentro de la aplicacion, la pagina de marketing no aparece sola.
  if (vaAlAcceso) {
    return <Navigate to="/start" replace />;
  }

  const handleGetStarted = () => {
    navigate('/register');
  };

  // Hero is above the fold: it never animates opacity, only transform
  const heroProps = getEntryProps(animateEntry);
  const revealProps = getRevealProps(animateOnScroll);

  return (
    // Sin fondo propio: lo pinta la capa de la marca de agua (el monograma,
    // fijo detrás de toda la página), a la que se le da el de siempre
    <div
      className={`relative flex h-auto min-h-screen w-full flex-col [--fondo-de-agua:var(--color-white)] ${marcaDeAguaDelMonograma()}`}
    >
      <InstallInstructionsModal
        isOpen={showInstallModal}
        route={isDesktopSafari ? 'desktop-safari' : iosInstallRoute}
        onClose={() => setShowInstallModal(false)}
      />
      <div className="layout-container flex h-full grow flex-col">
        {/* Solo el monograma: el nombre lo da el título, con el logo grande */}
        <Header soloMonograma />

        {/* Hero Section - Completely Redesigned */}
        {/* Bajo este bloque había una onda que lo separaba del siguiente. Al
            quitarla quedó un hueco vacío: de las cifras al título de después,
            268 px en escritorio y 192 en el móvil (Agustín, 25 nov 2026). Se
            quitan el relleno inferior de la sección (`pb-16`, el sitio de la
            onda) y la mitad del de su contenedor, que por eso va distinto arriba
            que abajo; quedan 156 y 96 px. Volver a `py-24` reabre el hueco */}
        <section className="relative overflow-hidden">
          {/* La textura se desvanece hacia abajo: la onda tapaba su borde, y sin
              ella acababa en una línea recta justo bajo las cifras */}
          <div className="absolute inset-0 bg-[url('/images/golf-background.jpeg')] bg-cover bg-center opacity-5 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />

          <div className="relative px-4 md:px-8 pt-16 pb-8 md:pt-24 md:pb-12 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <motion.div
                {...heroProps}
                variants={staggerContainer}
                className="space-y-6 md:space-y-8"
              >
                {/* Badge */}
                <motion.div variants={slideUp}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t('hero.badge')}
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.div variants={slideUp} className="space-y-4">
                  <TituloDeLaPortada
                    saludo={t('hero.title')}
                    marca={t('hero.brand')}
                  />
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-12 bg-accent rounded-full" />
                  </div>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                  variants={slideUp}
                  className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl"
                >
                  {t('hero.subtitle')}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  variants={slideUp}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <button
                    onClick={handleGetStarted}
                    className={`px-8 py-4 text-base ${PRINCIPAL} ${AL_PULSAR_BOTON}`}
                  >
                    {t('hero.getStartedButton')}
                  </button>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        // Donde no hay instalacion programatica, los pasos son
                        // la funcionalidad: merecen un modal, no una linea de
                        // texto gris bajo el boton (FE #335)
                        if (isIOS || isDesktopSafari) {
                          setShowInstallModal(true);
                        } else if (!canInstall) {
                          setShowInstallHint((h) => !h);
                        } else {
                          install();
                        }
                      }}
                      className={`flex items-center justify-center gap-2 px-8 py-4 text-base ${SECUNDARIO} ${AL_PULSAR_BOTON}`}
                    >
                      {isIOS ? (
                        <Share className="w-5 h-5" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      {tCommon('installBanner.install')}
                    </button>
                    {showInstallHint &&
                      !isIOS &&
                      !isDesktopSafari &&
                      !canInstall && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                          {isInstalled
                            ? tCommon('installBanner.alreadyInstalled')
                            : tCommon('installBanner.genericHint')}
                        </p>
                      )}
                  </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={slideUp}
                  className="grid grid-cols-3 gap-3 sm:gap-6 pt-8 border-t border-gray-200"
                >
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-primary font-poppins">
                      {t('hero.stats.free')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t('hero.stats.freeDetail')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-primary font-poppins">
                      {t('hero.stats.handicap')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t('hero.stats.handicapDetail')}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-2xl font-bold text-primary font-poppins">
                      {t('hero.stats.noAds')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {t('hero.stats.noAdsDetail')}
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Column - Hero Image/Visual */}
              <motion.div
                {...heroProps}
                variants={slideUp}
                className="relative hidden lg:block"
              >
                {/* La app de verdad, no una foto de banco de imágenes */}
                <div className="flex justify-center">
                  <CapturaDeLaApp
                    src="/images/portada/inicio.webp"
                    alt={t('hero.imageAlt')}
                    className="w-[300px]"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section - Redesigned */}
        <section
          id="features"
          className="relative z-10 px-4 md:px-8 py-16 md:py-24 max-w-7xl mx-auto"
        >
          <motion.div
            {...revealProps}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Section Header */}
            <motion.div
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 font-poppins">
                {t('features.title')}
              </h2>
              <p className="text-lg text-gray-600">{t('features.subtitle')}</p>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Feature 1 - Handicap Management */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                  {t('features.handicap.title')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('features.handicap.description')}
                </p>
              </motion.div>

              {/* Feature 2 - Ryder Cup Format */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-accent-400/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                  <Trophy className="w-6 h-6 text-accent-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                  {t('features.format.title')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('features.format.description')}
                </p>
              </motion.div>

              {/* Feature 3 - Team Management */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-navy-800/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-navy-800 group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-navy-800 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                  {t('features.team.title')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('features.team.description')}
                </p>
              </motion.div>

              {/* Feature 4 - Live Scoring */}
              <motion.div
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <Zap className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                  {t('features.scoring.title')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t('features.scoring.description')}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Benefits Section */}
        {/* La franja arena, translúcida: deja ver el monograma al pasar */}
        <section className="bg-gray-50/65 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              {...revealProps}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* La anotación de un hoyo, de verdad */}
              <motion.div variants={fadeInUp} className="flex justify-center">
                <CapturaDeLaApp
                  src="/images/portada/anotacion.webp"
                  alt={t('benefits.imageAlt')}
                  className="w-[280px]"
                />
              </motion.div>

              {/* Right - Benefits List */}
              <motion.div variants={staggerContainer} className="space-y-6">
                <motion.div variants={fadeInUp}>
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 font-poppins">
                    {t('benefits.title')}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {t('benefits.subtitle')}
                  </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-4">
                  {[
                    {
                      title: t('benefits.simple.title'),
                      desc: t('benefits.simple.description'),
                    },
                    {
                      title: t('benefits.mobile.title'),
                      desc: t('benefits.mobile.description'),
                    },
                    {
                      title: t('benefits.fair.title'),
                      desc: t('benefits.fair.description'),
                    },
                    {
                      title: t('benefits.community.title'),
                      desc: t('benefits.community.description'),
                    },
                  ].map((benefit) => (
                    <motion.div
                      key={benefit.title}
                      variants={fadeInUp}
                      className="flex gap-4 items-start"
                    >
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {benefit.title}
                        </h4>
                        <p className="text-gray-600 text-sm">{benefit.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4 md:px-8">
          <motion.div
            {...revealProps}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center bg-primary rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl [--cbg-foco:var(--cbg-sobre-contraste)]"
          >
            {/* Background Pattern - Subtle */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full -translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-poppins">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleGetStarted}
                  className={`px-8 py-4 text-base ${PRINCIPAL} ${AL_PULSAR_BOTON}`}
                >
                  {t('cta.button')}
                </button>
                <button
                  onClick={() => (globalThis.location.href = '#features')}
                  className={`px-8 py-4 text-base ${SECUNDARIO} ${AL_PULSAR_BOTON}`}
                >
                  {t('cta.learnMore')}
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default Landing;
