import { canonicaDe } from '../../utils/buscadores';

/**
 * La dirección canónica de la página pública que se está viendo (27 nov 2026). Los
 * dos dominios sirven la misma aplicación: así los buscadores juntan todo en
 * comebackgolf.com. React 19 lleva el `<link>` al `<head>`. En las pantallas de la
 * aplicación no hay: el robots.txt ya las deja fuera.
 */
export default function Canonica({ ruta }) {
  const href = canonicaDe(ruta);
  return href ? <link rel="canonical" href={href} /> : null;
}
