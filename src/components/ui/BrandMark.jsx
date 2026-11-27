/**
 * La marca, en un solo sitio (ComeBack Golf). Son los SVG originales del
 * diseñador, servidos tal cual desde `public/brand/`: no se redibujan, no se
 * deforman y no se recolorean, así que cada pieza va en sus dos tintas y se
 * elige una, en vez de heredar el color como haría un icono.
 *
 * - `Wordmark`: el logo de texto. Es el de las cabeceras, el logo por defecto.
 *   Con `forma="linea"`, el nombre en una sola línea: en una cabecera cabe
 *   bastante más grande que el de dos, que para crecer la hacía más alta.
 * - `BrandMark` (por defecto): el stamp, el monograma CG. Es el de la espera
 *   del arranque —que continúa el icono de la aplicación—, el pie de página y
 *   la marca de agua. Las normas de la marca piden un solo logo por vista; hay
 *   dos excepciones, decididas por Agustín: la cabecera pública en ancho, donde
 *   va junto al nombre (24 nov 2026), y la portada, con el monograma en la
 *   cabecera y el nombre en el título (25 nov).
 *
 * Tintas: `deep` (Deep Forest, sobre Sand), `acid` (Acid Lime, sobre Deep
 * Forest) y `tema`, la de por defecto, que pinta la que toca según el tema
 * que se ve.
 *
 * @param {string} className - Clases del elemento, normalmente el tamaño
 * @param {'deep'|'acid'|'tema'} tinta
 * @param {string} title - Nombre accesible; omitir cuando es decorativa
 */
const STAMP = {
  deep: '/brand/stamp-deep.svg',
  acid: '/brand/stamp-acid.svg',
};

const WORDMARK = {
  deep: '/brand/wordmark-deep.svg',
  acid: '/brand/wordmark-acid.svg',
};

const WORDMARK_EN_UNA_LINEA = {
  deep: '/brand/wordmark-linea-deep.svg',
  acid: '/brand/wordmark-linea-acid.svg',
};

const Pieza = ({ src, className, title, extra = '' }) => (
  <img
    src={src}
    className={`${className} object-contain ${extra}`.trim()}
    alt={title || ''}
    aria-hidden={title ? undefined : 'true'}
    draggable="false"
  />
);

// Las dos tintas a la vez; `index.css` esconde la que no toca. La escondida va
// con `display: none`, así que tampoco la lee un lector de pantalla
const SegunElTema = ({ fuentes, className, title }) => (
  <>
    <Pieza
      src={fuentes.deep}
      className={className}
      title={title}
      extra="solo-claro"
    />
    <Pieza
      src={fuentes.acid}
      className={className}
      title={title}
      extra="solo-oscuro"
    />
  </>
);

const avisaSiNoExiste = (
  pieza,
  tinta,
  validas,
  que = 'tinta',
  sale = 'la deep',
) => {
  // Una tinta mal escrita pintaría el logo oscuro sobre fondo oscuro: casi
  // invisible, y sin que fallen ni el lint ni los tests. Al menos se avisa
  // mientras se desarrolla
  if (import.meta.env.DEV && !validas.includes(tinta)) {
    console.warn(
      `${pieza}: ${que} desconocida "${tinta}"; se pinta ${sale}. Use ${validas.join(', ')}.`,
    );
  }
};

/**
 * @param {'lineas'|'linea'} forma - en dos líneas (por defecto) o en una
 */
export const Wordmark = ({
  className = 'h-10',
  tinta = 'tema',
  forma = 'lineas',
  title,
}) => {
  avisaSiNoExiste('Wordmark', tinta, ['deep', 'acid', 'tema']);
  // Cualquier otra forma, la de dos líneas: mal escrita no deja sin logo, pero
  // se avisa («línea» con tilde pinta el de dos líneas, con la letra pequeña)
  avisaSiNoExiste(
    'Wordmark',
    forma,
    ['lineas', 'linea'],
    'forma',
    'la de dos líneas',
  );
  const fuentes = forma === 'linea' ? WORDMARK_EN_UNA_LINEA : WORDMARK;
  if (tinta === 'tema') {
    return (
      <SegunElTema fuentes={fuentes} className={className} title={title} />
    );
  }
  return (
    <Pieza
      src={fuentes[tinta] ?? fuentes.deep}
      className={className}
      title={title}
    />
  );
};

const BrandMark = ({ className = 'size-8', tinta = 'tema', title }) => {
  avisaSiNoExiste('BrandMark', tinta, ['deep', 'acid', 'tema']);

  if (tinta === 'tema') {
    return <SegunElTema fuentes={STAMP} className={className} title={title} />;
  }

  return (
    <Pieza
      src={STAMP[tinta] ?? STAMP.deep}
      className={className}
      title={title}
    />
  );
};

export default BrandMark;
