# Local setup

How to run the Comeback Golf frontend on your machine, against a local backend.

The project lives in two repositories:

| Repository | What it is |
|---|---|
| [ComebackGolfWeb](https://github.com/agustinEDev/ComebackGolfWeb) (this one) | React + Vite frontend |
| [ComebackGolfApi](https://github.com/agustinEDev/ComebackGolfApi) | REST backend |

---

## 1. Requirements

- **Node.js 22**, the version in [`.nvmrc`](.nvmrc) (`nvm use` picks it up). It is the one CI and Render use.
- **npm** (CI pins npm 11 because npm 10 can fail `npm ci` with `ERESOLVE` on optional peer dependencies).
- **Git**, with commit signing set up if you are going to push: every commit must be signed (see
  [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md)).

## 2. Backend

Clone [ComebackGolfApi](https://github.com/agustinEDev/ComebackGolfApi) and follow its README. The frontend
expects it at `http://localhost:8000` and needs it to allow `http://localhost:5173` as an origin (CORS with
credentials, because the session travels in cookies).

Without a backend, only the public pages work (landing, pricing, legal pages, forgot password...).

## 3. Frontend

```bash
git clone https://github.com/agustinEDev/ComebackGolfWeb.git
cd ComebackGolfWeb
npm ci                    # exact versions from package-lock.json
cp .env.example .env
npm run dev               # http://localhost:5173, opens the browser
```

### Environment variables

[`.env.example`](.env.example) lists them all with comments. The ones that matter locally:

| Variable | Local value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | If left empty, the app calls `/api/...` on its own origin and the Vite dev server proxies it to `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` · `VITE_GOOGLE_REDIRECT_URI` | Your OAuth client | Only needed to try Google sign-in |
| `VITE_SENTRY_DSN` | *(empty)* | Without a DSN Sentry is not started, which is what you want locally. After `cp .env.example .env`, clear it: the placeholder value is not empty, so `src/main.jsx` would start Sentry with it |
| `TEST_EMAIL` · `TEST_PASSWORD` | A test user of **your local** backend | Only for the Playwright tests that log in. Never real credentials |

`.env` is git-ignored. The app version is not a variable: the build takes it from `package.json`.

### Check that it works

- The landing page loads at `http://localhost:5173`.
- You can register, confirm the email (your backend sends it) and log in.
- The browser console shows no CORS errors.

## 4. Everyday commands

```bash
npm run dev                  # development server (port 5173)
npm test                     # Vitest in watch mode
npm test -- --run --coverage # the whole suite once, with the CI coverage thresholds
npm run lint                 # ESLint, zero warnings allowed
npm run format               # Prettier (npm run format:check only checks)
npm run lint:architecture    # Clean Architecture contracts
npm run typecheck:nucleo     # type check of the JavaScript core
npm run build                # production build in dist/
npm run preview              # serves dist/ on port 4173
```

### End-to-end tests (Playwright)

```bash
npx playwright install chromium   # first time only
npm run test:e2e:smoke            # the @smoke tests: no backend needed, the same ones CI runs
npm run test:e2e                  # all of them; some need the backend and TEST_EMAIL/TEST_PASSWORD
npm run test:integration          # only tests/integration.spec.js, against the real backend
```

Playwright starts `npm run dev` by itself, or reuses one that is already running. More in
[docs/INTEGRATION_TESTS.md](docs/INTEGRATION_TESTS.md).

### Before pushing

CI runs, among others, the same commands as above: `npm run format:check`, `npm run lint`,
`npx tsc --noEmit`, `npm run typecheck:nucleo`, `npm run lint:architecture` and
`npm test -- --run --coverage`. Running them locally saves a round trip. The build does **not** run the type
checks, so a green `npm run build` is not enough.

## 5. Container image (optional)

The [`Dockerfile`](Dockerfile) builds the app and serves it with nginx ([`nginx.conf`](nginx.conf)), and
[`entrypoint.sh`](entrypoint.sh) writes the API URL at start-up (`VITE_API_BASE_URL`), so the same image works
against any backend. It is only used for local testing in Kubernetes: production is a Render static site.

## 6. Troubleshooting

**The frontend cannot reach the backend.** Check that `curl http://localhost:8000/health` answers, that
`.env` has the right `VITE_API_BASE_URL`, and that the backend allows the `http://localhost:5173` origin.

**Port already in use.**

```bash
lsof -ti:5173   # shows the PID using the port; stop that process
```

**`npm run preview` shows an old version.** It serves whatever is in `dist/`: run `npm run build` first.

**A change does not show after a deploy or a build.** The service worker caches the app. In DevTools →
Application, unregister the service worker and clear the site data, then reload.
