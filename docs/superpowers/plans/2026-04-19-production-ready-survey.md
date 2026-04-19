# Founder Mental Health Survey — Production Readiness Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the Founder Mental Health Survey to bulletproof production — a survey tool that researchers, founders, and journalists can trust with sensitive mental health data.

**Architecture:** Next.js 15 (App Router) on Vercel, Supabase (Postgres + RLS) for storage, Resend for transactional email, Sentry for observability. Anonymous by default, token-based result retrieval, zero PII in survey responses.

**Tech Stack:** Next.js 15.5, React 19, TypeScript 5, Tailwind CSS, Supabase JS, Zod (to add), Resend (to add), Sentry (to add), Playwright (to add for E2E), Vercel Analytics.

---

## Scope & Phasing Philosophy

A mental health survey is **not** like a generic form. It collects sensitive data from a vulnerable population (founders in distress), so bulletproof means:

1. **Data integrity** — no lost submissions, no silent failures
2. **Psychological safety** — crisis responses, no triggering UX, graceful distress handling
3. **Legal defensibility** — clear consent, documented retention, proper disclosure
4. **Observable** — you know when something breaks before users do
5. **Accessible** — WCAG 2.1 AA minimum (mental health crosses all demographics)

This plan is structured in **8 phases**, each producing working, shippable software. Phases 1–3 are must-have before inviting respondents. Phases 4–6 are must-have before public launch. Phases 7–8 are ongoing operations.

---

## Current State Audit (2026-04-19)

### What's built ✅
- 5 sections, 34 questions: Company demographics, ADHD (ASRS-6), Depression (PHQ-9), Anxiety (GAD-7), Founder Stressors
- Scoring for PHQ-9, GAD-7, ASRS with population norms
- Anonymous short tokens (FMH-XXXX), Supabase storage
- Results page with visual severity bars and crisis banner (988/Crisis Text Line)
- Email capture with 5 interest checkboxes (report, coaching, retreat, plant medicine, updates)
- Deployed to Vercel (production) with env vars set
- 16 passing unit tests on scoring logic
- TypeScript clean, API routes dynamic

### What's missing ❌
- Autism (AQ-10), Dark Triad (SD3), Treatment history sections from V1 spec
- Input validation (no Zod, handcrafted checks)
- Rate limiting on API routes
- Progress persistence (reload = lose answers)
- Idempotency (double-click submit could create duplicate rows)
- Actual email sending (captures preferences but never sends)
- Privacy policy, terms of service, data retention disclosure
- Accessibility audit (ARIA, keyboard nav, screen reader, contrast)
- Error boundaries and friendly error states
- Observability (Sentry, structured logs)
- Analytics (conversion funnel, drop-off)
- E2E tests (only unit tests exist)
- Admin dashboard for aggregate data
- Data export (CSV for research)
- Custom domain
- SEO (meta tags, OG image, robots.txt, sitemap)
- Content review pass — question wording, tone, instructions

---

## Phase 1: Content Completion

**Why first:** Every phase after depends on the final question set. Don't optimize a UX you're going to change.

**Deliverable:** Final question set agreed and committed, schema migration for any new sections.

### Task 1.1: Decide final question inventory
- [ ] **Decision doc:** Write `docs/question-inventory.md` listing all proposed sections. Review with Jason.
- [ ] Confirm whether to add: AQ-10 (autism, 10 items), SD3 (dark triad, 27 items), Treatment history (current therapy/coaching/meds/barriers), Sleep (PSQI short form?), Substance use (AUDIT-C, 3 items), Social support (single item)
- [ ] **Budget check:** Total survey length < 15 minutes. Target ~50 questions max. Track estimated completion time.
- [ ] **Ordering:** Put validated clinical instruments LAST. Demographics and light questions first. The current order is good — just slot new sections in.

### Task 1.2: Write any new sections
For each new section (AQ-10, SD3, Treatment):
- [ ] Add questions array to `lib/questions.ts` following existing pattern
- [ ] Add `SectionId` to `lib/types.ts`
- [ ] Add section meta to `SECTIONS` array in `lib/questions.ts`
- [ ] Add scoring function to `lib/scoring.ts` (if applicable)
- [ ] Add norms to `lib/norms.ts` (cite source)
- [ ] Add score type to `AllScores` in `lib/types.ts`
- [ ] Update `computeAllScores` to call new scorer
- [ ] Add unit tests to `lib/__tests__/scoring.test.ts` covering: all-zero, max, threshold boundary, reverse-scored items (SD3)
- [ ] Update API submit route to persist new section JSONB
- [ ] Update `ResultsDisplay.tsx` with new results card
- [ ] Commit per section, not per file

