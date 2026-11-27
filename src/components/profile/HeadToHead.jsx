const APARTADOS = ['against', 'alongside'];
const CASILLAS = ['won', 'halved', 'lost'];

const COLOR = {
  won: 'text-exito',
  halved: 'text-tinta',
  lost: 'text-error',
};

/**
 * El cara a cara con un amigo: «Contra él» y «Con él», cada uno con
 * ganadas, empatadas y perdidas (22 oct). Un apartado sin partidas no se
 * pinta, y sin ninguno no se pinta el bloque: un «0 · 0 · 0» diría que habéis
 * jugado y empatado a nada.
 */
const HeadToHead = ({ headToHead, t }) => {
  const apartados = APARTADOS.filter((clave) => headToHead?.[clave]);
  if (apartados.length === 0) return null;

  return (
    <section className="mt-4" data-testid="player-profile-h2h">
      <h3 className="mb-2 text-sm font-semibold text-tinta">
        {t('playerProfile:headToHead.title')}
      </h3>
      <div className="space-y-2">
        {apartados.map((clave) => (
          <div
            key={clave}
            className="p-3 bg-tarjeta border border-linea rounded-lg"
            data-testid={`player-profile-h2h-${clave}`}
          >
            <p className="mb-2 text-xs font-medium text-tinta-suave">
              {t(`playerProfile:headToHead.${clave}`)}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {CASILLAS.map((casilla) => (
                <div
                  key={casilla}
                  data-testid={`player-profile-h2h-${clave}-${casilla}`}
                >
                  <p className={`text-lg font-bold ${COLOR[casilla]}`}>
                    {headToHead[clave][casilla]}
                  </p>
                  <p className="text-xs text-tinta-suave">
                    {t(`playerProfile:headToHead.${casilla}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeadToHead;
