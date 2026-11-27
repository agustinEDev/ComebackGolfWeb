/**
 * El aviso de un guardado en los modales de barras: «Guardada»/«Quitada» o
 * el error. Una sola pieza, que usan las filas (con `useAvisoDeLaFila`), la
 * pregunta de las barras pendientes y el aviso de «guardada sin releer».
 *
 * La región `status` está montada siempre y solo cambia su texto: una región
 * viva que aparece ya con el texto puede no anunciarse en VoiceOver. Vacía no
 * ocupa sitio (`sr-only`): en un `space-y` empujaba lo de debajo 16 px
 * (/code-review). Los errores van en una alerta, que se anuncia al aparecer.
 */

const TEXTO = 'text-sm font-medium break-words';

/**
 * @param {{texto: string|null|undefined, testId?: string, className?: string}} props
 *   `className`: lo que lleva además cuando tiene texto (el margen de su sitio)
 */
export const RegionDeAviso = ({ texto, testId, className = '' }) => (
  <p
    data-testid={testId}
    role="status"
    aria-live="polite"
    className={texto ? `${TEXTO} text-exito ${className}`.trim() : 'sr-only'}
  >
    {texto || ''}
  </p>
);

/**
 * @param {{texto: string|null|undefined, className?: string}} props
 */
export const AlertaDeAviso = ({ texto, className = '' }) =>
  texto ? (
    <p role="alert" className={`${TEXTO} text-error ${className}`.trim()}>
      {texto}
    </p>
  ) : null;

/**
 * La de una fila: su región y, si falló, su alerta.
 *
 * @param {{resultado: {tipo: 'ok'|'error', texto: string}|null}} props
 */
const AvisoDeLaFila = ({ resultado }) => (
  <>
    <RegionDeAviso
      texto={resultado?.tipo === 'ok' ? resultado.texto : null}
      className="mt-1"
    />
    <AlertaDeAviso
      texto={resultado?.tipo === 'error' ? resultado.texto : null}
      className="mt-1"
    />
  </>
);

export default AvisoDeLaFila;
