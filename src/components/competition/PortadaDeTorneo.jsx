import { indiceDeLaPortada } from '../../utils/indiceDeLaPortada';

/**
 * La portada de un torneo (ComeBack Golf). Las competiciones todavía no tienen
 * imagen propia, así que cada una lleva una ilustración de la marca: un green,
 * un bunker rastrillado o una calle, vistos desde arriba y en los tonos del
 * dossier. Más adelante el creador elegirá o subirá la suya.
 *
 * Cuál le toca sale de su identificador: siempre la misma para el mismo
 * torneo, y distinta de la de al lado. Es decorativa: sin nombre accesible.
 *
 * Los colores van escritos aquí y no en tokens a propósito: es una imagen, y
 * como una foto, no cambia con el tema.
 */
const BOSQUE = '#222d24';
const MUSGO = '#34443a';
const HIERBA = '#4f6648';
const HIERBA_CLARA = '#6f8a5c';
const ARENA = '#d3c4ac';
const ARENA_OSCURA = '#bfaf97';

const Green = () => (
  <>
    <rect width="400" height="220" fill={MUSGO} />
    <path
      d="M-20 150 C 60 90, 150 190, 240 120 S 380 60, 430 110 L430 240 L-20 240 Z"
      fill={HIERBA}
    />
    <path
      d="M210 58 C 262 30, 338 44, 350 96 C 360 142, 300 168, 248 152 C 196 138, 168 84, 210 58 Z"
      fill={HIERBA_CLARA}
    />
    <path
      d="M236 118 C 252 104, 284 108, 290 126 C 294 142, 262 150, 244 142 C 232 136, 228 126, 236 118 Z"
      fill={ARENA}
    />
    <path
      d="M300 92 L300 58 L322 66 L300 74"
      fill={ARENA}
      stroke={ARENA}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </>
);

const Bunker = () => (
  <>
    <rect width="400" height="220" fill={ARENA_OSCURA} />
    <g fill="none" stroke={ARENA} strokeWidth="5" strokeLinecap="round">
      <path d="M-10 60 C 90 10, 240 20, 410 90" />
      <path d="M-10 92 C 100 40, 250 54, 410 126" />
      <path d="M-10 124 C 110 72, 260 88, 410 162" />
      <path d="M-10 156 C 120 104, 270 122, 410 198" />
      <path d="M-10 188 C 130 138, 280 156, 410 234" />
    </g>
    <path d="M250 -10 C 300 20, 380 30, 430 10 L430 -10 Z" fill={HIERBA} />
    <path d="M-10 190 C 40 200, 80 214, 110 240 L-10 240 Z" fill={MUSGO} />
  </>
);

const Calle = () => (
  <>
    <rect width="400" height="220" fill={BOSQUE} />
    <path
      d="M-30 200 C 60 120, 130 210, 210 130 S 330 20, 430 60"
      fill="none"
      stroke={HIERBA}
      strokeWidth="78"
      strokeLinecap="round"
    />
    <path
      d="M-30 200 C 60 120, 130 210, 210 130 S 330 20, 430 60"
      fill="none"
      stroke={HIERBA_CLARA}
      strokeWidth="2"
      strokeDasharray="2 14"
      strokeLinecap="round"
    />
    <path
      d="M286 150 C 302 138, 330 142, 336 160 C 340 176, 310 182, 294 174 C 282 168, 278 158, 286 150 Z"
      fill={ARENA}
    />
  </>
);

const PORTADAS = [Green, Bunker, Calle];

const PortadaDeTorneo = ({ semilla, className = '' }) => {
  const indice = indiceDeLaPortada(semilla, PORTADAS.length);
  const Dibujo = PORTADAS[indice];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-testid="portada-de-torneo"
      data-portada={indice}
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none select-none ${className}`}
    >
      <Dibujo />
    </svg>
  );
};

export default PortadaDeTorneo;
