# CitedAI — GEO (Generative Engine Optimization) Platform

SaaS for businesses to get cited by ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok & Google AI Overviews.

## Product (MVP + production)
- **Landing + Pricing** (`/`, `/pricing`) — Stripe checkout wired (live when keys set, demo otherwise)
- **Dashboard** (`/dashboard`): score, trends, engines, radar, citation feed
- **GEO Audit** (`/dashboard/audit`): live fetch → 6 pillars + per-engine likelihood + fixes. Persisted to Postgres or local `.data/`
- **Prompt Lab** (`/dashboard/prompts`): heuristic now, **live via Perplexity/Exa/OpenAI** when keys set
- **Competitors** (`/dashboard/competitors`): editable rivals, share-of-voice table
- **Prod APIs**: `POST /api/audit`, `POST /api/visibility`, `GET /api/history?url=`, `GET /api/health`, `POST /api/llms-txt`, `POST /api/schema`, `GET /api/reports?format=html`, `GET /api/cron/daily?secret=`, `POST /api/billing/checkout`, `POST /api/billing/webhook`, `GET /llms.txt`

## Run locally (demo, zero keys)
```bash
npm install
npm run dev   # http://localhost:3000
```

## Go production
1. **DB (Supabase)**: create Postgres → copy connection string → `.env`:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   ```
   then `npm run db:push && npm run db:generate`
2. **Auth** (optional): Google Cloud → OAuth client → `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET`. Optional passwordless: `EMAIL_SERVER/EMAIL_FROM`.
3. **Stripe**: create 3 Prices → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`. Webhook URL: `https://your-domain.com/api/billing/webhook`.
4. **Live citations** (pick ≥1): `PERPLEXITY_API_KEY` (Sonar online), `EXA_API_KEY` (neural search), `OPENAI_API_KEY`. Without keys the app runs on the explainable heuristic — `/api/health` shows `mode`.
   **Open-source options (no OpenAI needed):**
   - `GROQ_API_KEY` (free at console.groq.com) → hosted open-source models (`GROQ_MODEL`, default `openai/gpt-oss-120b`; also `qwen/qwen3.8-27b`). Adds a 6th open-model engine row in Prompt Lab with real generated answers.
   - **Ollama** (fully local, zero cost): install from ollama.com, `ollama pull llama3.1` (or `mistral`, `qwen2.5`), set `OLLAMA_ENABLED=1`. No key, data never leaves your machine. Best for privacy-sensitive clients.
5. **Cron**: Vercel Cron is preconfigured (`vercel.json`, daily 06:00) — set `CRON_SECRET`. Or: `CRON_SECRET=x BASE_URL=https://... npm run cron:daily` on a scheduler.
6. **Deploy**:
   - Vercel: `vercel --prod` (set all env vars, runs `prisma generate` via build)
   - Docker: `docker compose up --build` (includes Postgres)

## Verify prod
- `GET /api/health` → all services `configured`
- `POST /api/audit {"url":"https://example.com"}` → persisted
- `GET /api/history` → rows from Postgres
- `GET /api/reports?format=html&brand=Acme&url=https://example.com` → white-label report
- `GET /llms.txt` → crawler file

## Notes
- Auth/dashboard guard is permissive in demo (no env) and enforced once `NEXTAUTH_SECRET` + a provider exist (`middleware.ts`).
- Stripe webhook downgrades plan on `customer.subscription.deleted`.
- Schema auto-injector: `POST /api/schema` returns bundle + Cloudflare Worker snippet.
