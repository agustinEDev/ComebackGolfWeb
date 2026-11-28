# GitHub Actions workflows

CI/CD and security pipelines of the Comeback Golf frontend. Every job ends with a **summary card** in the
run summary: what it checks, what came out and what to do if it fails (`.github/scripts/summary_card.py`).

| Workflow | When | What |
|---|---|---|
| [`ci-cd.yml`](ci-cd.yml) | Push to `main`, `develop`, `feature/**`, `release/**`, `hotfix/**`; PRs to `develop` and `main`; Mondays 09:00 UTC | The main pipeline: security, quality, tests and builds |
| [`pr-checks.yml`](pr-checks.yml) | PRs to `develop` and `main` | Conventional Commits PR title |
| [`auto-fix-pr-title.yml`](auto-fix-pr-title.yml) | Dependabot PRs | Capitalises the subject of the title so it passes `pr-checks.yml` |
| [`snyk-review.yml`](snyk-review.yml) | Mondays 06:00 UTC, PRs to `main`, manual | Snyk review of dependencies and code |
| [`cabeceras-de-produccion.yml`](cabeceras-de-produccion.yml) | Every day 07:00 UTC, manual | Compares the production security headers with the expected set |

All third-party actions are pinned by commit SHA; `src/accionesFijadasPorHuella.test.js` fails if one is
not.

## `ci-cd.yml`: CI/CD & Security Pipeline

Two columns. Everything in the first one is a required check; the second one runs only if nothing in the
first one **failed** (a skipped job, such as Dependency Review on a push, does not count as a failure), so no
test minutes are spent on a PR that cannot be merged.

```
 Column 1: static analysis and security            Column 2: tests and builds
 ──────────────────────────────────────            ──────────────────────────
 🔏 Signed commits                                  🧪 Tests + coverage
 🔒 npm audit                                       🎭 E2E smoke
 🔐 Secret Scanning                                 🏗️ Build
 📜 License Compliance                              🚀 Deploy like Render
 🔎 Dependency Review (PRs only)
 📦 Outdated deps (informational)                   📊 Pipeline Summary (always, at the end)
 🛡️ OWASP (Semgrep)
 🔍 Lint
 📝 Type Check
 🏛️ Architecture
```

| Job | What it checks | Fails when |
|---|---|---|
| 🔏 **Signed commits** | Every commit of the PR (or of the push) carries a signature verified by GitHub (`verify-signed-commits.sh`) | Any commit is unsigned or unverified |
| 🔒 **npm audit** | Installed packages against known vulnerabilities, after checking that `npm ci` left the lockfile untouched (`npm-audit-gate.sh`, exceptions in `.github/npm-audit-excepciones.json`) | Critical or high; moderate only warns |
| 🔐 **Secret Scanning** | TruffleHog (verified secrets) and gitleaks (generic secrets, after a self-test of its config) over the whole history | A secret is found |
| 📜 **License Compliance** | The licence of every installed package against the allow-list in `.github/dependency-review-config.yml` (`license_gate.py`); also runs the unit tests of `.github/scripts` | A licence is outside the list (no GPL, AGPL or LGPL-3.0) |
| 🔎 **Dependency Review** | Pull requests only: dependencies added or upgraded by the PR | Known vulnerability of moderate severity or worse, or a licence outside the list |
| 📦 **Outdated deps** | Packages with a newer release | Never: informational |
| 🛡️ **OWASP (Semgrep)** | `src/` with the `p/owasp-top-ten`, `p/react` and `p/javascript` rule sets; results uploaded to the Security tab | Any finding |
| 🔍 **Lint** | `npm run format:check` (Prettier) and `npm run lint` (ESLint, `--max-warnings 0`) | Any formatting difference or ESLint warning |
| 📝 **Type Check** | `npx tsc --noEmit` on the `.ts` files and `npm run typecheck:nucleo` (`checkJs` on domain, application and infrastructure) | Any type error |
| 🏛️ **Architecture** | `npm run lint:architecture`: the Clean Architecture contracts in `.dependency-cruiser.cjs` | A forbidden import or a circular dependency |
| 🧪 **Tests + coverage** | `npm test -- --run --coverage` over all of `src/` | A failing test, an unhandled error, or coverage below the thresholds in `vite.config.js` (90% lines, 89.5% statements, 86.5% functions, 86.5% branches) |
| 🎭 **E2E smoke** | Playwright tests tagged `@smoke` in Chromium against the dev server (no backend needed) | A failing test |
| 🏗️ **Build** | `npm run build`, and that the service worker precaches every JS/CSS file and both pages (`sw_precache_check.py`) | Build error or short precache |
| 🚀 **Deploy like Render** | Repeats Render's build on a clean machine (Node from `.nvmrc` with its own npm, `npm install`, `npm run build`), checks that npm installed the lockfile's exact versions (`lock_versions_match.py`), the startup JS budget (`bundle_budget.py`) and serves `dist/` as a static site (`smoke_static_site.py`) | Different versions, startup JS over **280 KB gzip** or a chunk over **320 KB**, or the site does not load |
| 📊 **Pipeline Summary** | One row per job and the overall verdict | Never on its own |

Artifacts kept by the pipeline:

| Artifact | Kept for |
|---|---|
| `npm-audit-report`, `license-report`, `outdated-dependencies`, `coverage-report` | 30 days |
| `playwright-report` (only when the smoke tests fail) | 14 days |
| `build-output` | 7 days |

No secrets beyond the default `GITHUB_TOKEN`.

## `pr-checks.yml`: PR title

`amannn/action-semantic-pull-request` checks the title as `type(scope): Subject`: lowercase type among
`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`; optional
scope; subject starting with a capital letter. The check does not re-run when the title is edited: push a
commit or re-run the job.

## `snyk-review.yml`: Snyk

A second opinion outside the main pipeline. It runs the Snyk CLI on the npm dependencies and on the code,
leaves a summary, and on a PR to `main` (release or hotfix) fails if something needs action (it is not a
required check). If there are high findings that need action, it opens or updates the issue
"Snyk: revisión periódica", and closes it when there are none. Known false positives live in
`.github/snyk-known-false-positives.json`. Needs the `SNYK_TOKEN` secret.

## `cabeceras-de-produccion.yml`: production security headers

Production headers are set in the Render dashboard and in Cloudflare, outside the repository. Every day this
workflow compares what both production domains serve with `.github/scripts/cabeceras_de_produccion.json`
and opens an issue (or comments on the open one) listing what is missing or extra. Background in
[docs/SECURITY_HEADERS.md](../../docs/SECURITY_HEADERS.md).

## Outside these workflows

- **CodeQL** runs with GitHub's default setup and is a required check on `main` and `develop`.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs against `develop`, grouped, and waits 5 days
  (3 for Docker images) before proposing a freshly published version; security updates do not wait.
- The required checks of each branch are listed in [docs/BRANCH_PROTECTION.md](../../docs/BRANCH_PROTECTION.md).