### Task 1.3: Migration for new sections
- [ ] Write `supabase/migrations/003_<sections>.sql` adding any new `section_xxx` columns (JSONB, nullable)
- [ ] Document in README how to apply migrations
- [ ] Run migration on staging Supabase (see Phase 4.2 for staging env)

### Task 1.4: Content review pass
- [ ] Read every question aloud. Note any that feel judgmental, leading, or confusing.
- [ ] Review section intros. Founders aren't patients — tone should feel like a peer, not a clinician.
- [ ] Ensure PHQ-9 Q9 (self-harm) is clearly the LAST question in depression section so the crisis banner fires after that context.
- [ ] Add optional open-text question at the end: "Is there anything else you want us to know?" (low signal for scoring, high signal for qualitative research)

---

## Phase 2: Data Integrity

**Why second:** Before we let humans submit, the data path must be bulletproof. Validate, log, never drop.

**Deliverable:** Zero-drop submissions, validated inputs, idempotent writes, auditable trail.

### Task 2.1: Add Zod validation on API routes
- [ ] Install: `npm i zod`
- [ ] Create `lib/schemas.ts`: Zod schemas for `SurveySubmission`, `EmailSubmission`, `TokenParam`
- [ ] Write failing test in `lib/__tests__/schemas.test.ts`: submit with missing required field should fail validation
- [ ] In `/api/submit`, parse body with `SurveySubmission.safeParse(body)`. Return 400 with detailed error on failure.
- [ ] Same for `/api/email`. Validate email format (`z.string().email()`).
- [ ] Test with curl: invalid JSON, missing fields, wrong types → all return structured 400s.
- [ ] Commit.

### Task 2.2: Server-side token generation (not client)
**Problem:** Currently `lib/token.ts` runs client-side. Malicious users could submit with any token. Move token generation to server.
- [ ] Change `/api/submit` to ignore any client-sent token, generate it server-side with `generateToken()`
- [ ] Return generated token in response
- [ ] Update `app/survey/page.tsx` to use the returned token, not a client-generated one
- [ ] Check for token collisions (unlikely with 8 char space = ~700K, but add unique constraint check with retry up to 5 attempts before giving up)
- [ ] Write test: concurrent submissions generate unique tokens
- [ ] Commit.

### Task 2.3: Idempotency + duplicate prevention
**Problem:** Double-click submit, network retry, React strict mode → duplicate rows.
- [ ] Generate a `submission_id` (uuid) on the client when the survey page mounts. Send it with submission.
- [ ] Add `submission_id` column to `survey_responses` with UNIQUE constraint
- [ ] On insert conflict, return the existing row's token instead of erroring
- [ ] Write test: submit twice with same submission_id → second returns first token, no duplicate row
- [ ] Commit.

### Task 2.4: Structured logging
- [ ] Create `lib/log.ts`: wrapper that emits JSON logs with `timestamp`, `level`, `event`, `context`
- [ ] Replace all `console.error` with `log.error(event, { context })`
- [ ] In API routes, log at key points: submission_received, scoring_complete, db_write_start, db_write_success, db_write_error (with Supabase error details)
- [ ] Never log full response data. Log counts and token prefix only.
- [ ] Commit.

### Task 2.5: Graceful DB failure UX
- [ ] If Supabase write fails, show a friendly error with a "try again" button that retains all answers
- [ ] Dispatch a Sentry breadcrumb (see Phase 5) with the failure reason
- [ ] Never show raw Supabase error strings to users
- [ ] Write test: mock Supabase client returning error, verify user-facing message and form retains state
- [ ] Commit.

### Task 2.6: Drop safety net — persist-before-score
**Problem:** If scoring throws, we lose the raw responses.
- [ ] In `/api/submit`, write responses to DB *first* (with `scores: null`, `completed: false`), then compute scores in a second UPDATE
- [ ] If scoring fails, row exists with raw responses — researcher can re-score later
- [ ] Commit.

---

## Phase 3: User Experience Polish

**Deliverable:** Users complete the survey on any device without losing progress, get clear feedback, and feel respected.

### Task 3.1: Progress persistence (draft save)
- [ ] On every response change, write `{responses, currentSectionIndex, surveyVersion}` to localStorage keyed by a client-side session ID
- [ ] On survey page mount, check localStorage and offer "Resume where you left off?" banner
- [ ] Clear localStorage on successful submission
- [ ] Track `surveyVersion` so stale drafts (after question changes) get discarded
- [ ] Commit.

