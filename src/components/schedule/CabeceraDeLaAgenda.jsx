import { AL_PASAR_EN_ENLACE } from '../ui/clasesDeComportamiento';
import { Link } from 'react-router';
import { ArrowLeft, Calendar } from 'lucide-react';

/**
 * La cabecera de la agenda (`SchedulePage`): volver a la ficha, el título, el
 * nombre de la competición y, para quien la puede cambiar, el enlace a la
 * agenda en la ficha. Sin estado ni efectos.
 */
const CabeceraDeLaAgenda = ({
  competitionId,
  competitionName,
  canManage,
  onVolver,
  t,
}) => (
  <div className="p-4">
    <button
      onClick={onVolver}
      className="hidden md:flex items-center gap-2 text-tinta-suave hover:text-tinta transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">{t('backToDetail')}</span>
    </button>

    <div className="flex flex-wrap justify-between items-center gap-3">
      <div>
        <h1 className="hidden md:block text-tinta text-3xl md:text-4xl font-bold">
          {t('title')}
        </h1>
        <p className="text-tinta-suave text-sm mt-1">{competitionName}</p>
      </div>
      {/* La agenda se cambia en la ficha (FE #654): aquí se quedan los
          equipos, los partidos y los sobres. Solo para quien la puede
          cambiar: los demás entran aquí por la ruta pública y en la
          ficha no tienen nada que tocar */}
      {canManage && (
        <Link
          to={`/competitions/${competitionId}`}
          data-testid="agenda-en-la-ficha"
          className={`flex items-center gap-2 rounded-lg border border-linea px-4 py-2 text-sm font-medium text-tinta ${AL_PASAR_EN_ENLACE}`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('agenda.inDetail')}</span>
        </Link>
      )}
    </div>
  </div>
);

export default CabeceraDeLaAgenda;
