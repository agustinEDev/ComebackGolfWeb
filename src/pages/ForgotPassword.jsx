import { Clock, Info, Lock, Mail, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import customToast from '../utils/toast';
import { useTranslation } from 'react-i18next';
import { validateEmail } from '../utils/validation';
import { requestPasswordResetUseCase } from '../composition';
import MarcoDeAcceso from '../components/auth/MarcoDeAcceso';
import { mensajeDelError } from '../utils/mensajeDelError';
import { registraElFallo } from '../utils/registraElFallo';
import EstadoDeAcceso from '../components/auth/EstadoDeAcceso';
import {
  BOTON_PRINCIPAL,
  ENLACE_PRINCIPAL,
  TARJETA_DE_ACCESO,
} from '../components/auth/clasesDeAcceso';

const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      newErrors.email = t(
        emailValidation.messageKey,
        emailValidation.messageOptions,
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordResetUseCase.execute(email);

      customToast.success(t('forgotPassword.success'));
      setSubmitted(true);
    } catch (error) {
      registraElFallo(
        'ForgotPassword.forgot-password-error',
        'Forgot password error:',
        error,
      );

      // Manejo de rate limiting (429)
      if (error.status === 429) {
        customToast.error(t('forgotPassword.rateLimitError'), {
          duration: 6000,
        });
      } else {
        customToast.error(mensajeDelError(error, t('forgotPassword.error')), {
          duration: 5000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Vista después de enviar el email
  if (submitted) {
    return (
      <MarcoDeAcceso
        titulo={t('forgotPassword.checkEmailTitle')}
        subtitulo={t('forgotPassword.checkEmailSubtitle')}
      >
        {/* El enlace, enviado: el green y, debajo, qué hacer ahora */}
        <EstadoDeAcceso
          pantallaCompleta={false}
          dibujo="green"
          titulo={t('forgotPassword.emailSentTitle')}
          texto={
            <>
              {t('forgotPassword.emailSentMessage')}{' '}
              <strong className="text-tinta wrap-anywhere">{email}</strong>,{' '}
              {t('forgotPassword.emailSentSuffix')}
            </>
          }
        >
          <div className="flex items-start gap-3 rounded-lg bg-realce p-4 text-left text-sm text-tinta">
            <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium mb-1">
                {t('forgotPassword.nextStepsTitle')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-tinta-suave">
                <li>{t('forgotPassword.nextStep1')}</li>
                <li>{t('forgotPassword.nextStep2')}</li>
                <li>{t('forgotPassword.nextStep3')}</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border-l-4 border-aviso bg-aviso-suave p-4 text-left text-sm text-tinta">
            <TriangleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-aviso"
              aria-hidden="true"
            />
            <p>
              <span className="font-medium">
                {t('forgotPassword.securityWarning')}
              </span>{' '}
              {t('forgotPassword.securityWarningMessage')}
            </p>
          </div>

          <Link to="/login" className={ENLACE_PRINCIPAL}>
            {t('forgotPassword.backToLogin')}
          </Link>
        </EstadoDeAcceso>

        {/* Resend Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setSubmitted(false)}
            className="text-sm text-tinta-suave hover:text-tinta transition-colors font-medium"
          >
            {t('forgotPassword.didntReceive')}
          </button>
        </div>
      </MarcoDeAcceso>
    );
  }

  // Vista del formulario (continúa en el siguiente fragmento)
  return (
    <MarcoDeAcceso
      titulo={t('forgotPassword.heroTitle')}
      subtitulo={t('forgotPassword.heroSubtitle')}
      ventajas={[
        { Icono: Lock, text: t('forgotPassword.features.secure') },
        { Icono: Clock, text: t('forgotPassword.features.expires') },
        { Icono: Mail, text: t('forgotPassword.features.checkSpam') },
      ]}
      textoDeVolver={t('forgotPassword.backToHome')}
    >
      {/* Form Card */}
      <div className={TARJETA_DE_ACCESO}>
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 font-poppins mb-2">
            {t('forgotPassword.title')}
          </h2>
          <p className="text-gray-600">{t('forgotPassword.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              {t('forgotPassword.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder={t('forgotPassword.emailPlaceholder')}
              value={email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              } outline-none text-gray-900 placeholder:text-gray-400`}
              disabled={isLoading}
              autoFocus
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs mt-2 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Rate Limit Notice */}
          <div className="bg-aviso-suave border-l-4 border-aviso p-3 rounded-lg">
            <p className="text-xs text-tinta flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{t('forgotPassword.rateLimitNotice')}</span>
            </p>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={BOTON_PRINCIPAL}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('forgotPassword.sending')}
              </span>
            ) : (
              t('forgotPassword.sendLinkButton')
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-tarjeta text-tinta-suave">
              {t('google.orDivider')}
            </span>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
          >
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </MarcoDeAcceso>
  );
};

export default ForgotPassword;