### Task 3.2: Mobile polish
- [ ] Run Lighthouse mobile audit. Target: Performance > 90, A11y > 95.
- [ ] Radio button targets min 44x44 px (Apple HIG). Audit `SingleSelect`, `LikertScale`.
- [ ] Dropdown on iOS — verify font-size >= 16px to prevent zoom-in
- [ ] Test on actual device (iPhone + Android). Note any issues as follow-up tasks.
- [ ] Commit any fixes.

### Task 3.3: Accessibility audit
- [ ] Install: `npm i -D @axe-core/react eslint-plugin-jsx-a11y`
- [ ] Add axe-core dev-time checks to layout
- [ ] Run axe on every page. Fix all violations.
- [ ] Keyboard nav: Tab through every input, all reachable. Arrow keys move between radio options. Esc doesn't break flow.
- [ ] Screen reader: Test with VoiceOver. Each question must have proper label association.
- [ ] Color contrast: ensure all text meets WCAG AA (4.5:1). The indigo-400 disabled button may be too light.
- [ ] Forms: Every `input` has `aria-required`, `aria-invalid` when errored, `aria-describedby` linking to error messages
- [ ] Crisis banner: `role="alert"` with `aria-live="assertive"` so screen readers announce it
- [ ] Commit.

### Task 3.4: Error boundaries
- [ ] Create `app/error.tsx` — catches server errors, shows friendly message, offers reload + token recovery link
- [ ] Create `app/global-error.tsx` — catches layout errors
- [ ] Create `app/not-found.tsx` — handles 404s cleanly (e.g., bad token URLs)
- [ ] Wrap `<ResultsDisplay>` in a client-side error boundary
- [ ] Write test: bad token shows "Results not found, double-check your code" not a JSON error
- [ ] Commit.

### Task 3.5: Loading states
- [ ] Add loading skeleton for `ResultsDisplay` (not just "Loading...")
- [ ] Submit button: disabled + spinner while submitting, clear success/failure feedback
- [ ] Use `useTransition` for navigation where applicable
- [ ] Commit.

### Task 3.6: Back-button & state preservation
- [ ] Going Back in browser should preserve section state, not restart
- [ ] Use router.push vs replace strategically
- [ ] Commit.

---

## Phase 4: Email Delivery

**Why separate phase:** Currently we capture email preferences but send nothing. This is a trust problem — users expect the report.

**Deliverable:** Real transactional email flow, report PDF, confirmation of interests.

### Task 4.1: Pick and configure email provider
- [ ] **Recommendation:** Resend (native Vercel Marketplace, React Email templates)
- [ ] Install via Vercel Marketplace — auto-provisions `RESEND_API_KEY` env var
- [ ] Verify a sending domain (e.g., `mail.foundermh.com`) with SPF, DKIM, DMARC
- [ ] Create `lib/email.ts` with `sendEmail(to, subject, reactComponent)` helper

### Task 4.2: Staging environment
- [ ] Set up a separate Supabase project for staging (`founder-mental-health-survey-staging`)
- [ ] Set Vercel preview deployments to use staging env vars
- [ ] Production = production Supabase, Preview = staging. Never test against prod.

### Task 4.3: Transactional confirmation email
- [ ] Install: `npm i @react-email/components`
- [ ] Create `emails/SurveyConfirmation.tsx` — confirms email received, summarizes interests they checked, includes results link with token
- [ ] In `/api/email`, after DB insert, enqueue email send via Resend
- [ ] Email send failure must NOT fail the API (user has already submitted) — log and alert instead
- [ ] Write test: mock Resend, verify email is built with correct content
- [ ] Commit.

### Task 4.4: Full PDF report generation
- [ ] **Option A (recommended):** Server-side HTML-to-PDF via `@react-pdf/renderer` or Puppeteer running in a Vercel Function
- [ ] **Option B (simpler first pass):** Email a rich HTML version, defer PDF
- [ ] Design the report: cover page, scores summary, each instrument explained, how to interpret, resources by score band, full disclaimer
- [ ] Generate on-demand when user hits "Get full report" — or generate when email submitted and attach
- [ ] Commit.

### Task 4.5: Queue for interest follow-ups
- [ ] Users who check "coaching", "retreat", "plant medicine" should get a follow-up email within 24 hours with specific resources
- [ ] For v1: manual — export weekly and send manually. Document the process in `docs/operations/follow-up.md`
- [ ] For v2: Vercel Queue or scheduled Cron job to process `email_contacts` where follow-up not yet sent

---

## Phase 5: Security, Privacy, Legal

**Deliverable:** A survey you can show to your lawyer without flinching.

