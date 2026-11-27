import { useTranslation } from 'react-i18next';

/**
 * «Cancelar» y «Crear» (o «Actualizar»). En el móvil la fila ocupa el ancho,
 * alineada con las tarjetas: pegada a la derecha quedaba descolgada. Pero el
 * que crece es «Crear», no «Cancelar»: con los dos a mitad y mitad, cancelar se
 * convertía en un objetivo enorme justo bajo el pulgar, al lado del de enviar,
 * y se lleva el formulario entero sin preguntar.
 */
const BotonesDelFormulario = ({ isEditMode, isSubmitting, onCancelar }) => {
  const { t } = useTranslation('competitions');
  return (
    <div className="flex gap-3 pt-2 pb-6 sm:justify-end">
      <button
        type="button"
        onClick={onCancelar}
        className="btn-secondary min-h-11 text-sm"
      >
        {t('create.cancel')}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary min-h-11 flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
      >
        {isSubmitting
          ? isEditMode
            ? t('edit.updating') || 'Updating...'
            : t('create.creating')
          : isEditMode
            ? t('edit.updateCompetition') || 'Update Competition'
            : t('create.createCompetition')}
      </button>
    </div>
  );
};

export default BotonesDelFormulario;
