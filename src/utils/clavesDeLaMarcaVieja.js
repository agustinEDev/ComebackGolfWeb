/**
 * La pasada única al arrancar tras el cambio de nombre (27 nov 2026). Las claves del
 * dispositivo pasaron de `rydercup-*` a `comebackgolf-*`. Se rescata lo que no puede
 * perderse —los golpes sin enviar, los avisos de golpes perdidos y el cierre de sesión
 * pendiente, que si no se reenvía deja la sesión viva en un móvil compartido— y se
 * borra todo lo demás: lleva datos de la cuenta y nadie volvería a leerlo, y la
 * política de privacidad promete borrar los golpes perdidos a los 7 días.
 *
 * Es la única pieza del front que nombra el prefijo viejo (sinLaMarcaVieja.test.js).
 * Cuando ya no quede quien abra la app con datos de entonces, se borra entera.
 */
const PREFIJO_VIEJO = 'rydercup-';

/**
 * Las listas (cola de golpes y avisos de golpes perdidos): por hoyo y persona —la misma
 * identidad que usan sus dueños—, gana lo nuevo. De lo viejo solo entra lo que no
 * esté: si no, un golpe viejo del mismo hoyo se enviaría el último y pisaría al nuevo.
 * Las dos a la vez solo se dan con una pestaña del build viejo abierta.
 */
const hoyoYPersona = (e) =>
  JSON.stringify([
    e?.matchId,
    e?.holeNumber,
    e?.participantId ?? null,
    e?.userId ?? null,
  ]);

const juntaListas = (nueva, vieja) => {
  const lista = JSON.parse(nueva);
  const estan = new Set(lista.map(hoyoYPersona));
  return JSON.stringify([
    ...lista,
    ...JSON.parse(vieja).filter((e) => !estan.has(hoyoYPersona(e))),
  ]);
};

/** El cierre pendiente es una hora: gana la más reciente. */
const laMasReciente = (nueva, vieja) =>
  String(Math.max(Number(nueva) || 0, Number(vieja) || 0));

const esLista = (texto) => Array.isArray(JSON.parse(texto));
const esHora = (texto) => Number.isFinite(Number(texto)) && texto.trim() !== '';

const RESCATADAS = {
  'rydercup-scoring-queue': {
    nueva: 'comebackgolf-scoring-queue',
    vale: esLista,
    junta: juntaListas,
  },
  'rydercup-golpes-perdidos': {
    nueva: 'comebackgolf-golpes-perdidos',
    vale: esLista,
    junta: juntaListas,
  },
  'rydercup-cierre-pendiente': {
    nueva: 'comebackgolf-cierre-pendiente',
    vale: esHora,
    junta: laMasReciente,
  },
};

const valeLoNuevo = (regla, nueva) => {
  if (nueva === null) return false;
  try {
    return regla.vale(nueva);
  } catch {
    return false;
  }
};

const rescata = (almacen, clave) => {
  const regla = RESCATADAS[clave];
  if (!regla) return;
  const vieja = almacen.getItem(clave);
  try {
    if (!regla.vale(vieja)) return;
    const nueva = almacen.getItem(regla.nueva);
    // Si lo nuevo no vale (vacío o roto), se queda lo viejo, que sí vale
    almacen.setItem(
      regla.nueva,
      valeLoNuevo(regla, nueva) ? regla.junta(nueva, vieja) : vieja,
    );
  } catch {
    // Roto o sin sitio: se pierde lo viejo, que es lo que habría pasado sin esto
  }
};

export const recogeLasClavesViejas = (almacen = globalThis.localStorage) => {
  try {
    const viejas = [];
    for (let i = 0; i < almacen.length; i += 1) {
      const clave = almacen.key(i);
      if (clave?.startsWith(PREFIJO_VIEJO)) viejas.push(clave);
    }
    for (const clave of viejas) {
      rescata(almacen, clave);
      almacen.removeItem(clave);
    }
  } catch {
    // Sin almacenamiento no hay nada que recoger
  }
};
