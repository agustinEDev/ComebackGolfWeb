import { useState, useEffect, useEffectEvent, useMemo, useRef } from 'react';
import {
  useLoaderData,
  useLocation,
  useNavigate,
  useRevalidator,
} from 'react-router';
import { motion } from 'framer-motion';
import {
  Users,
  Clock,
  MapPin,
  Plus,
  Search,
  ArrowRight,
  AlertCircle,
  WifiOff,
  RotateCw,
} from 'lucide-react';
import customToast from '../utils/toast';
import { useSinConexion } from '../hooks/useSinConexion';
import {
  olvidaQueSeVuelveAPedir,
  pideOtraVez,
} from '../services/cargaDeLaPantalla';
import {
  guardaLosFiltros,
  losFiltrosGuardados,
} from '../services/memoriaDeLasListas';
import { useTranslation } from 'react-i18next';
import HeaderAuth from '../components/layout/HeaderAuth';
import { formatDateRange } from '../services/competitions';
import { etiquetaDeInscripcion } from '../utils/etiquetaDeInscripcion';
import { useAuth } from '../hooks/useAuth';
import { CountryFlag } from '../components/ui/CountryFlag';
import { formatCountryName } from '../services/countries';
import { ubicacionDe } from '../services/ubicacionDeCompeticion';
import { diaCorto } from '../utils/diaDeLaSesion';
import EtiquetaDelTipo from '../components/competition/EtiquetaDelTipo';
import { PANTALLA_MENOS_BARRA_INFERIOR } from '../utils/barraInferior';
import BlockLoader from '../components/ui/BlockLoader';
import EnrollmentStatus from '../domain/value_objects/EnrollmentStatus';
import { CompetitionStatusEnum } from '../domain/value_objects/CompetitionStatus';
import PortadaDeTorneo from '../components/competition/PortadaDeTorneo';
import FiltrosDeLista from '../components/ui/FiltrosDeLista';
import { esDelGrupo, grupoValido } from '../utils/gruposDeCompeticiones';
import { marcaDeAgua } from '../utils/marcaDeAgua';
import DibujoDeMarca from '../components/ui/DibujoDeMarca';

// La de `Competitions.datos`, en su memoria y en la de sus filtros
const LISTA = 'competitions';

