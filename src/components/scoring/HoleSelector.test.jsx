import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HoleSelector from './HoleSelector';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
    i18n: { language: 'en' },
  }),
}));

/**
 * Con la marca ComeBack Golf el estado de un hoyo se lee por su FORMA, no solo
 * por su color: vacío con contorno fino, anotado con contorno marcado, validado
 * relleno, y en conflicto relleno en el color de error. El estado va además en
 * `data-estado`, que es lo que comprueban los tests de abajo.
 */
describe('HoleSelector · el aspecto de cada estado', () => {
  const hoyo = (estado) => ({
    holeNumber: 1,
    holeResult: null,
    playerScores:
      estado === 'empty'
        ? []
        : [
            {
              userId: 'u1',
              ownSubmitted: true,
              markerSubmitted: estado !== 'pending',
              validationStatus:
                estado === 'validated'
                  ? 'match'
                  : estado === 'mismatch'
                    ? 'mismatch'
                    : 'pending',
            },
          ],
  });
  const boton = (estado) => {
    render(
      <HoleSelector
        currentHole={5}
        onSelect={() => {}}
        scores={[hoyo(estado)]}
      />,
    );
    return screen.getByTestId('hole-btn-1');
  };

  it.each([
    ['empty', ['border-borde', 'text-tinta-suave']],
    ['pending', ['border-tinta', 'text-tinta']],
    ['validated', ['bg-contraste', 'text-sobre-contraste']],
    ['mismatch', ['border-dashed', 'border-error', 'text-error']],
  ])('%s', (estado, clases) => {
    const b = boton(estado);

    expect(b.dataset.estado).toBe(estado);
    for (const clase of clases)
      expect(b.className.split(/\s+/)).toContain(clase);
  });

  it('ningún estado se distingue solo por el color: cada uno tiene su forma', () => {
    // La forma SIN el color: si hay relleno, y el grosor y el trazo del
    // contorno. Dos estados que solo cambiasen de color darían la misma
    const forma = (clases) =>
      [
        clases.some((c) => /^bg-/.test(c)) ? 'relleno' : 'hueco',
        clases.find((c) => /^border(-\d+|-\[[\d.]+px\])?$/.test(c)) ??
          'sin-borde',
        clases.includes('border-dashed') ? 'discontinuo' : 'continuo',
      ].join(' ');
    const formas = ['empty', 'pending', 'validated', 'mismatch'].map((e) => {
      const clases = boton(e).className.split(/\s+/);
      cleanup();
      return forma(clases);
    });

    expect(new Set(formas).size).toBe(4);
  });
});

