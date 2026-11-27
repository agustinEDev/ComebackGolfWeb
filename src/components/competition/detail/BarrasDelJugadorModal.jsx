import { AL_PASAR } from '../../ui/clasesDeComportamiento';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell, { CAJA_CENTRADA_SI_CABE } from '../../ui/ModalShell';
import { useBarrasDeLaInscripcion } from '../../../hooks/useBarrasDeLaInscripcion';
import { useRefsPorId } from '../../../hooks/useRefsPorId';
import { cargarBarras } from '../../../composition/cargarBarras';
import { BARRAS_GENERALES } from '../../../utils/barrasGenerales';
import { claveDelFalloDeLaBarra } from '../../../utils/falloDeLaBarra';
import { registraElFallo } from '../../../utils/registraElFallo';
import AvisoDeLaFila, { RegionDeAviso } from './AvisoDeLaFila';
import { useAvisoDeLaFila } from './useAvisoDeLaFila';
import { TeeSource } from '../../../domain/value_objects/TeeSource';
import TeeColor from '../../../domain/value_objects/TeeColor';

const GENERAL = 'general';

// Lo elegido sin la clave que ya se guardó
const sinClave = (elegidas, clave) =>
  Object.fromEntries(Object.entries(elegidas).filter(([k]) => k !== clave));

/**
 * Las barras de un inscrito (barras por campo, F2 y F3): su general y, por
 * campo, la que juega y de dónde sale. Se leen al abrir (`GET .../tees`, una
 * sola petición) y, tras cada cambio, se vuelven a leer: se enseña lo que dice
 * el servidor. Quien no puede cambiarlas solo las ve. De él se sale siempre.
 *
 * @param {Object} props
 * @param {{id: string, userName?: string|null}} props.inscripcion
 * @param {boolean} props.puedeCambiar
 * @param {Function} props.onClose
 * @param {(barras: Object) => void} [props.onCambio] - Con lo que quedó
 * @param {string} [props.titulo] - En vez de «Barras de {nombre}» (las mías)
 * @param {boolean} [props.cerrada=false] - Competición terminada o cancelada:
 *   un campo sin barra no se resalta como aviso (ya no se puede elegir)
 * @param {boolean} [props.propia=false] - Las mías: «Tu barra»; de otro, en
 *   tercera persona («Su barra»)
 * @param {boolean} [props.conEquipos=true] - Una Ryder: lo pendiente de un
 *   fallo es un «partido»; en stroke play, una «partida»
 * @param {string|null} [props.campoInicial] - El campo cuyo «Cambiar» lo abrió:
 *   se abre desplazado a su fila; sin él, arriba
 */