const Competitions = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('competitions');
  const { t: tComun } = useTranslation('common');
  const { t: tSchedule } = useTranslation('schedule');
  const { user } = useAuth();

  // «Organizas» o «Juegas» (FE #846); pendiente o rechazada, ninguno
  const papelEn = (competition) => {
    if (competition.creatorId === user?.id) return 'myCompetitions.youOrganise';
    return competition.enrollment_status === EnrollmentStatus.APPROVED
      ? 'myCompetitions.youPlay'
      : null;
  };
  // «Lun 12 oct · 08:10», o con la sesión si aún no hay hora
  const proximaSalida = ({ date, sessionType, teeTime }) =>
    [
      diaCorto(date, i18n.language),
      teeTime ?? tSchedule(`sessions.${sessionType}`),
    ]
      .filter(Boolean)
      .join(' · ');
  const nombreDelPais = (competition, code) =>
    formatCountryName(
      (competition.countries ?? []).find((c) => c.code === code),
      i18n.language,
    ) || code;
  // Los trae el `loader` de la ruta (`Competitions.datos`) antes de pintar: es
  // lo que deja a «atrás» devolverte a donde estabas (FE #647, fase 3). Sin red
  // o con error, `datos` es lo último que se cargó en esta visita, o `null`
  const resultado = useLoaderData();
  // La lista que llegó después del tope de 4 s: se pinta sin volver a pedirla
  // (Agustín, 2 nov 2026). Vale solo para la carga de la que vino
  const [llegoTarde, setLlegoTarde] = useState(null);
  useEffect(() => {
    if (!resultado.tardia) return undefined;
    let vigente = true;
    resultado.tardia.then((lista) => {
      if (vigente) setLlegoTarde({ de: resultado, datos: lista });
    });
    return () => {
      vigente = false;
    };
  }, [resultado]);
  // Los datos de otra cuenta no se enseñan: si entra otra persona sin salir de
  // aquí, espera como en la primera carga hasta tener los suyos (CodeRabbit;
  // antes del `loader`, cambiar de cuenta también tapaba la lista con la espera)
  // (`pendiente` y `sinSesion` no traen cuenta, y se esperan igual)
  const deOtraCuenta = resultado.usuarioId !== user?.id;
  const { estado, datos } = (() => {
    if (deOtraCuenta) return { estado: 'pendiente', datos: null };
    return llegoTarde?.de === resultado
      ? { estado: 'ok', datos: llegoTarde.datos }
      : resultado;
  })();
  // Memorizada: un `[]` nuevo en cada pintada rehacía los filtros sin parar
  const competitions = useMemo(() => datos ?? [], [datos]);
  const revalidador = useRevalidator();
  const reintentando = revalidador.state !== 'idle';
  // Sin red, el aviso ya lo da la barra de toda la aplicación; el de aquí es
  // para cuando el móvil cree tener red y el servidor no contesta (dos barras)
  const elMovilSabeQueNoHayRed = useSinConexion();
  // Los filtros, por entrada del historial: al volver atrás se repone el
  // scroll, y sin ellos se caía a esa altura en otra lista, la de sin filtrar
  // (Agustín, 2 nov 2026). Entrar de nuevo es otra entrada y empieza sin
  // filtros; recargar, también, porque viven en memoria (`memoriaDeLasListas`)
  const { key: entrada } = useLocation();
  const usuarioId = user?.id;
  const [filtrosAlVolver] = useState(() =>
    usuarioId ? losFiltrosGuardados(LISTA, usuarioId, entrada) : null,
  );
  const [searchQuery, setSearchQuery] = useState(
    filtrosAlVolver?.busqueda ?? '',
  );
  // El grupo elegido (Activos / Próximos / Finalizados), o `ALL`: ninguno, todos.
  // Un filtro guardado de antes —un estado suelto— ya no existe: es `ALL`
  const [statusFilter, setStatusFilter] = useState(
    grupoValido(filtrosAlVolver?.estado) ?? 'ALL',
  );
  // También al cambiar de entrada sin salir: pulsar Torneos en Torneos crea
  // otra, y la pantalla sigue filtrada
  useEffect(() => {
    if (!usuarioId) return;
    const conFiltros = searchQuery || statusFilter !== 'ALL';
    guardaLosFiltros(
      LISTA,
      usuarioId,
      entrada,
      conFiltros ? { busqueda: searchQuery, estado: statusFilter } : null,
    );
  }, [searchQuery, statusFilter, entrada, usuarioId]);

  // La marca de volver a pedir se gasta al llegar una carga: hasta entonces,
  // si otra navegación corta la recarga, esa sigue pidiendo (tercer revisor).
  // Y al salir se olvida, si no se llegó a usar
  useEffect(() => olvidaQueSeVuelveAPedir(), [resultado]);
  useEffect(() => olvidaQueSeVuelveAPedir, []);

  // El aviso de siempre, uno por carga fallida: cada carga trae un resultado
  // nuevo, también al reintentar (Agustín, 2 nov 2026: como hasta ahora)
  // (de su cuenta: la de otra que entra sin salir de aquí no es suya). Los
  // textos se leen al avisar: cambiar de idioma no repite el aviso
  const avisaDelFallo = useEffectEvent((deLaCarga) => {
    if (deOtraCuenta) return;
    if (deLaCarga.estado === 'sinRed')
      customToast.error(tComun('sinConexion.mensaje'));
    if (deLaCarga.estado === 'error')
      customToast.error(t('detail.failedToLoadCompetitions'));
  });
  useEffect(() => {
    avisaDelFallo(resultado);
  }, [resultado]);

  // Sin datos todavía: la primera carga de la aplicación (`pendiente`) o una
  // sesión que aún no se sabía (`sinSesion`; si no la hay, el guardia ya lleva
  // a entrar). Esperar aquí, con la carcasa puesta, es como cargaba siempre
  const faltanLosDatos = estado === 'pendiente' || estado === 'sinSesion';
  // Se pide en cuanto se sabe quién es, y otra vez cada vez que la sesión se
  // confirma o cambia (otro `user`), como antes del `loader`, que dependía de
  // él (`/code-review`). También con una carga en camino: gana la última
  // (tercer revisor). Si los datos vuelven a faltar más tarde (la sesión
  // superó el tope), una vez más, pero no en cada carga que siga sin ellos
  const pedidaCon = useRef(faltanLosDatos ? null : user);
  const faltabanYa = useRef(faltanLosDatos);
  useEffect(() => {
    const vuelvenAFaltar = faltanLosDatos && !faltabanYa.current;
    faltabanYa.current = faltanLosDatos;
    if (!user?.id || (pedidaCon.current === user && !vuelvenAFaltar)) return;
    pedidaCon.current = user;
    pideOtraVez(revalidador);
  }, [user, faltanLosDatos, revalidador]);

  // Al volver la señal, se vuelve a pedir sola (decidido el 2 nov 2026)
  useEffect(() => {
    if (estado !== 'sinRed') return undefined;
    const alVolver = () => pideOtraVez(revalidador);
    globalThis.addEventListener('online', alVolver);
    return () => globalThis.removeEventListener('online', alVolver);
  }, [estado, revalidador]);

  // En el mismo pintado que la lista, y no en un efecto: un efecto la dejaba un
  // pintado vacía, justo cuando el router restaura el scroll al volver atrás,
  // y el navegador recortaba la posición sobre una página corta (revisor)
  const filteredCompetitions = useMemo(() => {
    let filtered = competitions;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (comp) =>
          comp.name?.toLowerCase().includes(query) ||
          // Se busca sobre lo que se ve: la tarjeta enseña los países en el
          // idioma de la aplicación, así que buscar «España» tenía que
          // encontrar una competición cuya `location` del backend dice «Spain»
          ubicacionDe(comp, i18n.language).toLowerCase().includes(query) ||
          // Y por sus campos, todos: la tarjeta enseña el nombre de uno, y
          // con varios, su conjunto (revisión de la FE-B)
          (comp.golfCourses ?? []).some((campo) =>
            campo.name?.toLowerCase().includes(query),
          ),
      );
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((comp) =>
        esDelGrupo(comp.status, statusFilter),
      );
    }

    return filtered;
  }, [competitions, searchQuery, statusFilter, i18n.language]);

  const handleCreateCompetition = () => {
    navigate('/competitions/create');
  };

  const handleViewCompetition = (competitionId) => {
    navigate(`/competitions/${competitionId}`, {
      state: { from: 'my-competitions' },
    });
  };

  // Sin ningún torneo de verdad (consultado, y sin filtros que lo expliquen):
  // va su dibujo en lugar del icono y se quita la marca de agua, para no tener
  // dos dibujos a la vez (Agustín, 27 nov 2026)
  const sinNingunTorneo =
    !faltanLosDatos &&
    !((estado === 'error' || estado === 'sinRed') && datos === null) &&
    filteredCompetitions.length === 0 &&
    !searchQuery &&
    statusFilter === 'ALL';

  // Renderiza el contenido de la lista de competiciones
  const renderCompetitionsList = () => {
    const reintentar = (
      <button
        type="button"
        onClick={() => pideOtraVez(revalidador)}
        disabled={reintentando}
        className="inline-flex items-center gap-2 px-4 py-2 bg-contraste text-sobre-contraste rounded-lg font-medium hover:opacity-90 transition-colors disabled:opacity-60"
      >
        <RotateCw className="w-4 h-4" aria-hidden="true" />
        {t('myCompetitions.reintentar')}
      </button>
    );
    if (faltanLosDatos) {
      return <BlockLoader texto={t('myCompetitions.loadingCompetitions')} />;
    }
    // Un error del servidor —429, 5xx— tampoco es «no tienes ninguna»: no se
    // ha podido preguntar. Antes se vaciaba la lista y lo decía (FE #647, T6)
    if (estado === 'error' && datos === null) {
      return (
        <div
          data-testid="competiciones-sin-cargar"
          className="flex flex-col items-center justify-center py-12 bg-tarjeta border border-linea rounded-tarjeta"
        >
          <AlertCircle
            className="w-16 h-16 text-tinta-suave mb-4"
            aria-hidden="true"
          />
          <p className="text-tinta font-semibold text-lg mb-2">
            {t('myCompetitions.noSePudoCargar')}
          </p>
          <p className="text-tinta-suave text-sm mb-6 max-w-md text-center">
            {t('myCompetitions.noSePudoCargarDetalle')}
          </p>
          {reintentar}
        </div>
      );
    }
    // Vacio porque no se ha podido preguntar NO es vacio: decir «no tienes
    // ninguna» —y ofrecer crear la primera— es afirmar algo que nadie ha
    // comprobado, y quien tenga las suyas las ve desaparecer
    // Por la lista entera, no por lo filtrado: sin cobertura la lista se
    // conserva, así que un filtro que no casa con nada no es falta de red —se
    // consultó, y no había coincidencias— y merece su propio mensaje
    if (estado === 'sinRed' && datos === null) {
      return (
        <div
          data-testid="competiciones-sin-cobertura"
          className="flex flex-col items-center justify-center py-12 bg-tarjeta border border-linea rounded-tarjeta"
        >
          <WifiOff
            className="w-16 h-16 text-tinta-suave mb-4"
            aria-hidden="true"
          />
          <p className="text-tinta font-semibold text-lg mb-2">
            {tComun('sinConexion.aviso')}
          </p>
          <p className="text-tinta-suave text-sm max-w-md text-center">
            {t('myCompetitions.sinCoberturaDetalle')}
          </p>
        </div>
      );
    }
    if (filteredCompetitions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 bg-tarjeta border border-linea rounded-tarjeta">
          {sinNingunTorneo ? (
            <DibujoDeMarca
              nombre="trofeo"
              className="mx-auto mb-4 h-32 w-32 text-tinta"
            />
          ) : (
            <AlertCircle className="w-16 h-16 text-tinta-suave mb-4" />
          )}
          <p className="text-tinta font-semibold text-lg mb-2">
            {searchQuery || statusFilter !== 'ALL'
              ? t('myCompetitions.noCompetitionsFound')
              : t('myCompetitions.noCompetitionsYet')}
          </p>
          <p className="text-tinta-suave text-sm mb-6 max-w-md text-center">
            {searchQuery || statusFilter !== 'ALL'
              ? t('myCompetitions.tryAdjustingFilters')
              : t('myCompetitions.createFirstCompetition')}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <motion.button
              onClick={handleCreateCompetition}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-contraste text-sobre-contraste rounded-lg font-medium hover:opacity-90 transition-colors "
            >
              <Plus className="w-5 h-5" />
              <span>{t('myCompetitions.createYourFirstCompetition')}</span>
            </motion.button>
          )}
        </div>
      );
    }
    // Renderizado normal de la lista de competiciones: con lo último que se
    // cargó, si ahora no se ha podido, y diciéndolo
    return (
      <>
        {estado === 'error' && (
          <div
            data-testid="aviso-lista-sin-actualizar"
            className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-tarjeta border border-linea rounded-lg text-sm text-tinta"
          >
            <span>{t('myCompetitions.noSePudoActualizar')}</span>
            {reintentar}
          </div>
        )}
        {estado === 'sinRed' && !elMovilSabeQueNoHayRed && (
          <div
            data-testid="aviso-lista-sin-respuesta"
            className="flex items-center gap-2 mb-4 p-3 bg-tarjeta border border-linea rounded-lg text-sm text-tinta"
          >
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{tComun('sinConexion.aviso')}</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCompetitions.map((competition) => {
            // Una vez por tarjeta (`/code-review`)
            const papel = papelEn(competition);
            // La que se está jugando, en la superficie de realce. Sage y Sand
            // tienen la misma luminancia: las separa el matiz, no el
            // contraste, así que la insignia sigue siendo quien lo dice
            const enJuego =
              competition.status === CompetitionStatusEnum.IN_PROGRESS;
            return (
              <div
                key={competition.id}
                onClick={() => handleViewCompetition(competition.id)}
                data-testid="tarjeta-competicion"
                data-en-juego={enJuego || undefined}
                className={`group min-w-0 cursor-pointer overflow-hidden rounded-tarjeta border border-transparent transition-colors hover:border-tinta ${enJuego ? 'bg-realce' : 'bg-tarjeta'}`}
              >
                {/* La portada: la ilustración del torneo, con un velo oscuro
                    bajo el título para que se lea. Los colores van fijos —Sand
                    sobre el velo, la flecha en lima—: es una imagen y no cambia
                    con el tema */}
                <div className="relative h-40">
                  <PortadaDeTorneo
                    semilla={competition.id}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-forest/95 via-forest/70 to-forest/15"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-sand px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-forest">
                    {competition.status && t(`status.${competition.status}`)}
                  </span>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 break-words text-xl font-black uppercase leading-tight tracking-wide text-sand">
                        {competition.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-sand">
                        {formatDateRange(
                          competition.startDate,
                          competition.endDate,
                          i18n.language,
                        )}
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-lime text-forest"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                <div className="space-y-2 p-4">
                  {/* Qué torneo es y qué hago en él (FE #846). Quien organiza
                      y juega, «Organizas»: es lo que le distingue */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <EtiquetaDelTipo tipo={competition.tournamentType} />
                    {papel && (
                      <span
                        data-testid="mi-papel"
                        className="inline-flex items-center rounded-full border border-linea px-2 py-0.5 text-[11px] font-semibold text-tinta"
                      >
                        {t(papel)}
                      </span>
                    )}
                    {/* Las solicitudes pendientes, si organizo */}
                    {competition.creatorId === user?.id &&
                      competition.pending_enrollments_count > 0 && (
                        <span className="inline-flex items-center rounded-full bg-contraste px-2 py-0.5 text-[11px] font-semibold text-sobre-contraste">
                          <span className="mr-1.5 h-2 w-2 rounded-full bg-lime"></span>
                          {competition.pending_enrollments_count}{' '}
                          {competition.pending_enrollments_count === 1
                            ? t('myCompetitions.pendingRequest')
                            : t('myCompetitions.pendingRequests')}
                        </span>
                      )}
                    {/* La inscripción que aún no es «Juegas»: pendiente o rechazada */}
                    {competition.creatorId !== user?.id &&
                      competition.enrollment_status &&
                      competition.enrollment_status !==
                        EnrollmentStatus.APPROVED && (
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                            competition.enrollment_status ===
                            EnrollmentStatus.REJECTED
                              ? 'border-error text-error'
                              : 'border-linea text-tinta'
                          }`}
                        >
                          {competition.enrollment_status ===
                            EnrollmentStatus.REQUESTED && '⏳ '}
                          {competition.enrollment_status ===
                            EnrollmentStatus.REJECTED && '✗ '}
                          {t('myCompetitions.enrollmentStatus', {
                            status: etiquetaDeInscripcion(
                              t,
                              competition.enrollment_status,
                              user?.gender,
                            ),
                          })}
                        </span>
                      )}
                  </div>

                  {/* Mi próxima salida si juego (FE #846); las fechas van en la portada */}
                  {competition.myNextSession && (
                    <div
                      data-testid="proxima-salida"
                      className="flex items-center gap-2 text-sm font-medium text-tinta"
                    >
                      <Clock className="w-4 h-4 shrink-0 text-tinta" />
                      <span>
                        {t('myCompetitions.nextSession', {
                          cuando: proximaSalida(competition.myNextSession),
                        })}
                      </span>
                    </div>
                  )}

                  {/* Dónde: el campo con su bandera, o «Varios campos»; sin campos
                  todavía, el país como antes. El país no se repite (FE #846).
                  La ubicación se rehace aquí y no se usa la del backend: allí
                  se arma uniendo `name_en` (FE #513) */}
                  <div
                    data-testid="donde"
                    className="flex min-w-0 items-center gap-2 text-tinta-suave text-sm"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    {competition.golfCourses?.length > 0 ? (
                      <>
                        <span className="flex shrink-0 items-center gap-1">
                          {[
                            ...new Set(
                              competition.golfCourses.map((c) => c.countryCode),
                            ),
                          ].map((code) => (
                            <span key={code} data-testid="bandera">
                              <CountryFlag
                                countryCode={code}
                                style={{ width: '20px', height: 'auto' }}
                                title={nombreDelPais(competition, code)}
                              />
                            </span>
                          ))}
                        </span>
                        <span className="min-w-0 truncate">
                          {competition.golfCourses.length === 1
                            ? competition.golfCourses[0].name
                            : t('myCompetitions.severalCourses')}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex shrink-0 items-center gap-1">
                          {(competition.countries ?? [])
                            .slice(0, 3)
                            .map((country, index) => (
                              <span
                                key={country.code || index}
                                data-testid="bandera"
                              >
                                <CountryFlag
                                  countryCode={country.code}
                                  style={{ width: '20px', height: 'auto' }}
                                  title={
                                    formatCountryName(country, i18n.language) ||
                                    country.code
                                  }
                                />
                              </span>
                            ))}
                        </span>
                        <span className="min-w-0 truncate">
                          {ubicacionDe(competition, i18n.language)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Jugadores y, en stroke play, cuántas jornadas: en una Ryder llega null (FE #846) */}
                  <div
                    data-testid="jugadores"
                    className="flex items-center gap-2 text-tinta-suave text-sm"
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>
                      {t('myCompetitions.players', {
                        count: competition.enrolledCount || 0,
                        max: competition.maxPlayers,
                      })}
                      {/* Sin jornadas todavía no se dice «0 jornadas» (Agustín, 13 oct) */}
                      {competition.playingDays > 0 && (
                        <>
                          {' '}
                          ·{' '}
                          {t('myCompetitions.playingDays', {
                            count: competition.playingDays,
                          })}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div
      className={`relative flex h-auto ${PANTALLA_MENOS_BARRA_INFERIOR} w-full flex-col bg-fondo text-tinta ${marcaDeAgua(sinNingunTorneo ? null : 'arbol-calle')}`}
    >
      <div className="layout-container flex h-full grow flex-col">
        <HeaderAuth
          user={user}
          acciones={
            <button
              type="button"
              onClick={handleCreateCompetition}
              aria-label={t('myCompetitions.createCompetition')}
              data-testid="crear-competicion"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-lime text-forest transition-[filter] hover:brightness-95 active:brightness-90"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          }
        />
        <div className="px-4 md:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* En el móvil el título lo pinta la cabecera, bajo la barra del
                logo y el «+»; aquí, solo en pantallas anchas */}
            <div className="hidden px-4 pt-4 md:block">
              <p className="text-3xl font-extrabold leading-tight tracking-tight text-tinta md:text-[32px]">
                {t('myCompetitions.title')}
              </p>
              <p className="mt-1 text-sm text-tinta-suave">
                {t('myCompetitions.subtitle')}
              </p>
            </div>
            {/* Filtros: en qué momento está el torneo, y el buscador */}
            <div className="space-y-3 p-4">
              <FiltrosDeLista
                nombre={t('myCompetitions.filterBy')}
                opciones={[
                  {
                    valor: 'ACTIVOS',
                    texto: t('myCompetitions.groups.active'),
                  },
                  {
                    valor: 'PROXIMOS',
                    texto: t('myCompetitions.groups.upcoming'),
                  },
                  {
                    valor: 'FINALIZADOS',
                    texto: t('myCompetitions.groups.finished'),
                  },
                ]}
                valor={statusFilter}
                // Tocar el elegido lo quita: sin ninguno se ven todos
                alCambiar={(grupo) =>
                  setStatusFilter(grupo === statusFilter ? 'ALL' : grupo)
                }
              />
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-tinta-suave"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label={t('myCompetitions.searchPlaceholder')}
                  placeholder={t('myCompetitions.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-h-[48px] w-full rounded-full border border-borde bg-fondo pl-12 pr-4 text-tinta transition-colors placeholder:text-tinta-suave"
                />
              </div>
              {/* Sin lista que enseñar no hay «0 de 0»: no se ha podido preguntar */}
              {datos !== null && (
                <div className="text-sm text-tinta-suave">
                  {t('myCompetitions.showing', {
                    filtered: filteredCompetitions.length,
                    total: competitions.length,
                  })}
                </div>
              )}
            </div>
            {/* Competitions List */}
            <div className="p-4">{renderCompetitionsList()}</div>
            {/* Footer */}
            <footer className="flex flex-col gap-6 px-5 py-10 text-center">
              <p className="text-tinta-suave text-base font-normal leading-normal">
                {t('footer', { year: new Date().getFullYear() })}
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Una por cuenta: si entra otra sin salir de aquí, la pantalla empieza de cero,
// sin lo que buscó la anterior ni su estado (revisor, 3 nov 2026)
const CompetitionsDeLaCuenta = () => {
  const { user } = useAuth();
  return <Competitions key={user?.id ?? ''} />;
};

export default CompetitionsDeLaCuenta;
