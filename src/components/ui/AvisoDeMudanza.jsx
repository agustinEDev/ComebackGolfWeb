import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocoRetenido } from '../../hooks/useFocoRetenido';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import BrandMark from './BrandMark';
import { alTocarElFondo } from './alTocarElFondo';
import {
  AL_PULSAR_BOTON,
  AL_PULSAR_ENLACE,
  NO_DISPONIBLE,
  PRINCIPAL,
  SECUNDARIO,
} from './clasesDeBoton';
import { useAuth } from '../../hooks/useAuth';
import { detectStandalone } from '../../utils/standalone';
import { resumenPorPartida } from '../../utils/scoringOfflineQueue';
import { COLA_VACIADA } from '../../services/vaciadoDeLaCola';
import {
  direccionNueva,
  esElDominioAntiguo,
  hastaCuandoSeAplaza,
  tocaEnsenarlo,
} from '../../utils/mudanza';

/** El día en que vuelve a salir tras «Ahora no» (`AAAA-MM-DD`). */
export const CLAVE_DE_LA_VUELTA = 'cbg:mudanza:vuelve';

const leeLaVuelta = () => {
  try {
    return localStorage.getItem(CLAVE_DE_LA_VUELTA);
  } catch {
    return null;
  }
};

const apuntaLaVuelta = (dia) => {
  try {
    localStorage.setItem(CLAVE_DE_LA_VUELTA, dia);
  } catch {
    // Sin almacenamiento vuelve a salir en la próxima apertura: mejor que nunca
  }
};

/**
 * El aviso de la mudanza a comebackgolf.com, solo en el dominio viejo (fase 1;
 * Agustín, 27 nov 2026). Una pantalla al abrir, una vez al día y nunca encima
 * de la anotación. La aplicación instalada no puede cambiar de dominio, así
 * que explica cómo instalar la nueva; en el navegador basta con ir.
 *
 * Lo anotado sin cobertura y aún sin enviar vive en ESTE dominio: mientras
 * quede algo, no deja irse y lleva a Inicio, donde su aviso dice qué partidas
 * son.
 *
 * @param {{ host?: string, instalada?: boolean }} props - para los tests
 */
const AvisoDeMudanza = ({
  host = globalThis.location?.hostname ?? '',
  instalada = detectStandalone(),
}) => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const dialogo = useRef(null);

  // La vuelta, también en memoria: sin almacenamiento, «Ahora no» vale al menos
  // mientras la app siga abierta
  const [vuelveEnMemoria, setVuelveEnMemoria] = useState(null);
  // «Ver cuáles» lo aparta hasta que se vacíe la cola, para dejar ver Inicio
  const [viendoPendientes, setViendoPendientes] = useState(false);
  const [, setVuelta] = useState(0);

  const enElViejo = esElDominioAntiguo(host);
  // Leída en cada pintada, no una vez: con la app abierta varios días, vuelve
  // a salir al día siguiente
  const visible =
    enElViejo &&
    !viendoPendientes &&
    tocaEnsenarlo({
      hoy: new Date(),
      aplazadoHasta: leeLaVuelta() ?? vuelveEnMemoria,
      pathname,
    });

  // Solo lo de quien tiene la sesión, y solo lo que se puede enviar: sin
  // sesión no se envía nada (y no se cuenta lo de otra cuenta), y lo de una
  // partida que el servidor ya no conoce no se vacía nunca
  const pendientes =
    visible && userId != null
      ? resumenPorPartida(userId).filter((p) => !p.desaparecida).length
      : 0;

  const aplaza = useCallback(() => {
    const dia = hastaCuandoSeAplaza(new Date());
    apuntaLaVuelta(dia);
    setVuelveEnMemoria(dia);
  }, []);

  useFocoRetenido(dialogo, { activo: visible, alEscape: aplaza });

  useEffect(() => {
    if (!enElViejo) return undefined;
    // El vaciado corre por su cuenta y avisa al terminar: se vuelve a pintar,
    // y quien estaba mirando sus pendientes vuelve a ver el aviso
    const alVaciar = () => {
      setViendoPendientes(false);
      setVuelta((n) => n + 1);
    };
    globalThis.addEventListener(COLA_VACIADA, alVaciar);
    return () => globalThis.removeEventListener(COLA_VACIADA, alVaciar);
  }, [enElViejo]);

  if (!visible) return null;

  const verCuales = () => {
    setViendoPendientes(true);
    navigate('/dashboard');
  };

  const pasos = ['abrir', 'instalar', 'entrar', 'borrar'];

  return (
    // Tocar fuera de la columna (en el escritorio, a los lados) es «Ahora no»,
    // como Escape: de un aviso se sale siempre
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-fondo text-tinta"
      {...alTocarElFondo(aplaza)}
    >
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mudanza-titulo"
        tabIndex={-1}
        className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10 outline-none"
      >
        <BrandMark className="mx-auto size-16" />
        <h2
          id="mudanza-titulo"
          className="mt-6 text-center font-poppins text-2xl font-extrabold"
        >
          {t('mudanza.titulo')}
        </h2>
        <p className="mt-2 text-center text-tinta-suave">
          {instalada ? t('mudanza.texto') : t('mudanza.navegador')}
        </p>

        {instalada && (
          <ol className="mt-6 space-y-3">
            {pasos.map((paso, i) => (
              <li key={paso} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-contraste text-xs font-bold text-sobre-contraste"
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-snug">
                  {t(`mudanza.pasos.${paso}`)}
                </span>
              </li>
            ))}
          </ol>
        )}

        {pendientes > 0 && (
          <p
            role="status"
            className="mt-6 rounded-tarjeta bg-aviso-suave p-3 text-sm text-aviso"
          >
            {t('mudanza.pendientes', { count: pendientes })}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {pendientes > 0 ? (
            <>
              <button
                type="button"
                disabled
                className={`min-h-[44px] w-full px-4 py-2.5 ${NO_DISPONIBLE}`}
              >
                {t('mudanza.esperando')}
              </button>
              <button
                type="button"
                onClick={verCuales}
                className={`min-h-[44px] w-full px-4 py-2.5 ${SECUNDARIO} ${AL_PULSAR_BOTON}`}
              >
                {t('mudanza.verCuales')}
              </button>
            </>
          ) : (
            <a
              href={direccionNueva({ instalada, pathname })}
              // Ido a la nueva, al volver a esta no la tapa: vuelve mañana
              onClick={aplaza}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex min-h-[44px] w-full items-center justify-center px-4 py-2.5 ${PRINCIPAL} ${AL_PULSAR_ENLACE}`}
            >
              {instalada ? t('mudanza.ir') : t('mudanza.irNavegador')}
            </a>
          )}
          <button
            type="button"
            onClick={aplaza}
            className="min-h-[44px] w-full text-sm font-semibold text-tinta-suave underline underline-offset-2 hover:text-tinta"
          >
            {t('mudanza.ahoraNo')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvisoDeMudanza;
