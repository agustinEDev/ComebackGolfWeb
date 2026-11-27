import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarcaDeCabecera from './MarcaDeCabecera';

/**
 * La marca de las cabeceras (Agustín, 24 nov 2026, viendo las tres variantes):
 *
 *   #   dónde               | qué se ve
 *   ----|---------------------|-------------------------------------------
 *   C1  móvil               | solo el wordmark
 *   C2  desde md            | el monograma a la izquierda del wordmark
 *   C3  lector de pantalla  | la marca se nombra UNA vez: el monograma es
 *                           | decorativo
 *   C4  tema                | cada pieza trae sus dos tintas; el monograma
 *                           | no se esconde con una clase en la propia
 *                           | imagen, que chocaría con la regla del tema
 */
describe('MarcaDeCabecera', () => {
  const pinta = () => render(<MarcaDeCabecera titulo="Comeback Golf" />);

  it('C1/C2: el monograma solo desde md; el wordmark, siempre', () => {
    pinta();

    const monograma = screen.getByTestId('monograma-de-cabecera');
    expect(monograma.className.split(' ')).toEqual(
      expect.arrayContaining(['hidden', 'md:flex']),
    );
    const wordmark = screen.getAllByAltText('Comeback Golf')[0];
    expect(wordmark.className).not.toMatch(/\bhidden\b/);
    // A su izquierda
    expect(
      monograma.compareDocumentPosition(wordmark) &
        globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  /**
   * El nombre en una línea (25 nov 2026):
   *
   *   #   dónde    | qué nombre se ve
   *   ----|---------|-----------------------------------------------------
   *   C5  desde md | el de una línea, a 36 px, junto al monograma
   *   C6  móvil    | el de dos líneas: comparte fila con dos botones y el
   *                | menú, y uno de una línea no cabe
   *   C8  cada nombre va en su envoltorio, que es quien lo esconde: las
   *       imágenes llevan la regla del tema, que gana a `hidden`
   */
  const nombres = (testid) =>
    [...screen.getByTestId(testid).querySelectorAll('img')].map((i) =>
      i.getAttribute('src'),
    );

  it('C5: desde md, el nombre en una línea a 36 px', () => {
    pinta();

    const ancho = screen.getByTestId('nombre-en-ancho');
    expect(ancho.className.split(' ')).toEqual(
      expect.arrayContaining(['hidden', 'md:flex']),
    );
    expect(nombres('nombre-en-ancho')).toEqual([
      '/brand/wordmark-linea-deep.svg',
      '/brand/wordmark-linea-acid.svg',
    ]);
    for (const img of ancho.querySelectorAll('img'))
      expect(img.className.split(' ')).toContain('h-9');
  });

  it('C6: en el móvil, el de dos líneas', () => {
    pinta();

    const movil = screen.getByTestId('nombre-en-movil');
    expect(movil.className.split(' ')).toEqual(
      expect.arrayContaining(['flex', 'md:hidden']),
    );
    expect(nombres('nombre-en-movil')).toEqual([
      '/brand/wordmark-deep.svg',
      '/brand/wordmark-acid.svg',
    ]);
  });

  it('C8: ninguna imagen del nombre lleva `hidden`: lo esconde su envoltorio', () => {
    pinta();

    for (const img of screen.getAllByAltText('Comeback Golf'))
      expect(img.className).not.toMatch(/\bhidden\b/);
  });

  it('C3: la marca se nombra una vez: el monograma es decorativo', () => {
    pinta();

    for (const img of screen
      .getByTestId('monograma-de-cabecera')
      .querySelectorAll('img')) {
      expect(img).toHaveAttribute('aria-hidden', 'true');
      expect(img).toHaveAttribute('alt', '');
    }
  });

  it('C4: las dos tintas de cada pieza, y ninguna imagen del monograma lleva `hidden`', () => {
    pinta();

    const delMonograma = [
      ...screen.getByTestId('monograma-de-cabecera').querySelectorAll('img'),
    ];
    expect(delMonograma.map((i) => i.getAttribute('src'))).toEqual([
      '/brand/stamp-deep.svg',
      '/brand/stamp-acid.svg',
    ]);
    for (const img of delMonograma) {
      expect(img.className).not.toMatch(/\bhidden\b/);
    }
  });

  /**
   * En la portada, el nombre lo da el título, que lleva el logo grande: la
   * cabecera se queda con el monograma solo, para no repetir el logo en la misma
   * pantalla (Agustín, 25 nov 2026).
   *
   *   #    cabecera        | qué se ve                | cómo se llama
   *   -----|----------------|--------------------------|----------------------
   *   C11  soloMonograma   | el monograma, en móvil   | el monograma lleva el
   *                        | y en ancho; ningún nombre| nombre de la marca
   *   C12  (por defecto)   | como hasta ahora         | lo lleva el wordmark
   */
  it('C11: solo el monograma, a cualquier ancho y con el nombre de la marca', () => {
    render(<MarcaDeCabecera titulo="Comeback Golf" soloMonograma />);

    const monograma = screen.getByTestId('monograma-de-cabecera');
    // Visible también en el móvil: ya no es `hidden md:flex`
    expect(monograma.className).not.toMatch(/\bhidden\b/);
    expect(nombres('monograma-de-cabecera')).toEqual([
      '/brand/stamp-deep.svg',
      '/brand/stamp-acid.svg',
    ]);
    for (const img of monograma.querySelectorAll('img'))
      expect(img).toHaveAttribute('alt', 'Comeback Golf');
    expect(screen.queryByTestId('nombre-en-movil')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nombre-en-ancho')).not.toBeInTheDocument();
  });

  it('C12: por defecto el monograma sigue siendo decorativo', () => {
    pinta();

    for (const img of screen
      .getByTestId('monograma-de-cabecera')
      .querySelectorAll('img'))
      expect(img).toHaveAttribute('alt', '');
  });

  it('C10: nada lleva `shrink-0`: el logo cede antes de que la fila desborde', () => {
    // Con `shrink-0`, a 320 px el logo se montaba sobre «Registrarse», y en
    // ancho la página se desplazaba de lado (revisión, 25 nov 2026)
    const { container } = pinta();
    const portada = render(
      <MarcaDeCabecera titulo="Comeback Golf" soloMonograma />,
    );

    expect(container.innerHTML).not.toMatch(/shrink-0/);
    expect(portada.container.innerHTML).not.toMatch(/shrink-0/);
  });
});
