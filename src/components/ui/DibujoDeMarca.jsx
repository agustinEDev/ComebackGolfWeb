import bunker from '../../assets/ilustraciones/silueta/bunker-rastrillo.svg';
import green from '../../assets/ilustraciones/silueta/green-bandera.svg';
import trofeo from '../../assets/ilustraciones/silueta/trofeo.svg';
import tarjeta from '../../assets/ilustraciones/silueta/tarjeta-lapiz.svg';
import bola from '../../assets/ilustraciones/silueta/bola-tee.svg';
import carrito from '../../assets/ilustraciones/silueta/carrito.svg';
import bolsa from '../../assets/ilustraciones/silueta/bolsa.svg';

// Las siluetas, opacas: la máscara toma de ellas la forma, y el color es el del
// texto que rodea al dibujo (`currentColor`)
// Los cinco últimos, en las pantallas vacías (Agustín, 27 nov 2026)
const SILUETAS = { bunker, green, trofeo, tarjeta, bola, carrito, bolsa };

/**
 * Uno de nuestros dibujos de línea a tamaño de ilustración, en el color del
 * texto que lo rodea, así que se lee en claro y en oscuro (26 nov 2026). Los de
 * las marcas de agua vienen grises y al 24 %: sirven de fondo, no de dibujo.
 * Decorativo: sin nombre accesible y sin recibir toques.
 *
 * @param {{ nombre: 'bunker'|'green'|'trofeo'|'tarjeta'|'bola'|'carrito'|'bolsa', className?: string }} props
 */
const DibujoDeMarca = ({ nombre, className = '' }) => {
  const silueta = Object.hasOwn(SILUETAS, nombre) ? SILUETAS[nombre] : null;
  if (!silueta) return null;
  // La silueta, en una variable: la máscara la leen las clases (con su prefijo
  // de WebKit, que Safari aún necesita)
  return (
    <span
      aria-hidden="true"
      data-dibujo={nombre}
      className={`pointer-events-none block bg-current [mask-image:var(--silueta)] [-webkit-mask-image:var(--silueta)] [mask-size:contain] [-webkit-mask-size:contain] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [mask-position:center] [-webkit-mask-position:center] ${className}`}
      style={{ '--silueta': `url("${silueta}")` }}
    />
  );
};

export default DibujoDeMarca;
