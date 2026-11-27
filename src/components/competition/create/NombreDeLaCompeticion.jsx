import { useTranslation } from 'react-i18next';

/**
 * El nombre, con su aviso junto al campo (BE #540). `ref` es el campo:
 * al fallar, el envío lo trae a la vista y le da el foco.
 */
const NombreDeLaCompeticion = ({
  ref,
  valor,
  onChange,
  error,
  tournamentType,
  conEquipos,
}) => {
  const { t } = useTranslation('competitions');
  return (
    <div>
      <label
        htmlFor="competitionName"
        className="block text-sm font-medium text-tinta mb-1"
      >
        {t('create.competitionName')}
      </label>
      <input
        ref={ref}
        id="competitionName"
        data-testid="campo-nombre"
        type="text"
        name="competitionName"
        value={valor}
        onChange={onChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'error-del-nombre' : undefined}
        // El ejemplo, del tipo elegido: «Ryder Cup de amigos» en un Medal no (pasada)
        placeholder={t(
          tournamentType && !conEquipos
            ? `create.competitionNamePlaceholderFor.${tournamentType}`
            : 'create.competitionNamePlaceholder',
        )}
        className={`w-full bg-fondo px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta ${error ? 'border-error' : 'border-linea'}`}
      />
      {error && (
        <p
          id="error-del-nombre"
          data-testid="error-del-nombre"
          className="mt-1 text-sm text-error"
        >
          {t(`create.errors.${error}`)}
        </p>
      )}
    </div>
  );
};

export default NombreDeLaCompeticion;
