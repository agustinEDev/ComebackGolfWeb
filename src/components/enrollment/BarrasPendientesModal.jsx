import { AL_PASAR } from '../ui/clasesDeComportamiento';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell, { CAJA_CENTRADA_SI_CABE } from '../ui/ModalShell';
import TeeColor from '../../domain/value_objects/TeeColor';
import {
  AlertaDeAviso,
  RegionDeAviso,
} from '../competition/detail/AvisoDeLaFila';

/**
 * «Elige tu barra en {campo}» (barras por campo, F1): un campo que no tiene
 * su barra general, con las que se le pueden fijar. «Ahora no» pasa al
 * siguiente; «Cerrar» deja este y el resto para la ficha. De él se sale
 * siempre, salvo mientras guarda (el guardado decide qué sigue).
 *
 * @param {Object} props
 * @param {{golfCourseId: string, golfCourseName: string, options: string[]}|null} props.campo
 * @param {boolean} props.guardando
 * @param {{tipo: 'ok'|'error', texto: string}|null} [props.aviso] - Lo que
 *   pasó al guardar: el error, junto al selector; el acierto («Guardada en
 *   {campo}», al pasar al siguiente), arriba. Nunca un toast encima del modal
 * @param {() => void} [props.onElegir] - Al elegir otra barra: el aviso de
 *   antes (un error) se borra
 * @param {(color: string) => void} props.onGuardar
 * @param {Function} props.onSaltar
 * @param {Function} props.onClose
 */
const BarrasPendientesModal = ({
  campo,
  guardando,
  aviso = null,
  onElegir,
  onGuardar,
  onSaltar,
  onClose,
}) => {
  if (!campo) return null;
  return (
    <Contenido
      campo={campo}
      guardando={guardando}
      aviso={aviso}
      onElegir={onElegir}
      onGuardar={onGuardar}
      onSaltar={onSaltar}
      onClose={onClose}
    />
  );
};

// El modal se queda montado al pasar de un campo al siguiente: así su región
// de avisos sigue siendo la misma y VoiceOver anuncia «Guardada en {campo}».
// Lo de cada campo (lo elegido) vive en `Eleccion`, que empieza de cero en
// cada uno
const Contenido = ({
  campo,
  guardando,
  aviso,
  onElegir,
  onGuardar,
  onSaltar,
  onClose,
}) => {
  const { t } = useTranslation(['competitions', 'golfCourses']);
  // El foco entra por el título, no por el selector: en el iPhone, enfocar un
  // `<select>` desplaza la página de detrás hasta él aunque se pida no
  // desplazar, y al cerrar la ficha se quedaba abajo (pasada del iPhone, 22 nov)
  const tituloRef = useRef(null);
  // Al pasar de campo, el foco vuelve al título: lo que lo tenía (el botón
  // de guardar) era del campo anterior y ya no está
  const campoAnterior = useRef(campo.golfCourseId);
  useEffect(() => {
    if (campoAnterior.current === campo.golfCourseId) return;
    campoAnterior.current = campo.golfCourseId;
    tituloRef.current?.focus({ preventScroll: true });
  }, [campo.golfCourseId]);
  return (
    <ModalShell
      isOpen
      // Con muchos campos no cabe en el móvil: se desplaza hasta «Cerrar»
      scrollableBackdrop
      boxClassName={CAJA_CENTRADA_SI_CABE}
      onClose={onClose}
      labelledBy="barra-pendiente-titulo"
      describedBy="barra-pendiente-texto"
      closeOnEscape={!guardando}
      busy={guardando}
      inicialRef={tituloRef}
    >
      <div className="space-y-4">
        {/* Montada siempre, solo cambia su texto (VoiceOver); vacía no ocupa
            sitio ni empuja el título */}
        <RegionDeAviso texto={aviso?.tipo === 'ok' ? aviso.texto : null} />
        <h2
          ref={tituloRef}
          id="barra-pendiente-titulo"
          tabIndex={-1}
          className="text-lg font-bold text-tinta break-words focus:outline-none"
        >
          {t('competitions:tees.chooseOnCourse', {
            course: campo.golfCourseName,
          })}
        </h2>
        <p id="barra-pendiente-texto" className="text-sm text-tinta-suave">
          {t('competitions:tees.chooseOnCourseHint')}
        </p>
        <Eleccion
          key={campo.golfCourseId}
          campo={campo}
          guardando={guardando}
          error={aviso?.tipo === 'error' ? aviso.texto : null}
          onElegir={onElegir}
          onGuardar={onGuardar}
          onSaltar={onSaltar}
          onClose={onClose}
          t={t}
        />
      </div>
    </ModalShell>
  );
};

const Eleccion = ({
  campo,
  guardando,
  error,
  onElegir,
  onGuardar,
  onSaltar,
  onClose,
  t,
}) => {
  const [color, setColor] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (color && !guardando) onGuardar(color);
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="barra-pendiente"
          className="block text-sm font-medium text-tinta mb-1"
        >
          {t('competitions:tees.label')}
        </label>
        <select
          id="barra-pendiente"
          required
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            onElegir?.();
          }}
          className="bg-fondo w-full min-h-11 px-3 py-2 border border-borde rounded-lg focus:outline-none focus:ring-2 focus:ring-tinta text-sm"
        >
          <option value="" disabled>
            {t('competitions:tees.choose')}
          </option>
          {TeeColor.ordenarParaSelector(campo.options).map((opcion) => (
            <option key={opcion} value={opcion}>
              {t(`golfCourses:form.teeColors.${opcion}`)}
            </option>
          ))}
        </select>
        {/* El error, junto al selector y no en un toast encima (K1) */}
        <AlertaDeAviso texto={error} className="mt-1" />
      </div>
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        {/* Salir sin elegir y sin saltar: lo que falte lo avisa la ficha */}
        <button
          type="button"
          disabled={guardando}
          onClick={onClose}
          className={`min-h-11 px-4 py-2 text-tinta rounded-lg font-medium disabled:opacity-50 ${AL_PASAR}`}
        >
          {t('competitions:tees.close')}
        </button>
        <button
          type="button"
          disabled={guardando}
          onClick={onSaltar}
          className={`min-h-11 px-4 py-2 text-tinta border-[1.5px] border-tinta bg-fondo rounded-boton font-medium disabled:opacity-50 ${AL_PASAR}`}
        >
          {t('competitions:tees.notNow')}
        </button>
        <button
          type="submit"
          disabled={!color || guardando}
          className="min-h-11 px-4 py-2 bg-contraste text-sobre-contraste rounded-boton font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {t('competitions:tees.save')}
        </button>
      </div>
    </form>
  );
};

export default BarrasPendientesModal;