describe('HoleSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render 18 hole buttons by default', () => {
    render(<HoleSelector currentHole={1} onSelect={mockOnSelect} />);
    expect(screen.getByTestId('hole-selector')).toBeInTheDocument();
    expect(screen.getByTestId('hole-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('hole-btn-18')).toBeInTheDocument();
  });

  /**
   * El hoyo en juego: en lima y con un aro, que es su forma (la lima sola no
   * se separa del fondo claro). Dentro conserva la de su estado.
   *
   *   estado     | contorno dentro del aro
   *   -----------|--------------------------------
   *   empty      | ninguno
   *   pending    | 1,5 px
   *   validated  | 3 px
   *   mismatch   | 2 px discontinuo, rojo oscuro
   */
  const enJuego = (estado) => {
    const score =
      estado === 'empty'
        ? []
        : [
            {
              holeNumber: 2,
              holeResult: null,
              playerScores: [
                {
                  userId: 'u1',
                  ownSubmitted: true,
                  markerSubmitted: estado !== 'pending',
                  validationStatus:
                    estado === 'validated'
                      ? 'match'
                      : estado === 'mismatch'
                        ? 'mismatch'
                        : 'pending',
                },
              ],
            },
          ];
    const { unmount } = render(
      <HoleSelector currentHole={2} onSelect={mockOnSelect} scores={score} />,
    );
    const boton = screen.getByTestId('hole-btn-2');
    const salida = {
      estado: boton.dataset.estado,
      clases: boton.className.split(/\s+/).filter(Boolean),
    };
    unmount();
    return salida;
  };

  it.each(['empty', 'pending', 'validated', 'mismatch'])(
    'el hoyo en juego, %s: lima, letra Forest y aro',
    (estado) => {
      const { estado: leido, clases } = enJuego(estado);

      expect(leido).toBe(estado);
      expect(clases).toEqual(
        expect.arrayContaining([
          'bg-lime',
          'text-forest',
          'ring-2',
          'ring-tinta',
          'ring-offset-2',
        ]),
      );
      // Nada del estado sin elegir: ni su relleno ni su letra
      expect(clases).not.toContain('bg-contraste');
      expect(clases).not.toContain('text-error');
      expect(clases).not.toContain('text-tinta-suave');
      // Y sin «encima»: ya es el elegido
      expect(clases.some((c) => c.includes('hover:'))).toBe(false);
    },
  );

  it('el hoyo en juego conserva la forma de su estado: cuatro contornos distintos', () => {
    const contorno = (estado) =>
      enJuego(estado)
        .clases.filter((c) => c.startsWith('border'))
        .sort()
        .join(' ');

    expect(contorno('empty')).toBe('');
    expect(contorno('pending')).toBe('border-[1.5px] border-forest');
    expect(contorno('validated')).toBe('border-[3px] border-forest');
    // El rojo del tema claro, fijo: sobre la lima, el del oscuro no se ve
    expect(contorno('mismatch')).toBe(
      'border-2 border-[#b42318] border-dashed',
    );
  });

  it('las dos filas se separan lo bastante para el aro del hoyo en juego', () => {
    render(<HoleSelector currentHole={5} onSelect={mockOnSelect} />);

    // El aro sobresale 4 px (2 de separación y 2 de trazo): con 10 px entre
    // filas no toca al hoyo de debajo
    const clases = screen.getByTestId('hole-selector').className.split(/\s+/);
    expect(clases).toContain('gap-y-2.5');
    expect(clases).not.toContain('gap-1');
  });

  it('los demás hoyos no van en lima ni llevan aro, y responden al puntero', () => {
    render(<HoleSelector currentHole={5} onSelect={mockOnSelect} />);

    const clases = screen.getByTestId('hole-btn-1').className.split(/\s+/);
    expect(clases).not.toContain('bg-lime');
    expect(clases).not.toContain('ring-2');
    expect(clases).toEqual(
      expect.arrayContaining([
        'enabled:hover:bg-contraste',
        'enabled:hover:text-sobre-contraste',
      ]),
    );
  });

  it('should call onSelect when a hole is clicked', () => {
    render(<HoleSelector currentHole={1} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getByTestId('hole-btn-7'));
    expect(mockOnSelect).toHaveBeenCalledWith(7);
  });

  it('should show validated status', () => {
    const scores = [
      { holeNumber: 3, playerScores: [{ validationStatus: 'match' }] },
    ];
    render(
      <HoleSelector currentHole={1} onSelect={mockOnSelect} scores={scores} />,
    );
    expect(screen.getByTestId('hole-btn-3').dataset.estado).toBe('validated');
  });

  it('should show mismatch status', () => {
    const scores = [
      { holeNumber: 5, playerScores: [{ validationStatus: 'mismatch' }] },
    ];
    render(
      <HoleSelector currentHole={1} onSelect={mockOnSelect} scores={scores} />,
    );
    expect(screen.getByTestId('hole-btn-5').dataset.estado).toBe('mismatch');
  });

  it('should respect totalHoles prop', () => {
    render(
      <HoleSelector currentHole={1} onSelect={mockOnSelect} totalHoles={9} />,
    );
    expect(screen.getByTestId('hole-btn-9')).toBeInTheDocument();
    expect(screen.queryByTestId('hole-btn-10')).toBeNull();
  });
});

