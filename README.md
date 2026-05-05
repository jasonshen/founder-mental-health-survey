# Founder Mental Health Survey

```sql
-- how are you, really?
SELECT mood
  FROM founder
 WHERE honest = TRUE;
```

A confidential, validated screening tool for startup founders. About 10 minutes, fully anonymous.

Live: **[foundermental.health](https://foundermental.health)**

## What it measures

Seven validated clinical instruments, plus founder-specific research items:

| Instrument | What it screens | Items |
|---|---|---|
| PHQ-9 | Depression | 9 |
| GAD-7 | Anxiety | 7 |
| MBI-GS | Burnout (exhaustion / cynicism / efficacy) | 9 + 1 attention check |
| ASRS-6 | ADHD (adult) | 6 |
| AQ-10 | Autism spectrum traits | 10 |
| Dirty Dozen | Dark Triad (Mach / psychopathy / narcissism) | 12 |
| AUDIT-C | Alcohol use (follow-up, gated on alcohol frequency) | 2 |

Founder-specific sections:

- **Outlook** (`life_outlook`, 9 items, 0–10 scales) — 4 well-being anchors (life satisfaction, happiness, worthwhile, purpose), 3 domain ratings (relationships, physical health, mental health), and 2 SDT-grounded need-frustration items (autonomy: "I have to" vs "I want to"; relatedness: "I feel alone carrying the weight"). Redesigned 2026-05-01 — see [`docs/survey-design-rationale-life-ambition-burnout.md`](docs/survey-design-rationale-life-ambition-burnout.md).
- **Ambition** (16 items) — 3 drive-intensity items (Hirschi/Spurk core), 2 breadth & identity items, 4 Kasser-Ryan aspiration items (intrinsic vs extrinsic importance), and 7 Deci-Ryan PLOC regulation items spanning amotivation → external (avoidance / approach) → introjected → identified → integrated → intrinsic. The regulation block is the analytical centerpiece of the **Deep Ambition** arm of the project.
- **Founder Challenges** (14 items) — self-leadership, team execution, cofounder/board friction, existential business anxiety.
- **Cofounder Relationship** (11 items, skipped for solo founders) — alignment, trust, conflict navigation, decision rights, division of labor, overall health.
- **Social Support & Connection** (4 items) — confidant capacity vs actual confiding frequency, both scoped to "outside your company".
- **Help-Seeking History** — therapy and coaching engagement (ever / current / duration / impact), barriers when respondents considered support but didn't pursue it, mental-health leave.
- **Medication & Substance Use** — current psychotropic medication; past-12-month frequency for alcohol, cannabis, nicotine, off-prescription stimulants, MDMA, psilocybin, ayahuasca/DMT, LSD, ketamine; AUDIT-C follow-ups for monthly-or-greater drinkers.
- **Open-ended reflection** — one optional 1000-character free-text item.

Total: **16 active sections, ~140 items**, every item optional except consent. The legacy V1/V2 sections `macro_outlook` (merged into Outlook on 2026-05-01) and `founder_stress` (replaced by Founder Challenges in V3) were dropped from the schema in migration 010.

## Cohorts

The consent screener splits respondents into a **YC** cohort (current or alum YC founders) and a **general** founder cohort. Branding, the consent flow, and the confirmation email subject vary by cohort. Cohort is stored as a top-level column on `survey_responses` (migration 009), enabling cohort-aware percentile tables and analysis. URL hints (`/yc` vs `/survey`) seed the screener's default but the user's answer is always authoritative.

## Privacy posture

The schema is the privacy guarantee. Three structural choices make the survey hard to de-anonymize:

1. **No join key between identity and responses.** `email_contacts` and `survey_responses` live in separate tables and share no foreign key. We collect email opt-ins on the post-results page, but the database itself cannot tell you which email belongs to which set of responses.
2. **No timestamps with sub-day resolution.** `created_at` is `DATE`, not `TIMESTAMPTZ`. Time-of-day fingerprinting (e.g. "the only person who submitted in the 3 minutes after I shared the link") doesn't work.
3. **The confirmation email carries no survey content.** It contains no access token, no results URL, and no scores — just a thank-you, a heads-up that the detailed report arrives in ~2 weeks, and a reminder to save the access code shown at the end of the survey. If a respondent loses their token, we cannot recover it from their email address. That's the point.

See [`supabase/migrations/005_privacy_hardening.sql`](supabase/migrations/005_privacy_hardening.sql) for the schema-level enforcement.

## Stack

- **Next.js 15** App Router on Vercel
- **React 19** (client components for interactive surfaces)
- **Supabase** (Postgres + service-role key for server-side writes)
- **Resend** for transactional email (the post-survey confirmation)
- **Tailwind CSS 3**
- **Zod 4** for request validation
- **TypeScript 5**

## Local development

```bash
# 1. Install
pnpm install   # or npm install

# 2. Environment
cp .env.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#   RESEND_API_KEY (optional — emails will skip if missing)
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# 3. Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Schema migrations

All schema lives in [`supabase/migrations/`](supabase/migrations/). Apply them in order:

| # | What |
|---|---|
| 001 | Initial schema (`survey_responses`, `email_contacts`) |
| 002 | V2 column refactor |
| 003 | Idempotency + RLS hardening |
| 004 | Feature flags table |
| 005 | Privacy hardening (drops email↔token join, coarsens timestamps to DATE) |
| 006 | V3 expansion: `sections_ext` JSONB + partial-save columns |
| 007 | Allow NULL `anonymous_token` so partial rows can exist before finalize |
| 008 | Per-section column refactor (drops `sections_ext`, adds `section_<id>` for every V3 section) |
| 009 | Add `cohort` column to `survey_responses` (YC vs general) |
| 010 | Drop legacy `section_macro_outlook` and `section_founder_stress` columns |

Run them via the Supabase SQL editor or the Supabase CLI (`supabase migration up`).

## Architecture notes

### Sections and per-section columns
Every section maps 1:1 to its own JSONB column on `survey_responses` (e.g. `section_dark_triad`). The `SECTION_COLUMN` allowlist in [`lib/types.ts`](lib/types.ts) is the single source of truth — both API routes look up the column name via this map, so dynamic column writes are safe (closed set, no string interpolation of user input).

### Partial save
`POST /api/save-section` upserts an in-progress row keyed by a client-generated `submission_id` UUID. No `anonymous_token` is assigned until the user clicks **Submit** at the end, at which point `POST /api/submit` finalizes the same row in place — generating the token, computing scores, and flipping `completed = true`. This means abandoned submissions (which are most of them) become research data instead of being silently lost.

### Cohort routing
The consent page (`app/consent/page.tsx`) reads the URL hint, asks the YC screener question, and writes the resulting cohort (`yc` or `general`) into `localStorage` keys consumed by `app/survey/begin/page.tsx`. The cohort flows through `/api/save-section` and `/api/submit` into the top-level `cohort` column. Confirmation email subject and per-cohort percentile lookups branch on this value.

### Skip logic
Declarative predicates on `Question` and `SectionMeta` in [`lib/questions.ts`](lib/questions.ts) and helpers in [`lib/conditions.ts`](lib/conditions.ts). Examples: solo founders skip the cofounder section entirely; AUDIT-C alcohol follow-ups appear only if alcohol frequency ≥ Monthly; therapy follow-ups only show when "Have you ever worked with a therapist?" = Yes.

### Reverse-coded items
Marked with `reverseCoded: true` in `Question` metadata. The survey UI presents them unmarked; reversal happens at the analysis layer, not the survey layer.

### Attention check
A single `attentionCheck: true` item sits in the burnout section asking the respondent to select a specific scale value. Stored raw — flagged downstream during analysis, never used to block submission.

## Tests

```bash
pnpm test
```

Jest with `ts-jest`, scoped to [`lib/`](lib/). Coverage today: Zod request schemas and the scoring layer (PHQ-9, GAD-7, ASRS, AQ-10, Dark Triad). API routes and the survey UI are exercised manually rather than via automated tests.

## Authors

- **[Jason Shen](https://jasonshen.com)**
- **[Keegan Walden](https://www.linkedin.com/in/keegan-walden-ph-d-672ab9101/)**

## License

This survey is a screening tool, not a medical diagnosis. The validated instruments used (PHQ-9, GAD-7, ASRS, AQ-10, MBI-GS, Dirty Dozen, AUDIT-C) are public-domain or widely used in research; the founder-specific sections (Outlook, Ambition, Founder Challenges, Cofounder Relationship, Social Support) are original to this project. Ambition and Outlook draw on Self-Determination Theory (Deci & Ryan; Kasser & Ryan) and the Hirschi/Spurk drive-intensity scale — see the rationale doc linked above.

Code is open source — see the GitHub repo for license terms.
