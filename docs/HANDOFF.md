# Handoff — Founder Mental Health Survey

> **For the next Claude Code session.** Read this first. It captures project state, decisions-already-made, and what's next so you don't re-litigate settled questions.

**Last updated:** 2026-04-19
**Owner:** Jason Shen (jasonyshen@gmail.com)

---

## What this is

A confidential mental health screening tool for startup founders. Uses validated clinical instruments (PHQ-9, GAD-7, ASRS) plus founder-specific stressor questions. Designed to be taken in ~3–5 minutes, with immediate results and an optional email for follow-up resources.

**Domain:** `foundermental.health` (chosen over foundermh.com for the "founder mental health" / "fundamental health" double meaning). `foundermh.com` should be bought as a cheap redirect backup.

**Repo:** https://github.com/jasonshen/founder-mental-health-survey
**Hosting:** Vercel (team `jasonshen-4157s-projects`, project `founder-mental-health-survey`)
**Data:** Supabase (project `eulpvtedxovfuewnetry`)
**Email (pending):** Resend via Vercel Marketplace

---

## Quickstart for new session

```bash
cd "/Users/jasonshen/Library/CloudStorage/Dropbox/Projects/Claude Code 2026/founder-mental-health-survey"
npm run dev               # local dev on :3000 (or auto-assigned)
npx jest                  # 33 tests currently passing
npx tsc --noEmit          # type check
npx next build            # production build verify
```

Key URLs:
- **Production:** `https://foundermental.health` (once domain is wired)
- **Vercel default:** `https://founder-mental-health-survey-*.vercel.app`
- **Supabase dashboard:** `https://supabase.com/dashboard/project/eulpvtedxovfuewnetry`

---

## Tech stack

- **Next.js 15.5** (App Router, TypeScript)
- **React 19**
- **Tailwind CSS 3**
- **Supabase** (Postgres + RLS, service-role writes from API routes)
- **Zod** for API input validation
- **Resend** for transactional email (not yet configured)
- **Jest** for unit tests (`lib/__tests__/`)

---

## Architecture at a glance

```
app/
  page.tsx                → marketing / intro
  consent/                → informed consent checkboxes
  survey/                 → 5-section survey flow (client component, draft save)
  results/                → scoring summary, cohort card (if flag on)
  results/[token]/        → direct results link used in emails
  email/                  → post-survey email capture with interest checkboxes
  admin/                  → password-gated dashboard (stats + flag toggles)
  api/
    submit                → POST: validate + score + persist
    results/[token]       → GET: fetch scores
    email                 → POST: save email contact + fire confirmation email
    cohort                → GET: empirical founder-cohort percentiles (flag-gated)
    admin/login           → POST: set admin auth cookie
    admin/flags           → POST: toggle a feature flag
  error.tsx, global-error.tsx, not-found.tsx  → error boundaries

lib/
  questions.ts            → all 36 questions (5 sections)
  scoring.ts              → PHQ-9, GAD-7, ASRS scorers
  norms.ts                → severity-band prevalence (published clinical data)
  types.ts                → all TypeScript types
  schemas.ts              → Zod request schemas
  flags.ts                → DB-backed feature flag read/write w/ 30s cache
  log.ts                  → JSON structured logger
  token.ts                → short memorable tokens (FMH-XXXX)
  admin-auth.ts           → cookie-based admin check
  email.ts                → Resend wrapper (graceful if key missing)
  emails/confirmation.ts  → HTML + text templates for the first email
  supabase.ts             → lazy-init client factories

components/
  ResultsDisplay.tsx      → main results view, cohort card, CTAs
  SurveySection.tsx       → section wrapper
  ProgressBar.tsx
  CrisisBanner.tsx        → shown on PHQ-9 Q9 > 0
  QuestionTypes/
    LikertScale.tsx
    SingleSelect.tsx      → radio buttons
    Dropdown.tsx          → <select> (16px font, no iOS zoom)

supabase/migrations/
  001_initial_schema.sql         → survey_responses, email_contacts, aggregate_norms
  002_v2_schema.sql              → added section_company + email interest cols
  003_idempotency_and_security.sql → submission_id + dropped anon SELECT policy
  004_feature_flags.sql          → feature_flags table

docs/superpowers/plans/
  2026-04-19-production-ready-survey.md  → full 8-phase plan (source of truth)
```

---

## Current survey shape (36 questions, 5 sections)

