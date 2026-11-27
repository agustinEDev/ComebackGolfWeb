import BrandMark, { Wordmark } from '../ui/BrandMark';

/**
 * La marca de la cabecera pública (ComeBack Golf).
 *
 * En pantallas anchas, el monograma (stamp) y, a su derecha, el nombre en una
 * línea. Las normas de la marca piden un solo logo por vista; ponerlos juntos
 * en escritorio lo decidió Agustín el 24 nov 2026, viendo las tres variantes, y
 * el nombre en una línea, el 25: el de dos no se podía agrandar sin hacer más
 * alta la cabecera.
 *
 * En el móvil, solo el nombre, y el de dos líneas, pequeño: comparte fila con
 * dos botones y el menú, y uno de una línea no cabe a 360 px.
 *
 * La cabecera de la app no usa esto: su fila lleva el menú de navegación y no
 * deja sitio al monograma; pinta el nombre en una línea ella misma.
 *
 * El monograma es decorativo —el nombre lo da el wordmark—. A cada pieza la
 * esconde su envoltorio y no una clase en la imagen: las dos tintas de dentro
 * ya llevan su propia regla de `display`, la del tema, que gana a cualquier
 * otra. Nada aquí lleva `shrink-0`: si la fila se queda corta, el logo se
 * encoge un poco antes de que la página se desplace de lado.
 *
 * @param {string} titulo - nombre accesible de la marca
 * @param {boolean} soloMonograma - la portada: su título ya lleva el logo
 *   grande, y aquí queda el monograma solo, a cualquier ancho, con el nombre de
 *   la marca (deja de ser decorativo: es lo único que la nombra en la cabecera).
 *   En el móvil mide 40 px, lo que el botón de al lado: con más, la cabecera de
 *   la portada salía más alta que la de las demás páginas
 */
const MarcaDeCabecera = ({ titulo, soloMonograma = false }) => (
  <span className="flex min-w-0 items-center gap-3">
    <span
      data-testid="monograma-de-cabecera"
      className={soloMonograma ? 'flex min-w-0' : 'hidden min-w-0 md:flex'}
    >
      <BrandMark
        className={soloMonograma ? 'h-10 w-auto md:h-12' : 'h-12 w-auto'}
        title={soloMonograma ? titulo : undefined}
      />
    </span>
    {!soloMonograma && (
      <>
        <span data-testid="nombre-en-movil" className="flex min-w-0 md:hidden">
          <Wordmark className="h-9 w-auto" title={titulo} />
        </span>
        <span data-testid="nombre-en-ancho" className="hidden min-w-0 md:flex">
          <Wordmark forma="linea" className="h-9 w-auto" title={titulo} />
        </span>
      </>
    )}
  </span>
);

export default MarcaDeCabecera;
