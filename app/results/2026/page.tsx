import Link from "next/link";
import type { Metadata } from "next";
import PageChrome from "@/components/PageChrome";
import aggregates from "./aggregates.json";

export const metadata: Metadata = {
  title: "2026 Results — Founder Mental Health Survey",
  description:
    "Aggregate results from the 2026 Founder Mental Health Survey: demographics, mental health screeners, burnout, ADHD, challenges, and more.",
};

/* ─── Types (shape of aggregates.json) ─────────────────────────────── */

interface Opt {
  label: string;
  count: number;
  pct: number;
}
interface Question {
  id: string;
  text: string;
  kind: "categorical" | "numeric" | "ordinal" | "scale";
  answered: number;
  options?: Opt[];
  stats?: { median: number; mean: number; min: number; max: number; p25: number; p75: number };
  buckets?: Opt[];
}
interface Composite {
  id: string;
  label: string;
  description: string;
  range: [number, number];
  answered: number;
  stats: { median: number; mean: number; p25: number; p75: number; min: number; max: number };
  severity?: Opt[];
}
interface Section {
  title: string;
  questions: Question[];
  composites?: Composite[];
}

/* ─── Shared chart components ──────────────────────────────────────── */

function Bar({ opt, max, lead }: { opt: Opt; max: number; lead: boolean }) {
  const width = max > 0 ? Math.max((opt.pct / max) * 100, 1.5) : 0;
  return (
    <div className={`dist-row${lead ? " lead" : ""}`}>
      <span className="dist-label">{opt.label}</span>
      <span className="dist-track">
        <span className="dist-fill" style={{ width: `${width}%` }} />
      </span>
      <span className="dist-val">
        {opt.pct}%<span className="dist-ct">{opt.count}</span>
      </span>
    </div>
  );
}

function Distribution({ q }: { q: Question }) {
  const rows = q.kind === "numeric" ? q.buckets ?? [] : q.options ?? [];
  const max = Math.max(...rows.map((r) => r.pct), 0);
  const leadPct = Math.max(...rows.map((r) => r.pct), -1);
  return (
    <div className="dist">
      <div className="dist-h">
        <p className="dist-q">{q.text}</p>
        <span className="dist-n">n = {q.answered}</span>
      </div>
      {q.kind === "numeric" && q.stats && (
        <p className="dist-stats">
          Median <strong>{q.stats.median}</strong> · Mean{" "}
          <strong>{q.stats.mean}</strong> · Range{" "}
          <strong>
            {q.stats.min}–{q.stats.max}
          </strong>
        </p>
      )}
      {rows.map((opt) => (
        <Bar key={opt.label} opt={opt} max={max} lead={opt.pct === leadPct} />
      ))}
    </div>
  );
}

/* ─── Scale bar (0–10 items: shows range + median dot) ─────────────── */

function ScaleBar({ q }: { q: Question }) {
  if (!q.stats) return null;
  const { median, p25, p75 } = q.stats;
  const left = (p25 / 10) * 100;
  const width = ((p75 - p25) / 10) * 100;
  const dot = (median / 10) * 100;
  return (
    <div className="scale-item">
      <span className="scale-text">{q.text}</span>
      <div className="scale-bar-wrap">
        <span className="scale-track-bg">
          <span className="scale-iqr" style={{ left: `${left}%`, width: `${width}%` }} />
          <span className="scale-dot" style={{ left: `${dot}%` }} />
        </span>
        <span className="scale-endpoints">
          <span>0</span><span>10</span>
        </span>
      </div>
      <span className="scale-median">{median}</span>
    </div>
  );
}

/* ─── Severity band chart (for composite scores) ──────────────────── */

const SEVERITY_COLORS = ["#2d9d4e", "#8ab63f", "#e8a838", "#d96136", "#c0392b"];

