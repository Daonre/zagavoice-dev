# ZagaVoice — AI Receptionist Platform (v1, Inbound MVP)

A white-label AI phone receptionist you can resell to clients. Built on:

- **Vapi** — answers the actual phone calls (speech → AI → speech)
- **Next.js** — the dashboard UI (deployed on Vercel)
- **Supabase** — database, login, and multi-tenant security (each client only sees their own data)

How it works, in one sentence: a client's phone number rings → Vapi's AI answers using the agent you configured → when the call ends, Vapi sends the transcript + summary + lead details to this app's webhook → it appears instantly in the client's dashboard.

---

## Setup (about 30 minutes)

### 1. Supabase
1. Go to supabase.com → New project (use your existing org).
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → Run.
3. Go to **Project Settings → API** and copy: Project URL, `anon` key, `service_role` key.
4. Go to **Authentication → Providers → Email** and turn OFF "Confirm email" (so signups work instantly while testing).

### 2. Vapi
1. Sign up at dashboard.vapi.ai.
2. Go to **API Keys** → copy your **Private key**.
3. Go to **Phone Numbers** → Buy a number (~$2/mo, this is the number clients' customers will call). You'll attach it to an assistant in step 5.

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill in every value. For `VAPI_WEBHOOK_SECRET`, make up any long random string — it's a password the webhook uses to confirm requests really come from Vapi.

### 4. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel → New Project → import the repo → add all the env vars from `.env.local` → Deploy.
3. Note your live URL, e.g. `https://zagavoice.vercel.app`.

### 5. Go live
1. Open your deployed app → **Create an account** (this becomes your first org).
2. Go to **Agent setup** → fill in business name, greeting, voice, and business knowledge → **Create receptionist**. This creates the assistant in Vapi automatically, with the webhook already pointed at your app.
3. In the Vapi dashboard → **Phone Numbers** → select your number → set **Assistant** to the one just created (the ID is shown on the Agent setup page).
4. **Also set the Server URL Secret** on the assistant in Vapi to the same value as `VAPI_WEBHOOK_SECRET`.
5. Call the number. Talk to your receptionist. Hang up — within ~30 seconds the call, transcript, summary, and lead appear in the dashboard.

---

## Running locally (optional)

```bash
npm install
npm run dev
```

Note: the webhook won't receive Vapi events locally unless you tunnel (e.g. `ngrok`). Easiest path: deploy to Vercel and test there.

## The reseller model

Each signup creates a new **org** — a separate client with their own agent, calls, and leads, walled off by Row Level Security. Your unit economics:

- Vapi all-in cost: roughly $0.10–0.15 per minute of calls + ~$2/mo per number
- Typical resale price: $200–500/mo flat per client business
- At ~300 call-minutes/mo per client, your cost is ~$35–50 → 80%+ margin

## What v2 adds (already planned)

1. Stripe subscription billing per org (you've done this stack before)
2. Outbound campaigns (lead list upload → scheduled call batches)
3. Calendar booking (Vapi tool calling → Google Calendar)
4. White-label theming per org (logo + brand color columns already exist in the `orgs` table)
