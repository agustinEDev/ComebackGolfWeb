import { useTranslation } from 'react-i18next';
import TeeColor from '../../domain/value_objects/TeeColor';
import { Gender } from '../../domain/value_objects/Gender';
import { nombreDeLaBarra } from '../../utils/nombreDeLaBarra';

// Siempre en el mismo orden, llegue como llegue
const ORDEN_DE_GENEROS = [Gender.MALE, Gender.FEMALE];

const generoDe = (tee) => tee.teeGender || tee.tee_gender || tee.gender;

/**
 * Los tees de un campo en una línea (26 nov 2026): una píldora por tee y por
 * género hacía de cada fila de la tabla una columna. Un punto del color real
 * de cada barra con sus géneros al lado (M, F); el nombre entero de cada tee,
 * para el lector de pantalla.
 *
 * @param {{ tees: Array<{ color: string, identifier?: string }> }} props
 */
const TeesCompactos = ({ tees }) => {
  const { t } = useTranslation('golfCourses');
  if (!tees?.length) return null;

  // Agrupados por barra (color y nombre propio), en el orden en que llegan
  const grupos = [];
  for (const tee of tees) {
    const clave = `${tee.color}|${tee.identifier ?? ''}`;
    let grupo = grupos.find((g) => g.clave === clave);
    if (!grupo) {
      grupo = {
        clave,
        color: tee.color,
        identifier: tee.identifier,
        generos: [],
      };
      grupos.push(grupo);
    }
    const genero = generoDe(tee);
    if (ORDEN_DE_GENEROS.includes(genero) && !grupo.generos.includes(genero))
      grupo.generos.push(genero);
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="flex flex-wrap items-center gap-x-3 gap-y-1"
      >
        {grupos.map((grupo) => (
          <span
            key={grupo.clave}
            data-testid="grupo-de-tee"
            className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-tinta-suave"
          >
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/20"
              style={{ backgroundColor: TeeColor.swatchFor(grupo.color) }}
            />
            {[
              // El nombre propio de la barra, si lo tiene: dos amarillas con
              // distinto nombre no se confunden
              grupo.identifier,
              ...ORDEN_DE_GENEROS.filter((g) => grupo.generos.includes(g)).map(
                (g) => t(`teeInitials.${g}`),
              ),
            ]
              .filter(Boolean)
              .join(' ')}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {tees.map((tee, i) => (
          <li
            key={`${tee.color}-${tee.identifier ?? ''}-${generoDe(tee)}-${i}`}
          >
            {nombreDeLaBarra(t, {
              color: tee.color,
              identifier: tee.identifier,
              gender: generoDe(tee),
            })}
          </li>
        ))}
      </ul>
    </>
  );
};

export default TeesCompactos;
