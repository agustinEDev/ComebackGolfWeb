import { useNavigate } from 'react-router';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { rutaDeAnotacion } from '../../utils/rutaDeAnotacion';
import { nombresDeCompaneros } from '../../utils/nombreDeCompanero';

/**
 * La pieza central del panel: cuándo juego y contra quién.
 *
 * Cuando no hay nada programado no pinta nada (Agustín, 26 nov 2026). Antes se
 * convertía en una invitación a montar una partida rápida, pero el botón de
 * «Partida rápida» va justo debajo en el panel y hacía lo mismo.
 */
const NextMatchBanner = ({
  match,
  isLoading = false,
  sinRespuesta = false,
  desdeMemoria = false,
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();

  // Mientras se pregunta, nada, y sin reservar sitio (Agustín, 26 nov 2026). Un
  // hueco de la altura del banner hacía que, al saberse que no hay partido —lo
  // normal: la mayoría no está en un torneo—, todo lo de debajo subiera de
  // golpe. Ahora solo se mueve algo cuando SÍ hay partido, y solo la primera
  // vez: en adelante el panel recuerda la última respuesta y no manda `isLoading`
  if (isLoading) return null;

  // Sin poder preguntar no se sabe si hay partido (FE #615). La invitación a
  // una partida rápida dice justo que no lo hay, a quien quizá lo tiene en una
  // hora; y sin conexión tampoco se podría crear
  if (!match && sinRespuesta) {
    return (
      <div
        data-testid="next-match-sin-respuesta"
        className="flex w-full min-w-0 items-center gap-3 rounded-tarjeta border border-contorno bg-tarjeta p-5"
      >
        <span className="flex-shrink-0 rounded-lg bg-contraste p-2">
          <Calendar
            className="h-5 w-5 text-sobre-contraste"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-tinta">
            {t('nextMatch.sinRespuestaTitle')}
          </span>
          <span className="block text-xs text-tinta">
            {t('nextMatch.sinRespuestaDesc')}
          </span>
        </span>
      </div>
    );
  }

  // Sin próximo partido, nada (Agustín, 26 nov 2026). Antes este hueco era una
  // tarjeta «¿Partido improvisado?» que llevaba a crear una partida rápida,
  // pero justo debajo está el botón lima de «Partida rápida», que hace lo mismo
  if (!match) return null;

  const when = match.roundDate
    ? new Date(match.roundDate).toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      })
    : null;
  const session = match.sessionType
    ? t(`nextMatch.session.${match.sessionType}`)
    : null;
  const opponents = (match.opponentNames || []).join(', ');
  // Como la tarjeta: quien se retiró, dicho (QA de la release)
  const partners = nombresDeCompaneros(
    t,
    'upcomingMatches.withdrawnPartner',
    match,
  ).join(', ');
  // Una partida de stroke play (FE #824, PR 7): sin formato ni rivales, con su
  // número, su hora y su pantalla
  const esPartida = Boolean(match.esPartidaDeFranja);
  const titulo = esPartida
    ? [
        t('nextMatch.teeGroup', { numero: match.matchNumber }),
        match.competitionName,
      ]
    : [
        match.matchFormat && t(`nextMatch.format.${match.matchFormat}`),
        match.competitionName,
      ];
  const destino = rutaDeAnotacion(match);

  return (
    <button
      type="button"
      onClick={() => navigate(destino)}
      data-testid="next-match-banner"
      className="flex w-full items-center gap-3 rounded-tarjeta border border-contorno bg-tarjeta p-4 text-left transition-colors md:p-5"
    >
      <span className="hidden flex-shrink-0 rounded-lg bg-contraste p-2 md:block">
        <Calendar className="h-5 w-5 text-sobre-contraste" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-tinta">
          {t(esPartida ? 'nextMatch.labelTeeGroup' : 'nextMatch.label')}
        </span>
        <span className="block truncate text-base font-bold text-tinta">
          {titulo.filter(Boolean).join(' · ')}
        </span>
        {/* Le pasaron de otra partida: su hora puede ser otra (QA del 11 oct 2026) */}
        {esPartida && match.broughtIn && (
          <span className="block text-xs font-semibold text-tinta">
            {/* La hora ya va en la línea de abajo (revisor) */}
            {t('nextMatch.broughtIn', { numero: match.matchNumber })}
          </span>
        )}
        {(when || session) && (
          <span className="block truncate text-xs text-tinta">
            {[when, session, esPartida ? match.teeTime : match.golfCourseName]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
        {esPartida && partners && (
          <span className="mt-0.5 block truncate text-xs text-tinta-suave">
            {t('nextMatch.withPartners', { partners })}
          </span>
        )}
        {opponents && (
          <span className="mt-0.5 block truncate text-xs text-tinta-suave">
            {t('nextMatch.versus', { opponents })}
            {partners ? ` · ${t('nextMatch.withPartners', { partners })}` : ''}
          </span>
        )}
        {/* De lo guardado, como avisa «Mis próximos partidos» (FE #615): si el
            calendario cambió, esto no es el partido de ahora. Sin `truncate`:
            cortado a media frase el aviso no dice nada */}
        {desdeMemoria && (
          <span
            data-testid="next-match-desde-memoria"
            className="mt-0.5 block text-xs font-medium text-tinta"
          >
            {t('nextMatch.desdeMemoria')}
          </span>
        )}
      </span>

      <span className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-contraste px-3 py-1.5 text-xs font-semibold text-sobre-contraste">
        {t('nextMatch.view')}
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </span>
    </button>
  );
};

export default NextMatchBanner;
