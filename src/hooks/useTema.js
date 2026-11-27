import { useSyncExternalStore } from 'react';
import { alCambiarElTema, alternaElTema, temaActual } from '../utils/tema';

/**
 * El tema que se aplica y cómo cambiarlo (el conmutador de sol y luna).
 *
 * @returns {{ tema: 'claro'|'oscuro', alternar: () => void }}
 */
export const useTema = () => {
  const tema = useSyncExternalStore(alCambiarElTema, temaActual, () => 'claro');
  return { tema, alternar: alternaElTema };
};
