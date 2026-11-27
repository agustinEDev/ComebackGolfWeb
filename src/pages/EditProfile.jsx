import { AL_PASAR } from '../components/ui/clasesDeComportamiento';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import HeaderAuth from '../components/layout/HeaderAuth';
import AvatarPicker from '../components/profile/AvatarPicker';
import { useEditProfile } from '../hooks/useEditProfile'; // <- ¡NUEVA IMPORTACIÓN!
import { useAvatar } from '../hooks/useAvatar';
import { ALIAS_MAX_LENGTH } from '../utils/alias';
import FuenteRfeg from '../components/golf_course/FuenteRfeg';
import { canUseRFEG } from '../utils/countryUtils';
import CountryAutocomplete from '../components/ui/CountryAutocomplete';
import FullScreenLoader from '../components/ui/FullScreenLoader';
import { instanteEnTexto } from '../utils/instanteDeLaApi';
import CampoDeHandicap from '../components/ui/CampoDeHandicap';
import { formatoDeIndice } from '../utils/formatoDeHandicap';
import { PANTALLA_MENOS_BARRA_INFERIOR } from '../utils/barraInferior';
import ContrasenaParaGoogleModal from '../components/profile/ContrasenaParaGoogleModal';
import { Gender } from '../domain/value_objects/Gender';

