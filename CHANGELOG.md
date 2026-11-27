# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.96.0] - 2026-11-27

**Lo básico para los buscadores y el código sin la marca vieja** (#1288-#1291). Al cargar,
una pasada única pasa a las claves nuevas la cola de golpes, los golpes perdidos y el cierre
de sesión pendiente, y borra lo demás que guardaba la versión anterior: se pierden cachés
(el último panel, las últimas listas), que se rehacen con la primera conexión. Va con el
backend 2.82.0. Probada en el Kind recreado con los nombres nuevos: la pasada única, las claves
nuevas con sesión y un barrido de pantallas sin errores.

### Added

- **Lo básico para los buscadores**: `robots.txt` y `sitemap.xml` en el build, la canónica de
  cada página pública apuntando a www.comebackgolf.com (los dos dominios sirven la misma
  aplicación) y una imagen para compartir enlaces (WhatsApp, Instagram…) con el logo. El
  título y la descripción pasan al español: «Comeback Golf: torneos de golf en formato Ryder».
  El robots.txt deja entrar a buscadores y asistentes en las páginas públicas y bloquea las
  pantallas de la aplicación y los enlaces compartidos de clasificaciones y partidas; una
  pantalla nueva queda bloqueada sola. El dominio sale de una sola constante (`utils/sitio.js`).

### Changed

- **El código ya no nombra la marca vieja** (renombrado a Comeback Golf; FE #1289, #1290 y esta
  PR). Las referencias a issues pasan a «BE #N» / «FE #N» (los números anteriores a los repos
  nuevos son de los archivados). Las claves del dispositivo pasan de `rydercup-*` a
  `comebackgolf-*`: al cargar, una pasada única rescata la cola de golpes, los golpes perdidos
  y el cierre de sesión pendiente, y borra lo demás. El dominio viejo vive en una constante
  (`DOMINIO_ANTIGUO`). La release de Sentry pasa a `comebackgolf-web@<versión>`. Un test impide
  que la marca vieja vuelva; se queda el modo de juego Ryder.

## Earlier versions

The history up to this version lives in the archived repository `agustinEDev/RyderCupWeb`.
