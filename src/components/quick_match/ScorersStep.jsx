import {
  AL_PASAR,
  ELEGIDO_CON_TEXTO_DENTRO,
} from '../ui/clasesDeComportamiento';
import { Smartphone } from 'lucide-react';
import { MAX_SCORERS, oppositeTeam } from './createQuickMatchModalConstants';

/**
 * Si anota, móvil verde; si no, móvil rojo y tachado (Agustín, 4 nov 2026).
 * La raya es para que se distinga sin el color: verde y rojo se confunden
 * con daltonismo, y al sol. El estado lo lee el lector de pantalla del
 * `aria-pressed` del botón, así que el icono va oculto.
 */
const IconoDelAnotador = ({ anota }) =>
  anota ? (
    <span
      data-testid="quick-match-scorer-anota"
      aria-hidden="true"
      className="shrink-0 text-exito"
    >
      <Smartphone className="w-6 h-6" />
    </span>
  ) : (
    <span
      data-testid="quick-match-scorer-no-anota"
      aria-hidden="true"
      className="relative shrink-0 text-error"
    >
      <Smartphone className="w-6 h-6" />
      <span
        data-tachado
        className="absolute left-1/2 top-1/2 h-0.5 w-7 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded bg-error ring-2 ring-tarjeta"
      />
    </span>
  );

/**
 * En foursomes apuntan las dos parejas cuando hay algun anotador del bando de
 * enfrente; si no, la tarjeta la lleva entera la pareja de quien crea.
 *
 * El bando de enfrente es la OTRA letra, no "cualquiera que no sea el mio": un
 * registrado sin equipo no juega en ninguna de las dos parejas y bastaba con
 * que estuviera entre los anotadores para dar por elegidas las dos.
 */
const bothPairsScore = (registeredParticipants, currentUser, scorerIds) => {
  const myTeam =
    registeredParticipants.find((p) => p.userId === currentUser?.id)?.team ??
    null;
  const rivalTeam = oppositeTeam(myTeam);
  return registeredParticipants.some(
    (p) =>
      (p.team ?? null) === rivalTeam && scorerIds.includes(p.participantId),
  );
};

/**
 * Wizard step 3: pick which registered participants act as scorers
 * (1-4, always including the creator).
 */
const ScorersStep = ({
  t,
  registeredParticipants,
  currentUser,
  scorerIds,
  onToggleScorer,
  isFoursomes = false,
  rivalCanScore = false,
  partnerCanScore = false,
  onChooseScoringSides = () => {},
  isProcessing,
  onBack,
  onClose,
  onNext,
}) => (
  <div className="p-4 space-y-4">
    {isFoursomes ? (
      <div>
        <h3 className="text-sm font-medium text-tinta mb-1">
          {t('create.scorers.foursomesHeading')}
        </h3>
        <p className="text-xs text-tinta-suave mb-3">
          {t(
            partnerCanScore
              ? 'create.scorers.foursomesDescription'
              : 'create.scorers.foursomesDescriptionAlone',
          )}
        </p>
        <div className="space-y-2">
          {rivalCanScore && (
            <button
              type="button"
              data-testid="quick-match-scorers-both-pairs"
              aria-pressed={bothPairsScore(
                registeredParticipants,
                currentUser,
                scorerIds,
              )}
              onClick={() => onChooseScoringSides('BOTH')}
              className={`w-full text-left px-3 py-2 border rounded-lg transition-colors ${
                bothPairsScore(registeredParticipants, currentUser, scorerIds)
                  ? ELEGIDO_CON_TEXTO_DENTRO
                  : 'border-linea'
              }`}
            >
              <span className="block text-sm text-tinta">
                {t('create.scorers.bothPairs')}
              </span>
              <span className="block text-xs text-tinta-suave">
                {t('create.scorers.bothPairsHint')}
              </span>
            </button>
          )}
          <button
            type="button"
            data-testid="quick-match-scorers-my-pair"
            aria-pressed={
              !bothPairsScore(registeredParticipants, currentUser, scorerIds)
            }
            onClick={() => onChooseScoringSides('MINE')}
            className={`w-full text-left px-3 py-2 border rounded-lg transition-colors ${
              bothPairsScore(registeredParticipants, currentUser, scorerIds)
                ? 'border-linea'
                : ELEGIDO_CON_TEXTO_DENTRO
            }`}
          >
            <span className="block text-sm text-tinta">
              {t('create.scorers.onlyMyPair')}
            </span>
            <span className="block text-xs text-tinta-suave">
              {t(
                partnerCanScore
                  ? 'create.scorers.onlyMyPairHint'
                  : 'create.scorers.onlyMyPairHintAlone',
              )}
            </span>
          </button>
        </div>
      </div>
    ) : (
      <div>
        <h3 className="text-sm font-medium text-tinta mb-1">
          {t('create.scorers.heading')}
        </h3>
        <p className="text-xs text-tinta-suave mb-3">
          {t('create.scorers.description')}
        </p>
        <ul className="space-y-2">
          {registeredParticipants.map((p) => {
            const isCreatorParticipant = p.userId === currentUser.id;
            const checked = scorerIds.includes(p.participantId);
            return (
              <li key={p.participantId}>
                <button
                  type="button"
                  aria-pressed={checked}
                  disabled={
                    isCreatorParticipant ||
                    (scorerIds.length >= MAX_SCORERS && !checked)
                  }
                  onClick={() => onToggleScorer(p.participantId)}
                  className={`w-full min-h-12 flex items-center gap-3 px-4 py-3 border rounded-lg text-left transition-colors disabled:cursor-default ${
                    checked
                      ? ELEGIDO_CON_TEXTO_DENTRO
                      : 'border-linea bg-tarjeta'
                  }`}
                >
                  <IconoDelAnotador anota={checked} />
                  <span className="text-sm text-tinta">{p.name}</span>
                  {isCreatorParticipant && (
                    <span className="text-xs text-tinta-suave">
                      ({t('create.participants.creatorBadge')})
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    )}

    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        disabled={isProcessing}
        data-testid="quick-match-scorers-back"
        className={`px-4 py-2 text-sm font-medium text-tinta border-[1.5px] border-tinta bg-fondo rounded-boton disabled:opacity-50 ${AL_PASAR}`}
      >
        {t('create.scorers.back')}
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className={`px-4 py-2 text-sm font-medium text-tinta border-[1.5px] border-tinta bg-fondo rounded-boton disabled:opacity-50 ${AL_PASAR}`}
        >
          {t('create.cancel')}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isProcessing}
          data-testid="quick-match-scorers-next"
          className="px-4 py-2 text-sm font-medium text-sobre-contraste bg-contraste rounded-boton disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {t('create.scorers.next')}
        </button>
      </div>
    </div>
  </div>
);

export default ScorersStep;
