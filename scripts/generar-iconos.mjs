// Genera los iconos de la PWA y el favicon (public/icons): el monograma (stamp)
// en Deep Forest sobre Acid Lime.
//
// Era lima sobre Deep Forest y más pequeño, y en la pantalla del iPhone quedaba
// perdido: «se ve pequeño y parece un garabato» (Agustín, 25 nov 2026). Un trazo
// fino claro sobre oscuro se lee peor que uno oscuro sobre claro, y el
// monograma ocupaba el 62 % del alto; ahora, el 80 %.
//
// El SVG no se toca: es el que sirve la web (`public/brand/stamp-deep.svg`),
// pintado tal cual y centrado. Solo se elige cuánto ocupa. El trazo no se puede
// engrosar sin redibujar el logo. Uso: node scripts/generar-iconos.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new globalThis.URL('..', import.meta.url));
const svg = readFileSync(`${raiz}public/brand/stamp-deep.svg`);
const logo = `data:image/svg+xml;base64,${svg.toString('base64')}`;

const ACID_LIME = '#DDF478';

// `stamp`: la parte del alto del icono que ocupa el monograma. El maskable deja
// más aire: Android recorta hasta un círculo del 80 %, y el monograma tiene que
// caber entero dentro
const ICONOS = [
  ['pwa-192x192.png', 192, 0.8],
  ['pwa-512x512.png', 512, 0.8],
  ['pwa-maskable-512x512.png', 512, 0.58],
  ['apple-touch-icon-180x180.png', 180, 0.8],
  ['favicon-32x32.png', 32, 0.88],
];

const navegador = await chromium.launch();
for (const [fichero, lado, stamp] of ICONOS) {
  const pagina = await navegador.newPage({
    viewport: { width: lado, height: lado },
    deviceScaleFactor: 1,
  });
  await pagina.setContent(`<!doctype html>
    <body style="margin:0;width:${lado}px;height:${lado}px;overflow:hidden;background:${ACID_LIME};position:relative">
      <img src="${logo}" style="position:absolute;left:50%;top:50%;height:${lado * stamp}px;width:auto;transform:translate(-50%,-50%)">
    </body>`);
  await pagina.locator('img').evaluate((img) => img.decode());
  await pagina.screenshot({ path: `${raiz}public/icons/${fichero}` });
  await pagina.close();
  globalThis.console.log(fichero);
}
await navegador.close();
