import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Las pantallas ya rediseñadas con la marca ComeBack Golf no vuelven a pintar
 * con las escalas de antes (`bg-white`, `text-gray-700`, `bg-primary`, azules,
 * verdes…): usan los colores de la marca, que cambian con el tema
 * (`bg-fondo`, `bg-tarjeta`, `text-tinta`, `text-error`, `team-a`…).
 *
 *   #   caso                                   | resultado
 *   ----|--------------------------------------|---------------------------
 *   M1  cada fichero de una zona rediseñada    | ninguna clase de antes
 *   M2  las excepciones                        | contadas, ni una más ni una
 *                                              | menos
 *   M3  las zonas existen                      | si una se mueve, se nota
 *
 * Al rediseñar un bloque, su carpeta o sus ficheros se añaden a `ZONAS`.
 */
// Todas las paletas de Tailwind y las de antes de la marca, con cualquier
// utilidad que pinte un color
const PALETAS =
  'white|black|(?:gray|slate|zinc|neutral|stone|primary|secondary|accent|navy|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}|primary|secondary|accent|navy';
const DE_ANTES = new RegExp(
  `(?<![\\w-])(?:[a-z-]+:)*(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|divide|outline|decoration|placeholder|caret|accent|fill|stroke|shadow|from|via|to)-(?:${PALETAS})(?:\\/\\d+)?(?![\\w/-])`,
  'g',
);

const ZONAS = [
  // La ficha del torneo (FE #1260)
  'src/pages/CompetitionDetail.jsx',
  'src/components/competition/detail',
  'src/components/competition/AccionesDeLaFicha.jsx',
  'src/components/competition/AgendaDeLaCompeticion.jsx',
  'src/components/competition/CompetitionGolfCoursesSection.jsx',
  'src/components/competition/FranjasDeLaCompeticion.jsx',
  'src/components/competition/HandicapsDeLaCompeticion.jsx',
  'src/components/competition/PartidasEnLaFranja.jsx',
  'src/components/competition/PlazasDeLaFranja.jsx',
  'src/components/invitation/InvitacionEnLaFicha.jsx',
  'src/components/ui/Plegable.jsx',
  'src/components/ui/TituloConNumero.jsx',
  // El calendario y crear o editar un torneo (FE #1261)
  'src/pages/creator/SchedulePage.jsx',
  'src/pages/CreateCompetition.jsx',
  'src/components/schedule',
  'src/components/competition/create',
  'src/components/competition/CompetitionTypeChooser.jsx',
  'src/components/competition/SetupModeChooser.jsx',
  'src/components/competition/StrokePlaySettings.jsx',
  'src/components/competition/EnrollmentOpeningModal.jsx',
  'src/components/competition/NameCaptainsModal.jsx',
  'src/components/competition/CaptainBadge.jsx',
  'src/components/competition/MisPartidas.jsx',
  // El perfil
  'src/pages/Profile.jsx',
  'src/pages/EditProfile.jsx',
  'src/pages/DeviceManagement.jsx',
  'src/pages/PlayerStatsPage.jsx',
  'src/pages/player/PlayerProfilePage.jsx',
  'src/components/profile',
  'src/components/stats',
  // Lo social: actividad, amigos, invitaciones y mis partidos
  'src/pages/player/FeedPage.jsx',
  'src/pages/player/FriendsPage.jsx',
  'src/pages/player/MyInvitationsPage.jsx',
  'src/pages/player/UpcomingMatchesPage.jsx',
  'src/pages/player/TarjetaDeUnAmigoPage.jsx',
  'src/pages/creator/InvitationsPage.jsx',
  'src/components/feed',
  'src/components/friend',
  'src/components/invitation',
  'src/components/enrollment',
  // La partida rápida, los sobres, la sala de draft y los modales comunes
  'src/pages/EnvelopePage.jsx',
  'src/pages/DraftRoomPage.jsx',
  'src/pages/quick_match',
  'src/components/quick_match',
  'src/components/modals',
  'src/components/ui/ModalShell.jsx',
];

// Lo que pinta sus propios colores a propósito, con las veces que sale
const EXCEPCIONES = {
  // La marca sobre la foto elegida, una isla con su propia paleta
  // (`data-paleta="propia"`): el velo y la marca blanca, en las dos fotos
  'src/components/profile/AvatarPicker.jsx': 4,
  // Los colores de las barras son los del mundo real (blancas, amarillas,
  // azules, rojas…): no siguen a la marca ni al tema
  'src/components/quick_match/createQuickMatchModalConstants.js': 50,
  // El velo tras un modal o una hoja: negro traslúcido en los dos temas. Uno
  // por diálogo
  'src/components/profile/AliasSheet.jsx': 1,
  'src/components/modals/ConfirmModal.jsx': 1,
  'src/components/ui/ModalShell.jsx': 1,
  'src/components/quick_match/CreateQuickMatchModal.jsx': 1,
  'src/components/quick_match/DialogosDePartidaRapida.jsx': 3,
  'src/components/quick_match/HandicapInputPanel.jsx': 1,
  'src/components/quick_match/TeeSelectPanel.jsx': 1,
};

const ficherosDe = (ruta) => {
  const abs = resolve(process.cwd(), ruta);
  if (!statSync(abs).isDirectory()) return [ruta];
  return readdirSync(abs).flatMap((entrada) => {
    const hija = join(ruta, entrada);
    if (statSync(resolve(process.cwd(), hija)).isDirectory())
      return ficherosDe(hija);
    return /\.jsx?$/.test(entrada) && !entrada.includes('.test.') ? [hija] : [];
  });
};

const ficheros = [...new Set(ZONAS.flatMap(ficherosDe))];
const deAntesEn = (ruta) =>
  readFileSync(resolve(process.cwd(), ruta), 'utf8')
    .split('\n')
    // Los comentarios pueden nombrar las clases de antes
    .filter((linea) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(linea))
    .flatMap((linea) => linea.match(DE_ANTES) ?? []);

describe('Las pantallas rediseñadas pintan con la marca', () => {
  it('M3: hay zonas rediseñadas que mirar', () => {
    expect(ficheros.length).toBeGreaterThan(110);
  });

  it.each(ficheros)('M1: %s no usa las escalas de antes', (ruta) => {
    const encontradas = deAntesEn(ruta);
    const permitidas = EXCEPCIONES[ruta] ?? 0;

    expect(
      encontradas.length > permitidas ? encontradas : [],
      `${encontradas.length} clases de antes, se permiten ${permitidas}`,
    ).toEqual([]);
  });

  it('M2: ninguna excepción sobra', () => {
    const sobran = Object.entries(EXCEPCIONES)
      .filter(([ruta, veces]) => deAntesEn(ruta).length < veces)
      .map(
        ([ruta, veces]) =>
          `${ruta}: dice ${veces}, hay ${deAntesEn(ruta).length}`,
      );

    expect(sobran).toEqual([]);
  });
});
