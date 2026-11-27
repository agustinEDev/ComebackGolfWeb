import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../hooks/useAuthContext';
import { googleLoginUseCase, linkGoogleAccountUseCase } from '../composition';
import {
  verifyOAuthState,
  recogeLaVueltaDeGoogleConSuCuenta,
  recogeElVerificadorDeGoogle,
} from '../utils/googleOAuth';
import {
  olvidaLaVueltaTrasEntrar,
  vueltaTrasEntrar,
} from '../utils/vueltaTrasEntrar';
import { vuelvenLosAvisosDeCierre } from '../utils/avisoDeCierreForzado';
import { stripSecretsFromAddressBar } from '../utils/stripSecretsFromAddressBar';
import customToast from '../utils/toast';
import FullScreenLoader from '../components/ui/FullScreenLoader';
import { registraElFallo } from '../utils/registraElFallo';
import EstadoDeAcceso from '../components/auth/EstadoDeAcceso';
import { ENLACE_PRINCIPAL } from '../components/auth/clasesDeAcceso';

const GoogleCallback = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, updateCsrfToken } = useAuthContext();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);
  const [flow, setFlow] = useState('login');

  // El code y el state, ya leidos por el router: fuera de la barra, antes de
  // que Replay grabe el href de la pagina y de que acabe en el Referer
  // (utils/stripSecretsFromAddressBar.js)
  useEffect(() => {
    stripSecretsFromAddressBar();
  }, []);

  // La vuelta de Google se procesa UNA vez: el código solo se canjea una (A07),
  // y el verifier de PKCE se lee y se borra al recogerlo. Es un evento del
  // efecto y no el efecto: lee la URL, `t` y `navigate` del momento en que se
  // lanza, sin que un cambio de idioma o un repintado lo vuelvan a lanzar
  const procesaLaVuelta = useEffectEvent(async () => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const stateParam = searchParams.get('state');

    // El verifier de PKCE se recoge lo primero, y así se borra pase lo que pase: bien,
    // mal o con la vuelta rechazada (fase 3)
    const codeVerifier = recogeElVerificadorDeGoogle();
    // Y la página de vuelta guardada (lleva el token del enlace de cambio de correo):
    // se recoge antes de cualquier salida temprana, para que no se quede guardada
    // (/code-review). Solo la usa la entrada; vincular no la guarda
    const vuelta = recogeLaVueltaDeGoogleConSuCuenta();

    // Verify CSRF nonce from state parameter
    const { flow: parsedFlow, valid } = verifyOAuthState(stateParam);
    setFlow(parsedFlow);

    if (!valid) {
      setError(t('google.callbackError'));
      return;
    }

    // Handle Google OAuth error
    if (errorParam) {
      setError(t('google.callbackError'));
      return;
    }

    // Missing authorization code
    if (!code) {
      setError(t('google.missingCode'));
      return;
    }

    // Sin verifier (la vuelta llegó a otra pestaña, o el almacenamiento se vació) el
    // backend no canjearía el código: ni se le pregunta
    if (!codeVerifier) {
      setError(
        t(
          parsedFlow === 'link'
            ? 'google.missingVerifierLink'
            : 'google.missingVerifier',
        ),
      );
      return;
    }

    try {
      if (parsedFlow === 'link') {
        // Link Google account flow
        await linkGoogleAccountUseCase.execute(code, codeVerifier);
        customToast.success(t('google.linkSuccess'));
        navigate('/profile/edit', { replace: true });
      } else {
        // Login/register flow. La vuelta ya se recogió arriba
        const { user, csrfToken, isNewUser } = await googleLoginUseCase.execute(
          code,
          codeVerifier,
        );

        // Update auth context
        setUser(user);
        updateCsrfToken(csrfToken);

        if (isNewUser) {
          // Se entró: acaba el silencio de un cierre de sesión anterior (C5). Un alta
          // es otra cuenta y no vuelve a ninguna página: la guardada se olvida
          vuelvenLosAvisosDeCierre();
          olvidaLaVueltaTrasEntrar();
          customToast.info(t('google.welcomeNewUser'));
          navigate('/auth/complete-profile', { replace: true });
        } else {
          vuelvenLosAvisosDeCierre();
          customToast.success(
            t('login.welcomeMessage', { name: user.firstName }),
          );
          // A la página de la que se vino: la que trae Google (confirmar el correo) o
          // la guardada por una redirección dura, que se gasta; si no, al panel
          // Con la cuenta que la apuntó: si es otra la que entra, a su panel (FE #1064)
          const url = vuelta
            ? new globalThis.URL(vuelta.ruta, globalThis.location.origin)
            : null;
          const desdeGoogle = url
            ? {
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                cuenta: vuelta.cuenta,
              }
            : null;
          navigate(
            vueltaTrasEntrar(desdeGoogle ?? undefined, { cuenta: user?.id }),
            { replace: true },
          );
        }
      }
    } catch (err) {
      registraElFallo(
        'GoogleCallback.google-oauth-callback-error',
        'Google OAuth callback error:',
        err,
      );
      // La página guardada se conserva: solo una entrada con éxito la gasta, y quien
      // entre después con contraseña vuelve a ella (Agustín, 8 nov 2026)

      // Sin 423: el bloqueo por fallos de contraseña no frena a Google (BE #732)
      if (err.errorCode === 'GOOGLE_LINK_NEEDS_VERIFIED_EMAIL') {
        // Vincular Google pide el correo de la cuenta verificado (BE #749)
        setError(t('google.linkNeedsVerifiedEmail'));
      } else if (err.errorCode === 'REAUTHENTICATION_REQUIRED') {
        // Vincular pide la contraseña confirmada hace menos de 5 minutos
        // (BE #753): caducó o no se confirmó. Desde el perfil se vuelve a pedir
        setError(t('google.reauthRequired'));
      } else if (err.errorCode === 'GOOGLE_EMAIL_NOT_VERIFIED') {
        // Google no verificó el correo: ni alta ni vínculo (backend, revisión
        // del registro con Google)
        setError(t('google.emailNotVerified'));
      } else if (err.errorCode === 'ACCOUNT_DEACTIVATED') {
        // Reintentar no sirve: que lo diga
        setError(t('google.accountDeactivated'));
      } else if (err.status === 429) {
        setError(t('google.rateLimited'));
      } else if (err.status === 409) {
        setError(t('google.alreadyLinked'));
      } else {
        // Texto propio y traducido: el del backend no sigue el idioma de la app
        setError(
          parsedFlow === 'link'
            ? t('google.linkError')
            : t('google.genericError'),
        );
      }
    }
  });

  useEffect(() => {
    // StrictMode monta los efectos dos veces en desarrollo: el ref, que sobrevive
    // a ese doble montaje, deja pasar solo la primera
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    procesaLaVuelta();
  }, []);

  if (error) {
    return (
      <EstadoDeAcceso
        dibujo="bunker"
        titulo={
          flow === 'link' ? t('google.linkErrorTitle') : t('google.errorTitle')
        }
        texto={error}
      >
        <Link
          to={flow === 'link' ? '/profile/edit' : '/login'}
          className={ENLACE_PRINCIPAL}
        >
          {flow === 'link'
            ? t('google.backToProfile')
            : t('login.signInButton')}
        </Link>
      </EstadoDeAcceso>
    );
  }

  // La misma espera que el resto del arranque: entrar con Google es otro camino
  // de entrada, y cambiar de dibujo a mitad es lo que se nota como parpadeo
  return <FullScreenLoader />;
};

export default GoogleCallback;
