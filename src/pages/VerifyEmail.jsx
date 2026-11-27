import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  verifyEmailUseCase,
  resendVerificationLinkUseCase,
} from '../composition';
import BlockLoader from '../components/ui/BlockLoader';
import EstadoDeAcceso from '../components/auth/EstadoDeAcceso';
import {
  BOTON_PRINCIPAL,
  ENLACE_PRINCIPAL,
  ENLACE_SECUNDARIO,
} from '../components/auth/clasesDeAcceso';
import {
  stripSecretsFromAddressBar,
  readStrippedSecret,
} from '../utils/stripSecretsFromAddressBar';
import { registraElFallo } from '../utils/registraElFallo';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  // Tras quitarlo de la barra, una recarga lo recupera del historial
  const token = searchParams.get('token') || readStrippedSecret('token');

  // Leido: fuera de la barra, antes de que Replay grabe el href de la pagina
  // y de que acabe en el Referer (utils/stripSecretsFromAddressBar.js)
  useEffect(() => {
    stripSecretsFromAddressBar();
  }, []);

  // verifying | verifiedSignIn | deactivated | expired | error | invalid
  const [status, setStatus] = useState('verifying');
  const hasVerifiedRef = useRef(false); // Usar ref para prevenir doble ejecución
  // Pedir otro enlace con el caducado (fase 3): idle | sending | sent | limited | failed
  const [reenvio, setReenvio] = useState('idle');

  // El `disabled` llega en el siguiente render: el ref corta un segundo clic en el acto
  const pidiendoEnlace = useRef(false);
  const pideOtroEnlace = async () => {
    if (pidiendoEnlace.current) return;
    pidiendoEnlace.current = true;
    setReenvio('sending');
    try {
      await resendVerificationLinkUseCase.execute(token);
      setReenvio('sent');
    } catch (error) {
      if (error?.status === 429) {
        setReenvio('limited');
        return;
      }
      registraElFallo(
        'VerifyEmail.error-resending-the-verification-link',
        'Error resending the verification link:',
        error,
      );
      setReenvio('failed');
    } finally {
      // Enviado, el botón queda desactivado; si falló, se puede volver a pedir
      pidiendoEnlace.current = false;
    }
  };

  useEffect(() => {
    // Prevenir ejecución múltiple usando ref (más confiable que state con React Strict Mode)
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyEmail = async () => {
      if (!token || token.trim() === '') {
        setStatus('invalid');
        return;
      }

      try {
        await verifyEmailUseCase.execute(token);

        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Verificar no abre sesión (BE #753): se entra con la contraseña. Con
        // una sesión ya abierta, el enlace de iniciar sesión lleva al panel
        setStatus('verifiedSignIn');
      } catch (error) {
        registraElFallo(
          'VerifyEmail.verification-error',
          '❌ Verification error:',
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (error?.errorCode === 'VERIFICATION_TOKEN_EXPIRED') {
          // Es el de la cuenta, pero pasaron sus 48 horas: se ofrece otro (fase 3)
          setStatus('expired');
          return;
        }
        // Desactivada: el correo SÍ quedó verificado, pero no entra (BE #750)
        setStatus(
          error?.errorCode === 'ACCOUNT_DEACTIVATED' ? 'deactivated' : 'error',
        );
      }
    };

    verifyEmail();
  }, [token, navigate]);

  // Cada estado con su dibujo y sus salidas: el búnker para lo que salió mal y
  // el green para lo que salió bien (26 nov 2026). Una sola salida a cada
  // sitio: antes «Ir al inicio» y «Volver al inicio» iban juntas
  if (status === 'verifying') {
    return (
      <EstadoDeAcceso
        nivel={1}
        encima={<BlockLoader sinRelleno />}
        titulo={t('verifyEmail.verifyingTitle')}
        texto={t('verifyEmail.verifyingBody')}
      >
        {/* Con una red lenta puede tardar: no se queda sin salida */}
        <Link
          to="/"
          className="inline-block text-sm text-tinta-suave hover:text-tinta"
        >
          ← {t('verifyEmail.backToHome')}
        </Link>
      </EstadoDeAcceso>
    );
  }

  // Verificado, sin sesión: a iniciar sesión (BE #753). Con recarga:
  // con una sesión ya abierta, el login lleva al panel y este ya pregunta el
  // usuario verificado, sin el aviso de verificar
  if (status === 'verifiedSignIn') {
    return (
      <EstadoDeAcceso
        nivel={1}
        dibujo="green"
        titulo={t('verifyEmail.successTitle')}
        texto={t('verifyEmail.signInNow')}
      >
        <a href="/login" className={ENLACE_PRINCIPAL}>
          {t('verifyEmail.goToLogin')}
        </a>
      </EstadoDeAcceso>
    );
  }

  // Enlace caducado: se ofrece otro, sin sesión (fase 3)
  if (status === 'expired') {
    return (
      <EstadoDeAcceso
        nivel={1}
        dibujo="bunker"
        titulo={t('verifyEmail.expiredTitle')}
        texto={t('verifyEmail.expiredMessage')}
      >
        {reenvio !== 'idle' && reenvio !== 'sending' && (
          <p
            role="status"
            className={`mb-3 ${reenvio === 'sent' ? 'text-exito' : 'text-error'}`}
          >
            {reenvio === 'sent' && t('verifyEmail.resendLinkSent')}
            {reenvio === 'limited' && t('common:demasiadasPeticiones')}
            {reenvio === 'failed' && t('emailVerification.failed')}
          </p>
        )}
        {/* Enviado, no se vuelve a pedir: la respuesta es la misma con
            cualquier token y otro clic solo gastaría el límite */}
        <button
          type="button"
          onClick={pideOtroEnlace}
          disabled={reenvio === 'sending' || reenvio === 'sent'}
          className={BOTON_PRINCIPAL}
        >
          {t('verifyEmail.resendLink')}
        </button>
        <Link to="/login" className={ENLACE_SECUNDARIO}>
          {t('verifyEmail.goToLogin')}
        </Link>
        <Link to="/" className={ENLACE_SECUNDARIO}>
          {t('verifyEmail.goToHome')}
        </Link>
      </EstadoDeAcceso>
    );
  }

  // Cuenta desactivada: verificado, pero sin sesión ni panel
  if (status === 'deactivated') {
    return (
      <EstadoDeAcceso
        nivel={1}
        dibujo="green"
        titulo={t('verifyEmail.successTitle')}
      >
        <p role="alert" className="text-tinta-suave mb-3">
          {t('google.accountDeactivated')}
        </p>
        <Link to="/" className={ENLACE_PRINCIPAL}>
          {t('verifyEmail.goToHome')}
        </Link>
      </EstadoDeAcceso>
    );
  }

  // Inválido o ya usado
  if (status === 'error') {
    return (
      <EstadoDeAcceso
        nivel={1}
        dibujo="bunker"
        titulo={t('verifyEmail.errorTitle')}
        texto={t('verifyEmail.errorMessage')}
      >
        <Link to="/login" className={ENLACE_PRINCIPAL}>
          {t('verifyEmail.goToLogin')}
        </Link>
        <Link to="/" className={ENLACE_SECUNDARIO}>
          {t('verifyEmail.goToHome')}
        </Link>
      </EstadoDeAcceso>
    );
  }

  // Sin token en el enlace
  return (
    <EstadoDeAcceso
      nivel={1}
      dibujo="bunker"
      titulo={t('verifyEmail.invalidTitle')}
      texto={t('verifyEmail.invalidMessage')}
    >
      <Link to="/" className={ENLACE_PRINCIPAL}>
        {t('verifyEmail.goToHome')}
      </Link>
    </EstadoDeAcceso>
  );
};

export default VerifyEmail;
