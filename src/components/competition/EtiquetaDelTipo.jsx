import { useTranslation } from 'react-i18next';
import { RYDER_CUP } from '../../domain/value_objects/TournamentType';

/**
 * Qué torneo es, en las tarjetas de «Mis próximos partidos» y «Mis
 * competiciones» (FE #845, #846). El nombre es el mismo que al elegirlo al
 * crearla. Sin tipo, una por equipos: es lo que eran todas.
 *
 * Todas con el mismo aspecto (ComeBack Golf): las distingue su nombre, no un
 * color por tipo.
 *
 * @param {{tipo?: string|null}} props
 */
const EtiquetaDelTipo = ({ tipo }) => {
  const { t } = useTranslation('competitions');
  const elTipo = tipo ?? RYDER_CUP;
  return (
    <span
      data-testid="tipo-de-torneo"
      className="inline-flex shrink-0 items-center rounded-full border border-linea px-2 py-0.5 text-[11px] font-semibold text-tinta"
    >
      {t(`create.type.${elTipo}.title`, { defaultValue: elTipo })}
    </span>
  );
};

export default EtiquetaDelTipo;
