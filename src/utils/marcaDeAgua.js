/**
 * Las marcas de agua: un dibujo de la marca, grande y muy tenue, en la esquina
 * inferior de las pantallas con aire (listas cortas o vacías, confirmaciones,
 * errores). Nunca en las que van llenas de tarjetas (guía del diseñador; reparto
 * de Agustín, 25 nov 2026). En la anotación sí, también detrás de la tarjeta de
 * resultados, que va translúcida (Agustín, 26 nov 2026).
 *
 * Va en una CAPA FIJA a la pantalla, por debajo de todo: se ve nada más abrir
 * y no se mueve; lo que se desplaza por delante es el contenido, y las tarjetas,
 * que son opacas, la tapan al pasar, salvo las de resultados de la anotación
 * (Agustín, 26 nov 2026). La capa es un
 * pseudo-elemento del contenedor de la página, que por eso pierde su color de
 * fondo; no crea contexto de apilado, así que no atrapa a los diálogos. Es
 * decorativa: un pseudo-elemento sin texto no existe para un lector de pantalla.
 * El porqué de cada regla está junto a ellas, en `index.css`.
 *
 * El dibujo lleva su color dentro (un gris verdoso translúcido, a medio camino
 * entre el claro y el oscuro) porque en una imagen de fondo no hay `currentColor`: el mismo
 * fichero se ve igual de tenue en los dos temas. Va a línea limpia, sin
 * desenfoque, como el dibujo del panel.
 */
export const DIBUJOS_DE_MARCA_DE_AGUA = [
  'arbol-calle',
  'bola-tee',
  'bolsa',
  'bunker-rastrillo',
  'carrito',
  'green-bandera',
  'guante',
  'tarjeta-lapiz',
  'trofeo',
];

/**
 * Las clases que ponen ese dibujo en la capa fija. OJO: dejan SIN FONDO al
 * contenedor que las lleva (su `bg-*` deja de pintarse; con él taparía la
 * capa). Si la página no usa el fondo de la aplicación, se le da a la capa:
 * `[--fondo-de-agua:var(--color-gray-50)]`. Nunca un fondo en `style`.
 *
 * @param {string | null | undefined} dibujo - uno de `DIBUJOS_DE_MARCA_DE_AGUA`
 * @returns {string} las clases, o cadena vacía si no toca ninguno
 */
export const marcaDeAgua = (dibujo) =>
  DIBUJOS_DE_MARCA_DE_AGUA.includes(dibujo)
    ? `marca-de-agua agua-${dibujo}`
    : '';

/**
 * La marca de agua de la portada pública y de Inicio: el monograma de la
 * cabecera, en grande, centrado y fijo detrás de toda la página (Agustín, 26 nov
 * 2026). No es
 * uno de los dibujos: es el sello de la marca, servido desde `public/brand`, en
 * Forest o en lima según el tema. Como las demás, deja sin fondo al contenedor.
 */
export const marcaDeAguaDelMonograma = () =>
  'marca-de-agua marca-de-agua-monograma';

/**
 * El dibujo de cada pestaña de la anotación: la tarjeta al anotar y en la
 * tarjeta de resultados, y el trofeo en la clasificación. Las tarjetas de
 * resultados van translúcidas para dejarlo ver (`TarjetaVertical` en el partido
 * y en la partida rápida, `TarjetasDeLaPartida` en la de stroke play; Agustín,
 * 26 nov 2026: hasta entonces esa pestaña no llevaba dibujo).
 */
const DE_LA_PESTANA = {
  input: 'tarjeta-lapiz',
  scorecard: 'tarjeta-lapiz',
  cards: 'tarjeta-lapiz',
  leaderboard: 'trofeo',
  standings: 'trofeo',
  classification: 'trofeo',
};

export const marcaDeAguaDeLaPestana = (pestana) => {
  const clases = marcaDeAgua(DE_LA_PESTANA[pestana]);
  // Más arriba que en el resto: abajo va fija la barra de entregar la tarjeta,
  // que taparía la base del dibujo
  return clases && `${clases} marca-de-agua-alta`;
};
