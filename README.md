# AbuzarStore

Custom e-commerce storefront for AbuzarStore, built with Next.js 16, React 19, Tailwind CSS 4 and Supabase.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for orders, receipts and admin APIs |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP server details |
| `SMTP_USER` / `SMTP_PASS` | SMTP login (for Gmail use an App Password) |
| `SMTP_FROM` | From header, e.g. `AbuzarStore <you@gmail.com>` |
| `STORE_NAME` | Store name used in emails and receipts |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN; leave blank to disable error monitoring |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional, only needed to upload source maps from CI/Vercel |

Never expose `SUPABASE_SERVICE_ROLE_KEY` or SMTP credentials to the browser.

## Admin access

1. Create the user in Supabase → Authentication → Users → Add user.
2. Grant the admin role:

```bash
node scripts/make-admin.mjs admin@example.com
```

3. Reset an admin password without putting it in shell history:

```bash
ADMIN_NEW_PASSWORD="use-a-password-manager" npm run admin:reset -- admin@example.com
```

4. Sign in at `/admin/login`. On the first sign-in, scan the TOTP QR code with an authenticator app and enter the 6-digit code. Later sign-ins ask for the code.
5. Admin APIs require an AAL2 session, so a password alone cannot access the dashboard. Make sure TOTP is enabled in Supabase → Authentication → Providers → Multi-Factor Authentication.

## Email / SMTP

Order confirmation emails include the PDF receipt. Test SMTP and PDF attachment delivery with:

```bash
npm run test:smtp -- you@example.com
```

The store skips email safely when SMTP is not configured. Add the same variables to Vercel → Project Settings → Environment Variables for production.

## Error monitoring

Sentry is wired through `instrumentation.js`, `instrumentation-client.js`, `sentry.server.config.js` and `sentry.edge.config.js`. Set `NEXT_PUBLIC_SENTRY_DSN` to start reporting; without it the SDK stays disabled. Source-map upload is optional and only runs when `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` are set.

## Tests

Start the app, then run the hermetic Playwright regressions:

```bash
npm run test:e2e
```

Run the live receipt test against the latest order in Supabase:

```bash
npm run test:e2e:live
```

CI runs lint, build and the regression suite on every push/PR. Add these repository secrets for the E2E step: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Payment methods

Admins can enable or disable Cash on Delivery, JazzCash, Easypaisa and Bank Transfer from Admin → Site Info → Payment methods. Disabled methods are hidden at checkout and rejected by `POST /api/orders`.
