import { AL_PASAR, FONDO_DE_LO_ELEGIDO } from '../ui/clasesDeComportamiento';

/**
 * La rejilla de hoyos de las tres anotaciones (partido, partida de stroke play
 * y partida rápida): UNA sola (Agustín, 26 nov 2026). Estaba copiada en el
 * selector de los partidos y en el de la rápida, y lo que se arreglaba en uno
 * no llegaba al otro. Quien la usa solo decide el ESTADO de cada hoyo; el
 * dibujo vive aquí.
 *
 * El estado se lee por la FORMA, no solo por el color (ComeBack Golf): vacío
 * con contorno fino, anotado con contorno marcado, cerrado relleno, y en
 * conflicto con contorno discontinuo. Cuatro formas: sin ver el color se siguen
 * distinguiendo. Las de solo contorno llevan el relleno del fondo: sin él, la
 * marca de agua de la pantalla asomaba por dentro del hoyo (26 nov 2026).
 */
const FORMA = {
  empty: 'border border-borde bg-fondo text-tinta-suave',
  pending: 'border-[1.5px] border-tinta bg-fondo text-tinta',
  validated: 'bg-contraste text-sobre-contraste',
  mismatch: 'border-2 border-dashed border-error bg-fondo text-error',
};

// El hoyo en juego es lo elegido: en lima y con un aro alrededor, que es su
// forma (la lima sola apenas se separa del fondo claro). Dentro conserva la
// de su estado: sin contorno, contorno, contorno grueso o discontinuo. El
// rojo del conflicto es el del tema claro en los dos: va sobre la lima, que
// no cambia, y el del oscuro no se vería
const EN_JUEGO = `${FONDO_DE_LO_ELEGIDO} ring-2 ring-tinta ring-offset-2 ring-offset-fondo`;
const FORMA_EN_JUEGO = {
  empty: '',
  pending: 'border-[1.5px] border-forest',
  validated: 'border-[3px] border-forest',
  mismatch: 'border-2 border-dashed border-[#b42318]',
};

/**
 * @param {object} props
 * @param {number} props.currentHole - el hoyo en juego
 * @param {(hoyo: number) => void} props.onSelect
 * @param {number} [props.totalHoles]
 * @param {(hoyo: number) => string} props.estadoDe - el estado de cada hoyo,
 *   con el nombre que le dé quien la usa: va tal cual a `data-estado`
 * @param {Record<string, 'empty'|'pending'|'validated'|'mismatch'>} [props.formaDelEstado]
 *   - qué forma corresponde a cada estado, si sus nombres no son los de la forma
 * @param {string} props.testId - el de la rejilla
 * @param {(hoyo: number) => string} props.testIdDelHoyo
 * @param {(hoyo: number) => import('react').ReactNode} [props.extraDelHoyo] -
 *   lo que un hoyo lleve dentro además del número (el punto de «sin guardar»)
 */
const RejillaDeHoyos = ({
  currentHole,
  onSelect,
  totalHoles = 18,
  estadoDe,
  formaDelEstado,
  testId,
  testIdDelHoyo,
  extraDelHoyo,
}) => (
  // Más aire entre las dos filas que entre columnas: el aro del hoyo en juego
  // sobresale 4 px y con menos pisaba al hoyo de debajo
  <div data-testid={testId} className="grid grid-cols-9 gap-x-1 gap-y-2.5">
    {Array.from({ length: totalHoles }, (_, i) => i + 1).map((hoyo) => {
      const estado = estadoDe(hoyo);
      const forma = formaDelEstado ? formaDelEstado[estado] : estado;
      return (
        <button
          type="button"
          key={hoyo}
          data-testid={testIdDelHoyo(hoyo)}
          onClick={() => onSelect(hoyo)}
          data-estado={estado}
          // El aro y la lima solo se ven: a un lector de pantalla se le dice
          aria-current={hoyo === currentHole ? 'true' : undefined}
          className={`relative w-8 h-8 rounded-lg text-sm font-semibold ${
            hoyo === currentHole
              ? `${EN_JUEGO} ${FORMA_EN_JUEGO[forma] ?? ''}`
              : `${AL_PASAR} ${FORMA[forma] || FORMA.empty}`
          }`}
        >
          {hoyo}
          {extraDelHoyo?.(hoyo)}
        </button>
      );
    })}
  </div>
);

export default RejillaDeHoyos;