### Task 5.1: Privacy policy & terms
- [ ] Write `app/privacy/page.tsx` — plain-language privacy policy: what we collect (scores, optional email), what we don't (IP, cookies beyond necessary), retention (e.g., indefinite for research, email deleted on request), who sees it, how to request deletion
- [ ] Write `app/terms/page.tsx` — this is not medical advice, not a diagnosis, screening only, no clinician-patient relationship, crisis resources
- [ ] Link both from footer on every page
- [ ] Update consent page to link to both and add "I've read the Privacy Policy and Terms" checkbox
- [ ] **Legal review** — run both past a lawyer. Mental health + US consumer = non-trivial.

### Task 5.2: Data retention & deletion
- [ ] Decide retention policy. Recommend: survey responses retained indefinitely (aggregate research), email_contacts removable on request
- [ ] Add `/api/delete` endpoint: accepts token, deletes row
- [ ] Add instructions in privacy policy for how to request deletion (support@ email)
- [ ] Commit.

### Task 5.3: Rate limiting
- [ ] Install: Vercel KV or Upstash Redis for counter storage
- [ ] `/api/submit`: max 3 submissions per IP per hour
- [ ] `/api/email`: max 5 per IP per hour
- [ ] `/api/results/[token]`: max 30 per IP per hour (user might refresh legitimately)
- [ ] Return 429 with `Retry-After` header
- [ ] Bot filter: add Vercel Firewall WAF rule to block obvious bot user agents
- [ ] Commit.

### Task 5.4: Row Level Security audit
- [ ] Re-read existing RLS policies in `001_initial_schema.sql`
- [ ] Verify anon role can INSERT but cannot SELECT without token match (current policy is `USING (true)` which is too permissive — fix to require token equality via API only using service role)
- [ ] Audit: can an attacker with the anon key enumerate all submissions? Test this.
- [ ] Recommended: remove anon SELECT entirely; do all reads via service role in API routes (server-only)
- [ ] Commit migration.

### Task 5.5: Crisis response enhancement
- [ ] Beyond 988 and Crisis Text Line, add: international resources (IASP), peer support (founder-specific if any exists), a "you're not alone" message
- [ ] On the results page, if PHQ-9 score >= 15 OR Q9 > 0, also email the person within 1 hour with resources (if they left an email)
- [ ] Document the protocol in `docs/operations/crisis-protocol.md`
- [ ] **This is an ethical obligation** — do not skip.

