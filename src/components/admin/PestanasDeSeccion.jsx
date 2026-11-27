import {
  CLASE_DE_LA_LISTA_DE_PESTANAS,
  claseDePestana,
} from '../ui/clasesDeComportamiento';
import {
  GrupoDePestanas,
  ListaDePestanas,
  PanelDePestana,
} from '../ui/Pestanas';

/**
 * Las pestañas de una sección del panel de admin (17 oct): Campos de golf
 * (aprobados y solicitudes) y Hoyos (pendientes y todos los campos). Cada una
 * puede llevar su `ver` en la URL, para enlazarla y que sobreviva a recargar; la
 * primera va sin él. El patrón de pestañas lo pone la pieza compartida
 * (FE #658); aquí, un solo panel para todas y el aspecto de la sección.
 *
 * @param {string} etiqueta - el nombre de las pestañas para los lectores (el de la sección)
 * @param {{id: string, label: string}[]} pestanas
 * @param {string} actual - el id de la abierta
 * @param {(id: string) => void} onElegir
 */
const PestanasDeSeccion = ({
  etiqueta,
  pestanas,
  actual,
  onElegir,
  children,
}) => (
  <GrupoDePestanas actual={actual} onElegir={onElegir} panelUnico>
    <ListaDePestanas
      etiqueta={etiqueta}
      className={`${CLASE_DE_LA_LISTA_DE_PESTANAS} mb-4`}
      pestanas={pestanas.map(({ id, label }) => ({ id, contenido: label }))}
      claseDePestana={(abierta) =>
        `min-h-11 flex-1 px-3 ${claseDePestana(abierta)}`
      }
    />
    <PanelDePestana>{children}</PanelDePestana>
  </GrupoDePestanas>
);

export default PestanasDeSeccion;