const BarrasDelJugadorModal = ({
  inscripcion,
  puedeCambiar,
  onClose,
  onCambio,
  titulo: tituloPropio,
  propia = false,
  cerrada = false,
  conEquipos = true,
  campoInicial = null,
}) => {
  const { t } = useTranslation(['competitions', 'golfCourses']);
  const { barras, cargando, fallo, recargar } = useBarrasDeLaInscripcion(
    inscripcion.id,
    true,
  );
  // El foco entra por el título: en el iPhone, enfocar un selector desplaza la
  // página de detrás (pasada del iPhone, 22 nov)
  const tituloRef = useRef(null);
  // Las filas de los campos, por su id: a ellas se desplaza al abrir desde un
  // campo (sin buscarlas por un selector)
  const filas = useRefsPorId();
  // Abierto desde el «Cambiar» de un campo, se desplaza el fondo del modal (no
  // la página: sin `scrollIntoView`) hasta su fila, una sola vez: lo que el
  // jugador mueva después, y las relecturas tras guardar, no lo pisan
  const yaDesplazado = useRef(false);
  useLayoutEffect(() => {
    if (!barras || !campoInicial || yaDesplazado.current) return;
    yaDesplazado.current = true;
    const fila = filas.elemento(campoInicial);
    const fondo = fila?.closest('[role="dialog"]');
    if (!fila || !fondo) return;
    fondo.scrollTop +=
      fila.getBoundingClientRect().top - fondo.getBoundingClientRect().top - 16;
  }, [barras, campoInicial, filas]);
  // Lo elegido y aún sin guardar, por clave (`general` o el id del campo); y
  // qué se está guardando, para no mezclar dos guardados
  const [elegidas, setElegidas] = useState({});
  const [guardando, setGuardando] = useState(null);
  // Lo que pasó al guardar, en la fila guardada y no en un toast encima del
  // modal; con el modal ya cerrado, un toast (pasada del iPhone, 22 nov)
  const aviso = useAvisoDeLaFila();
  const elegir = (clave, valor) => {
    setElegidas((e) => ({ ...e, [clave]: valor }));
    aviso.limpiar(clave);
  };
  const color = (c) => t(`golfCourses:form.teeColors.${c}`);
  const motivo = (source) =>
    t(`competitions:tees.${propia ? 'source' : 'sourceOther'}.${source}`);
  const habitual = (c) =>
    c
      ? t(`competitions:tees.${propia ? 'usualMine' : 'usual'}`, {
          color: color(c),
        })
      : t(`competitions:tees.${propia ? 'usualMineNoColor' : 'usualNoColor'}`);

  const guardar = async (clave, valor) => {
    setGuardando(clave);
    aviso.limpiar();
    try {
      const casos = await cargarBarras();
      if (clave === GENERAL)
        await casos.changeEnrollmentTeeUseCase.execute(inscripcion.id, valor);
      else
        await casos.changeEnrollmentCourseTeeUseCase.execute(
          inscripcion.id,
          clave,
          valor,
        );
      aviso.avisar({
        clave,
        tipo: 'ok',
        texto: t(
          valor === null
            ? 'competitions:tees.rowRemoved'
            : 'competitions:tees.rowSaved',
        ),
        textoSiCerrado: t(
          valor === null
            ? 'competitions:tees.removed'
            : 'competitions:tees.saved',
        ),
      });
      setElegidas((e) => sinClave(e, clave));
      const leida = await recargar();
      if (leida.estado === 'cargada') onCambio?.(leida.datos);
    } catch (error) {
      registraElFallo(
        'BarrasDelJugadorModal.error-saving-tee',
        'Error saving a tee:',
        error,
      );
      const texto = t(
        claveDelFalloDeLaBarra(error, {
          quitando: valor === null,
          conEquipos,
        }),
      );
      aviso.avisar({ clave, tipo: 'error', texto });
      // La general vuelve a la que tenía: el selector no enseña una que no se
      // guardó (pasada del iPhone, 22 nov)
      if (clave === GENERAL) setElegidas((e) => sinClave(e, GENERAL));
    } finally {
      setGuardando(null);
    }
  };

  // Sin filas y con un aviso: solo puede ser un guardado bueno cuya relectura
  // falló (un fallo al guardar no relee, y las filas siguen)
  const guardadaSinReleer = !barras && aviso.resultado !== null;

  const titulo =
    tituloPropio ??
    (inscripcion.userName
      ? t('competitions:tees.playerTitle', { name: inscripcion.userName })
      : t('competitions:tees.playerTitleNoName'));

  return (
    <ModalShell
      isOpen
      // Con muchos campos no cabe en el móvil: se desplaza hasta «Cerrar»
      scrollableBackdrop
      boxClassName={CAJA_CENTRADA_SI_CABE}
      onClose={onClose}
      labelledBy="barras-del-jugador-titulo"
      busy={guardando !== null}
      inicialRef={tituloRef}
    >
      <div className="space-y-4">
        <h2
          ref={tituloRef}
          id="barras-del-jugador-titulo"
          tabIndex={-1}
          className="text-lg font-bold text-tinta break-words focus:outline-none"
        >
          {titulo}
        </h2>
        {cargando && barras === null && (
          <p role="status" className="text-sm text-tinta-suave">
            {t('competitions:tees.loading')}
          </p>
        )}
        {/* Guardado bien y la relectura falló: sin filas donde decirlo, la
            confirmación sale aquí, encima del «No se pudieron leer» (revisión
            de la pasada del iPhone). Montada siempre: solo cambia su texto */}
        <RegionDeAviso
          testId="barras-guardadas-sin-releer"
          texto={
            guardadaSinReleer
              ? (aviso.resultado.textoSiCerrado ?? aviso.resultado.texto)
              : null
          }
        />
        {fallo && (
          <div
            data-testid="barras-sin-cargar"
            className="rounded-lg border border-aviso bg-aviso-suave p-3 text-sm text-aviso"
          >
            <p>{t('competitions:tees.notLoaded')}</p>
            <button
              type="button"
              onClick={() => recargar()}
              className="mt-2 min-h-11 font-semibold underline"
            >
              {t('competitions:tees.retry')}
            </button>
          </div>
        )}
        {barras && (
          <>
            <FilaDeBarra
              id="barra-general"
              etiqueta={t('competitions:tees.general')}
              actual={barras.generalTee ?? ''}
              textoActual={
                barras.generalTee
                  ? color(barras.generalTee)
                  : habitual(barras.defaultTee)
              }
              // La general es obligatoria: sin opción vacía (sin elegir, solo
              // «Elige», que no se puede guardar)
              vacia={null}
              opciones={BARRAS_GENERALES}
              elegida={elegidas[GENERAL]}
              onElegir={(v) => elegir(GENERAL, v)}
              resultado={aviso.de(GENERAL)}
              onGuardar={(v) => guardar(GENERAL, v)}
              puedeCambiar={puedeCambiar}
              guardando={guardando}
              clave={GENERAL}
              t={t}
              color={color}
            />
            {barras.courses.map((campo) => (
              <FilaDeBarra
                key={campo.golfCourseId}
                refDeLaFila={filas.refDe(campo.golfCourseId)}
                id={`barra-${campo.golfCourseId}`}
                etiqueta={t('competitions:tees.onCourse', {
                  course: campo.golfCourseName,
                })}
                actual={campo.source === TeeSource.OWN ? (campo.tee ?? '') : ''}
                // Sin barra, el valor ya lo dice: el motivo no se repite
                textoActual={
                  campo.source === TeeSource.NONE
                    ? t('competitions:tees.noTee')
                    : `${campo.tee ? color(campo.tee) : t('competitions:tees.noTee')} · ${motivo(campo.source)}`
                }
                aviso={!cerrada && campo.source === TeeSource.NONE}
                // Sin barra en ese campo puede quedar un cambio propio que ya
                // no vale: quitarlo se ofrece solo si lo hay (`ownTee`); sin
                // nada que quitar, «Guardar» no se pulsa sin elegir una
                quitableSinCambio={
                  campo.source === TeeSource.NONE && campo.ownTee != null
                }
                vacia={t('competitions:tees.noOwnOnCourse')}
                // En el orden de todos los selectores (tabla del 21 nov, E)
                opciones={TeeColor.ordenarParaSelector(campo.options)}
                // Su barra propia, aunque el campo ya no la tenga: si no, el
                // selector mostraría otra que no es la suya
                yaNoDisponible={
                  campo.source === TeeSource.OWN &&
                  campo.tee &&
                  !campo.options.includes(campo.tee)
                    ? campo.tee
                    : null
                }
                sinOpciones={t('competitions:tees.noOptions')}
                elegida={elegidas[campo.golfCourseId]}
                onElegir={(v) => elegir(campo.golfCourseId, v)}
                resultado={aviso.de(campo.golfCourseId)}
                onGuardar={(v) => guardar(campo.golfCourseId, v)}
                puedeCambiar={puedeCambiar}
                guardando={guardando}
                clave={campo.golfCourseId}
                t={t}
                color={color}
              />
            ))}
          </>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`min-h-11 px-4 py-2 text-tinta border-[1.5px] border-tinta bg-fondo rounded-boton font-medium ${AL_PASAR}`}
          >
            {t('competitions:tees.close')}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

// Una barra: la general o la de un campo. Lo que juega, y con permiso, el
// selector y Guardar si cambió algo. `vacia`: la opción de quitar la barra
// propia del campo; sin ella (la general, obligatoria), solo «Elige» (corto:
// comparte fila con «Guardar») si aún no hay ninguna, que no se puede guardar
const FilaDeBarra = ({
  refDeLaFila,
  id,
  etiqueta,
  actual,
  textoActual,
  aviso = false,
  vacia,
  quitableSinCambio = false,
  yaNoDisponible = null,
  opciones,
  sinOpciones,
  elegida,
  onElegir,
  onGuardar,
  puedeCambiar,
  guardando,
  clave,
  resultado = null,
  t,
  color,
}) => {
  const valor = elegida ?? actual;
  return (
    <section
      ref={refDeLaFila}
      data-testid={`fila-${id}`}
      className="rounded-lg border border-linea p-3"
    >
      <p className="text-sm font-medium text-tinta break-words">{etiqueta}</p>
      <p
        className={`text-sm break-words ${aviso ? 'font-semibold text-aviso' : 'text-tinta-suave'}`}
      >
        {textoActual}
      </p>
      {/* Sin opciones se avisa; aun así, si hay algo que quitar (su cambio
          propio, o uno que ya no vale en un campo sin barra), se puede */}
      {puedeCambiar && opciones.length === 0 && (
        <p className="mt-1 text-xs text-aviso">{sinOpciones}</p>
      )}
      {puedeCambiar &&
        (opciones.length === 0 && !quitableSinCambio && actual === '' ? null : (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label htmlFor={id} className="sr-only">
              {etiqueta}
            </label>
            <select
              id={id}
              value={valor}
              onChange={(e) => onElegir(e.target.value)}
              className="min-h-11 min-w-0 flex-1 bg-fondo px-3 py-2 border border-borde rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-tinta"
            >
              {vacia !== null ? (
                <option value="">{vacia}</option>
              ) : (
                actual === '' && (
                  <option value="" disabled>
                    {t('competitions:tees.chooseShort')}
                  </option>
                )
              )}
              {/* Solo el color: con «(ya no disponible en este campo)» no
                  cabía y se cortaba (revisión F1). Que ya no está, debajo */}
              {yaNoDisponible && (
                <option value={yaNoDisponible}>{color(yaNoDisponible)}</option>
              )}
              {opciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {color(opcion)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={
                guardando !== null ||
                (valor === actual && !(quitableSinCambio && valor === ''))
              }
              onClick={() => onGuardar(valor || null)}
              data-testid={`guardar-${clave}`}
              className="min-h-11 px-4 py-2 bg-contraste text-sobre-contraste transition-opacity hover:opacity-90 rounded-boton text-sm font-medium disabled:opacity-50"
            >
              {t('competitions:tees.save')}
            </button>
          </div>
        ))}
      {puedeCambiar && yaNoDisponible && (
        <p className="mt-1 text-xs break-words text-aviso">
          {t('competitions:tees.notAvailableHere', {
            color: color(yaNoDisponible),
          })}
        </p>
      )}
      <AvisoDeLaFila resultado={resultado} />
    </section>
  );
};

export default BarrasDelJugadorModal;
