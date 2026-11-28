# End-to-end and integration tests

The Playwright tests live in [`tests/`](../tests/) and run in Chromium against the Vite dev server, which
Playwright starts by itself (or reuses if one is already running on port 5173).

| File | What it covers | Needs the backend |
|---|---|---|
| `auth.spec.js` | The landing page loads with the right title | No |
| `password-reset.spec.js` | Forgot password and reset password pages: validation, anti-enumeration message, invalid token, navigation, mobile layout, accessibility | Partly |
| `security.spec.js` | HTML escaping, input length limit, cookies, CSP, error messages, input validation | Partly |
| `login.spec.js` | Logging in with a test user, and the error for wrong credentials | Yes, and a test user |
| `integration.spec.js` | Session in httpOnly cookies, backend validation of login and registration, login → dashboard → profile, session after a reload | Yes, and a test user |

## What runs in CI

Only the tests tagged **`@smoke`**: they need no backend (landing page, forgot password page and its
validation, reset password link without a token, navigation between the password pages, mobile layout and
form labels of the forgot password page, HTML escaping and input length limit). They run in the
`🎭 E2E smoke` job of [`ci-cd.yml`](../.github/workflows/ci-cd.yml). The rest need a real backend and a
session, and are run by hand.

## Running them

```bash
npx playwright install chromium   # first time only

npm run test:e2e:smoke            # the @smoke tests, as in CI
npm run test:e2e                  # every test
npm run test:integration          # only integration.spec.js
npm run test:security             # only security.spec.js
npm run test:e2e:ui               # interactive mode
npm run test:e2e:headed           # with the browser visible
npx playwright test -g "Session Persistence"   # one describe block
```

The tests that log in need:

1. The [backend](https://github.com/agustinEDev/ComebackGolfApi) running at `http://localhost:8000`.
2. A **dedicated test user** in that local backend, with its email confirmed. Never a personal or production
   account.
3. Its credentials in `TEST_EMAIL` and `TEST_PASSWORD`, in `.env` (git-ignored, loaded by
   `playwright.config.js`) or inline:

```bash
TEST_EMAIL=test-user@example.com TEST_PASSWORD='...' npm run test:integration
```

Without those variables, `integration.spec.js` skips its tests, but `login.spec.js` fails with `Missing test credentials`. Note that `.env.example` ships placeholder `TEST_EMAIL`/`TEST_PASSWORD` values: after `cp .env.example .env`, replace them with a real test user or remove them.

## Configuration

From [`playwright.config.js`](../playwright.config.js):

| Setting | Value | Why |
|---|---|---|
| `workers` | 1, `fullyParallel: false` | One test at a time, so the backend rate limit is not hit |
| `retries` | 2 in CI, 0 locally | |
| `baseURL` | `http://localhost:5173` | The Vite dev server |
| `trace` | `on` | A trace for every test, to open with `npx playwright show-trace` |
| `reporter` | `html` | The report lands in `playwright-report/` |

`integration.spec.js` also waits 500 ms after each test, for the same rate limit.

## Troubleshooting

**Stays on `/login` instead of reaching `/dashboard`.** The backend is not running, the test user does not
exist or has not confirmed its email, or the credentials are wrong. Check `curl http://localhost:8000/health`
and log in by hand with the same user.

**`Missing test credentials`.** `TEST_EMAIL` or `TEST_PASSWORD` is not set: `login.spec.js` needs them and fails without them (see above).

**Timeout waiting for the web server.** Start `npm run dev` in another terminal and run the tests again:
Playwright reuses it outside CI.

**HTTP 429.** The backend rate limit kicked in: wait a minute, or run fewer tests at a time.
