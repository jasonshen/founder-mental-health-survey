# Founder Mental Health Survey

```
   /\_/\
  ( o.o )   founder mental health survey
   > ^ <    "how are you, really?"
```

A confidential, validated screening tool for startup founders. About 10 minutes, fully anonymous.

Live: **[foundermental.health](https://foundermental.health)**

## What it measures

Five validated clinical screeners alongside founder-specific research items:

| Instrument | What it screens | Items |
|---|---|---|
| PHQ-9 | Depression | 9 |
| GAD-7 | Anxiety | 7 |
| ASRS-6 | ADHD (adult) | 6 |
| AQ-10 | Autism spectrum traits | 10 |
| MBI-GS | Burnout (exhaustion / cynicism / efficacy) | 9 |

Plus founder-specific sections: life outlook & flourishing, ambition (Hirschi/Spurk + custom Ambition Breadth), 14-item founder challenges, AI/economy outlook, cofounder relationship quality (Four Elements), Dirty Dozen Dark Triad, social support, help-seeking history, medication use, and substance use (with AUDIT-C follow-up).

Total: **18 sections, ~130 questions**, every item optional except consent.

## Privacy posture

The schema is the privacy guarantee. Two structural choices make it hard to de-anonymize:

1. **No join key between identity and responses.** `email_contacts` and `survey_responses` live in separate tables and share no foreign key. We collect email opt-ins on the post-results page, but the database itself cannot tell you which email belongs to which set of responses.
2. **No timestamps with sub-day resolution.** `created_at` is `DATE`, not `TIMESTAMPTZ`. Time-of-day fingerprinting (e.g. "the only person who submitted in the 3 minutes after I shared the link") doesn't work.

See [`supabase/migrations/005_privacy_hardening.sql`](supabase/migrations/005_privacy_hardening.sql) for the schema-level enforcement.

## Stack

- **Next.js 15** App Router on Vercel
- **React 19** (client components for interactive surfaces)
- **Supabase** (Postgres + service-role key for server-side writes)
- **Resend** for transactional email (the optional results report)
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
| 008 | Per-section column refactor (drops `sections_ext`, adds `section_<id>` for all 13 V3 sections) |

Run them via the Supabase SQL editor or the Supabase CLI (`supabase migration up`).

## Architecture notes

### Sections and per-section columns
Every section maps to its own JSONB column on `survey_responses` (e.g. `section_dark_triad`). The `lib/types.ts` `SECTION_COLUMN` allowlist is the single source of truth — both API routes look up the column name via this map, so dynamic column writes are safe (closed set).

### Partial save
`POST /api/save-section` upserts an in-progress row keyed by a client-generated `submission_id` UUID. No `anonymous_token` is assigned until the user clicks **Submit** at the end, at which point `POST /api/submit` finalizes the same row in place — generating the token, computing scores, and flipping `completed = true`. This means abandoned submissions (which are most of them) become research data instead of being silently lost.

### Skip logic
Declarative predicates on `Question` and `SectionMeta` in [`lib/questions.ts`](lib/questions.ts) and helpers in [`lib/conditions.ts`](lib/conditions.ts). Examples: solo founders skip the cofounder section entirely; AUDIT-C alcohol follow-ups appear only if alcohol frequency ≥ Monthly; therapy follow-ups only show when "Have you ever worked with a therapist?" = Yes.

### Reverse-coded items
Marked with `reverseCoded: true` in `Question` metadata. The survey UI presents them unmarked; reversal happens at the analysis layer, not the survey layer.

### Attention check
A single `attentionCheck: true` item sits in the burnout section asking the respondent to select a specific scale value. Stored raw — flagged downstream during analysis, not used to block submission.

## Tests

```bash
pnpm test
```

Jest + Testing Library. Coverage focuses on scoring, the API routes, and Zod validation — not the survey UI itself.

## Authors

- **[Jason Shen](https://jasonshen.com)**
- **[Keegan Walden](https://www.linkedin.com/in/keegan-walden-ph-d-672ab9101/)**

## License

This survey is a screening tool, not a medical diagnosis. The instruments used (PHQ-9, GAD-7, ASRS, AQ-10, MBI-GS, Dirty Dozen, AUDIT-C) are public-domain or widely used in research; the founder-specific sections (Ambition Breadth, Founder Challenges, Cofounder Quality) are original to this project.

Code is open source — see the GitHub repo for license terms.
