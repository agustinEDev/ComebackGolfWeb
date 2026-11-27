import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import HeaderAuth from './HeaderAuth';
import { logoutUseCase } from '../../composition';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

vi.mock('../ui/LanguageSwitcher', () => ({
  default: ({ compacto }) => (
    <div
      data-testid={
        compacto ? 'language-switcher-compacto' : 'language-switcher'
      }
    />
  ),
}));

vi.mock('../../composition', () => ({
  logoutUseCase: { execute: vi.fn() },
}));

vi.mock('../../utils/broadcastAuth', () => ({
  broadcastLogout: vi.fn(),
}));

let novedades = 0;
vi.mock('../../hooks/useNovedadesDeActividad', () => ({
  useNovedadesDeActividad: () => novedades,
  olvidaLasNovedades: () => {},
}));

const clearAuth = vi.fn();
vi.mock('../../hooks/useAuthContext', () => ({
  useAuthContext: () => ({ clearAuth }),
}));

const user = { first_name: 'Ana', last_name: 'Soto', is_admin: false };

const renderHeader = (path, props = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <HeaderAuth user={user} {...props} />
    </MemoryRouter>,
  );

/**
 * Cabecera contextual en movil (FE #310): decir donde estas y como volver, en
 * lugar de repetir la marca en cada pantalla.
 */
