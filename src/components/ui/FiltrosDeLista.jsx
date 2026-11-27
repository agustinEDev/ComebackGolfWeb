import { AL_PASAR, ELEGIDO } from './clasesDeComportamiento';

/**
 * Los filtros de una lista (Activos / Próximos / Finalizados): el único sitio
 * donde la marca usa cápsulas. El elegido va en lima, como todo lo elegido; los
 * demás, con contorno fino.
 *
 * Son botones con `aria-pressed`, no pestañas: filtran la misma lista, no
 * cambian de panel.
 *
 * @param {{ valor: string, texto: string }[]} opciones
 * @param {string} valor - el elegido
 * @param {(valor: string) => void} alCambiar
 * @param {string} nombre - nombre accesible del grupo
 */
const FiltrosDeLista = ({
  opciones,
  valor,
  alCambiar,
  nombre,
  className = '',
}) => (
  <div role="group" aria-label={nombre} className={`flex gap-2 ${className}`}>
    {opciones.map((opcion) => {
      const elegido = opcion.valor === valor;
      return (
        <button
          key={opcion.valor}
          type="button"
          aria-pressed={elegido}
          onClick={() => alCambiar(opcion.valor)}
          className={`min-h-[44px] min-w-0 flex-1 whitespace-nowrap rounded-full px-2 text-sm font-semibold transition-colors ${
            elegido ? ELEGIDO : `border border-borde text-tinta ${AL_PASAR}`
          }`}
        >
          {opcion.texto}
        </button>
      );
    })}
  </div>
);

export default FiltrosDeLista;
