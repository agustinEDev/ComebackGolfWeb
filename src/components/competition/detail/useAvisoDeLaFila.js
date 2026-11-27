import { useEffect, useRef, useState } from 'react';
import customToast from '../../../utils/toast';
import { AVISO_ARRIBA } from '../../../utils/avisoArriba';

/**
 * Lo que pasó al guardar una fila de un modal de barras, para pintarlo en esa
 * fila con `AvisoDeLaFila` y no en un toast encima del modal (pasada del
 * iPhone, 22 nov). Si el guardado acaba con el modal ya cerrado, no hay fila:
 * entonces un toast arriba, como en cualquier modal (de un modal se sale
 * siempre).
 *
 * @returns {{
 *   resultado: {clave: string, tipo: 'ok'|'error', texto: string}|null,
 *   avisar: (aviso: {clave: string, tipo: 'ok'|'error', texto: string, textoSiCerrado?: string}) => void,
 *   limpiar: (clave?: string) => void,
 *   de: (clave: string) => Object|null,
 * }}
 */
export const useAvisoDeLaFila = () => {
  const [resultado, setResultado] = useState(null);
  const abierto = useRef(true);
  useEffect(() => {
    abierto.current = true;
    return () => {
      abierto.current = false;
    };
  }, []);

  // El texto suelto (`textoSiCerrado`) se guarda también: lo usa quien lo
  // dice fuera de su fila (la confirmación sin releer)
  const avisar = (aviso) => {
    if (abierto.current) {
      setResultado(aviso);
      return;
    }
    // Arriba, como los avisos de los modales: el guardado acaba justo tras
    // cerrar, con la vista aún donde estaba el modal (23 nov 2026)
    const texto = aviso.textoSiCerrado ?? aviso.texto;
    if (aviso.tipo === 'error') customToast.error(texto, AVISO_ARRIBA);
    else customToast.success(texto, AVISO_ARRIBA);
  };

  // Sin clave, el que haya; con clave, solo el de esa fila
  const limpiar = (clave) =>
    setResultado((r) => (clave === undefined || r?.clave === clave ? null : r));

  const de = (clave) => (resultado?.clave === clave ? resultado : null);

  return { resultado, avisar, limpiar, de };
};
