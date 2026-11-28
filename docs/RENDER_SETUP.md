# Sentry on Render

Production is a **Render Static Site**. Vite reads the `VITE_*` variables **when it builds**, so they live in
the Static Site's **Environment** tab and a change only takes effect after a new deploy. The production
domains are served by two Static Sites (one per domain), and both need the same Sentry variables.

## Variables the code reads

| Variable | Production value | If not set |
|---|---|---|
| `VITE_SENTRY_DSN` | The DSN of the frontend project (Sentry → Settings → Projects → Client Keys) | Sentry is not started |
| `VITE_SENTRY_ENVIRONMENT` | `production` | `development` |
| `VITE_SENTRY_DEBUG` | `false` | `false` (only the exact string `true` turns it on) |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.1` | `1.0` |
| `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Leave it unset | `0`: no random sessions are recorded |
| `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | `1.0` | `1.0`: every session with an error is recorded |

The defaults live in [`src/utils/sentrySampleRates.js`](../src/utils/sentrySampleRates.js); the rest of the
configuration in [`src/sentry.ts`](../src/sentry.ts) and the minimal start-up in `src/main.jsx`. The release
name comes from the version in `package.json`.

`.env.example` also lists `VITE_SENTRY_PROFILES_SAMPLE_RATE`, `VITE_SENTRY_AUTO_SESSION_TRACKING` and
`VITE_SENTRY_ATTACH_STACKTRACE`, but no code reads them today.

## Privacy

Replays mask **all text** and block **all media** in every environment, request and response bodies and
headers are never recorded (`networkDetailAllowUrls` is empty), and tokens are scrubbed from URLs, events and
recordings ([`src/utils/sentryScrubbing.js`](../src/utils/sentryScrubbing.js)). Raising the replay rates
records more sessions, not more content.

## Changing a value

1. [Render Dashboard](https://dashboard.render.com/) → the Static Site → **Environment**.
2. Change the variable (in both Static Sites).
3. **Manual Deploy** → **Deploy latest commit**: without a new build, nothing changes.

If a temporary debugging session needs more traces or recorded sessions, put the value back afterwards: the
Sentry quota is shared by all events.

## Checking that it works

- Sentry → the frontend project → **Releases**: the new version shows up once users load it.
- Sentry → **Issues**: new errors arrive tagged with `environment:production` and the release.
- The production build strips `console.*` calls, so the browser console says nothing about Sentry.

## Troubleshooting

**No events at all.** Check that `VITE_SENTRY_DSN` is set in that Static Site and that a deploy ran after
setting it. The CSP must allow the Sentry ingest host in `connect-src` (see
[SECURITY_HEADERS.md](SECURITY_HEADERS.md)).

**The variable changed but the behaviour did not.** It is read at build time: deploy again. Returning users
may keep the previous version until the service worker updates.

## References

- [Render: environment variables](https://render.com/docs/environment-variables)
- [Sentry for React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry sampling](https://docs.sentry.io/platforms/javascript/configuration/sampling/)
