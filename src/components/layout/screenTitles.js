import { matchPath } from 'react-router';

/**
 * Titulo y pantalla padre de cada ruta autenticada (FE #310).
 *
 * Dentro de la aplicacion la cabecera dice donde estas y como volver: el
 * titulo, bajo la barra del logo. El mapa vive aqui, en un solo sitio,
 * en lugar de repartido por veinte paginas.
 *
 * `parent` es una plantilla de ruta: sus parametros se rellenan con los de la
 * ruta actual, de modo que el detalle de un torneo vuelve a ese torneo y no a
 * la lista. Sin `parent` no se pinta flecha: son las cuatro raices de la
 * navegacion inferior, donde volver no significa nada.
 *
 * `back: 'history'` es para pantallas sin padre unico. Al perfil de un jugador
 * se llega desde el feed, desde Amigos y desde la busqueda, asi que cualquier
 * destino fijo se equivocaria dos de cada tres veces: se vuelve por donde se
 * vino.
 *
 * `ancho: true` marca las paginas del contenedor ancho (`px-4` mas `p-4`): su
 * contenido empieza a 32 px del borde en el movil, y el titulo que pinta la
 * cabecera se alinea con el. Las demas empiezan a 16.
 *
 * Las rutas de anotacion en vivo no aparecen a proposito: llevan su propia
 * cabecera y ni siquiera muestran la navegacion inferior.
 */
const SCREENS = [
  { pattern: '/dashboard', titleKey: 'screens.dashboard' },
  { pattern: '/competitions', ancho: true, titleKey: 'screens.myCompetitions' },
  { pattern: '/friends', titleKey: 'screens.friends' },
  { pattern: '/feed', titleKey: 'screens.feed' },
  { pattern: '/profile', ancho: true, titleKey: 'screens.profile' },

  {
    pattern: '/profile/edit',
    ancho: true,
    titleKey: 'screens.editProfile',
    parent: '/profile',
  },
  {
    pattern: '/profile/devices',
    ancho: true,
    titleKey: 'screens.devices',
    parent: '/profile',
  },
  {
    pattern: '/confirm-email-change',
    titleKey: 'screens.confirmEmail',
    parent: '/profile/edit',
  },
  {
    pattern: '/admin',
    ancho: true,
    titleKey: 'screens.admin',
    parent: '/profile',
  },
  {
    pattern: '/admin/resumen',
    ancho: true,
    titleKey: 'screens.adminOverview',
    parent: '/admin',
  },
  {
    pattern: '/admin/usuarios',
    ancho: true,
    titleKey: 'screens.adminUsers',
    parent: '/admin',
  },
  {
    pattern: '/admin/competiciones',
    ancho: true,
    titleKey: 'screens.adminCompetitions',
    parent: '/admin',
  },
  {
    pattern: '/admin/campos',
    ancho: true,
    titleKey: 'screens.adminGolfCourses',
    parent: '/admin',
  },
  {
    pattern: '/admin/hoyos',
    ancho: true,
    titleKey: 'screens.adminHoles',
    parent: '/admin',
  },

  {
    pattern: '/competitions/create',
    ancho: true,
    titleKey: 'screens.createCompetition',
    parent: '/competitions',
  },
  {
    pattern: '/competitions/:id',
    ancho: true,
    titleKey: 'screens.competition',
    parent: '/competitions',
  },
  {
    pattern: '/competitions/:id/edit',
    ancho: true,
    titleKey: 'screens.editCompetition',
    parent: '/competitions/:id',
  },
  {
    pattern: '/competitions/:id/schedule',
    ancho: true,
    titleKey: 'screens.schedule',
    parent: '/competitions/:id',
  },
  // Pública, pero con sesión lleva esta cabecera (QA, FE #865-4)
  {
    pattern: '/competitions/:id/leaderboard',
    titleKey: 'screens.leaderboard',
    parent: '/competitions/:id',
  },
  {
    pattern: '/creator/competitions/:id/schedule',
    ancho: true,
    titleKey: 'screens.schedule',
    parent: '/competitions/:id',
  },
  {
    pattern: '/creator/competitions/:id/invitations',
    titleKey: 'screens.invitations',
    parent: '/competitions/:id',
  },

  {
    pattern: '/players/:userId',
    titleKey: 'screens.playerProfile',
    back: 'history',
  },
  // Se llega desde Actividad o desde el perfil de un amigo: se vuelve por donde se vino
  {
    pattern: '/quick-matches/:quickMatchId/shared',
    titleKey: 'screens.sharedQuickMatch',
    back: 'history',
  },
  // La partida o el partido de un amigo, desde su logro en Actividad (release social 2)
  {
    pattern: '/competitions/:id/groups/:groupId',
    titleKey: 'screens.friendGroup',
    back: 'history',
  },
  {
    pattern: '/competitions/:id/matches/:matchId',
    titleKey: 'screens.friendMatch',
    back: 'history',
  },

  {
    pattern: '/browse-competitions',
    titleKey: 'screens.browseCompetitions',
    parent: '/dashboard',
  },
  {
    pattern: '/player/invitations',
    titleKey: 'screens.myInvitations',
    parent: '/dashboard',
  },
  {
    pattern: '/player/matches',
    titleKey: 'screens.myMatches',
    parent: '/dashboard',
  },
  {
    pattern: '/quick-matches',
    titleKey: 'screens.myQuickMatches',
    parent: '/dashboard',
  },
  {
    pattern: '/stats',
    ancho: true,
    titleKey: 'screens.myStats',
    parent: '/dashboard',
  },
];

/**
 * Sustituye los `:param` de una plantilla por los valores de la ruta actual.
 * Si falta alguno se devuelve null: mejor no pintar flecha que pintar una que
 * lleva a una URL con `:id` literal.
 */
function buildPath(template, params) {
  const segments = template.split('/');

  for (const segment of segments) {
    if (segment.startsWith(':') && !params[segment.slice(1)]) return null;
  }

  return segments
    .map((segment) =>
      segment.startsWith(':') ? params[segment.slice(1)] : segment,
    )
    .join('/');
}

/**
 * Devuelve `{ titleKey, backTo, backByHistory, contenedorAncho }` para un pathname, o null si la
 * ruta no es una pantalla de la aplicacion (publicas, anotacion en vivo, alta
 * de perfil).
 */
function specificity(pattern) {
  const segments = pattern.split('/');
  const staticSegments = segments.filter(
    (segment) => !segment.startsWith(':'),
  ).length;

  // Primero manda la profundidad (`/competitions/:id/edit` gana a
  // `/competitions/:id`), y a igualdad de profundidad gana lo estatico, o
  // `/competitions/:id` se quedaria con `/competitions/create`
  return segments.length * 10 + staticSegments;
}

export function resolveScreen(pathname) {
  // El orden del mapa no deberia importar: se elige la coincidencia mas
  // especifica
  const matches = SCREENS.map((screen) => ({
    screen,
    match: matchPath({ path: screen.pattern, end: true }, pathname),
  })).filter(({ match }) => match !== null);

  if (matches.length === 0) return null;

  const best = matches.reduce((winner, candidate) =>
    specificity(candidate.screen.pattern) > specificity(winner.screen.pattern)
      ? candidate
      : winner,
  );

  return {
    titleKey: best.screen.titleKey,
    backTo: best.screen.parent
      ? buildPath(best.screen.parent, best.match.params)
      : null,
    backByHistory: best.screen.back === 'history',
    contenedorAncho: best.screen.ancho === true,
  };
}
