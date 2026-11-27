import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import HeaderAuth from '../components/layout/HeaderAuth';
import { useAuth } from '../hooks/useAuth';
import { confirmEmailChangeUseCase } from '../composition';
import { laPantallaEstaLista } from '../utils/cortinaDeArranque';
import {
  forgetStrippedSecret,
  readStrippedSecret,
  stripSecretsFromAddressBar,
} from '../utils/stripSecretsFromAddressBar';
import { PANTALLA_MENOS_BARRA_INFERIOR } from '../utils/barraInferior';
import { seEstaCerrandoLaSesion } from '../utils/cierreDeEstaCarga';
import EstadoDeAcceso from '../components/auth/EstadoDeAcceso';
import BlockLoader from '../components/ui/BlockLoader';
import {
  BOTON_PRINCIPAL,
  ENLACE_PRINCIPAL,
  ENLACE_SECUNDARIO,
} from '../components/auth/clasesDeAcceso';

// Cada rechazo del backend, con su texto (BE #749)
const TEXTO_DEL_RECHAZO = {
  EMAIL_CHANGE_EXPIRED: 'confirmEmailChange.expired',
  EMAIL_ALREADY_IN_USE: 'confirmEmailChange.inUse',
  EMAIL_CHANGE_INVALID: 'confirmEmailChange.invalid',
};
// Cualquier otro fallo (sin red, el servidor): el token sigue valiendo, se reintenta
const FALLO = 'confirmEmailChange.failed';

/**
 * El enlace que confirma un correo nuevo (BE #749). Va dentro de la
 * sesión: un desconocido que lo reciba por un error al escribir el correo no puede
 * confirmarlo. Si no había sesión, el login devuelve aquí con el token.
 */
const ConfirmEmailChange = () => {
  const { t } = useTranslation('profile');
  const { user, refetch } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  // Tras quitarlo de la barra, una recarga lo recupera del historial
  const token = searchParams.get('token') || readStrippedSecret('token');
  const [estado, setEstado] = useState(
    token
      ? { clave: 'confirmEmailChange.confirming' }
      : {
          clave: 'confirmEmailChange.invalid',
        },
  );
  // Una vez por intento: el token se gasta al confirmarlo, pero un fallo de red no
  const [intento, setIntento] = useState(0);
  const enviado = useRef(-1);

  useEffect(() => {
    laPantallaEstaLista();
    // Leído: fuera de la barra y del historial, antes de que Replay grabe el href
    // y de que acabe en el Referer (como al verificar el correo)
    stripSecretsFromAddressBar();
  }, []);

  // Usado el token, ni el historial ni el router lo guardan: si no, una recarga, la
  // página guardada al cerrar la sesión o la de la que venía (la sesión que cae sin
  // recargar) lo repetirían gastado y dirían «Este enlace no vale» (revisiones, 8 nov
  // 2026). El router aún lo tiene: la barra se limpió sin él
  const olvidaElToken = useCallback(() => {
    forgetStrippedSecret('token');
    navigate({ pathname, search: '', hash }, { replace: true });
  }, [navigate, pathname, hash]);

  useEffect(() => {
    if (!token || enviado.current === intento) return;
    enviado.current = intento;
    confirmEmailChangeUseCase
      .execute(token)
      .then((confirmado) => {
        olvidaElToken();
        setEstado({
          clave: 'confirmEmailChange.done',
          email: confirmado?.email,
          bien: true,
        });
        // La sesión, con el correo nuevo; si falla, el cambio ya está hecho
        Promise.resolve(refetch?.()).catch(() => {});
      })
      .catch((error) => {
        // Falló porque la sesión se está cerrando: la redirección al login llega ya, y
        // «Comprueba la conexión» sería mentira (3c, 8 nov 2026). Sigue «Confirmando…»
        if (seEstaCerrandoLaSesion()) return;
        // Una respuesta final (caducado, no vale, ocupado) también lo gasta; un fallo de
        // red no: «Reintentar» lo necesita
        if (TEXTO_DEL_RECHAZO[error?.errorCode]) olvidaElToken();
        setEstado({ clave: TEXTO_DEL_RECHAZO[error?.errorCode] || FALLO });
        // Caducado u ocupado: el backend lo anuló, y Seguridad no debe seguir
        // mostrándolo pendiente
        Promise.resolve(refetch?.()).catch(() => {});
      });
  }, [token, refetch, intento, olvidaElToken]);

  const reintenta = () => {
    setEstado({ clave: 'confirmEmailChange.confirming' });
    setIntento((n) => n + 1);
  };

  const confirmando = estado.clave === 'confirmEmailChange.confirming';
  return (
    <div className={`${PANTALLA_MENOS_BARRA_INFERIOR} bg-fondo`}>
      <HeaderAuth user={user} />
      <main className="max-w-md mx-auto px-4 py-10">
        {/* En el móvil el título va en la cabecera (screenTitles) */}
        <h1 className="hidden md:block text-xl font-semibold text-tinta mb-4 text-center">
          {t('confirmEmailChange.title')}
        </h1>
        <EstadoDeAcceso
          pantallaCompleta={false}
          dibujo={confirmando ? undefined : estado.bien ? 'green' : 'bunker'}
          encima={confirmando ? <BlockLoader sinRelleno /> : undefined}
        >
          <p
            className="text-tinta-suave wrap-anywhere mb-3"
            role={estado.bien || confirmando ? 'status' : 'alert'}
          >
            {t(estado.clave, { email: estado.email })}
          </p>
          {estado.clave === FALLO && (
            <button
              type="button"
              onClick={reintenta}
              className={BOTON_PRINCIPAL}
            >
              {t('confirmEmailChange.retry')}
            </button>
          )}
          {!confirmando && (
            <Link
              to="/profile/edit"
              className={
                estado.clave === FALLO ? ENLACE_SECUNDARIO : ENLACE_PRINCIPAL
              }
            >
              {t('confirmEmailChange.toProfile')}
            </Link>
          )}
        </EstadoDeAcceso>
      </main>
    </div>
  );
};

export default ConfirmEmailChange;
