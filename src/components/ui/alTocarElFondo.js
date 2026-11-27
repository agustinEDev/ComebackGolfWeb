// El gesto en curso, uno para todos los diálogos: los gestos van de uno en uno.
// `pulsado` es el fondo donde se apretó el botón principal, si en ese momento
// se podía cerrar; `soltado`, el fondo donde además se soltó. Con un diálogo
// dentro de otro (una hoja sobre el asistente de partida rápida) los eventos
// pasan por los dos fondos, y cada uno solo apunta lo que es suyo
let pulsado = null;
let soltado = null;

const olvidar = () => {
  pulsado = soltado = null;
};

// El gesto no se queda pegado: se olvida al empezar otro (en captura, antes que
// nadie), al soltar (después de los fondos, que escuchan en la raíz de React,
// dentro del documento), tras el clic y con cualquier tecla. Sin esto, un fondo
// apretado con el botón derecho o soltado fuera dejaba el gesto a medias, y el
// clic de un Enter en «Entregar» lo terminaba cerrando el diálogo. La
// aplicación solo corre en el navegador: el documento siempre está
document.addEventListener('mousedown', olvidar, true);
document.addEventListener('mouseup', () => {
  pulsado = null;
});
document.addEventListener('click', olvidar);
document.addEventListener('keydown', olvidar, true);

// Una lista abierta dentro del diálogo: un buscador o un desplegable
// (`combobox`, o un botón que abre una lista o un menú) que se anuncia abierto.
// Los que abren otro diálogo (`aria-haspopup="dialog"`) o un plegable no
// cuentan: el diálogo de encima tiene su propio fondo
const LISTA_ABIERTA =
  '[aria-expanded=true]:is([role=combobox],[aria-haspopup=listbox],[aria-haspopup=menu])';

// La barra de desplazamiento de un fondo que se desplaza es del fondo: sin
// esto, pulsarla o arrastrarla contaba como tocarlo. Solo si la hay (con barras
// que flotan sobre el contenido, como en el móvil, no ocupa sitio)
const enLaBarra = (e, fondo) =>
  fondo.offsetWidth > fondo.clientWidth &&
  e.clientX - fondo.getBoundingClientRect().left >= fondo.clientWidth;

/**
 * Lo que lleva el fondo de un diálogo para que tocarlo lo cierre: se esparce
 * sobre el fondo (`<div {...alTocarElFondo(cerrar)}>`).
 *
 * Tocar fuera cierra TODOS los diálogos, igual que Escape y que «Cerrar»
 * (Agustín, 23 nov 2026). Y cierra exactamente cuando cerraría Escape: con algo
 * en vuelo que no puede quedarse a medias, o en un aviso sin salida (hay que
 * elegir), quien llama no pasa cierre y el fondo no hace nada.
 *
 * Cerrar pide que el gesto EMPIECE y ACABE en el fondo, con el botón principal
 * y fuera de su barra de desplazamiento: seleccionando el texto del mensaje se
 * suelta a menudo fuera de la caja, y en el aviso de final anticipado eso
 * descartaba el único aviso que lleva a entregar.
 *
 * Y al pulsar tiene que poderse cerrar y no haber dentro ninguna lista abierta
 * (`LISTA_ABIERTA`): con una lista abierta, el toque de fuera es de la lista,
 * que se cierra con su propia escucha, igual que con su Escape. Se mira al
 * pulsar porque la lista se cierra con ese mismo toque y, en el navegador, el
 * diálogo se vuelve a pintar sin ella antes del clic.
 *
 * @param {Function|null|undefined|false} cerrar Qué hace tocar el fondo; sin
 *   él, nada
 * @returns {{ onMouseDown: Function, onMouseUp: Function, onClick: Function }}
 */
export const alTocarElFondo = (cerrar) => ({
  onMouseDown: (e) => {
    const fondo = e.currentTarget;
    if (
      cerrar &&
      e.button === 0 &&
      e.target === fondo &&
      !fondo.querySelector(LISTA_ABIERTA) &&
      !enLaBarra(e, fondo)
    )
      pulsado = fondo;
  },
  onMouseUp: (e) => {
    if (pulsado === e.currentTarget && e.target === e.currentTarget)
      soltado = e.currentTarget;
  },
  onClick: (e) => {
    if (cerrar && soltado === e.currentTarget && e.target === e.currentTarget)
      cerrar();
  },
});
