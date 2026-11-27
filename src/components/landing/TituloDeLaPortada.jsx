import { Wordmark } from '../ui/BrandMark';

/**
 * El título de la portada: el saludo en la letra de la web y, debajo, el
 * nombre con el logo auténtico, en una línea (Agustín, 25 nov 2026).
 *
 * La letra del logo no es una tipografía: el diseñador dibujó esas dos
 * palabras, así que solo «Comeback Golf» puede ir con ese trazo.
 *
 * El nombre va además como texto dentro del `h1`, fuera de la vista: es lo que
 * lee un lector de pantalla y lo que ve un buscador. El logo es decorativo, o se
 * diría dos veces.
 *
 * El logo es algo menor de lo que cabría, para que no se despegue tanto del
 * saludo que lleva encima. Lleva su proporción en la clase: sin ella medía 0 de
 * alto hasta que llegaba el SVG y, al llegar, empujaba hacia abajo el resto de
 * la portada (entre 69 y 114 px) en la primera visita.
 *
 * @param {string} saludo - «Bienvenido a»
 * @param {string} marca - el nombre, como texto
 */
const TituloDeLaPortada = ({ saludo, marca }) => (
  <h1 className="text-3xl font-bold leading-tight tracking-tight text-tinta md:text-4xl lg:text-5xl">
    {saludo} <span className="sr-only">{marca}</span>
    <span className="mt-2 flex md:mt-3">
      <Wordmark
        forma="linea"
        className="aspect-[53367/13545] h-auto w-68 max-w-full md:w-96 lg:w-112"
      />
    </span>
  </h1>
);

export default TituloDeLaPortada;
