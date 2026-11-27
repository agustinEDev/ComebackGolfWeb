import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { PANTALLA_MENOS_BARRA_INFERIOR } from '../../utils/barraInferior';
import { marcaDeAgua } from '../../utils/marcaDeAgua';
import {
  AL_PULSAR_ENLACE,
  PRINCIPAL,
  SECUNDARIO,
} from '../../components/ui/clasesDeBoton';

const BOTON = 'inline-flex items-center justify-center h-10 px-5 text-sm';

/**
 * La dirección no lleva a ninguna pantalla (FE #544).
 *
 * Una tarjeta centrada y no la cabecera pública: esa ofrece «Registrarse» y
 * «Entrar», que a quien tiene sesión le sobran. Los botones salen de `useAuth`
 * y no del `user` de `AuthContext`, que sobrevive a las cookies; mientras se
 * pregunta, el mensaje solo. Esto solo elige qué enlace enseñar y no redirige a
 * nadie: `useAuth` puede devolver un usuario sin confirmar (`sinConfirmar`,
 * FE #529), y entonces el panel lo resuelve su propio guardia.
 */
const NotFound = () => {
  const { t } = useTranslation('common');
  const { user, loading } = useAuth();

  // La pantalla menos el hueco de la barra inferior, si App la pinta (21 oct)
  return (
    <main
      className={`flex ${PANTALLA_MENOS_BARRA_INFERIOR} items-center justify-center [--fondo-de-agua:var(--color-gray-50)] px-4 py-12 ${marcaDeAgua('bunker-rastrillo')}`}
    >
      <div className="w-full max-w-md rounded-lg bg-white px-6 py-10 text-center shadow-sm">
        <p aria-hidden="true" className="mb-4 text-5xl font-bold text-primary">
          404
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {t('notFound.title')}
        </h1>
        <p className="mb-8 text-gray-600">{t('notFound.message')}</p>

        {!loading && (
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className={`${BOTON} ${PRINCIPAL} ${AL_PULSAR_ENLACE}`}
              >
                {t('notFound.goToDashboard')}
              </Link>
            ) : (
              <>
                <Link
                  to="/"
                  className={`${BOTON} ${SECUNDARIO} ${AL_PULSAR_ENLACE}`}
                >
                  {t('notFound.goHome')}
                </Link>
                <Link
                  to="/login"
                  className={`${BOTON} ${PRINCIPAL} ${AL_PULSAR_ENLACE}`}
                >
                  {t('notFound.login')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default NotFound;