const EditProfile = () => {
  const { t, i18n } = useTranslation('profile');
  // Toda la lógica ahora reside en el hook. Obtenemos todo lo que necesitamos de él.
  const {
    user,
    refetchUser,
    formData,
    aliasError,
    isLoading,
    isSaving,
    isUpdatingRFEG,
    isRefreshing,
    countries,
    isLoadingCountries,
    handleInputChange,
    handleUpdateProfile,
    handleUpdateSecurity,
    handleCancelEmailChange,
    isCancellingEmail,
    handleUpdateHandicapManually,
    handleUpdateHandicapRFEG,
    handleRefreshUserData,
    isGoogleLinked,
    hasPassword,
    isUnlinkingGoogle,
    isGoingToGoogle,
    sinConfirmar,
    handleLinkGoogle,
    handleUnlinkGoogle,
    isGooglePasswordOpen,
    accionDeGoogle,
    cierraContrasenaParaGoogle,
    confirmaContrasenaParaGoogle,
  } = useEditProfile();

  const {
    presets: avatarPresets,
    uploads: avatarUploads,
    isLoadingOptions: isLoadingAvatarOptions,
    isSettingPreset: isSettingAvatarPreset,
    isUploading: isUploadingAvatar,
    isRemoving: isRemovingAvatar,
    handleSelectPreset: handleSelectAvatarPreset,
    handleUpload: handleUploadAvatar,
    handleActivateUpload: handleActivateAvatarUpload,
    handleRemove: handleRemoveAvatar,
  } = useAvatar(user, refetchUser);

  const navigate = useNavigate();

  // --- LÓGICA DE RENDERIZADO ---
  // (Esta parte no cambia, pero ahora es más fácil de razonar sobre ella)

  if (isLoading) {
    return <FullScreenLoader texto={t('common:loading')} />;
  }

  // Sin red (sesión sin confirmar) no hay qué editar: todo necesita el servidor
  if (sinConfirmar) {
    return (
      <div
        className={`relative flex ${PANTALLA_MENOS_BARRA_INFERIOR} w-full flex-col bg-fondo`}
      >
        <HeaderAuth user={null} />
        <p role="status" className="px-4 py-12 text-center text-tinta">
          {t('common:sinConexion.mensaje')}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // En el idioma de la app y leída como UTC: salía en `en-US` fijo y con la
  // hora sin huso tomada por local (FE #710)
  const currentHandicap =
    user.handicap !== null && user.handicap !== undefined
      ? formatoDeIndice(user.handicap)
      : t('edit.handicap.notSet');
  const handicapUpdated =
    instanteEnTexto(user.handicap_updated_at, i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) ?? t('edit.handicap.never');

  // El JSX que sigue es idéntico al de antes, pero ahora consume los
  // estados y manejadores del hook.
  return (
    <div
      className={`relative flex h-auto ${PANTALLA_MENOS_BARRA_INFERIOR} w-full flex-col bg-fondo`}
    >
      <div className="layout-container flex h-full grow flex-col">
        <HeaderAuth user={user} />

        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="flex flex-wrap justify-between gap-3 p-4 items-center">
              {/* En móvil el título lo pinta la cabecera, bajo la barra: aquí saldría dos veces */}
              <p className="hidden md:block text-tinta tracking-tight text-3xl md:text-[32px] font-bold leading-tight min-w-72">
                {t('edit.title')}
              </p>
              <button
                onClick={handleRefreshUserData}
                disabled={isRefreshing}
                className="flex min-h-11 items-center gap-2 px-4 py-2 border-[1.5px] border-tinta bg-fondo text-tinta rounded-boton text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('edit.refreshData')}
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isRefreshing ? t('edit.refreshing') : t('edit.refreshData')}
              </button>
            </div>

            <div className="px-4 mb-6">
              <AvatarPicker
                user={user}
                presets={avatarPresets}
                uploads={avatarUploads}
                isLoadingOptions={isLoadingAvatarOptions}
                isSettingPreset={isSettingAvatarPreset}
                isUploading={isUploadingAvatar}
                isRemoving={isRemovingAvatar}
                onSelectPreset={handleSelectAvatarPreset}
                onUpload={handleUploadAvatar}
                onActivateUpload={handleActivateAvatarUpload}
                onRemove={handleRemoveAvatar}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
              <div className="rounded-tarjeta border border-contorno bg-tarjeta p-5">
                <h3 className="text-tinta font-bold text-lg mb-4">
                  {t('edit.personalInfo.title')}
                </h3>
                <p className="text-sm text-tinta-suave mb-4">
                  {t('edit.personalInfo.subtitle')}
                </p>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.personalInfo.firstName')}
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder={t('edit.personalInfo.firstNamePlaceholder')}
                      maxLength={100}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.personalInfo.lastName')}
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder={t('edit.personalInfo.lastNamePlaceholder')}
                      maxLength={100}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="alias"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.personalInfo.alias')}
                    </label>
                    <div className="relative">
                      <input
                        id="alias"
                        type="text"
                        name="alias"
                        value={formData.alias}
                        onChange={handleInputChange}
                        placeholder={t('edit.personalInfo.aliasPlaceholder')}
                        maxLength={ALIAS_MAX_LENGTH}
                        aria-describedby={
                          aliasError ? 'alias-error' : 'alias-help'
                        }
                        aria-invalid={aliasError ? 'true' : undefined}
                        /* Sitio a la derecha para el botón de quitarlo, que si
                           no se come las últimas letras de lo escrito */
                        className={`bg-fondo w-full py-2 pl-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 ${
                          aliasError
                            ? 'border-error focus:ring-error'
                            : 'border-borde focus:ring-tinta'
                        }`}
                      />
                      {formData.alias && (
                        /* Solo cuando hay algo que quitar: un botón que no
                           hace nada es ruido. `type="button"` porque dentro de
                           un formulario el defecto es «submit», y pulsarlo
                           guardaría el perfil entero.
                           Vacía el campo y ya está: se guarda con el resto del
                           formulario, para que no haya dos maneras distintas
                           de guardar lo mismo */
                        <button
                          type="button"
                          onClick={() =>
                            handleInputChange({
                              target: { name: 'alias', value: '' },
                            })
                          }
                          aria-label={t('edit.personalInfo.aliasClear')}
                          className="absolute inset-y-0 right-0 flex h-full w-12 items-center justify-center text-tinta-suave active:text-tinta"
                        >
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {aliasError ? (
                      /* El aviso ocupa el sitio de la ayuda en vez de sumarse:
                         los dos a la vez empujan el formulario y dejan al
                         usuario leyendo dos cosas que dicen lo contrario */
                      <p
                        id="alias-error"
                        role="alert"
                        className="mt-1 text-sm text-error"
                      >
                        {t(aliasError)}
                      </p>
                    ) : (
                      <p
                        id="alias-help"
                        className="mt-1 text-sm text-tinta-suave"
                      >
                        {t('edit.personalInfo.aliasHelp')}
                      </p>
                    )}
                  </div>

                  {/* Nationality Selector */}
                  <div>
                    {/* Evento sintético para no saltarse handleInputChange,
                        que es quien además limpia el error del campo */}
                    <CountryAutocomplete
                      id="countryCode"
                      countries={countries}
                      /* Dentro del componente y no como <label htmlFor>
                         externo: sobre un <button> el <label> nativo gana a
                         name-from-content y tapaba el país elegido */
                      label={
                        <>
                          {t('edit.personalInfo.nationality')}{' '}
                          <span className="text-tinta-suave font-normal">
                            {t('edit.personalInfo.nationalityOptional')}
                          </span>
                        </>
                      }
                      value={formData.countryCode}
                      placeholder={t('edit.personalInfo.selectNationality')}
                      disabled={isSaving || isLoadingCountries}
                      onChange={(code) =>
                        handleInputChange({
                          target: { name: 'countryCode', value: code },
                        })
                      }
                    />
                    <p className="text-xs text-tinta-suave mt-1 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t('edit.personalInfo.rfegInfo')}
                    </p>
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.personalInfo.gender')}
                    </label>
                    <div className="relative">
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full py-2 px-3 rounded-lg border border-borde focus:outline-none focus:ring-2 focus:ring-tinta bg-fondo disabled:opacity-60 disabled:cursor-not-allowed appearance-none pr-10"
                        disabled={isSaving}
                      >
                        <option value="">
                          {t('edit.personalInfo.genderPlaceholder')}
                        </option>
                        <option value={Gender.MALE}>
                          {t('edit.personalInfo.genderOptions.MALE')}
                        </option>
                        <option value={Gender.FEMALE}>
                          {t('edit.personalInfo.genderOptions.FEMALE')}
                        </option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-tinta-suave"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-contraste text-sobre-contraste font-bold py-2 px-4 rounded-boton transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? t('edit.personalInfo.updating')
                      : t('edit.personalInfo.update')}
                  </button>
                </form>
              </div>

              <div className="rounded-tarjeta border border-contorno bg-tarjeta p-5">
                <h3 className="text-tinta font-bold text-lg mb-4">
                  {t('edit.security.title')}
                </h3>
                <p className="text-sm text-tinta-suave mb-4">
                  {t('edit.security.subtitle')}
                </p>

                <form onSubmit={handleUpdateSecurity} className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.security.currentPassword')}
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder={t(
                        'edit.security.currentPasswordPlaceholder',
                      )}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                    <p className="text-xs text-tinta-suave mt-1">
                      {t('edit.security.currentPasswordHelp')}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-linea">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.security.newEmail')}
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={t('edit.security.newEmailPlaceholder')}
                      maxLength={254}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                    {/* El correo no tiene dónde partirse: sin esto desborda a 360 (FE #826) */}
                    <p className="text-xs text-tinta-suave mt-1 wrap-anywhere">
                      {t('edit.security.currentEmail', { email: user.email })}
                    </p>
                    {/* El correo nuevo, pendiente de confirmar desde su dirección (backend
                        #749): entero, para ver una errata */}
                    {user.pending_email && (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-fondo border border-aviso px-3 py-2">
                        <p className="text-xs text-aviso wrap-anywhere">
                          {t('edit.security.pendingEmail', {
                            email: user.pending_email,
                          })}
                        </p>
                        <button
                          type="button"
                          onClick={handleCancelEmailChange}
                          disabled={isCancellingEmail}
                          className="shrink-0 text-xs font-medium text-aviso underline disabled:opacity-50"
                        >
                          {t('edit.security.cancelPendingEmail')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-linea">
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.security.newPassword')}
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder={t('edit.security.newPasswordPlaceholder')}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                    <p className="text-xs text-tinta-suave mt-1">
                      {t('edit.security.newPasswordHelp')}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.security.confirmPassword')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder={t(
                        'edit.security.confirmPasswordPlaceholder',
                      )}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-error text-sobre-contraste font-bold py-2 px-4 rounded-boton transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? t('edit.security.updating')
                      : t('edit.security.update')}
                  </button>
                </form>
              </div>
            </div>

            <div className="px-4 mt-6">
              <div className="rounded-tarjeta border border-contorno bg-tarjeta p-5">
                <h3 className="text-tinta font-bold text-lg mb-4">
                  {t('edit.handicap.title')}
                </h3>
                <div className="bg-realce border border-contorno rounded-lg p-3 mb-4">
                  <p className="text-sm text-tinta">
                    <span className="font-semibold">
                      {t('edit.handicap.current')}
                    </span>{' '}
                    <span className="text-tinta font-bold text-lg">
                      {currentHandicap}
                    </span>
                  </p>
                  <p className="text-xs text-tinta-suave mt-1">
                    {t('edit.handicap.lastUpdated', { date: handicapUpdated })}
                  </p>
                </div>

                <form
                  onSubmit={handleUpdateHandicapManually}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="handicap"
                      className="block text-sm font-medium text-tinta mb-1"
                    >
                      {t('edit.handicap.manual')}
                    </label>
                    <CampoDeHandicap
                      id="handicap"
                      name="handicap"
                      value={formData.handicap}
                      onChange={(valor) =>
                        handleInputChange({
                          target: { name: 'handicap', value: valor },
                        })
                      }
                      placeholder={t('edit.handicap.manualPlaceholder')}
                      className="bg-fondo w-full px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta"
                    />
                    <p className="text-xs text-tinta-suave mt-1">
                      {t('edit.handicap.manualHelp')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full border-[1.5px] border-tinta bg-fondo text-tinta font-bold py-2 px-4 rounded-boton disabled:opacity-50 disabled:cursor-not-allowed ${AL_PASAR}`}
                  >
                    {isSaving
                      ? t('edit.handicap.updating')
                      : t('edit.handicap.updateManually')}
                  </button>
                </form>

                {/* RFEG Update - Only for Spanish players */}
                {canUseRFEG(user) ? (
                  <div className="mt-4 pt-4 border-t border-linea">
                    <p className="text-sm text-tinta-suave mb-3">
                      {t('edit.handicap.rfegUpdate')}
                    </p>
                    <button
                      type="button"
                      onClick={handleUpdateHandicapRFEG}
                      disabled={isUpdatingRFEG}
                      className="w-full bg-contraste text-sobre-contraste font-bold py-2 px-4 rounded-boton transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingRFEG
                        ? t('edit.handicap.updatingFromRFEG')
                        : t('edit.handicap.updateFromRFEG')}
                    </button>
                    <p className="text-xs text-tinta-suave mt-2">
                      {t('edit.handicap.rfegHelp')}
                    </p>
                    {/* De dónde sale el hándicap que se trae (auditoría legal, F4) */}
                    <FuenteRfeg variante="handicap" className="mt-1" />
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-linea">
                    <div className="flex items-start gap-2 p-3 bg-realce border border-contorno rounded-lg text-sm text-tinta">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold mb-1">
                          {t('edit.handicap.rfegOnlySpanish')}
                        </p>
                        <p className="text-xs">
                          {user.country_code
                            ? t('edit.handicap.rfegInfoWithNationality', {
                                countryCode: user.country_code,
                              })
                            : t('edit.handicap.rfegInfoNoNationality')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Accounts Section */}
            <div className="px-4 mt-6">
              <div className="rounded-tarjeta border border-contorno bg-tarjeta p-5">
                <h3 className="text-tinta font-bold text-lg mb-2">
                  {t('edit.linkedAccounts.title')}
                </h3>
                <p className="text-sm text-tinta-suave mb-4">
                  {t('edit.linkedAccounts.subtitle')}
                </p>

                <div className="flex items-center justify-between p-4 border border-linea bg-fondo rounded-lg">
                  <div className="flex items-center gap-3">
                    {/* Google icon */}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-tinta">
                        {t('edit.linkedAccounts.google')}
                      </p>
                      <p
                        className={`text-sm ${isGoogleLinked ? 'text-exito' : 'text-tinta-suave'}`}
                      >
                        {isGoogleLinked
                          ? t('edit.linkedAccounts.linked')
                          : t('edit.linkedAccounts.notLinked')}
                      </p>
                    </div>
                  </div>

                  <div>
                    {!isGoogleLinked ? (
                      <button
                        type="button"
                        onClick={handleLinkGoogle}
                        disabled={isGoingToGoogle}
                        className="px-4 py-2 bg-contraste text-sobre-contraste text-sm font-semibold rounded-boton transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('edit.linkedAccounts.link')}
                      </button>
                    ) : hasPassword ? (
                      <button
                        type="button"
                        onClick={handleUnlinkGoogle}
                        disabled={isUnlinkingGoogle}
                        className="min-h-11 px-4 py-2 border border-error bg-fondo text-error text-sm font-semibold rounded-boton hover:brightness-95 transition-[filter] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUnlinkingGoogle
                          ? t('edit.linkedAccounts.unlinking')
                          : t('edit.linkedAccounts.unlink')}
                      </button>
                    ) : (
                      <div className="relative group">
                        <button
                          type="button"
                          disabled
                          aria-label={t('edit.linkedAccounts.cannotUnlinkOnly')}
                          title={t('edit.linkedAccounts.cannotUnlinkOnly')}
                          className="px-4 py-2 border border-linea bg-fondo text-tinta-suave text-sm font-semibold rounded-boton cursor-not-allowed opacity-60"
                        >
                          {t('edit.linkedAccounts.unlink')}
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-contraste text-sobre-contraste text-xs rounded-boton opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                          {t('edit.linkedAccounts.cannotUnlinkOnly')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-stretch">
              <div className="flex flex-1 gap-3 flex flex-wrap px-4 py-6 justify-end">
                <button
                  onClick={() => navigate('/profile')}
                  className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-boton min-h-11 px-4 border-[1.5px] border-tinta bg-fondo text-tinta text-sm font-bold leading-normal tracking-wide ${AL_PASAR}`}
                >
                  <span className="truncate">{t('edit.cancel')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContrasenaParaGoogleModal
        isOpen={isGooglePasswordOpen}
        onClose={cierraContrasenaParaGoogle}
        alConfirmar={confirmaContrasenaParaGoogle}
        para={accionDeGoogle}
      />
    </div>
  );
};

export default EditProfile;