1. **About You & Your Company** (10 Q) — YC batch, year founded, role, age (number), gender, race, industry, funding raised, annual run rate, team size
2. **Focus & Attention** (6 Q) — ASRS-v1.1 Part A (ADHD)
3. **How You've Been Feeling** (9 Q) — PHQ-9 (depression)
4. **Worry & Anxiety** (7 Q) — GAD-7
5. **Founder-Specific Stressors** (5 Q) — runway, loneliness, co-founder, identity, sleep

Order is deliberate: easy demographics first, then attention, then depression (Q9 of PHQ-9 about self-harm comes late in depression section so crisis banner fires *after* full context), then anxiety, then founder-specific.

---

## Decisions already made (don't re-litigate)

### Scientific honesty
- **Raw results, not percentiles per integer.** We show severity band + "about X% of general population scores in the [band] range." Per-integer cumulative percentiles from primary source lit are not published directly — computing them requires interpolation assumptions that would be dishonest to present as precise.
- Cited sources: Kroenke et al. 2001 (PHQ-9), Spitzer et al. 2006 (GAD-7), Kessler et al. 2005 (ASRS).

### Cohort percentiles are flag-gated and empirical
- When `founder_cohort_percentiles` flag is ON, we show "Compared to other founders" card computed from real submissions (not a distribution assumption — count-based ranking).
- Threshold before flipping: N ≥ 100 completed submissions. Admin page shows current N vs. threshold.
- **Manual flip** via admin dashboard. Not auto. User wants control to avoid flipping when sample is skewed (e.g., first 100 are all Jason's friends).

### Tokens
- Short memorable format: `FMH-XXXX` (4 random chars from a confusable-free 29-char set = ~700K space, plenty for <2K respondents).
- **Server-generated** (client-sent tokens are ignored). Uniqueness enforced by DB constraint; retry up to 5 on collision.

### Idempotency
- Client generates a `submission_id` UUID on survey mount. Same id retried = same token returned. No duplicate rows from double-click / network retries.

### Data integrity safety net
- `/api/submit` writes raw responses FIRST (with `completed=false`, `scores=null`), then computes scores and UPDATEs. If scoring throws, raw data is still safe and re-scorable.

### Admin auth
- Simple shared password in `ADMIN_PASSWORD` env var. Cookie-based, 12h expiry, HttpOnly, SameSite=Strict.
- **Fail-closed:** if env var not set, no one gets in (even Jason). By design.
- This is intentionally simple for v1. Swap to Clerk or Vercel Sign-in when multi-admin needed.

### RLS hardening
- Anon role can INSERT submissions, but cannot SELECT. All reads go through API routes using service-role key.
- `feature_flags` table has RLS enabled (deny-all to anon); service-role only.

### UX choices
- localStorage draft save with `SURVEY_VERSION` check (invalidates when question set changes). "Welcome back" banner on return.
- All tap targets ≥ 44×44px (Apple HIG).
- Dropdowns use 16px font to prevent iOS zoom.
- Radio groups use proper ARIA (`role=radiogroup`, `aria-labelledby`, `aria-required`).
- CrisisBanner uses `role=alert` + `aria-live=assertive`.
- Skip-to-main-content link in root layout.

### Email
- Initial email is **raw scores only** — no percentiles. Links back to `/results/[token]`.
- When cohort flag flips ON, send a second batch email inviting previous respondents back to see cohort data (admin endpoint to be built: `/api/admin/notify-cohort`).
- Email send failures do NOT fail the user-facing action. Log + continue.
- If `RESEND_API_KEY` missing, `sendEmail` returns `{sent: false, reason: "no_provider"}` and logs — app still works, email just skipped.

---

## State at time of handoff

### ✅ Shipped & in production
- Full survey flow (36 questions, 5 sections)
- Anonymous short tokens
- Raw results page with severity + band prevalence
- Email capture with 5 interest checkboxes (report, coaching, retreat, plant medicine, updates)
- Crisis banner (PHQ-9 Q9 > 0)
- Idempotent submissions
- Draft save / resume via localStorage
- Error boundaries (error.tsx, global-error.tsx, not-found.tsx)
- Loading skeletons
- Accessibility pass (radiogroups, ARIA, tap targets, focus rings, skip link)
- Zod validation on all API routes
- Structured JSON logging
- DB-backed feature flags + admin toggle UI
- Admin dashboard (stats, cohort readiness, flag list)
- Cohort percentile API endpoint (flag-gated)
- Cohort comparison card on results (appears when flag on)
- Resend wrapper + confirmation email template (wired, graceful when not configured)
- 33 tests passing, TypeScript clean, production build clean

### 🟡 Waiting on Jason
1. **Buy domains:** `foundermental.health` (primary) + `foundermh.com` (redirect backup). Vercel Domains preferred for auto-DNS.
2. **Point domain at Vercel** (Settings → Domains → add foundermental.health + www redirect)
3. **Set env vars** in Vercel (Production):
   - `ADMIN_PASSWORD` = long random string
   - `NEXT_PUBLIC_APP_URL` = `https://foundermental.health`
4. **Install Resend** via Vercel Marketplace (auto-provisions `RESEND_API_KEY`)
5. **Verify sending subdomain** in Resend (e.g., `mail.foundermental.health`) — add SPF/DKIM/DMARC DNS records
6. **Set `EMAIL_FROM`** env var once domain verified: `Founder Mental Health <results@mail.foundermental.health>`
7. **Migrations to run** in Supabase SQL editor (if not already):
   - `003_idempotency_and_security.sql` — adds submission_id + drops anon SELECT
   - `004_feature_flags.sql` — creates feature_flags table + seeds founder_cohort_percentiles flag
   (migrations 001 and 002 are already applied)

### 🔴 Still to build (from the 8-phase plan)
See `docs/superpowers/plans/2026-04-19-production-ready-survey.md` for the full plan. Open items:

**Phase 1 (Content) — deferred pending scope decision:**
- Add AQ-10 (autism) section?
- Add SD3 (Dark Triad) section?
- Add Treatment history section?
- Add PSQI sleep short form?
- Add AUDIT-C substance use?
- Open-text "anything else?" at end?

**Phase 4 (Email) — partially done:**
- PDF report (deferred — Option A was "rich HTML email IS the report" for v1)
- Interest-specific follow-up emails (CoachingResources, RetreatInfo, PlantMedicine, CrisisSupport)
- Batch "notify cohort" endpoint for when flag flips

**Phase 5 (Security/Legal):**
- Privacy policy page (`app/privacy/page.tsx`)
- Terms of service page (`app/terms/page.tsx`)
- Consent page needs links to both
- `/api/delete` endpoint for right-to-deletion
- Rate limiting (Vercel KV or Upstash) on `/api/submit`, `/api/email`, `/api/results/[token]`, `/api/admin/login`
- Crisis response protocol doc (`docs/operations/crisis-protocol.md`)
- HIPAA / GDPR determination doc (`docs/compliance/README.md`)

**Phase 6 (Observability):**
- Sentry via Vercel Marketplace
- Vercel Analytics + Speed Insights
- `/api/health` endpoint + external uptime monitor
- Log drain

**Phase 7 (Admin & Research):**
- Admin now exists but lacks CSV export: `/api/admin/export` + `/api/admin/export-emails`
- `email_sends` log table

**Phase 8 (Launch prep):**
- Custom domain: see "Waiting on Jason" above
- SEO: `app/sitemap.ts`, `public/robots.txt`, OG image via Satori
- Playwright E2E tests
- Load test (k6 or artillery)
- Launch playbook doc

---

## Environment variables reference

| Name | Required | Where set | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | All envs | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | All envs | Public anon key (INSERT only) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | All envs | Service role for reads/writes in API routes |
| `ADMIN_PASSWORD` | For admin | Production | Gates `/admin`. Fail-closed if missing. |
| `NEXT_PUBLIC_APP_URL` | For email links | Production | Base URL used in email body (e.g., `https://foundermental.health`) |
| `RESEND_API_KEY` | For email | Production | Provisioned by Vercel Marketplace install |
| `EMAIL_FROM` | For email | Production | Sender address, default `onboarding@resend.dev` (not recommended for prod) |
| `VERCEL_URL` | auto | — | Vercel fallback if `NEXT_PUBLIC_APP_URL` unset |

---

## SQL migrations applied

Run in order if setting up a fresh Supabase project:

1. `supabase/migrations/001_initial_schema.sql` — tables, RLS, seed norms (already applied)
2. `supabase/migrations/002_v2_schema.sql` — V2 columns (already applied)
3. `supabase/migrations/003_idempotency_and_security.sql` — submission_id + drop anon SELECT (⚠️ verify applied on prod)
4. `supabase/migrations/004_feature_flags.sql` — feature_flags table (✅ applied per Jason)

Note: migration 001 has some seed data for `aggregate_norms` table. We no longer use that table (moved to `lib/norms.ts` as source of truth) but it's harmless to keep seeded.

---

## Logged events (for grep'ing Vercel logs)

All emitted as JSON lines via `lib/log.ts`. Common events:

- `submit_validation_failed`, `submit_token_collision`, `submit_persisted`, `submit_score_update_failed`, `submit_complete`, `submit_idempotent_return`, `submit_race_resolved`
- `results_invalid_token_format`, `results_not_found`, `results_scoring_pending`, `results_fetched`, `results_db_error`
- `email_validation_failed`, `email_captured`, `email_sent`, `email_send_error`, `email_skipped_no_provider`, `email_token_not_found`
- `cohort_computed`, `cohort_no_scores_for_token`, `cohort_db_error`
- `admin_login_success`, `admin_login_bad_password`, `admin_login_no_password_configured`
- `flag_read_error`, `flag_set`, `flag_write_error`

---

## Gotchas & traps

1. **Scoring pending state.** `/api/submit` may return `{scoring_pending: true}` if the raw insert succeeded but the score UPDATE failed. `/api/results/[token]` returns 202 until scores exist. The results page polls on 202 (up to 3 retries at 1.5s). If you add new scored instruments, make sure to re-run scoring for rows where `scores IS NULL`.

2. **Token format validation.** `TokenParamSchema` in `lib/schemas.ts` enforces `FMH-XXXX` with 4 chars. If you ever change token length, update this regex.

3. **Client-sent token is ignored.** Don't add code that trusts a client-supplied token on submit. The server always generates.

4. **Supabase client is lazy.** `createClient` calls moved out of module scope into functions. Don't revert this — build fails when envs are missing if client initializes at import time.

5. **Feature flag cache.** 30-second per-request cache in `lib/flags.ts`. If a flag flip doesn't seem to take effect immediately in a serverless function, that's why. Fine in practice.

6. **Email skip is silent.** If `RESEND_API_KEY` missing, the email just doesn't send and logs `email_skipped_no_provider`. The user sees success on the `/email` page. If someone reports "I didn't get an email," check Vercel logs for that event.

7. **VERCEL_URL is a preview URL.** Don't rely on `process.env.VERCEL_URL` alone for production email links — it gives you the deployment URL (e.g., `founder-mental-health-survey-abc123.vercel.app`), not the custom domain. Always set `NEXT_PUBLIC_APP_URL` for production.

8. **Migration 001 still exists.** It has `CREATE TABLE` statements without `IF NOT EXISTS`. If someone naively runs it again on a populated DB, it errors. New migrations (003+) use `IF NOT EXISTS` defensively.

9. **Admin cookie contains the password.** Because admin auth is a shared-secret check, the cookie value is literally `process.env.ADMIN_PASSWORD`. HttpOnly means JS can't read it, Secure means HTTPS-only, but it's still not as secure as a proper session. Don't give that cookie to anyone. For v2 auth, switch to sessions with a JWT/store-backed identifier.

10. **The .playwright-mcp/ and .claude/ directories are gitignored.** They're from the Claude Code preview/verification tooling. Don't commit them.

---

## If continuing work

Immediate sensible next steps in rough order:

1. **Domain setup day** — buy foundermental.health via Vercel Domains, wire DNS, set `NEXT_PUBLIC_APP_URL`. (blocks #2)
2. **Email setup day** — install Resend, verify subdomain, send yourself a test submission, confirm email lands. (unblocks real launch)
3. **Privacy policy + ToS** — before any real marketing. Consent page needs to link to both.
4. **Rate limiting** — Vercel KV or Upstash. Add to `/api/submit` especially (otherwise a bot could hammer).
5. **Sentry** — install via Marketplace, verify errors flow to it.
6. **Closed beta** — send link to 20 founders you know, gather feedback, fix sharp edges.
7. **Playwright E2E** — before public launch.
8. **Public launch** — tweet, LinkedIn, Hacker News.

Refer to `docs/superpowers/plans/2026-04-19-production-ready-survey.md` for the full plan with task breakdowns.

---

## Questions to ask Jason if scope is unclear

- Are we adding AQ-10 / SD3 / Treatment history, or staying at 36 Q?
- Who reviews the privacy policy + ToS — self or attorney?
- Target launch date?
- Any specific founders/communities to reach out to for closed beta?
- Plan for the crisis follow-up protocol (committing to 1h email on PHQ-9 Q9 > 0)?

Good luck. 🫶
