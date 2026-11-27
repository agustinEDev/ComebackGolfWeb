import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cargarBarras } from '../composition/cargarBarras';
import customToast from '../utils/toast';
import { AVISO_ARRIBA } from '../utils/avisoArriba';
import { registraElFallo } from '../utils/registraElFallo';
import { claveDelFalloDeLaBarra } from '../utils/falloDeLaBarra';
import { TeeSource } from '../domain/value_objects/TeeSource';

/**
 * Tras apuntarse o aceptar una invitación (barras por campo, F1): si algún
 * campo no tiene su barra general (`source: NONE`), se le pide en el mismo
 * flujo, campo a campo. Cerrarlo sin elegir no rompe nada: la ficha sigue
 * avisando (F2). Sin poder leer sus barras, tampoco se dice nada aquí.
 *
 * @param {{ alGuardar?: () => void }} [opciones] - Tras guardar una: la ficha
 *   vuelve a leer «Mis barras»
 */
export const useBarrasPendientes = ({ alGuardar } = {}) => {
  const { t } = useTranslation('competitions');
  const [pendiente, setPendiente] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // Lo que pasó al guardar, para decirlo DENTRO del modal y no en un toast
  // encima (K1, revisión de la pasada del iPhone): el error, junto al
  // selector; el acierto, si queda otro campo, «Guardada en {campo}»
  const [aviso, setAviso] = useState(null);
  // Cada comprobación con su número: la que llega tarde, si ya hubo otra
  // después, no se aplica (/code-review)
  const ultimaComprobacion = useRef(0);
  // La inscripción activa ahora, para lo que acaba después de un `await`: un
  // guardado que termina con otra inscripción a la vista no la pisa
  const activa = useRef(null);
  useEffect(() => {
    activa.current = pendiente?.enrollmentId ?? null;
  }, [pendiente]);

  /**
   * @param {string} enrollmentId
   * @param {{ conEquipos?: boolean }} [competicion] - Una Ryder (por defecto):
   *   lo pendiente de un fallo es un «partido»; en stroke play, una «partida»
   */
  const comprobar = async (enrollmentId, { conEquipos = true } = {}) => {
    if (!enrollmentId) return;
    const esta = ++ultimaComprobacion.current;
    setAviso(null);
    try {
      const { getEnrollmentTeesUseCase } = await cargarBarras();
      const barras = await getEnrollmentTeesUseCase.execute(enrollmentId);
      if (esta !== ultimaComprobacion.current) return;
      // Sin opciones no hay nada que elegir: lo dice la ficha
      const campos = barras.courses.filter(
        (campo) => campo.source === TeeSource.NONE && campo.options.length > 0,
      );
      if (campos.length > 0) setPendiente({ enrollmentId, campos, conEquipos });
    } catch (error) {
      registraElFallo(
        'useBarrasPendientes.error-reading-tees',
        'Error reading the enrollment tees:',
        error,
      );
    }
  };

  // Quita ESE campo de ESA inscripción, no «el primero»: si se salta uno
  // mientras otro se guarda, o llega la cola de otra inscripción, el guardado
  // no se come lo que no es suyo (/code-review, CodeRabbit)
  const quitarCampo = (enrollmentId, golfCourseId) =>
    setPendiente((p) => {
      if (!p || p.enrollmentId !== enrollmentId) return p;
      const quedan = p.campos.filter((c) => c.golfCourseId !== golfCourseId);
      return quedan.length ? { ...p, campos: quedan } : null;
    });

  const guardar = async (color) => {
    if (!pendiente || guardando) return;
    const { enrollmentId, campos, conEquipos } = pendiente;
    const { golfCourseId, golfCourseName } = campos[0];
    setGuardando(true);
    setAviso(null);
    try {
      const { changeEnrollmentCourseTeeUseCase } = await cargarBarras();
      await changeEnrollmentCourseTeeUseCase.execute(
        enrollmentId,
        golfCourseId,
        color,
      );
      // Si queda otro campo, el modal sigue: el aviso, dentro. Si era el
      // último, se cierra y el toast ya no tapa nada
      if (campos.length > 1)
        setAviso({
          enrollmentId,
          golfCourseId,
          tipo: 'ok',
          texto: t('tees.savedOn', { course: golfCourseName }),
        });
      // Solo si su modal sigue siendo el de ella: si entretanto se abrió el
      // de otra inscripción, el toast saldría encima de ese (CodeRabbit)
      else if (activa.current === enrollmentId)
        customToast.success(t('tees.saved'), AVISO_ARRIBA);
      alGuardar?.();
      quitarCampo(enrollmentId, golfCourseId);
    } catch (error) {
      registraElFallo(
        'useBarrasPendientes.error-saving-course-tee',
        'Error saving a course tee:',
        error,
      );
      setAviso({
        enrollmentId,
        golfCourseId,
        tipo: 'error',
        texto: t(claveDelFalloDeLaBarra(error, { conEquipos })),
      });
    } finally {
      setGuardando(false);
    }
  };

  // El aviso es del guardado de una inscripción y un campo: si entretanto
  // llegó otra inscripción, o el campo a la vista ya es otro (para un error),
  // no se pinta (/code-review). El acierto sigue con la misma inscripción: dice
  // el campo que se guardó mientras se pregunta por el siguiente
  const avisoDeAhora =
    aviso &&
    pendiente &&
    aviso.enrollmentId === pendiente.enrollmentId &&
    (aviso.tipo === 'ok' ||
      aviso.golfCourseId === pendiente.campos[0].golfCourseId)
      ? { tipo: aviso.tipo, texto: aviso.texto }
      : null;

  return {
    comprobar,
    campo: pendiente?.campos[0] ?? null,
    guardando,
    aviso: avisoDeAhora,
    // Al elegir otra barra, el aviso de antes ya no vale
    limpiarAviso: () => setAviso(null),
    guardar,
    saltar: () => {
      // Mientras guarda, no se salta: el guardado ya decide qué sigue
      if (!guardando && pendiente) {
        setAviso(null);
        quitarCampo(pendiente.enrollmentId, pendiente.campos[0].golfCourseId);
      }
    },
    cerrar: () => {
      if (!guardando) {
        setAviso(null);
        setPendiente(null);
      }
    },
  };
};