// Un hoyo que no se pudo guardar se marca aparte (FE #622): el rojo de fondo
// ya dice «desacuerdo con el marcador», así que va un punto en la esquina
describe('HoleSelector · los hoyos que no se pudieron guardar (FE #622)', () => {
  it('llevan un punto, y se anuncian', () => {
    render(
      <HoleSelector currentHole={1} onSelect={vi.fn()} noGuardados={[5, 7]} />,
    );

    expect(screen.getByTestId('no-guardado-5')).toBeInTheDocument();
    expect(screen.getByTestId('no-guardado-7')).toBeInTheDocument();
    // El número y el aviso: el punto solo no le dice nada a un lector de pantalla
    expect(screen.getByTestId('hole-btn-5')).toHaveAccessibleName(
      '5, holeSelector.noGuardado',
    );
    expect(screen.getByTestId('hole-btn-6')).toHaveAccessibleName('6');
  });

  it('los demás no', () => {
    render(
      <HoleSelector currentHole={1} onSelect={vi.fn()} noGuardados={[5]} />,
    );

    expect(screen.queryByTestId('no-guardado-6')).not.toBeInTheDocument();
  });

  it('sin la lista, ninguno', () => {
    render(<HoleSelector currentHole={1} onSelect={vi.fn()} />);

    expect(screen.queryByTestId(/^no-guardado-/)).not.toBeInTheDocument();
  });

  describe('#847: los hoyos sin jugar', () => {
    const sinNada = {
      ownSubmitted: false,
      markerSubmitted: false,
      validationStatus: 'pending',
    };

    it('salen vacíos, no amarillos, aunque la API traiga la fila', () => {
      render(
        <HoleSelector
          currentHole={1}
          onSelect={vi.fn()}
          scores={[{ holeNumber: 12, playerScores: [sinNada, sinNada] }]}
        />,
      );

      expect(screen.getByTestId('hole-btn-12').dataset.estado).toBe('empty');
      expect(screen.getByTestId('hole-btn-12').dataset.estado).not.toBe(
        'pending',
      );
    });

    it('revisor: una fila sin nadie (todos retirados), también gris', () => {
      render(
        <HoleSelector
          currentHole={1}
          onSelect={vi.fn()}
          scores={[{ holeNumber: 4, playerScores: [] }]}
        />,
      );

      expect(screen.getByTestId('hole-btn-4').dataset.estado).toBe('empty');
    });

    it('con algo anotado y sin validar, sí amarillo', () => {
      const anotado = { ...sinNada, ownSubmitted: true };
      render(
        <HoleSelector
          currentHole={1}
          onSelect={vi.fn()}
          scores={[{ holeNumber: 3, playerScores: [anotado, sinNada] }]}
        />,
      );

      expect(screen.getByTestId('hole-btn-3').dataset.estado).toBe('pending');
    });
  });
});

// F6 (25 oct 2026): con un retirado del fourball, el hoyo se cierra sin su bola
describe('HoleSelector · fourball con un retirado', () => {
  const hoyo = (a1) => [
    {
      holeNumber: 1,
      holeResult: null,
      playerScores: [
        {
          userId: 'a1',
          validationStatus: a1,
          ownSubmitted: false,
          markerSubmitted: false,
        },
        {
          userId: 'a2',
          validationStatus: 'match',
          ownSubmitted: true,
          markerSubmitted: true,
        },
        {
          userId: 'b1',
          validationStatus: 'match',
          ownSubmitted: true,
          markerSubmitted: true,
        },
        {
          userId: 'b2',
          validationStatus: 'match',
          ownSubmitted: true,
          markerSubmitted: true,
        },
      ],
    },
  ];

  it('F6: la bola del retirado sin validar no deja el hoyo a medias', () => {
    render(
      <HoleSelector
        currentHole={2}
        onSelect={() => {}}
        scores={hoyo('pending')}
        retirados={['a1']}
      />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).toBe('validated');
  });

  it('F6: sin retirados, la misma bola sí lo deja a medias', () => {
    render(
      <HoleSelector
        currentHole={2}
        onSelect={() => {}}
        scores={hoyo('pending')}
      />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).not.toBe(
      'validated',
    );
  });

  it('F6: con resultado del servidor (cerrado sin su bola al volver), validado', () => {
    const cerrado = hoyo('pending').map((h) => ({
      ...h,
      holeResult: { winner: 'B' },
    }));
    render(
      <HoleSelector currentHole={2} onSelect={() => {}} scores={cerrado} />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).toBe('validated');
  });

  // /code-review (26 oct 2026): el resultado del servidor no tapa lo que aún
  // no está cerrado: una corrección en la cola, o un desacuerdo nuevo
  it('con resultado del servidor y una corrección en la cola, a medias', () => {
    const cerrado = hoyo('match').map((h) => ({
      ...h,
      holeResult: { winner: 'B' },
      playerScores: h.playerScores.map((ps) =>
        ps.userId === 'a2'
          ? { ...ps, validationStatus: 'pending', enCola: true }
          : ps,
      ),
    }));
    render(
      <HoleSelector currentHole={2} onSelect={() => {}} scores={cerrado} />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).toBe('pending');
  });

  it('con resultado del servidor y un desacuerdo, en conflicto', () => {
    const cerrado = hoyo('match').map((h) => ({
      ...h,
      holeResult: { winner: 'B' },
      playerScores: h.playerScores.map((ps) =>
        ps.userId === 'b1' ? { ...ps, validationStatus: 'mismatch' } : ps,
      ),
    }));
    render(
      <HoleSelector currentHole={2} onSelect={() => {}} scores={cerrado} />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).toBe('mismatch');
  });

  it('el desacuerdo en la bola del retirado no lo marca en conflicto: no cuenta', () => {
    render(
      <HoleSelector
        currentHole={2}
        onSelect={() => {}}
        scores={hoyo('mismatch')}
        retirados={['a1']}
      />,
    );
    expect(screen.getByTestId('hole-btn-1').dataset.estado).toBe('validated');
  });
});