describe('HeaderAuth', () => {
  // #1129: lo que cambia cuando una pantalla no le pasa el usuario
  describe('who is signed in', () => {
    it('C4a: a player sees their initials and no Admin badge', () => {
      renderHeader('/feed');

      expect(screen.getByText('AS')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-badge')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('AS'));
      expect(
        screen.queryByText('header.administration'),
      ).not.toBeInTheDocument();
    });

    it('C4b: an admin sees their initials, the Admin badge and the admin entries', () => {
      renderHeader('/feed', { user: { ...user, is_admin: true } });

      expect(screen.getByText('AS')).toBeInTheDocument();
      expect(screen.getByTestId('admin-badge')).toBeInTheDocument();
      fireEvent.click(screen.getByText('AS'));
      expect(
        screen.getAllByText('header.administration').length,
      ).toBeGreaterThan(0);
    });

    it('C4c: without a user it shows «?», which is what the three screens showed', () => {
      renderHeader('/feed', { user: undefined });

      expect(screen.getByText('?')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-badge')).not.toBeInTheDocument();
    });
  });

  /**
   * El logo, en la barra de TODAS las pantallas; el título baja a la página
   * (Agustín, 25 nov 2026: «bajamos el título y ponemos el logo en la cabecera»).
   *
   *   #   pantalla                      | barra                | título
   *   ----|-------------------------------|----------------------|----------------
   *   L1  con título y pantalla padre   | flecha + logo        | bajo la barra
   *   L2  raíz de la navegación         | logo, sin flecha     | bajo la barra
   *   L3  con `marca` (Inicio)          | logo, sin flecha     | ninguno aquí
   *   L3b fuera del mapa (anotar)       | logo, sin flecha     | ninguno aquí
   *   L4  con acción                    | logo + la acción     | bajo la barra
   *   L5  el título es el único <h1> y no va dentro de <header>
   */
  it('L1: con título y pantalla padre, la barra lleva la flecha y el logo, y el título va debajo', () => {
    renderHeader('/profile/devices');

    const barra = screen.getByTestId('cabecera-movil');
    expect(within(barra).getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/profile',
    );
    const flecha = within(barra).getByRole('link', { name: 'back' });
    const logo = within(barra).getAllByAltText('brandMarkAlt')[0];
    // La flecha, delante del logo
    expect(
      flecha.compareDocumentPosition(logo) &
        globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(barra).queryByRole('heading')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'screens.devices' }),
    ).toHaveAttribute('data-testid', 'titulo-de-pantalla');
  });

  it('L2: en una raíz de la navegación, el logo sin flecha', () => {
    renderHeader('/competitions');

    const barra = screen.getByTestId('cabecera-movil');
    expect(within(barra).queryByRole('link', { name: 'back' })).toBeNull();
    expect(within(barra).queryByRole('button', { name: 'back' })).toBeNull();
    const logo = within(barra).getAllByAltText('brandMarkAlt')[0];
    // El logo lleva a Inicio desde cualquier pantalla
    expect(logo.closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByTestId('titulo-de-pantalla')).toBeInTheDocument();
  });

  it('L3: con `marca`, ni flecha ni título: la pantalla pone el suyo', () => {
    renderHeader('/profile/devices', { marca: true });

    const barra = screen.getByTestId('cabecera-movil');
    expect(within(barra).queryByRole('link', { name: 'back' })).toBeNull();
    expect(
      within(barra).getAllByAltText('brandMarkAlt').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByTestId('titulo-de-pantalla')).toBeNull();
  });

  it('L3b: en una pantalla fuera del mapa, como la anotación, solo el logo', () => {
    renderHeader('/player/matches/m-1/scoring');

    const barra = screen.getByTestId('cabecera-movil');
    expect(within(barra).queryByRole('link', { name: 'back' })).toBeNull();
    expect(within(barra).queryByRole('button', { name: 'back' })).toBeNull();
    expect(
      within(barra).getAllByAltText('brandMarkAlt').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByTestId('titulo-de-pantalla')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  /**
   * `tituloEnLaPagina`: la pantalla pinta su propio `<h1>` (la ficha de un
   * torneo, sobre su portada), pero sigue teniendo de dónde volver.
   *
   *   T1  con pantalla padre        | flecha a la padre, sin título ni h1
   *   T2  con `alVolver`            | la flecha es un botón que lo llama
   *   T3  con título propio (ficha) | tampoco lo pinta
   *   T4  vuelta por el historial   | conserva el botón de volver
   */
  it('T1: con `tituloEnLaPagina` conserva la flecha y no pinta título', () => {
    renderHeader('/profile/devices', { tituloEnLaPagina: true });

    const barra = screen.getByTestId('cabecera-movil');
    expect(within(barra).getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.queryByTestId('titulo-de-pantalla')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('T2: con `alVolver`, la flecha es un botón que lo llama', () => {
    const alVolver = vi.fn();
    renderHeader('/competitions/c-1', {
      title: 'Copa de Otoño',
      tituloEnLaPagina: true,
      alVolver,
    });

    fireEvent.click(
      within(screen.getByTestId('cabecera-movil')).getByRole('button', {
        name: 'back',
      }),
    );

    expect(alVolver).toHaveBeenCalledTimes(1);
  });

  it('T3: el título que le pasa la página tampoco se pinta', () => {
    renderHeader('/competitions/c-1', {
      title: 'Copa de Otoño',
      tituloEnLaPagina: true,
    });

    expect(screen.queryByText('Copa de Otoño')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('T4: en una pantalla que vuelve por el historial, conserva el botón', () => {
    renderHeader('/players/u-1', { tituloEnLaPagina: true });

    expect(
      within(screen.getByTestId('cabecera-movil')).getByRole('button', {
        name: 'back',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('titulo-de-pantalla')).toBeNull();
  });

  it('L4: la acción de la pantalla comparte la barra con el logo', () => {
    renderHeader('/competitions', {
      acciones: <button type="button">crear</button>,
    });

    const barra = screen.getByTestId('cabecera-movil');
    expect(
      within(barra).getByRole('button', { name: 'crear' }),
    ).toBeInTheDocument();
    expect(
      within(barra).getAllByAltText('brandMarkAlt').length,
    ).toBeGreaterThan(0);
  });

  it('L5: el título es el único <h1>, fuera de <header> y solo en móvil', () => {
    const { container } = renderHeader('/profile/devices');

    const titulos = screen.getAllByRole('heading', { level: 1 });
    expect(titulos).toHaveLength(1);
    expect(titulos[0].closest('header')).toBeNull();
    expect(titulos[0].parentElement.className.split(' ')).toContain(
      'md:hidden',
    );
    expect(container.querySelectorAll('header')).toHaveLength(1);
  });

  /**
   * El título, en línea con lo que tiene debajo. Las páginas del contenedor
   * ancho empiezan su contenido a 32 px del borde; las demás, a 16.
   *
   *   #   pantalla                         | sangría del título
   *   ----|----------------------------------|-------------------
   *   S1  Perfil, Dispositivos, Torneos,    | 32 px (px-8)
   *       crear/editar torneo, calendario,  |
   *       administración, estadísticas      |
   *   S2  la ficha, con el nombre del torneo| 32 px (px-8)
   *   S3  Amigos, Actividad, Explorar...    | 16 px (px-4)
   *   S4  Actividad tiene título            | «screens.feed»
   */
  const sangriaDelTitulo = () =>
    screen.getByTestId('titulo-de-pantalla').parentElement.className.split(' ');

  it.each([
    '/profile',
    '/profile/edit',
    '/profile/devices',
    '/competitions',
    '/competitions/create',
    '/competitions/c-1/edit',
    '/competitions/c-1/schedule',
    '/creator/competitions/c-1/schedule',
    '/admin',
    '/admin/usuarios',
    '/stats',
  ])('S1: en %s el título va a 32 px, como su contenido', (ruta) => {
    renderHeader(ruta);

    expect(sangriaDelTitulo()).toContain('px-8');
    expect(sangriaDelTitulo()).not.toContain('px-4');
  });

  it('S2: la ficha de un torneo, con su nombre por título, también a 32 px', () => {
    renderHeader('/competitions/c-1', { title: 'Copa de Otoño' });

    expect(sangriaDelTitulo()).toContain('px-8');
  });

  it.each([
    '/friends',
    '/feed',
    '/browse-competitions',
    '/player/invitations',
    '/player/matches',
    '/quick-matches',
    '/players/u-1',
    '/creator/competitions/c-1/invitations',
  ])('S3: en %s el título va a 16 px', (ruta) => {
    renderHeader(ruta);

    expect(sangriaDelTitulo()).toContain('px-4');
    expect(sangriaDelTitulo()).not.toContain('px-8');
  });

  it('S4: Actividad tiene título, como las demás pestañas', () => {
    renderHeader('/feed');

    expect(
      screen.getByRole('heading', { level: 1, name: 'screens.feed' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('cabecera-movil')).queryByRole('link', {
        name: 'back',
      }),
    ).toBeNull();
  });

  it('L6: un título de una sola palabra larga se parte, no ensancha la página', () => {
    // El nombre de un torneo lo escribe el usuario, hasta 100 caracteres
    renderHeader('/competitions', { title: 'X'.repeat(100) });

    const clases = screen
      .getByTestId('titulo-de-pantalla')
      .className.split(' ');
    expect(clases).toContain('wrap-anywhere');
    // Y como mucho tres líneas, igual que el saludo de Inicio: un nombre de
    // 100 caracteres no empuja toda la ficha
    expect(clases).toContain('line-clamp-3');
  });

  it('offers a back arrow to the parent screen', () => {
    renderHeader('/profile/devices');

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/profile',
    );
  });

  it('omits the back arrow on a bottom-navigation root', () => {
    renderHeader('/dashboard');

    expect(
      screen.queryByRole('link', { name: 'back' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'screens.dashboard' }),
    ).toBeInTheDocument();
  });

  it('lets a page override the title with a runtime name', () => {
    // El nombre de un torneo no cabe en un mapa estatico
    renderHeader('/competitions/abc-123', { title: 'Copa de Otoño' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Copa de Otoño' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/competitions',
    );
  });

  it('lets a page drop the back arrow explicitly', () => {
    renderHeader('/profile/devices', { backTo: null });

    expect(
      screen.queryByRole('link', { name: 'back' }),
    ).not.toBeInTheDocument();
  });

  it('lets a page decide how the arrow goes back (FE #647, fase 3)', () => {
    // El detalle de un torneo al que se llegó desde Torneos: vuelve atrás de
    // verdad, para que Torneos quede donde estaba
    const alVolver = vi.fn();
    renderHeader('/competitions/abc', {
      title: 'Summer Cup',
      backTo: '/competitions',
      alVolver,
    });

    fireEvent.click(screen.getByRole('button', { name: 'back' }));

    expect(alVolver).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('link', { name: 'back' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the brand on a route outside the map', () => {
    // Alta de perfil: no es una pantalla de la aplicacion todavia
    renderHeader('/auth/complete-profile');

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    // El mock de i18n devuelve la clave: el alt de la marca ya no es un literal
    expect(screen.getAllByAltText('brandMarkAlt').length).toBeGreaterThan(0);
  });

  /**
   * El nombre en una línea (25 nov 2026). En el móvil, la cabecera de la app
   * solo comparte fila con sus acciones, así que cabe:
   *
   *   #   cabecera                     | nombre en el móvil
   *   ----|------------------------------|------------------------------
   *   N1  con `marca` (la de Inicio)   | una línea, a 50 px (42 bajo 360)
   *   N2  sin `marca`, fuera del mapa  | igual: el mismo logo en todas
   *   N3  en ancho                     | una línea a 36 px, sin monograma
   *   N4  ninguna imagen de la cabecera queda escondida a todos los anchos
   *   N5  el logo de ancho cede antes de desbordar
   */
  const delMovil = () =>
    screen
      .getAllByAltText('brandMarkAlt')
      .filter((img) => !img.closest('[data-testid="marca-en-ancho"]'));
  const enAncho = () => [
    ...screen.getByTestId('marca-en-ancho').querySelectorAll('img'),
  ];

  it('N1: en Inicio, el nombre en una línea a 50 px', () => {
    renderHeader('/dashboard', { marca: true });

    const [clara, oscura] = delMovil();
    expect(clara).toHaveAttribute('src', '/brand/wordmark-linea-deep.svg');
    expect(oscura).toHaveAttribute('src', '/brand/wordmark-linea-acid.svg');
    // 50 px, y 42 en pantallas de menos de 360: con la flecha y la acción cabe
    expect(clara.className.split(' ')).toEqual(
      expect.arrayContaining(['h-[42px]', 'min-[360px]:h-[50px]']),
    );
  });

  it('N2: sin `marca`, fuera del mapa, el mismo logo', () => {
    renderHeader('/auth/complete-profile');

    const [clara] = delMovil();
    expect(clara).toHaveAttribute('src', '/brand/wordmark-linea-deep.svg');
    expect(clara.className.split(' ')).toContain('min-[360px]:h-[50px]');
  });

  it('N3: en ancho, el nombre en una línea a 36 px y sin el monograma', () => {
    renderHeader('/dashboard', { marca: true });

    // Con el monograma, la fila con el menú en línea no cabía a 1280 px
    expect(
      screen.queryByTestId('monograma-de-cabecera'),
    ).not.toBeInTheDocument();
    expect(enAncho().map((i) => i.getAttribute('src'))).toEqual([
      '/brand/wordmark-linea-deep.svg',
      '/brand/wordmark-linea-acid.svg',
    ]);
    for (const img of enAncho())
      expect(img.className.split(' ')).toContain('h-9');
  });

  it('N4: en la cabecera no hay ninguna imagen que no se vea nunca', () => {
    // El nombre de dos líneas se pintaba dentro del enlace de escritorio,
    // escondido a cualquier ancho: dos descargas de más por pantalla
    renderHeader('/dashboard', { marca: true });

    const todas = screen.getAllByAltText('brandMarkAlt');
    expect(todas.map((i) => i.getAttribute('src')).sort()).toEqual(
      [
        '/brand/wordmark-linea-acid.svg',
        '/brand/wordmark-linea-acid.svg',
        '/brand/wordmark-linea-deep.svg',
        '/brand/wordmark-linea-deep.svg',
      ].sort(),
    );
  });

  it('N5: el logo de ancho puede ceder: ni él ni su enlace llevan `shrink-0`', () => {
    // En el caso más cargado (administrador, con avisos y una acción) la fila
    // no cabe a 1280 px: cede el logo, no se desplaza la página (FE #680)
    renderHeader('/dashboard', { marca: true });

    const enlace = screen.getByTestId('marca-en-ancho');
    expect(enlace.className).not.toMatch(/shrink-0/);
    expect(enlace.className.split(' ')).toContain('min-w-0');
  });

  it('keeps the desktop navigation untouched', () => {
    renderHeader('/profile/devices');

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/dashboard',
        '/browse-competitions',
        '/competitions',
      ]),
    );
  });

  it('reaches the feed from the desktop navigation', () => {
    /**
     * La navegacion inferior es md:hidden, asi que en escritorio esta cabecera
     * es el unico camino al feed. Sin este enlace la seccion solo se alcanza
     * tecleando la URL.
     *
     * Amigos ya no cuelga de la cabecera: se entra desde dentro del feed, igual
     * que en movil. Que ese segundo salto exista lo vigila FeedPage.test.jsx
     * ("links to the friends list"), de modo que la cadena completa hasta
     * /friends sigue cubierta.
     */
    renderHeader('/dashboard');

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/feed');
  });

  /**
   * Al perfil de un jugador se llega desde el feed, desde Amigos y desde la
   * busqueda: no hay padre unico al que volver, asi que se retrocede por el
   * historial. Esta flecha es la de movil; en escritorio la vuelta la pone la
   * propia pagina, junto al contenido.
   */
  describe('vuelta desde el perfil de un jugador', () => {
    const renderPlayerProfile = (entries, index) =>
      render(
        <MemoryRouter initialEntries={entries} initialIndex={index}>
          <Routes>
            <Route path="/friends" element={<p>lista de amigos</p>} />
            <Route path="/feed" element={<p>actividad</p>} />
            <Route
              path="/players/:userId"
              element={<HeaderAuth user={user} />}
            />
          </Routes>
        </MemoryRouter>,
      );

    it('goes back to the previous page instead of a fixed parent', () => {
      renderPlayerProfile(['/friends', '/players/abc'], 1);

      fireEvent.click(screen.getByRole('button', { name: 'back' }));

      expect(screen.getByText('lista de amigos')).toBeInTheDocument();
    });

    it('falls back to the feed when there is nowhere to go back to', () => {
      // Entrar por URL directa deja el historial vacio: retroceder sacaria de
      // la aplicacion
      renderPlayerProfile(['/players/abc'], 0);

      fireEvent.click(screen.getByRole('button', { name: 'back' }));

      expect(screen.getByText('actividad')).toBeInTheDocument();
    });

    it('falls back after a chain of replaces, which renews the location key', () => {
      /**
       * Abrir un perfil compartido sin sesion encadena dos `replace` —el
       * redirect a /login y la vuelta tras entrar—, y cada uno estrena `key`
       * sin apilar entrada. Mirando solo la `key` esto parecia historial
       * propio y la flecha sacaba de la aplicacion.
       *
       * React Router deja ese recorrido en `window.history.state.idx`, que
       * los `replace` no incrementan.
       */
      const previous = window.history.state;
      window.history.replaceState({ idx: 0 }, '');

      try {
        // Dos entradas y una `key` real, justo lo que enmascaraba el fallo
        renderPlayerProfile(['/friends', '/players/abc'], 1);

        fireEvent.click(screen.getByRole('button', { name: 'back' }));

        expect(screen.getByText('actividad')).toBeInTheDocument();
        expect(screen.queryByText('lista de amigos')).not.toBeInTheDocument();
      } finally {
        window.history.replaceState(previous, '');
      }
    });
  });
  describe('salir deja el dispositivo limpio (FE #531)', () => {
    /**
     * LA TABLA — pulsar «Cerrar Sesión».
     *
     *   caso                              | qué pasa
     *   ----------------------------------|--------------------------------------
     *   el backend contesta               | se limpia lo de la cuenta
     *   el backend no contesta            | se limpia igual
     */
    const abreElMenuYSale = () => {
      const botones = screen.getAllByRole('button');
      fireEvent.click(botones[botones.length - 1]);
      fireEvent.click(screen.getByText('header.logout'));
    };

    it('lo de la cuenta se va del dispositivo', async () => {
      // Salía con una redirección dura y nada más, y una redirección no vacía
      // el almacenamiento: quedaban el nombre, el correo, el hándicap y las
      // partidas guardadas, para quien entrara después en ese móvil
      clearAuth.mockClear();
      logoutUseCase.execute.mockResolvedValue(undefined);

      renderHeader('/dashboard');
      abreElMenuYSale();

      await waitFor(() => expect(clearAuth).toHaveBeenCalled());
    });

    it('y también cuando el backend no contesta', async () => {
      // Quedarse sin cobertura al salir no es motivo para dejar los datos
      // puestos: la sesión se cierra igual de este lado
      clearAuth.mockClear();
      logoutUseCase.execute.mockRejectedValue(new TypeError('Failed to fetch'));

      renderHeader('/dashboard');
      abreElMenuYSale();

      await waitFor(() => expect(clearAuth).toHaveBeenCalled());
    });
  });

  /**
   * Entre md y xl los seis enlaces no caben: la cabecera pedía 1243 px y la
   * página se desplazaba en horizontal (FE #680). Por debajo de xl se esconden y
   * pasan al desplegable del avatar, que ya existía; desde xl, en línea como
   * siempre. Nada de un botón «Menú» aparte.
   */
  describe('los enlaces que no caben van al desplegable del avatar (FE #680)', () => {
    const ENLACES = [
      '/dashboard',
      '/browse-competitions',
      '/competitions',
      '/competitions/create',
      '/player/invitations',
      '/feed',
    ];
    const abrePerfil = () =>
      fireEvent.click(screen.getByText('AS').closest('button'));
    const enDesplegable = () =>
      screen.queryByTestId('navegacion-en-desplegable');

    it('M1: no hay un botón «Menú» aparte', () => {
      renderHeader('/dashboard');

      expect(
        screen.queryByRole('button', { name: /header\.menu/ }),
      ).not.toBeInTheDocument();
    });

    it('M2: el desplegable del avatar trae los seis enlaces, en el orden de siempre, antes del perfil', () => {
      renderHeader('/dashboard');

      abrePerfil();

      const hrefs = [...enDesplegable().querySelectorAll('a')].map((a) =>
        a.getAttribute('href'),
      );
      expect(hrefs).toEqual(ENLACES);
      const verPerfil = screen.getByText('header.viewProfile');
      expect(
        enDesplegable().compareDocumentPosition(verPerfil) &
          globalThis.Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('M3: elegir uno de esos enlaces cierra el desplegable', () => {
      renderHeader('/dashboard');
      abrePerfil();

      fireEvent.click(enDesplegable().querySelector('a[href="/feed"]'));

      expect(screen.queryByText('header.logout')).not.toBeInTheDocument();
    });

    it('M4: Escape cierra el desplegable', () => {
      renderHeader('/dashboard');
      abrePerfil();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByText('header.logout')).not.toBeInTheDocument();
    });

    it('M6: el avatar indica que despliega algo, y si está abierto', () => {
      // Con los enlaces dentro, el desplegable es ahora el único camino a ellos
      // por debajo de xl: tiene que notarse que el avatar se abre
      renderHeader('/dashboard');
      const botonPerfil = screen.getByText('AS').closest('button');

      expect(botonPerfil).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('indicador-desplegable')).not.toHaveClass(
        'rotate-180',
      );

      abrePerfil();

      expect(botonPerfil).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByTestId('indicador-desplegable')).toHaveClass(
        'rotate-180',
      );
    });

    // Antes (FE #680) el idioma solo vivia en el desplegable para ahorrar
    // sitio. Agustín, 20 oct: vuelve a la barra, pero como un globo de solo
    // icono, que cabe entre md y xl
    it('L1: en la barra de escritorio el idioma es un globo compacto, sin abrir nada', () => {
      renderHeader('/dashboard');

      expect(
        screen.getByTestId('language-switcher-compacto'),
      ).toBeInTheDocument();
      // El selector con texto sigue sin ocupar la barra
      expect(screen.queryByTestId('language-switcher')).not.toBeInTheDocument();
    });

    it('L1b: el globo va justo antes del avatar', () => {
      renderHeader('/dashboard');

      const botonPerfil = screen.getByText('AS').closest('button');
      // Hermano del bloque del avatar, no dentro de el: dentro, cada pulsacion
      // en el globo contaria como pulsar en el desplegable
      expect(
        screen.getByTestId('language-switcher-compacto').nextElementSibling,
      ).toBe(botonPerfil.parentElement);
    });

    it('L1c: solo en escritorio; en movil el idioma sigue en Perfil', () => {
      renderHeader('/dashboard');

      const bloque = screen
        .getByTestId('language-switcher-compacto')
        .closest('.md\\:flex');
      expect(bloque).toHaveClass('hidden');
    });

    it('L2: se cambia desde el desplegable del avatar, en su propia fila', () => {
      renderHeader('/dashboard');

      abrePerfil();

      const fila = screen.getByTestId('idioma-en-desplegable');
      expect(fila).toHaveTextContent('header.language');
      expect(fila).toContainElement(screen.getByTestId('language-switcher'));
    });

    it('M4b: tras cerrarlo con Escape, el foco vuelve al avatar', () => {
      // Si el foco estaba dentro del desplegable, al desaparecer caería al
      // body y quien va con teclado perdería el sitio
      renderHeader('/dashboard');
      const botonPerfil = screen.getByText('AS').closest('button');
      abrePerfil();
      enDesplegable().querySelector('a[href="/feed"]').focus();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(document.activeElement).toBe(botonPerfil);
    });

    it('M5: los enlaces en línea solo desde xl, y en el desplegable solo por debajo', () => {
      // jsdom no mide anchos: lo que se puede vigilar aquí es el contrato de
      // clases. Que de verdad quepa se mide en el navegador (FE #680).
      renderHeader('/dashboard');
      abrePerfil();

      expect(screen.getByTestId('navegacion-en-linea')).toHaveClass(
        'hidden',
        'xl:flex',
      );
      expect(enDesplegable()).toHaveClass('xl:hidden');
    });
  });

  describe('the unseen number on the desktop Actividad link (FE-1, case 1)', () => {
    afterEach(() => {
      novedades = 0;
    });

    const enLinea = () =>
      screen
        .getByTestId('navegacion-en-linea')
        .querySelector('a[href="/feed"]');

    it('shows nothing at zero', () => {
      renderHeader('/dashboard');

      expect(
        enLinea().querySelector('[data-testid="insignia-novedades"]'),
      ).toBeNull();
    });

    it('shows 9+ from ten, inline and in the avatar menu', () => {
      novedades = 12;
      renderHeader('/dashboard');

      expect(
        enLinea().querySelector('[data-testid="insignia-novedades"]'),
      ).toHaveTextContent('9+');
      fireEvent.click(screen.getByText('AS').closest('button'));
      const enMenu = screen
        .getByTestId('navegacion-en-desplegable')
        .querySelector('a[href="/feed"]');
      expect(
        enMenu.querySelector('[data-testid="insignia-novedades"]'),
      ).toHaveTextContent('9+');
    });

    it('tells screen readers the number, inline and in the menu (review FE-1)', () => {
      novedades = 4;
      renderHeader('/dashboard');

      expect(enLinea()).toHaveAccessibleDescription('bottomNav.unseen');
      expect(enLinea()).toHaveAccessibleName('header.feed');
      fireEvent.click(screen.getByText('AS').closest('button'));
      const enMenu = screen
        .getByTestId('navegacion-en-desplegable')
        .querySelector('a[href="/feed"]');
      expect(enMenu).toHaveAccessibleDescription('bottomNav.unseen');
    });

    it('no description at zero', () => {
      renderHeader('/dashboard');

      expect(enLinea()).not.toHaveAttribute('aria-describedby');
    });

    it('only the Actividad link carries it', () => {
      novedades = 2;
      renderHeader('/dashboard');

      expect(screen.getAllByTestId('insignia-novedades')).toHaveLength(1);
    });
  });
});
