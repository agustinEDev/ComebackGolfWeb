import { useTranslation } from 'react-i18next';

/**
 * ¿Juega el organizador? Solo al crear un Stableford o un Medal: si no, no
 * queda inscrito (BE #552).
 */
const JuegaElOrganizador = ({ marcada, onCambio }) => {
  const { t } = useTranslation('competitions');
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-tinta">
      <input
        type="checkbox"
        checked={marcada}
        onChange={(e) => onCambio(e.target.checked)}
        className="bg-fondo h-4 w-4 rounded border-borde text-tinta focus:ring-tinta"
      />
      {t('create.organizerPlays')}
    </label>
  );
};

export default JuegaElOrganizador;
