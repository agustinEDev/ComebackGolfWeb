/**
 * El último marcador por equipos visto de cada competición, guardado en el
 * dispositivo: al abrir la aplicación sale al instante, como el resto de Inicio
 * (`elUltimoPanel`), y se actualiza por detrás. Antes vivía solo en memoria y,
 * al abrir la app de cero, su sitio salía vacío un momento mientras lo demás ya
 * estaba pintado (Agustín, en el iPhone, 24 nov 2026).
 *
 * Es de la cuenta que lo vio: se olvida al cerrar la sesión
 * (`composition/limpiezaAlCerrarLaSesion`), para que la siguiente cuenta en el
 * mismo navegador no herede lo de la anterior.
 */
const CLAVE = 'comebackgolf-marcadores-vistos';
/** Si cambia la forma de lo guardado, se sube y lo de antes se ignora. */
const VERSION = 1;
/** Inicio enseña uno; caben unos pocos por si se alterna entre competiciones. */
const CUANTOS_CABEN = 4;

const textoONada = (x) =>
  x === null || x === undefined || typeof x === 'string';
const numeroONada = (x) => x === null || x === undefined || Number.isFinite(x);

/**
 * Lo que se pinta tiene que ser de su tipo: un nombre que no es texto revienta
 * al pintarlo, y como se pinta antes de que llegue lo nuevo, tumbaría Inicio en
 * cada apertura hasta cerrar sesión (la misma regla que `elUltimoPanel`).
 */
const esUnMarcador = (m) =>
  Boolean(m) &&
  typeof m === 'object' &&
  typeof m.competitionId === 'string' &&
  m.competitionId !== '' &&
  textoONada(m.competitionName) &&
  textoONada(m.teamAName) &&
  textoONada(m.teamBName) &&
  numeroONada(m.teamAPoints) &&
  numeroONada(m.teamBPoints);

/**
 * Lo que se pinta de un marcador, y nada más. La ÚNICA lista de sus campos:
 * la usa también el hook con la respuesta del servidor, para que un campo
 * nuevo no se vea en vivo y desaparezca al abrir la app desde lo guardado.
 */
export const soloLoQueSePinta = (m) => ({
  competitionId: m.competitionId,
  competitionName: m.competitionName,
  teamAName: m.teamAName,
  teamBName: m.teamBName,
  teamAPoints: m.teamAPoints,
  teamBPoints: m.teamBPoints,
});

/** @returns {Array|null} lo guardado, o nulo si el almacenamiento no se deja leer */
const leeDelDispositivo = () => {
  try {
    if (!globalThis.localStorage) return null;
    const crudo = globalThis.localStorage.getItem(CLAVE);
    const guardado = crudo ? JSON.parse(crudo) : null;
    if (guardado?.v !== VERSION || !Array.isArray(guardado.marcadores))
      return [];
    return guardado.marcadores.filter(esUnMarcador).map(soloLoQueSePinta);
  } catch {
    return null;
  }
};

// Se lee una vez: lo consulta cada pintado de Inicio, y leer y parsear el
// almacenamiento en cada uno es trabajo síncrono de balde. El orden es el de
// llegada: el último, el más reciente
let vistos = null;
const losVistos = () => {
  if (!vistos)
    vistos = new Map(
      (leeDelDispositivo() ?? []).map((m) => [m.competitionId, m]),
    );
  return vistos;
};

/**
 * Puesto al cerrar la sesión: ya no se escribe en lo que queda de página. Los
 * cierres duros —CSRF, dispositivo revocado— salen con una redirección que no
 * es instantánea, y la clasificación que estaba en vuelo puede contestar
 * después del borrado y reponer lo que se acaba de quitar (revisión de
 * seguridad, 25 nov 2026). El mismo cerrojo que `loUltimoConocido`.
 */
let cerrado = false;

// Otra pestaña ha tocado lo guardado —lo normal, que haya cerrado la sesión—:
// la copia en memoria de esta deja de valer. Sin esto, la siguiente escritura
// volcaba la memoria entera y devolvía al dispositivo los marcadores de la
// cuenta anterior, ya bajo la sesión de otra (revisión de seguridad)
globalThis.addEventListener?.('storage', (evento) => {
  if (evento.key === CLAVE || evento.key === null) vistos = null;
});

/**
 * Antes de escribir se parte de lo que hay AHORA en el dispositivo, no de la
 * memoria: es lo que vale si otra pestaña lo cambió y el aviso aún no llegó.
 */
const cambia = (como) => {
  if (cerrado) return;
  // Si el almacenamiento no se deja leer (Safari con él bloqueado), manda la
  // memoria: durante la visita se conservan todos, como antes de guardarlos
  const guardados = leeDelDispositivo();
  const todos = guardados
    ? new Map(guardados.map((m) => [m.competitionId, m]))
    : new Map(losVistos());
  if (como(todos) === false) {
    vistos = todos;
    return;
  }
  vistos = todos;
  try {
    globalThis.localStorage?.setItem(
      CLAVE,
      JSON.stringify({ v: VERSION, marcadores: [...todos.values()] }),
    );
  } catch {
    // Sin espacio, o en una ventana privada: en memoria queda lo de esta
    // escritura, que es lo que Inicio va a pedir
  }
};

/** @returns {object|null} el último marcador visto de esa competición */
export const elMarcadorVisto = (competitionId) =>
  losVistos().get(competitionId) ?? null;

export const recuerdaElMarcador = (competitionId, marcador) => {
  if (!competitionId) return;
  const nuevo = { ...marcador, competitionId };
  if (!esUnMarcador(nuevo)) return;
  const limpio = soloLoQueSePinta(nuevo);
  cambia((todos) => {
    const antes = todos.get(competitionId);
    // Sin cambios no se toca el almacenamiento: esto corre en cada vuelta a
    // la aplicación
    if (antes && JSON.stringify(antes) === JSON.stringify(limpio)) return false;
    todos.delete(competitionId);
    todos.set(competitionId, limpio);
    // Los más viejos se van por delante
    while (todos.size > CUANTOS_CABEN) todos.delete(todos.keys().next().value);
    return true;
  });
};

/** Ya no se puede ver (403) o ya no existe (404): lo visto deja de valer. */
export const olvidaElMarcador = (competitionId) => {
  cambia((todos) => todos.delete(competitionId));
};

export const olvidaLosMarcadores = () => {
  vistos = new Map();
  cerrado = true;
  try {
    globalThis.localStorage?.removeItem(CLAVE);
  } catch {
    // Sin almacenamiento no había nada que borrar
  }
};

/**
 * Entra una cuenta en esta carga: el cerrojo se levanta, como en
 * `abreLoGuardadoParaLaCuenta`. Los caminos «sin sesión» que no recargan la
 * página (la pantalla de entrar, un 401 al arrancar) limpian con el mismo
 * registro, y sin esto el marcador dejaba de guardarse tras entrar. No borra nada.
 */
export const abreLosMarcadoresParaLaCuenta = () => {
  cerrado = false;
};
