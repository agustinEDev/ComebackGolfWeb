import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { recogeLasClavesViejas } from './clavesDeLaMarcaVieja';
import { DOMINIO_ANTIGUO, esElDominioAntiguo } from './mudanza';

/**
 * La pasada única al arrancar tras el cambio de nombre (27 nov 2026, Agustín: «pasada
 * única al arrancar»). Las claves del dispositivo pasaron de `rydercup-*` a
 * `comebackgolf-*`.
 *
 *   V1 la cola de golpes vieja pasa a la nueva; la vieja se borra
 *   V2 los golpes perdidos viejos pasan a la nueva (la purga de 7 días los sigue viendo)
 *   V3 el cierre de sesión pendiente viejo pasa al nuevo: se reenvía y no se vuelve a entrar
 *   V4 con nueva y vieja a la vez no se pisa nada: en las listas se añade lo que no esté;
 *      en el cierre, la marca más reciente
 *   V5 el resto de `rydercup-*` (datos de la cuenta, cachés) se borra
 *   V6 lo que no empieza por `rydercup-` no se toca
 *   V7 un dato viejo roto se borra sin rescatar y sin romper el arranque
 *   V8 sin almacenamiento, no rompe
 *   V9 el dominio viejo es el de verdad
 *   V10 carga antes que el transporte, la purga y la app (main.jsx)
 */

class Almacen {
  constructor(datos = {}) {
    this.datos = new Map(Object.entries(datos));
  }
  get length() {
    return this.datos.size;
  }
  key(i) {
    return [...this.datos.keys()][i] ?? null;
  }
  getItem(clave) {
    return this.datos.has(clave) ? this.datos.get(clave) : null;
  }
  setItem(clave, valor) {
    this.datos.set(clave, String(valor));
  }
  removeItem(clave) {
    this.datos.delete(clave);
  }
  todo() {
    return Object.fromEntries(this.datos);
  }
}

const GOLPE = { id: 'g1', matchId: 'm1', holeNumber: 3, strokes: 4 };
const OTRO = { id: 'g2', matchId: 'm1', holeNumber: 4, strokes: 5 };
const AVISO = { id: 'a1', guardadoEn: 1 };

