import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Plegable from '../../ui/Plegable';
import { diaEnTexto } from '../../../utils/instanteDeLaApi';

// En el móvil, cada ajuste en una línea: la etiqueta a la izquierda y el valor a
// la derecha. Antes iban uno encima del otro y la tarjeta ocupaba más de una
// pantalla (Agustín, en el iPhone, 24 nov 2026). En escritorio, en dos columnas
// como siempre.
const FILA = 'flex items-baseline justify-between gap-3 md:block';
const VALOR = 'min-w-0 text-right font-medium text-tinta md:text-left';

/**
 * La configuración de la competición, plegada cuando ya está en juego o
 * acabada: lo que se mira entonces es la clasificación y las partidas.
 */
const AjustesDeLaCompeticion = ({
  competition,
  t,
  conClasificacion,
  conEquipos,
  esStrokePlay,
  repartoAMostrar,
  textoDeCategorias,
}) => {
  // La fecha, en el idioma de la app y no en el del navegador (FE #1238)
  const { i18n } = useTranslation();
  const creada = diaEnTexto(competition.createdAt, i18n?.language);
  return (
    <div className="p-4">
      {/* En juego o acabado, plegada: lo que se mira es la clasificación y las partidas */}
      {/* Algo menor en el móvil: a 360 px partía en dos líneas (QA, FE #865-5) */}
      <Plegable
        abiertoAlPrincipio={!conClasificacion}
        claseDelTitulo="text-base sm:text-lg"
        titulo={
          <>
            <Settings className="w-5 h-5 text-tinta" />
            {t('detail.settings.title')}
          </>
        }
      >
        <div className="grid grid-cols-1 gap-y-1.5 md:grid-cols-2 md:gap-4">
          {conEquipos && (
            <>
              <div className={FILA}>
                <span className="shrink-0 text-sm text-tinta-suave">
                  {t('detail.settings.teamOne')}
                </span>
                <p className={VALOR}>{competition.team1Name}</p>
              </div>
              <div className={FILA}>
                <span className="shrink-0 text-sm text-tinta-suave">
                  {t('detail.settings.teamTwo')}
                </span>
                <p className={VALOR}>{competition.team2Name}</p>
              </div>
            </>
          )}
          <div className={FILA}>
            <span className="shrink-0 text-sm text-tinta-suave">
              {t('detail.settings.playMode')}
            </span>
            {/* Salía «HANDICAP»: el valor del backend tal cual, en
              mayúsculas y en inglés, en una pantalla en español */}
            <p className={VALOR}>
              {competition.playMode
                ? t(`create.${String(competition.playMode).toLowerCase()}`, {
                    defaultValue: competition.playMode,
                  })
                : ''}
            </p>
          </div>
          {/* Qué torneo es y su modalidad (FE #791). Con respaldo: un
            tipo que el backend añada mañana sale con su nombre */}
          {competition.tournamentType && (
            <div className={FILA}>
              <span className="shrink-0 text-sm text-tinta-suave">
                {t('detail.settings.tournamentType')}
              </span>
              <p className={VALOR}>
                {t(`create.type.${competition.tournamentType}.title`, {
                  defaultValue: competition.tournamentType,
                })}
                {competition.modality &&
                  ` · ${t(`create.modality.${competition.modality}`, {
                    defaultValue: competition.modality,
                  })}`}
              </p>
            </div>
          )}
          {/* Los ajustes de un Stableford o un Medal: solo se veían al
            editarla (FE #824, PR 5) */}
          {esStrokePlay && competition.strokePlay && (
            <div data-testid="ajustes-del-torneo" className="contents">
              <div data-testid="ajuste-categorias" className={FILA}>
                <span className="shrink-0 text-sm text-tinta-suave">
                  {t('detail.settings.categories')}
                </span>
                <p className={VALOR}>
                  {textoDeCategorias(competition.strokePlay)}
                </p>
              </div>
              <div data-testid="ajuste-jornadas" className={FILA}>
                <span className="shrink-0 text-sm text-tinta-suave">
                  {t('detail.settings.matchdaysLabel')}
                </span>
                <p className={VALOR}>
                  {t('detail.settings.matchdays', {
                    count: competition.strokePlay.maxMatchdaysPerPlayer,
                  })}
                </p>
              </div>
              <div data-testid="ajuste-general" className={FILA}>
                <span className="shrink-0 text-sm text-tinta-suave">
                  {t('detail.settings.overallLabel')}
                </span>
                <p className={VALOR}>
                  {t(
                    `detail.settings.overall.${competition.strokePlay.overallStanding}`,
                  )}
                </p>
              </div>
            </div>
          )}
          {/* El modo elegido al crearla no salía en ningún sitio (#710) */}
          {competition.setupMode && (
            <div className={FILA}>
              <span className="shrink-0 text-sm text-tinta-suave">
                {t('detail.settings.setupMode')}
              </span>
              <p className={VALOR}>
                {t(`create.setupMode.${competition.setupMode}.title`, {
                  defaultValue: competition.setupMode,
                })}
              </p>
            </div>
          )}
          {conEquipos && (
            <div className={FILA}>
              <span className="shrink-0 text-sm text-tinta-suave">
                {t('detail.settings.teamAssignment')}
              </span>
              {/* Idem, y con respaldo: un modo que el backend añada
                mañana sale con su nombre, no con la clave */}
              <p className={VALOR}>
                {repartoAMostrar
                  ? t(`detail.settings.assignment.${repartoAMostrar}`, {
                      defaultValue: repartoAMostrar,
                    })
                  : ''}
              </p>
            </div>
          )}
          <div className={FILA}>
            <span className="shrink-0 text-sm text-tinta-suave">
              {t('detail.settings.maxPlayingHandicap')}
            </span>
            {competition.maxPlayingHandicap != null ? (
              <p className={VALOR}>{competition.maxPlayingHandicap}</p>
            ) : (
              <p className={`${VALOR} italic`}>
                {t('detail.settings.maxPlayingHandicapNone')}
              </p>
            )}
          </div>
          {/* Sin fecha legible, sin campo: ni «Invalid Date» ni uno vacío */}
          {creada && (
            <div className={FILA}>
              <span className="shrink-0 text-sm text-tinta-suave">
                {t('detail.settings.created')}
              </span>
              <p className={VALOR}>{creada}</p>
            </div>
          )}
        </div>
      </Plegable>
    </div>
  );
};

export default AjustesDeLaCompeticion;
