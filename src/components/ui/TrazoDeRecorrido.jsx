/**
 * El recurso gráfico de la marca (ComeBack Golf): un trazo orgánico, irregular
 * como el recorrido de un hoyo. Va DETRÁS del contenido y es decorativo: sin
 * nombre accesible y sin recibir toques.
 *
 * - `calle`: una calle que serpentea, para la cabecera de una pantalla.
 * - `green`: la llegada, con su bandera, para el pie.
 * - `curvas`: curvas de nivel, para el fondo de una tarjeta.
 *
 * El color es el del token `trazo`, sutil en los dos temas.
 */
const TRAZOS = {
  calle: {
    caja: '0 0 390 220',
    grosor: 14,
    caminos: [
      'M-20 150 C 40 60, 110 40, 150 95 S 190 190, 250 150 S 330 40, 410 70',
    ],
  },
  green: {
    caja: '0 0 390 160',
    grosor: 12,
    caminos: [
      'M-20 140 C 60 130, 110 60, 190 70 S 250 40, 300 62 S 350 96, 410 78',
      'M318 60 L318 22 L340 30 L318 38',
    ],
  },
  curvas: {
    caja: '0 0 360 200',
    grosor: 1.5,
    caminos: [
      'M-10 150 C 50 110, 110 170, 180 130 S 300 80, 370 120',
      'M-10 118 C 60 76, 120 140, 190 98 S 300 50, 370 86',
      'M-10 86 C 60 46, 130 104, 200 66 S 300 22, 370 52',
      'M-10 54 C 70 18, 140 70, 210 34 S 310 -4, 370 20',
    ],
  },
};

const TrazoDeRecorrido = ({ forma = 'calle', className = '' }) => {
  const trazo = TRAZOS[forma] ?? TRAZOS.calle;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={trazo.caja}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth={trazo.grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pointer-events-none select-none text-trazo ${className}`}
    >
      {trazo.caminos.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};

export default TrazoDeRecorrido;