describe('las claves de la marca vieja', () => {
  let almacen;
  beforeEach(() => {
    almacen = new Almacen();
  });

  it('V1: la cola de golpes pasa a la clave nueva y la vieja se borra', () => {
    almacen.setItem('rydercup-scoring-queue', JSON.stringify([GOLPE]));

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual({
      'comebackgolf-scoring-queue': JSON.stringify([GOLPE]),
    });
  });

  it('V2: los golpes perdidos pasan a la clave nueva', () => {
    almacen.setItem('rydercup-golpes-perdidos', JSON.stringify([AVISO]));

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual({
      'comebackgolf-golpes-perdidos': JSON.stringify([AVISO]),
    });
  });

  it('V3: el cierre de sesión pendiente pasa a la clave nueva', () => {
    almacen.setItem('rydercup-cierre-pendiente', '1700000000000');

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual({
      'comebackgolf-cierre-pendiente': '1700000000000',
    });
  });

  it('V4: con las dos, en una lista se añade lo viejo que no esté', () => {
    almacen.setItem('comebackgolf-scoring-queue', JSON.stringify([OTRO]));
    almacen.setItem('rydercup-scoring-queue', JSON.stringify([GOLPE, OTRO]));

    recogeLasClavesViejas(almacen);

    expect(JSON.parse(almacen.getItem('comebackgolf-scoring-queue'))).toEqual([
      OTRO,
      GOLPE,
    ]);
    expect(almacen.getItem('rydercup-scoring-queue')).toBeNull();
  });

  it('V4: el mismo hoyo de la misma persona en las dos: gana lo nuevo, sin repetir', () => {
    const nuevo = {
      matchId: 'm1',
      holeNumber: 3,
      participantId: 'p1',
      userId: 'u1',
      timestamp: 2,
    };
    const viejo = { ...nuevo, timestamp: 1, scoreData: { strokes: 9 } };
    const otroHoyo = { ...viejo, holeNumber: 4 };
    almacen.setItem('comebackgolf-scoring-queue', JSON.stringify([nuevo]));
    almacen.setItem(
      'rydercup-scoring-queue',
      JSON.stringify([viejo, otroHoyo]),
    );
    almacen.setItem('comebackgolf-golpes-perdidos', JSON.stringify([nuevo]));
    almacen.setItem('rydercup-golpes-perdidos', JSON.stringify([viejo]));

    recogeLasClavesViejas(almacen);

    expect(JSON.parse(almacen.getItem('comebackgolf-scoring-queue'))).toEqual([
      nuevo,
      otroHoyo,
    ]);
    expect(JSON.parse(almacen.getItem('comebackgolf-golpes-perdidos'))).toEqual(
      [nuevo],
    );
  });

  it('V4: el mismo hoyo de otra persona sí entra', () => {
    const mio = {
      matchId: 'm1',
      holeNumber: 3,
      participantId: 'p1',
      userId: 'u1',
    };
    const suyo = { ...mio, participantId: 'p2', userId: 'u2' };
    almacen.setItem('comebackgolf-scoring-queue', JSON.stringify([mio]));
    almacen.setItem('rydercup-scoring-queue', JSON.stringify([suyo]));

    recogeLasClavesViejas(almacen);

    expect(JSON.parse(almacen.getItem('comebackgolf-scoring-queue'))).toEqual([
      mio,
      suyo,
    ]);
  });

  it.each([
    ['1700000000000', '1600000000000', '1700000000000'],
    ['1600000000000', '1700000000000', '1700000000000'],
  ])(
    'V4: con los dos cierres (nuevo %s, viejo %s), gana %s',
    (nuevo, viejo, gana) => {
      almacen.setItem('comebackgolf-cierre-pendiente', nuevo);
      almacen.setItem('rydercup-cierre-pendiente', viejo);

      recogeLasClavesViejas(almacen);

      expect(almacen.todo()).toEqual({ 'comebackgolf-cierre-pendiente': gana });
    },
  );

  it('V5: lo demás de la marca vieja se borra, también lo que lleva el usuario', () => {
    almacen.setItem(
      'rydercup-sesion-conocida',
      '{"first_name":"Ana","email":"a@b.c"}',
    );
    almacen.setItem('rydercup-ultimo-panel', '{}');
    almacen.setItem('rydercup-scoring-session-u1', 'x');
    almacen.setItem('rydercup-orden-de-salida-r1', '[]');

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual({});
  });

  it('V6: lo que no es de la marca vieja no se toca', () => {
    const intacto = {
      'comebackgolf-ultimo-panel': '{}',
      'muestrasMias:v1:u1': '[]',
      i18nextLng: 'es',
      'ryderCup.algo': 'x',
    };
    Object.entries(intacto).forEach(([c, v]) => almacen.setItem(c, v));

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual(intacto);
  });

  it('V7: un dato viejo roto se borra sin rescatar y sin romper', () => {
    almacen.setItem('rydercup-scoring-queue', '{no es json');
    almacen.setItem('comebackgolf-scoring-queue', JSON.stringify([OTRO]));

    expect(() => recogeLasClavesViejas(almacen)).not.toThrow();
    expect(almacen.todo()).toEqual({
      'comebackgolf-scoring-queue': JSON.stringify([OTRO]),
    });
  });

  it.each([
    ['rydercup-scoring-queue', '{no es json'],
    ['rydercup-golpes-perdidos', '{"no":"es una lista"}'],
    ['rydercup-cierre-pendiente', 'ayer'],
  ])('V7: %s roto y sin nada nuevo: no se copia la basura', (clave, roto) => {
    almacen.setItem(clave, roto);

    recogeLasClavesViejas(almacen);

    expect(almacen.todo()).toEqual({});
  });

  it.each([
    ['comebackgolf-scoring-queue', 'rydercup-scoring-queue', 'null'],
    ['comebackgolf-scoring-queue', 'rydercup-scoring-queue', '{"a":1}'],
    ['comebackgolf-golpes-perdidos', 'rydercup-golpes-perdidos', '{roto'],
    ['comebackgolf-cierre-pendiente', 'rydercup-cierre-pendiente', 'ayer'],
  ])(
    'V4: si lo nuevo de %s no vale, gana lo viejo válido',
    (nueva, vieja, basura) => {
      const bueno =
        vieja === 'rydercup-cierre-pendiente'
          ? '1700000000000'
          : JSON.stringify([GOLPE]);
      almacen.setItem(nueva, basura);
      almacen.setItem(vieja, bueno);

      recogeLasClavesViejas(almacen);

      expect(almacen.todo()).toEqual({ [nueva]: bueno });
    },
  );

  it('V8: sin almacenamiento, no rompe', () => {
    const roto = {
      get length() {
        throw new Error('SecurityError');
      },
    };

    expect(() => recogeLasClavesViejas(roto)).not.toThrow();
    expect(() => recogeLasClavesViejas(undefined)).not.toThrow();
  });

  it('V9: el dominio viejo es el de verdad', () => {
    expect(DOMINIO_ANTIGUO).toBe('rydercupfriends.com');
    expect(esElDominioAntiguo('www.rydercupfriends.com')).toBe(true);
  });

  it('V10: carga antes de todo lo que lee el almacenamiento', () => {
    const main = readFileSync(resolve(process.cwd(), 'src/main.jsx'), 'utf8');
    const donde = (modulo) => main.indexOf(modulo);

    expect(donde("'./composition/clavesViejasAlArrancar'")).toBeGreaterThan(-1);
    for (const despues of [
      "'./composition/interfazDelTransporte'",
      "'./composition/caducidadAlArrancar'",
      "'./App.jsx'",
    ]) {
      expect(donde("'./composition/clavesViejasAlArrancar'")).toBeLessThan(
        donde(despues),
      );
    }
  });
});
