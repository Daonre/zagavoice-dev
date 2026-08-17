# ZagaVoice

AI phone receptionist SaaS — multi-tenant, built on Next.js 14, Supabase, and Vapi.

## What this is

ZagaVoice answers business phone calls with an AI voice agent, captures leads,
and logs call data per business (tenant), with real-time per-call budget
enforcement to prevent runaway OpenAI spend.

## Architecture

Vapi doesn't call OpenAI directly. Instead, it's configured to send LLM
requests to a custom endpoint in this app, which sits between Vapi and
OpenAI so we can enforce budgets and log usage per call before any
response is generated.

```
Caller → Vapi (speech-to-text/text-to-speech)
       → POST /api/vapi/llm
           → floe-guard budget check (per Vapi call ID)
           → OpenAI (streamed via SSE)
       → back to Vapi → spoken to caller

POST /api/vapi/webhook  (call events, metadata)
```

## Stack

- **Next.js 14** (App Router) — dashboard + API routes, deployed on Vercel
- **Supabase** — Postgres + Auth + RLS for multi-tenancy
- **Vapi** — voice/telephony layer, speech-to-text and text-to-speech
- **OpenAI (GPT-4o-mini)** — LLM completions, called from our own endpoint
- **floe-guard** — custom per-call budget enforcement library

## Database schema (`schema.sql`)

Four tables, RLS-scoped per business:
- `profiles` — business/tenant accounts
- `agents` — per-business AI agent configuration
- `calls` — call logs and transcripts
- `leads` — captured leads from calls

## Environment variables

Required in `.env.local` (and mirrored in Vercel → Environment Variables
for Production and Preview):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Full Supabase project URL — must include `https://` and `.supabase.co`, not just the project ref |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — bypasses RLS, never expose client-side |
| `OPENAI_API_KEY` | Used server-side only, in `/api/vapi/llm` |
| `VAPI_API_KEY` | Vapi dashboard API key |
| `VAPI_WEBHOOK_SECRET` | Shared secret — must match the "Server URL Secret" set in the Vapi assistant config, used to verify webhook calls actually came from Vapi |

⚠️ Never commit `.env.local`. If any of these are ever exposed (e.g.
pasted somewhere they shouldn't be), rotate immediately:
- Supabase: Project Settings → API → regenerate
- OpenAI: platform.openai.com → revoke + create new
- Vapi: dashboard.vapi.ai → regenerate

## Local development

```bash
npm install
npm run dev       # dev server, http://localhost:3000
npm run build     # production build — do this before deploying
npm run start     # serve the production build locally to smoke-test
```

## Known gotchas (learned the hard way)

- **Don't run `dev` and `start` on the same port in different terminals**
  — causes stale middleware/session fetch errors.
- **`/login` must stay `force-dynamic`** — it was previously statically
  prerendered, which tried to construct the Supabase client at build time
  with no env vars available, breaking the build.
- **Global `npm install -g vercel` may fail on some macOS/Node versions**
  due to an esbuild native-binary mismatch. Use `npx vercel@latest <cmd>`
  instead, or deploy via the Vercel web dashboard's GitHub import (no CLI
  needed).
- **Vercel env var values shown in the dashboard may not reflect what's
  actually saved** — after editing a value, do a hard refresh and
  reveal/re-check it before trusting it, and always redeploy after any
  env var change (they don't apply retroactively).

## Deployment

Deployed via Vercel, connected to this GitHub repo's `main` branch.
Pushing to `main` triggers a production deploy. Environment variables
are managed in Vercel → Settings → Environment Variables (must be set
for Production and Preview).

Live: `https://zagavoice-dev-djbr.vercel.app`

## Vapi assistant configuration

The Vapi assistant's custom-LLM server URL must point to:
```
https://zagavoice-dev-djbr.vercel.app/api/vapi/llm
```
and the webhook URL to `/api/vapi/webhook`, with `VAPI_WEBHOOK_SECRET`
set identically in both Vapi's dashboard and this app's env vars.