### Task 5.6: HIPAA / compliance check
- [ ] **Research:** Are we a covered entity or business associate under HIPAA? (Likely no — we're not a healthcare provider, payer, or clearinghouse.) Document the determination.
- [ ] If BAA with Supabase matters: sign it. Otherwise note it's not applicable.
- [ ] GDPR considerations: we'll accept EU respondents. Add GDPR-compliant consent language, cookie disclosure (we use none beyond session), right to deletion process.
- [ ] Commit decision doc to `docs/compliance/README.md`.

---

## Phase 6: Observability & Monitoring

**Deliverable:** You find out about production issues in minutes, not from users.

### Task 6.1: Sentry
- [ ] Install via Vercel Marketplace → auto-provisions `SENTRY_DSN`
- [ ] Wrap app in Sentry with `@sentry/nextjs`
- [ ] Test: throw in `/api/submit` → alert fires in Sentry within seconds
- [ ] Configure alert: any 5xx rate > 1% over 5 min → email me
- [ ] Configure alert: any scoring error → email me
- [ ] Commit.

### Task 6.2: Analytics
- [ ] Enable **Vercel Analytics** (privacy-friendly, no cookies)
- [ ] Enable **Vercel Speed Insights** for Core Web Vitals
- [ ] Add custom events: survey_started, section_completed (N), survey_submitted, email_captured, results_viewed
- [ ] Dashboard to watch: 30-day funnel from survey_started → submitted
- [ ] Commit.

### Task 6.3: Uptime monitoring
- [ ] Set up external check (Better Stack / Uptime Robot): GET `/` and `/api/health` every 60s
- [ ] Add `/api/health` route returning `{ ok: true, dbReachable: true }` (pings Supabase lightly)
- [ ] Alert on 2 consecutive failures → SMS

### Task 6.4: Runtime logs drain
- [ ] Configure Vercel log drain to a searchable store (Axiom, Logtail, or just Vercel's built-in)
- [ ] Retention: 30 days minimum

---

## Phase 7: Admin & Research

**Deliverable:** You can actually use the data this survey collects.

### Task 7.1: Admin dashboard (simple)
- [ ] Create `app/admin/page.tsx` — password-protected (or Vercel Sign-in) page showing: total responses, breakdown by stage/YC/age, distribution of scores, opt-in counts
- [ ] Server component, pulls aggregates via service role client
- [ ] No PII shown ever
- [ ] Commit.

### Task 7.2: CSV export
- [ ] `/api/admin/export` (auth-gated) returns CSV of all responses
- [ ] Include computed scores, section JSONB flattened, NO emails
- [ ] Also write: `/api/admin/export-emails` separately, includes emails + interests
- [ ] Commit.

### Task 7.3: Email send log
- [ ] Table `email_sends` tracking every send: timestamp, type (confirmation/report/followup), recipient_hash (sha256 for privacy), status
- [ ] So you can prove what was sent when

---

## Phase 8: Launch Readiness

**Deliverable:** You can tweet the link without fear.

### Task 8.1: Custom domain
- [ ] Purchase domain (e.g., foundermh.com) — Vercel recommends their registrar
- [ ] Configure DNS in Vercel Domains panel
- [ ] Set up apex + www redirect
- [ ] Add domain to Vercel project. Verify SSL cert provisioned.

### Task 8.2: SEO & sharing
- [ ] `app/layout.tsx`: rich metadata — title, description, OG image (generate via Satori)
- [ ] `public/robots.txt`: allow all
- [ ] `app/sitemap.ts`: dynamic sitemap
- [ ] Test Twitter and LinkedIn unfurl with sharing debuggers
- [ ] Commit.

### Task 8.3: E2E tests with Playwright
- [ ] Install: `npm i -D @playwright/test`
- [ ] Write E2E: complete survey → see results → email flow → return via token
- [ ] Write E2E: crisis path — PHQ-9 Q9 positive → crisis banner shows
- [ ] Write E2E: accessibility — axe-playwright scan on every page
- [ ] Run in CI via `.github/workflows/e2e.yml` on every PR
- [ ] Commit.

### Task 8.4: Load test
- [ ] Use k6 or artillery to simulate 50 concurrent submissions
- [ ] Verify: no errors, submissions all land in DB, P95 latency < 2s
- [ ] Commit load test scripts

### Task 8.5: Final content review
- [ ] Read every page out loud one more time
- [ ] Have 3 founders (ideally at least one outside your network) complete the survey and share feedback
- [ ] Tweak based on feedback

### Task 8.6: Launch playbook
- [ ] Write `docs/operations/launch-playbook.md`: how to announce, what to monitor during launch, rollback plan, who to call if something breaks
- [ ] Pre-write tweets, LinkedIn post, email to your list
- [ ] Set up a "launch calm down" — don't ship on a Friday, have the afternoon clear

---

## Decisions Needed from Jason

Before Phase 1 begins, please decide:

1. **Question scope:** Add AQ-10 / SD3 / Treatment / other, or keep it tight at ~34 questions?
2. **Email provider:** Resend (recommended) or already using something?
3. **Custom domain:** Purchase now or continue using Vercel URL for MVP?
4. **Crisis follow-up:** Are you comfortable committing to email follow-ups within 1h for high-risk scores?
5. **Legal review:** Who reviews the privacy policy + ToS? Self or attorney?
6. **Target launch window:** Rough date helps sequence work.

---

## Execution Strategy

This plan is big. Do not try to do it all at once. Order of attack:

1. **Phases 1–3 (content + integrity + UX):** 1-2 weeks. After this, survey is good enough to share with a small private beta (~20 founders in your network).
2. **Phases 4–6 (email + legal + observability):** 2-3 weeks. After this, ready for public launch.
3. **Phases 7–8 (admin + launch prep):** 1 week. This is the "finishing" work.

**Total realistic timeline: 5-6 weeks of focused work** for a solo builder with AI assistance.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User in crisis doesn't see banner | Low | Very High | `role=alert`, fire on Q9>0 OR PHQ-9>=15, always top-of-page |
| Supabase outage during launch traffic | Medium | High | Observability + friendly error + retention of in-flight answers client-side |
| Scoring bug gives wrong severity | Low | High | Test coverage + clinical review before launch |
| Email provider blocks sending | Low | Medium | Proper DNS (SPF/DKIM/DMARC) + warming + fallback provider |
| Bad actors flood with junk | Medium | Low | Rate limiting + Vercel Firewall |
| Legal challenge over "not a diagnosis" | Low | Very High | Prominent disclaimers + legal review of ToS |
| Data breach | Low | Catastrophic | RLS audit + anon SELECT removed + service-role only reads |

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-19-production-ready-survey.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration on each phase.

**2. Inline Execution** — We work through tasks in this session, batch execution with checkpoints for review.

**Which approach? And which phase do you want to start with — Phase 1 (content) or skip ahead?**