function SeverityChart({ composite }: { composite: Composite }) {
  if (!composite.severity) return null;
  return (
    <div className="composite-card">
      <div className="composite-header">
        <div className="composite-title">{composite.label}</div>
        <div className="composite-meta">
          Median <strong>{composite.stats.median}</strong> · IQR{" "}
          <strong>{composite.stats.p25}–{composite.stats.p75}</strong> · n = {composite.answered}
        </div>
      </div>
      <div className="severity-track">
        {composite.severity.map((band, i) => (
          <div
            key={band.label}
            className="severity-seg"
            style={{
              width: `${Math.max(band.pct, 1.5)}%`,
              background: SEVERITY_COLORS[i] ?? SEVERITY_COLORS[SEVERITY_COLORS.length - 1],
            }}
            title={`${band.label}: ${band.pct}%`}
          />
        ))}
      </div>
      <div className="severity-legend">
        {composite.severity.map((band, i) => (
          <span key={band.label} className="severity-label">
            <span className="severity-dot" style={{ background: SEVERITY_COLORS[i] ?? "#999" }} />
            {band.label} <strong>{band.pct}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Subscale card (for MBI, Dark Triad) ─────────────────────────── */

function SubscaleCard({ composite, maxVal }: { composite: Composite; maxVal: number }) {
  const fill = (composite.stats.mean / maxVal) * 100;
  return (
    <div className="subscale-card">
      <div className="subscale-name">{composite.label}</div>
      <div className="subscale-track">
        <span className="subscale-fill" style={{ width: `${fill}%` }} />
      </div>
      <div className="subscale-stats">
        Mean <strong>{composite.stats.mean}</strong> / {maxVal} ·
        Median {composite.stats.median} ·
        IQR {composite.stats.p25}–{composite.stats.p75}
      </div>
    </div>
  );
}

/* ─── Sorted challenge ranking ─────────────────────────────────────── */

function ChallengeRanking({ questions }: { questions: Question[] }) {
  const sorted = [...questions]
    .filter((q) => q.stats)
    .sort((a, b) => (b.stats!.mean) - (a.stats!.mean));
  const maxMean = Math.max(...sorted.map((q) => q.stats!.mean), 0);
  return (
    <div className="challenges">
      {sorted.map((q) => {
        const fill = maxMean > 0 ? (q.stats!.mean / 4) * 100 : 0;
        // Shorten text for display
        const label = q.text.replace(/^I (am |feel |struggle to |have |keep )?/, "")
          .replace(/\.$/, "");
        return (
          <div key={q.id} className="challenge-row">
            <span className="challenge-label">{label}</span>
            <span className="dist-track">
              <span className="dist-fill" style={{ width: `${fill}%` }} />
            </span>
            <span className="challenge-val">
              {q.stats!.mean.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function Results2026Page() {
  const a = aggregates as unknown as {
    generatedAt: string;
    totals: { responses: number; completed: number; yc: number; general: number };
    cohort: Question;
    sections: Record<string, Section>;
  };
  const { totals } = a;
  const ycPct = Math.round((totals.yc / (totals.yc + totals.general)) * 100);

  // Convenience accessors
  const sec = (id: string) => a.sections[id];
  const q = (id: string): Question | undefined => {
    for (const s of Object.values(a.sections)) {
      const found = s.questions.find((x) => x.id === id);
      if (found) return found;
    }
    return undefined;
  };

  // Pre-compute some summary stats for text
  const phq9 = sec("depression")?.composites?.[0];
  const gad7 = sec("anxiety")?.composites?.[0];
  const asrs = sec("adhd")?.composites?.[0];
  const mbiExhaust = sec("burnout")?.composites?.[0];
  const mbiCynicism = sec("burnout")?.composites?.[1];
  const mbiEfficacy = sec("burnout")?.composites?.[2];

  const phq9ModPlus = phq9?.severity
    ? phq9.severity.slice(2).reduce((s, b) => s + b.pct, 0)
    : 0;
  const gad7ModPlus = gad7?.severity
    ? gad7.severity.slice(2).reduce((s, b) => s + b.pct, 0)
    : 0;
  const asrsHigh = asrs?.severity?.[2]?.pct ?? 0;

  // Life outlook helpers
  const lifeQ = (id: string) => sec("life_outlook")?.questions.find((x) => x.id === id);

  // Help-seeking helpers
  const hsQ = (id: string) => sec("help_seeking")?.questions.find((x) => x.id === id);
  const therapyEver = hsQ("hs_therapy_ever");
  const therapyYesPct = therapyEver?.options?.find((o) => o.label === "Yes")?.pct ?? 0;
  const coachEver = hsQ("hs_coach_ever");
  const coachYesPct = coachEver?.options?.find((o) => o.label === "Yes")?.pct ?? 0;
  const consideredNoGo = hsQ("hs_considered_no_go");
  const consideredPct = consideredNoGo?.options?.find((o) => o.label === "Yes")?.pct ?? 0;

  return (
    <PageChrome
      left="FMHS · 2026 Results"
      right="Aggregate · Anonymous"
      theme="slate"
    >
      <p className="eyebrow">The Founder Mental Health Survey</p>
      <h1 className="fmhs-title">
        2026 Results<span className="accent">.</span>
      </h1>
      <p className="fmhs-deck">
        {totals.responses} founders took the survey before it closed May 31. Below
        is the full picture — who they are, what they&apos;re building, and how
        they&apos;re doing across validated clinical screeners and
        founder-specific dimensions.
      </p>

      {/* ─── Stat band ─────────────────────────────────────────────── */}

      <div className="stat-band">
        <div className="stat-cell">
          <div className="stat-num">{totals.responses}</div>
          <div className="stat-lab">Total respondents</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{totals.completed}</div>
          <div className="stat-lab">Completed every section</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{ycPct}%</div>
          <div className="stat-lab">YC founders</div>
        </div>
      </div>

      {/* ═══ §01 Demographics ══════════════════════════════════════════ */}

      <section className="section">
        <h3>01 · Demographics</h3>
        <p>
          Who the founders behind these responses are — role, age, gender,
          and background.
        </p>
        {sec("demographics").questions.map((dq) => (
          <Distribution key={dq.id} q={dq} />
        ))}
      </section>

      {/* ═══ §02 Their companies ═══════════════════════════════════════ */}

      <section className="section">
        <h3>02 · Their companies</h3>
        <p>
          The companies they&apos;re running — community, industry, stage,
          and size.
        </p>
        <Distribution q={a.cohort} />
        {sec("company").questions.map((dq) => (
          <Distribution key={dq.id} q={dq} />
        ))}
      </section>

      {/* ═══ §03 Life Outlook ══════════════════════════════════════════ */}

      <section className="section">
        <h3>03 · Life Outlook</h3>
        <p>
          How founders rate their well-being on a 0–10 scale. The bar shows the
          middle 50% of responses (P25–P75); the dot marks the median.
        </p>
        <p className="section-insight">
          Founders report moderate life satisfaction
          (median {lifeQ("life_satisfaction")?.stats?.median}/10) and a strong
          sense that their work is worthwhile
          ({lifeQ("life_worthwhile")?.stats?.median}/10). But self-rated mental
          health is lower ({lifeQ("life_mental_health")?.stats?.median}/10),
          and many feel alone carrying the weight of the
          company (median {lifeQ("life_alone")?.stats?.median}/10).
        </p>

        <div className="subsection-label">Well-being</div>
        {["life_satisfaction", "life_happy", "life_worthwhile", "life_purpose"].map(
          (id) => { const sq = lifeQ(id); return sq ? <ScaleBar key={id} q={sq} /> : null; }
        )}

        <div className="subsection-label">Life domains</div>
        {["life_relationships_satisfying", "life_physical_health", "life_mental_health"].map(
          (id) => { const sq = lifeQ(id); return sq ? <ScaleBar key={id} q={sq} /> : null; }
        )}

        <div className="subsection-label">Founder experience</div>
        {["life_have_to", "life_alone"].map(
          (id) => { const sq = lifeQ(id); return sq ? <ScaleBar key={id} q={sq} /> : null; }
        )}
        <p className="footnote" style={{ marginTop: 8 }}>
          Higher = more agreement for all items. For the &ldquo;founder
          experience&rdquo; items, higher values indicate more frustration.
        </p>
      </section>

      {/* ═══ §04 Founder Challenges ════════════════════════════════════ */}

      <section className="section">
        <h3>04 · Founder Challenges</h3>
        <p>
          Founders rated each challenge on a 0–4 scale
          (0 = &ldquo;not a challenge,&rdquo; 4 = &ldquo;major challenge&rdquo;).
          Sorted by severity.
        </p>
        <p className="section-insight">
          Growth tops the list — &ldquo;we are not growing fast
          enough&rdquo; averages {q("fc_growth")?.stats?.mean.toFixed(1)}/4.
          Operational overwhelm and team speed follow. Board/investor conflict
          is the least-reported challenge (mean {q("fc_board_conflict")?.stats?.mean.toFixed(1)}).
        </p>
        <ChallengeRanking questions={sec("founder_challenges").questions} />
        <p className="footnote">
          Scale: 0 = not a challenge, 1 = minor, 2 = moderate, 3 = significant,
          4 = major. &ldquo;Cofounder friction&rdquo; shown only for cofounded
          companies (n = {q("fc_cofounder_friction")?.answered}).
        </p>
      </section>

      {/* ═══ §05 Cofounder Relationship ════════════════════════════════ */}

      <section className="section">
        <h3>05 · Cofounder Relationship</h3>
        <p>
          Among cofounded teams, how founders rate the health and dynamics of
          their primary cofounder relationship. Likert items use a 0–4 agree
          scale; overall health is 0–10.
        </p>
        {(() => {
          const cfHealth = q("cf_overall_health");
          return cfHealth?.stats ? (
            <p className="section-insight">
              The median cofounder relationship health
              is <strong>{cfHealth.stats.median}/10</strong> (IQR{" "}
              {cfHealth.stats.p25}–{cfHealth.stats.p75}). Trust and psychological
              safety are generally strong: most cofounders can raise difficult
              topics and share doubts openly.
            </p>
          ) : null;
        })()}
        {sec("cofounder").questions
          .filter((cq) => cq.id === "cf_overall_health")
          .map((cq) => <ScaleBar key={cq.id} q={cq} />)}
        {sec("cofounder").questions
          .filter((cq) => !["cf_gender", "cf_role", "cf_overall_health"].includes(cq.id))
          .map((cq) => <Distribution key={cq.id} q={cq} />)}
      </section>

      {/* ═══ §06 Depression (PHQ-9) ════════════════════════════════════ */}

      <section className="section">
        <h3>06 · Depression Screening (PHQ-9)</h3>
        <p>
          The PHQ-9 is a validated screener for depression severity.
          Scores range from 0 (no symptoms) to 27 (severe).
        </p>
        <p className="section-insight">
          The median PHQ-9 score is <strong>{phq9?.stats.median}</strong> (mild
          range). But <strong>{Math.round(phq9ModPlus)}%</strong> of founders
          score in the moderate-to-severe range (10+), compared to roughly 8%
          in the general population.
        </p>
        {phq9 && <SeverityChart composite={phq9} />}
      </section>

      {/* ═══ §07 Anxiety (GAD-7) ══════════════════════════════════════ */}

      <section className="section">
        <h3>07 · Anxiety Screening (GAD-7)</h3>
        <p>
          The GAD-7 is a validated screener for generalized anxiety disorder.
          Scores range from 0 to 21.
        </p>
        <p className="section-insight">
          The median GAD-7 score is <strong>{gad7?.stats.median}</strong>.{" "}
          <strong>{Math.round(gad7ModPlus)}%</strong> of founders score in the
          moderate-to-severe range (10+), roughly 5&times; the general population
          rate.
        </p>
        {gad7 && <SeverityChart composite={gad7} />}
      </section>

      {/* ═══ §08 Burnout (MBI-GS) ═════════════════════════════════════ */}

      <section className="section">
        <h3>08 · Burnout (MBI-GS)</h3>
        <p>
          The Maslach Burnout Inventory measures three dimensions on a 0–6
          frequency scale (0 = never, 6 = every day). Higher exhaustion and
          cynicism indicate more burnout; higher efficacy is protective.
        </p>
        <p className="section-insight">
          Founders report high emotional exhaustion (mean{" "}
          {mbiExhaust?.stats.mean}/6 — between &ldquo;a few times a
          month&rdquo; and &ldquo;once a week&rdquo;) but maintain strong
          professional efficacy ({mbiEfficacy?.stats.mean}/6). Cynicism sits in
          the middle at {mbiCynicism?.stats.mean}/6.
        </p>
        <div className="subscale-grid">
          {mbiExhaust && <SubscaleCard composite={mbiExhaust} maxVal={6} />}
          {mbiCynicism && <SubscaleCard composite={mbiCynicism} maxVal={6} />}
          {mbiEfficacy && <SubscaleCard composite={mbiEfficacy} maxVal={6} />}
        </div>
      </section>

      {/* ═══ §09 ADHD (ASRS-6) ════════════════════════════════════════ */}

      <section className="section">
        <h3>09 · Focus & Attention (ASRS-6)</h3>
        <p>
          The ASRS-6 is a screening tool for adult ADHD. Items are rated
          0–4 (never to very often); higher total scores suggest more
          ADHD-related traits.
        </p>
        <p className="section-insight">
          <strong>{asrsHigh}%</strong> of founders score in the high range
          (14+) on the ASRS-6, and another{" "}
          {asrs?.severity?.[1]?.pct ?? 0}% in the moderate range.
          {sec("autism")?.questions.find((aq) => aq.id === "nd_adhd_diagnosis")?.options?.[0]?.pct
            ? ` Among respondents, ${sec("autism").questions.find((aq) => aq.id === "nd_adhd_diagnosis")!.options![0].pct}% report a formal ADHD diagnosis.`
            : ""}
        </p>
        {asrs && <SeverityChart composite={asrs} />}
      </section>

      {/* ═══ §10 Ambition & Motivation ═════════════════════════════════ */}

      <section className="section">
        <h3>10 · Ambition & Motivation</h3>
        <p>
          What drives founders — how ambitious, what kind of success matters, and
          the deeper motivational regulation behind the work. All items use a
          0–4 agree/importance scale.
        </p>
        <p className="section-insight">
          Founders are highly ambitious (median {q("amb_ambitious")?.stats?.median}/4
          &ldquo;agree&rdquo; or &ldquo;strongly agree&rdquo;). The strongest
          motivations are autonomous — genuinely valuing the work (median{" "}
          {q("reg_identified")?.stats?.median}/4) and finding it enjoyable
          (median {q("reg_intrinsic")?.stats?.median}/4). External pressure
          and guilt-driven motivation are less common.
        </p>

        <div className="subsection-label">Drive intensity</div>
        {["amb_ambitious", "amb_strive", "amb_challenging_goals"].map(
          (id) => { const aq = q(id); return aq ? <Distribution key={id} q={aq} /> : null; }
        )}

        <div className="subsection-label">Why they work on this company</div>
        {[
          "reg_intrinsic", "reg_integrated", "reg_identified",
          "reg_introjected", "reg_external_approach", "reg_external_avoid",
          "reg_amotivation",
        ].map(
          (id) => { const aq = q(id); return aq ? <Distribution key={id} q={aq} /> : null; }
        )}

        <div className="subsection-label">What success means</div>
        {["asp_helping", "asp_self_knowledge", "asp_financial", "asp_admiration"].map(
          (id) => { const aq = q(id); return aq ? <Distribution key={id} q={aq} /> : null; }
        )}
      </section>

      {/* ═══ §11 Social Support ════════════════════════════════════════ */}

      <section className="section">
        <h3>11 · Social Support & Connection</h3>
        <p>
          How many people founders can confide in, and how often they do.
        </p>
        {(() => {
          const confWork = q("ss_could_confide_work");
          const confPersonal = q("ss_could_confide_personal");
          return confWork?.stats && confPersonal?.stats ? (
            <p className="section-insight">
              The median founder knows <strong>{confWork.stats.median}{" "}
              people</strong> they could confide in about work struggles and{" "}
              <strong>{confPersonal.stats.median}</strong> about personal
              struggles. In the past month, the median founder confided about
              work <strong>{q("ss_confide_work_freq")?.stats?.median ?? "?"}{" "}
              times</strong> and about personal matters{" "}
              <strong>{q("ss_confide_personal_freq")?.stats?.median ?? "?"}{" "}
              times</strong>.
            </p>
          ) : null;
        })()}
        <div className="stat-band" style={{ marginBottom: 16 }}>
          {sec("social_support").questions.map((sq) => (
            <div key={sq.id} className="stat-cell">
              <div className="stat-num">{sq.stats?.median ?? "—"}</div>
              <div className="stat-lab">
                {sq.text.length > 60 ? sq.text.slice(0, 60) + "..." : sq.text}
                <br /><span style={{ fontSize: 11 }}>median (n = {sq.answered})</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ §12 Help-Seeking ══════════════════════════════════════════ */}

      <section className="section">
        <h3>12 · Help-Seeking & Support</h3>
        <p>
          Founders&apos; experience with therapy, coaching, and barriers to
          seeking help.
        </p>
        <p className="section-insight">
          <strong>{therapyYesPct}%</strong> of founders have worked with a
          therapist at some point, and <strong>{coachYesPct}%</strong> have
          worked with a professional coach.{" "}
          <strong>{consideredPct}%</strong> considered seeking mental health
          support in the past year but didn&apos;t.
        </p>
        <div className="stat-band" style={{ marginBottom: 16 }}>
          <div className="stat-cell">
            <div className="stat-num">{therapyYesPct}%</div>
            <div className="stat-lab">Have done therapy</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">{coachYesPct}%</div>
            <div className="stat-lab">Have worked with a coach</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">{consideredPct}%</div>
            <div className="stat-lab">Considered but didn&apos;t go</div>
          </div>
        </div>
        {(() => {
          const barriers = sec("help_seeking")?.questions.find((bq) => bq.id === "hs_barriers");
          return barriers ? (
            <>
              <div className="subsection-label">What got in the way?</div>
              <Distribution q={barriers} />
            </>
          ) : null;
        })()}
        {(() => {
          const therapyImpact = hsQ("hs_therapy_impact");
          const coachImpact = hsQ("hs_coach_impact");
          return (therapyImpact?.stats || coachImpact?.stats) ? (
            <>
              <div className="subsection-label">Impact ratings (0–10)</div>
              {therapyImpact && <ScaleBar q={therapyImpact} />}
              {coachImpact && <ScaleBar q={coachImpact} />}
            </>
          ) : null;
        })()}
      </section>

      {/* ═══ §13 Medication ════════════════════════════════════════════ */}

      <section className="section">
        <h3>13 · Medication</h3>
        <p>
          What psychiatric medications founders are currently taking. Respondents
          could select multiple options.
        </p>
        {sec("medication").questions.map((mq) => (
          <Distribution key={mq.id} q={mq} />
        ))}
      </section>

      {/* ═══ §14 Substance Use ═════════════════════════════════════════ */}

      <section className="section">
        <h3>14 · Substance Use</h3>
        <p>
          How often founders used various substances in the past 12 months,
          on a 0–5 frequency scale (0 = never, 5 = daily or near-daily).
        </p>
        {(() => {
          const subs = sec("substance_use")?.questions.filter((sq) => sq.stats) ?? [];
          const sorted = [...subs].sort((a, b) => (b.stats!.mean) - (a.stats!.mean));
          return (
            <div className="substance-grid">
              {sorted.map((sq) => {
                const fill = (sq.stats!.mean / 5) * 100;
                const shortText = sq.text
                  .replace(/\(.*\)/, "")
                  .replace(/".*"/, "")
                  .trim();
                return (
                  <div key={sq.id} className="challenge-row">
                    <span className="challenge-label">{shortText}</span>
                    <span className="dist-track">
                      <span className="dist-fill" style={{ width: `${fill}%` }} />
                    </span>
                    <span className="challenge-val">{sq.stats!.mean.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <p className="footnote">
          Scale: 0 = never, 1 = once or twice, 2 = monthly, 3 = weekly,
          4 = 2–3&times;/week, 5 = daily. Mean frequency shown.
        </p>
      </section>

      {/* ═══ §15 Personality ═══════════════════════════════════════════ */}

      <section className="section">
        <h3>15 · Personality (Dirty Dozen)</h3>
        <p>
          The Dirty Dozen measures Machiavellianism, psychopathy, and narcissism
          on a 0–4 agree scale. Subscale scores are the mean of 4 items each.
        </p>
        <div className="subscale-grid">
          {sec("dark_triad")?.composites?.map((c) => (
            <SubscaleCard key={c.id} composite={c} maxVal={4} />
          ))}
        </div>
      </section>

      {/* ═══ §16 Neurodivergence ═══════════════════════════════════════ */}

      <section className="section">
        <h3>16 · Neurodivergence Diagnoses</h3>
        <p>
          Self-reported formal diagnoses of ADHD, autism, and other
          neurodivergent conditions.
        </p>
        {sec("autism")?.questions
          .filter((aq) => aq.id.startsWith("nd_"))
          .map((aq) => <Distribution key={aq.id} q={aq} />)}
      </section>

      {/* ═══ Footer ═══════════════════════════════════════════════════ */}

      <section className="section">
        <h3>Methodology note</h3>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Figures are percentages of respondents who answered each question
          ({"​n"} varies by question as not everyone finished every section).
          Composite scores (PHQ-9, GAD-7, ASRS, MBI) require &ge;70% of items
          answered; missing items are prorated. Aggregate counts
          only — no individual responses are shared. All respondents
          consented to anonymous data collection; the survey was open
          April 27 – May 31, 2026.
        </p>
      </section>

      <div className="nav-row">
        <Link href="/" className="btn-link">
          &larr; Back to about
        </Link>
        <span className="btn-meta">Updated {a.generatedAt}</span>
      </div>
    </PageChrome>
  );
}
