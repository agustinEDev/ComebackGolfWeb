/**
 * Una captura de verdad de la app, en un marco de móvil del color de contraste
 * (Forest en claro, arena en oscuro: un marco Forest se fundía con el fondo
 * oscuro) (26 nov 2026). La portada enseñaba fotos de banco de imágenes con datos inventados;
 * ahora enseña la app tal cual es. Las capturas se hicieron a 390 × 844 con una
 * partida de demostración: sus medidas van en la imagen para que no salte al
 * cargar.
 *
 * @param {{ src: string, alt: string, className?: string, sinEspera?: boolean }} props
 *        `sinEspera`: la primera de la página se pide al momento, no al bajar
 */
const CapturaDeLaApp = ({ src, alt, className = '', sinEspera = false }) => (
  // El marco es relleno, no borde, y la proporción va en la imagen: con ella en
  // la caja, el borde dejaba la imagen más estrecha y se recortaba por los lados
  <div
    className={`rounded-[2.25rem] bg-contraste p-[10px] shadow-2xl ${className}`}
  >
    <img
      src={src}
      alt={alt}
      width="390"
      height="844"
      loading={sinEspera ? 'eager' : 'lazy'}
      decoding="async"
      className="block aspect-[390/844] h-auto w-full rounded-[1.6rem]"
    />
  </div>
);

export default CapturaDeLaApp;
