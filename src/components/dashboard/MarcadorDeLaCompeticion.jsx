import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { enPuntos } from '../../utils/enPuntos';

const Equipo = ({ nombre, puntos, lado }) => (
  <div
    data-testid={`equipo-${lado}`}
    className={`min-w-0 flex-1 ${lado === 'b' ? 'text-right' : ''}`}
  >
    {/* El color del equipo nunca va solo: siempre con su nombre */}
    <p className="truncate text-sm font-semibold text-tinta">{nombre}</p>
    <p
      className={`text-5xl font-black leading-none tracking-tight ${
        lado === 'a' ? 'text-team-a' : 'text-team-b'
      }`}
    >
      {enPuntos(puntos)}
    </p>
  </div>
);

/**
 * La competición en juego en Inicio (ComeBack Golf): el marcador por equipos y
 * la barra que lo reparte. Al tocarla lleva a su clasificación.
 *
 * Los colores de equipo solo informan y van siempre con el nombre; el marcador
 * es lo único grande de la tarjeta.
 */
const MarcadorDeLaCompeticion = ({ marcador, alAbrir }) => {
  const { t } = useTranslation('dashboard');
  const a = Number(marcador.teamAPoints) || 0;
  const b = Number(marcador.teamBPoints) || 0;
  const total = a + b;
  // A cero, a medias: sin dividir por cero y sin dar ventaja a nadie
  const parteA = total > 0 ? (a / total) * 100 : 50;

  return (
    <button
      type="button"
      onClick={() => alAbrir(marcador.competitionId)}
      data-testid="marcador-de-la-competicion"
      className="block w-full rounded-tarjeta bg-realce p-5 text-left transition-opacity hover:opacity-90"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex flex-shrink-0 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-tinta">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-tinta/20"
          />
          {t('liveCompetition.label')}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-xs font-extrabold uppercase tracking-[0.08em] text-tinta">
          <span className="truncate">{marcador.competitionName}</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        </span>
      </span>

      <span className="mt-4 flex items-end justify-between gap-4">
        <Equipo nombre={marcador.teamAName} puntos={a} lado="a" />
        <Equipo nombre={marcador.teamBName} puntos={b} lado="b" />
      </span>

      <span
        role="img"
        aria-label={t('liveCompetition.score', {
          teamA: marcador.teamAName,
          pointsA: enPuntos(a),
          teamB: marcador.teamBName,
          pointsB: enPuntos(b),
        })}
        className="mt-4 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
      >
        <span
          data-testid="tramo-a"
          className="h-full bg-team-a"
          style={{ width: `${parteA}%` }}
        />
        <span
          data-testid="tramo-b"
          className="h-full bg-team-b"
          style={{ width: `${100 - parteA}%` }}
        />
      </span>
    </button>
  );
};

export default MarcadorDeLaCompeticion;
