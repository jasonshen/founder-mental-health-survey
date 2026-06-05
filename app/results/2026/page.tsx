import Link from "next/link";
import type { Metadata } from "next";
import PageChrome from "@/components/PageChrome";
import aggregates from "./aggregates.json";
import { CURATED_QUOTES } from "./quotes";

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

/* ─── Table of contents data ───────────────────────────────────────── */

const TOC = [
  { id: "demographics", num: "01", label: "Demographics" },
  { id: "companies", num: "02", label: "Their Companies" },
  { id: "life-outlook", num: "03", label: "Life Outlook" },
  { id: "challenges", num: "04", label: "Founder Challenges" },
  { id: "cofounder", num: "05", label: "Cofounder Relationship" },
  { id: "depression", num: "06", label: "Depression (PHQ-9)" },
  { id: "anxiety", num: "07", label: "Anxiety (GAD-7)" },
  { id: "burnout", num: "08", label: "Burnout (MBI-GS)" },
  { id: "adhd", num: "09", label: "ADHD (ASRS-6)" },
  { id: "ambition", num: "10", label: "Ambition & Motivation" },
  { id: "social-support", num: "11", label: "Social Support" },
  { id: "help-seeking", num: "12", label: "Help-Seeking" },
  { id: "medication", num: "13", label: "Medication" },
  { id: "substance-use", num: "14", label: "Substance Use" },
  { id: "personality", num: "15", label: "Personality" },
  { id: "neurodivergence", num: "16", label: "Neurodivergence" },
  { id: "voices", num: "17", label: "In Their Own Words" },
];

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

/* ─── Subscale card (for MBI) ──────────────────────────────────────── */

function SubscaleCard({
  composite,
  maxVal,
  description,
  baseline,
}: {
  composite: Composite;
  maxVal: number;
  description?: string;
  baseline?: { value: number; label: string };
}) {
  const fill = (composite.stats.mean / maxVal) * 100;
  return (
    <div className="subscale-card">
      <div className="subscale-name">{composite.label}</div>
      {description && (
        <div className="subscale-desc">{description}</div>
      )}
      <div className="subscale-track">
        <span className="subscale-fill" style={{ width: `${fill}%` }} />
        <span
          className="subscale-marker"
          style={{ left: `${(composite.stats.p25 / maxVal) * 100}%` }}
        />
        <span
          className="subscale-marker"
          style={{ left: `${(composite.stats.p75 / maxVal) * 100}%` }}
        />
        {baseline && (
          <span
            className="baseline-marker"
            style={{ left: `${(baseline.value / maxVal) * 100}%` }}
            title={`${baseline.label}: ${baseline.value}`}
          >
            <span className="baseline-flag">{baseline.label}</span>
          </span>
        )}
      </div>
      <div className="subscale-range-labels">
        <span>0</span>
        <span>{maxVal}</span>
      </div>
      <div className="subscale-stats">
        Mean <strong>{composite.stats.mean}</strong> ·
        Median {composite.stats.median} ·
        IQR {composite.stats.p25}–{composite.stats.p75} ·
        n = {composite.answered}
        {baseline && (
          <> · {baseline.label}: {baseline.value}</>
        )}
      </div>
    </div>
  );
}

/* ─── Trait scale bar (Life-Outlook-style for Dirty Dozen) ─────────── */

function TraitScaleBar({
  composite,
  maxVal,
  description,
  baseline,
}: {
  composite: Composite;
  maxVal: number;
  description?: string;
  baseline?: { value: number; label: string };
}) {
  const { mean, p25, p75 } = composite.stats;
  const left = (p25 / maxVal) * 100;
  const width = ((p75 - p25) / maxVal) * 100;
  const meanPos = (mean / maxVal) * 100;
  return (
    <div className="trait-item">
      <div className="trait-header">
        <span className="trait-name">{composite.label}</span>
        {description && <span className="trait-desc">{description}</span>}
      </div>
      <div className="trait-bar-wrap">
        <span className="scale-track-bg">
          <span className="scale-iqr" style={{ left: `${left}%`, width: `${width}%` }} />
          <span className="trait-diamond" style={{ left: `${meanPos}%` }} />
          {baseline && (
            <span
              className="trait-baseline"
              style={{ left: `${(baseline.value / maxVal) * 100}%` }}
              title={`${baseline.label}: ${baseline.value}`}
            />
          )}
        </span>
        <span className="scale-endpoints">
          <span>0</span><span>{maxVal}</span>
        </span>
      </div>
      <span className="trait-val">{mean}</span>
    </div>
  );
}

/* ─── Sorted challenge ranking ─────────────────────────────────────── */

function ChallengeRanking({ questions }: { questions: Question[] }) {
  const sorted = [...questions]
    .filter((q) => q.stats)
    .sort((a, b) => (b.stats!.mean) - (a.stats!.mean));
  return (
    <div className="challenges">
      {sorted.map((q) => {
        const fill = (q.stats!.mean / 4) * 100;
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

/* ─── Accordion section wrapper ────────────────────────────────────── */

function AccSection({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="acc-section" id={id} open>
      <summary className="acc-section-summary">
        <span className="acc-section-title">
          <span className="acc-section-num">{num}</span> {title}
        </span>
        <svg className="acc-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="acc-section-body">
        {children}
      </div>
    </details>
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

  // Pre-compute summary stats
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

  const lifeQ = (id: string) => sec("life_outlook")?.questions.find((x) => x.id === id);
  const hsQ = (id: string) => sec("help_seeking")?.questions.find((x) => x.id === id);
  const therapyYesPct = hsQ("hs_therapy_ever")?.options?.find((o) => o.label === "Yes")?.pct ?? 0;
  const coachYesPct = hsQ("hs_coach_ever")?.options?.find((o) => o.label === "Yes")?.pct ?? 0;
  const consideredPct = hsQ("hs_considered_no_go")?.options?.find((o) => o.label === "Yes")?.pct ?? 0;

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

      {/* ─── Table of contents ─────────────────────────────────────── */}

      <nav className="results-toc">
        <div className="toc-label">Navigation</div>
        <div className="toc-items">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="toc-item">
              <span className="toc-num">{t.num}</span>
              {t.label}
            </a>
          ))}
        </div>
      </nav>

      {/* ═══ §01 Demographics ══════════════════════════════════════════ */}

      <AccSection id="demographics" num="01" title="Demographics">
        <p>
          Who the founders behind these responses are — role, age, gender,
          and background.
        </p>
        {sec("demographics").questions.map((dq) => (
          <Distribution key={dq.id} q={dq} />
        ))}
      </AccSection>

      {/* ═══ §02 Their companies ═══════════════════════════════════════ */}

      <AccSection id="companies" num="02" title="Their Companies">
        <p>
          The companies they&apos;re running — community, industry, stage,
          and size.
        </p>
        <Distribution q={a.cohort} />
        {sec("company").questions.map((dq) => (
          <Distribution key={dq.id} q={dq} />
        ))}
      </AccSection>

      {/* ═══ §03 Life Outlook ══════════════════════════════════════════ */}

      <AccSection id="life-outlook" num="03" title="Life Outlook">
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
      </AccSection>

      {/* ═══ §04 Founder Challenges ════════════════════════════════════ */}

      <AccSection id="challenges" num="04" title="Founder Challenges">
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
      </AccSection>

      {/* ═══ §05 Cofounder Relationship ════════════════════════════════ */}

      <AccSection id="cofounder" num="05" title="Cofounder Relationship">
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
      </AccSection>

      {/* ═══ §06 Depression (PHQ-9) ════════════════════════════════════ */}

      <AccSection id="depression" num="06" title="Depression (PHQ-9)">
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
      </AccSection>

      {/* ═══ §07 Anxiety (GAD-7) ══════════════════════════════════════ */}

      <AccSection id="anxiety" num="07" title="Anxiety (GAD-7)">
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
      </AccSection>

      {/* ═══ §08 Burnout (MBI-GS) ═════════════════════════════════════ */}

      <AccSection id="burnout" num="08" title="Burnout (MBI-GS)">
        <p>
          The Maslach Burnout Inventory measures three dimensions on a 0–6
          frequency scale (0 = never, 6 = every day). Higher exhaustion and
          cynicism indicate more burnout; higher efficacy is protective.
        </p>
        <p className="section-insight">
          Founders report emotional exhaustion well above working-population
          norms — mean {mbiExhaust?.stats.mean}/6 vs. the normative
          mean of 2.16 (+1.05 SD), exceeding the &ldquo;high&rdquo;
          threshold of 2.89. Cynicism is also elevated at{" "}
          {mbiCynicism?.stats.mean}/6 vs. 1.41 (+1.03 SD), approaching the
          high threshold of 2.86. Professional efficacy remains healthy
          at {mbiEfficacy?.stats.mean}/6 (norm: 4.19). This pattern — high
          exhaustion with adequate efficacy — is characteristic of an
          &ldquo;Overextended&rdquo; burnout profile. The{" "}
          <span style={{ color: "var(--muted)" }}>▼</span> marker shows the
          general working population mean for comparison.
        </p>
        <div className="subscale-grid">
          {mbiExhaust && (
            <SubscaleCard
              composite={mbiExhaust}
              maxVal={6}
              description="How drained and depleted by work"
              baseline={{ value: 2.16, label: "Gen. pop." }}
            />
          )}
          {mbiCynicism && (
            <SubscaleCard
              composite={mbiCynicism}
              maxVal={6}
              description="Detachment and doubt about work's value"
              baseline={{ value: 1.41, label: "Gen. pop." }}
            />
          )}
          {mbiEfficacy && (
            <SubscaleCard
              composite={mbiEfficacy}
              maxVal={6}
              description="Confidence and accomplishment at work"
              baseline={{ value: 4.19, label: "Gen. pop." }}
            />
          )}
        </div>
        <p className="footnote">
          Population norms from the MBI Manual, 4th Ed. (Maslach, Jackson &amp;
          Leiter, 2018; N = 1,766 workers). &ldquo;High&rdquo; thresholds:
          Exhaustion &ge; 2.89, Cynicism &ge; 2.86, Efficacy &le; 4.30 (reverse-scored).
        </p>
      </AccSection>

      {/* ═══ §09 ADHD (ASRS-6) ════════════════════════════════════════ */}

      <AccSection id="adhd" num="09" title="Focus & Attention (ASRS-6)">
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
      </AccSection>

      {/* ═══ §10 Ambition & Motivation ═════════════════════════════════ */}

      <AccSection id="ambition" num="10" title="Ambition & Motivation">
        <p>
          What drives founders — how ambitious, what kind of success matters, and
          the deeper motivational regulation behind the work. All items use a
          five-point scale (0–4).
        </p>
        <p className="section-insight">
          Founders are highly ambitious (median {q("amb_ambitious")?.stats?.median}/4
          — &ldquo;strongly agree&rdquo;). The strongest
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
      </AccSection>

      {/* ═══ §11 Social Support ════════════════════════════════════════ */}

      <AccSection id="social-support" num="11" title="Social Support & Connection">
        <p>
          How many people founders can confide in, and how often they do.
        </p>
        {(() => {
          const confWork = q("ss_could_confide_work");
          const confPersonal = q("ss_could_confide_personal");
          const freqWork = q("ss_confide_work_freq");
          const freqPersonal = q("ss_confide_personal_freq");
          return confWork?.stats && confPersonal?.stats ? (
            <p className="section-insight">
              The median founder knows <strong>{confWork.stats.median}{" "}
              people</strong> they could confide in about work struggles and{" "}
              <strong>{confPersonal.stats.median}</strong> about personal
              struggles. In the past month, the median founder confided about
              work <strong>{freqWork?.stats?.median ?? "?"}{" "}
              times</strong> and about personal matters{" "}
              <strong>{freqPersonal?.stats?.median ?? "?"}{" "}
              times</strong>.
            </p>
          ) : null;
        })()}
        <div className="support-grid">
          {sec("social_support").questions.map((sq) => (
            <div key={sq.id} className="support-card">
              <div className="support-num">{sq.stats?.median ?? "—"}</div>
              <div className="support-label">{sq.text}</div>
              <div className="support-meta">
                median · mean {sq.stats?.mean ?? "—"} · IQR{" "}
                {sq.stats?.p25 ?? "—"}–{sq.stats?.p75 ?? "—"} · n = {sq.answered}
              </div>
            </div>
          ))}
        </div>
      </AccSection>

      {/* ═══ §12 Help-Seeking ══════════════════════════════════════════ */}

      <AccSection id="help-seeking" num="12" title="Help-Seeking & Support">
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
      </AccSection>

      {/* ═══ §13 Medication ════════════════════════════════════════════ */}

      <AccSection id="medication" num="13" title="Medication">
        <p>
          What psychiatric medications founders are currently taking. Respondents
          could select multiple options.
        </p>
        {sec("medication").questions.map((mq) => (
          <Distribution key={mq.id} q={mq} />
        ))}
      </AccSection>

      {/* ═══ §14 Substance Use ═════════════════════════════════════════ */}

      <AccSection id="substance-use" num="14" title="Substance Use">
        <p>
          Founders reported how often they used each substance in the past
          12 months. Two key metrics: <strong>any use</strong> (tried it at
          least once) and <strong>monthly or more</strong> (regular use).
        </p>
        {(() => {
          const subs = sec("substance_use")?.questions ?? [];

          // Compute derived metrics for each substance
          const rows = subs.map((sq) => {
            const opts = sq.options ?? [];
            const neverPct = opts.find((o) => o.label === "Never")?.pct ?? 100;
            const anyUse = Math.round((100 - neverPct) * 10) / 10;
            const monthlyPlus = opts
              .filter((o) => !["Never", "Once or twice"].includes(o.label))
              .reduce((sum, o) => sum + o.pct, 0);
            const shortText = sq.text
              .replace(/\(.*\)/, "")
              .replace(/".*"/, "")
              .trim();
            return { ...sq, shortText, anyUse, monthlyPlus: Math.round(monthlyPlus * 10) / 10 };
          }).sort((a, b) => b.anyUse - a.anyUse);

          const alcoholRow = rows.find((r) => r.id === "sub_alcohol");
          const cannabisRow = rows.find((r) => r.id === "sub_cannabis");
          const psychedelicIds = ["sub_psilocybin", "sub_mdma", "sub_lsd", "sub_ayahuasca", "sub_ketamine"];
          const anyPsychedelic = Math.round(
            (subs
              .filter((s) => psychedelicIds.includes(s.id))
              .reduce((max, s) => {
                const neverPct = s.options?.find((o) => o.label === "Never")?.pct ?? 100;
                return Math.max(max, 100 - neverPct);
              }, 0)) * 10
          ) / 10;

          return (
            <>
              <p className="section-insight">
                <strong>{alcoholRow?.anyUse}%</strong> of founders used
                alcohol in the past year, with{" "}
                <strong>{alcoholRow?.monthlyPlus}%</strong> drinking monthly
                or more. <strong>{cannabisRow?.anyUse}%</strong> used
                cannabis. Around <strong>1 in 4</strong> founders have tried
                a psychedelic (psilocybin is the most common
                at {rows.find((r) => r.id === "sub_psilocybin")?.anyUse}%),
                though regular psychedelic use is rare.
              </p>
              <div className="substance-table">
                <div className="substance-header-row">
                  <span className="substance-header-name">Substance</span>
                  <span className="substance-header-metric">Any use</span>
                  <span className="substance-header-metric">Monthly+</span>
                </div>
                {rows.map((r) => (
                  <div key={r.id} className="substance-row">
                    <span className="substance-name">{r.shortText}</span>
                    <span className="substance-cell">
                      <span className="substance-bar-wrap">
                        <span
                          className="substance-bar substance-bar-any"
                          style={{ width: `${r.anyUse}%` }}
                        />
                      </span>
                      <span className="substance-pct">{r.anyUse}%</span>
                    </span>
                    <span className="substance-cell">
                      <span className="substance-bar-wrap">
                        <span
                          className="substance-bar substance-bar-monthly"
                          style={{ width: `${r.monthlyPlus}%` }}
                        />
                      </span>
                      <span className="substance-pct">
                        {r.monthlyPlus > 0 ? `${r.monthlyPlus}%` : "—"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
        <p className="footnote">
          Past 12 months. &ldquo;Any use&rdquo; = at least once.
          &ldquo;Monthly+&rdquo; = monthly, weekly, or daily.
          n &asymp; {sec("substance_use")?.questions[0]?.answered}.
          &ldquo;Stimulants&rdquo; refers to non-prescribed use
          (e.g., Adderall without Rx, cocaine). &ldquo;Ketamine&rdquo;
          is recreational only (not prescribed/clinical).
        </p>
      </AccSection>

      {/* ═══ §15 Personality ═══════════════════════════════════════════ */}

      <AccSection id="personality" num="15" title="Personality (Dirty Dozen)">
        <p>
          The Dirty Dozen measures three personality traits on a 0–4
          agreement scale. The shaded region shows the middle 50% (P25–P75);
          the ◆ marks the founder mean;
          the <span style={{ color: "var(--muted)" }}>▼</span> marks the
          general population mean.
        </p>
        {(() => {
          const ddBaselines: Record<string, number> = {
            machiavellianism: 1.24,
            psychopathy: 1.14,
            narcissism: 1.60,
          };
          const ddDesc: Record<string, string> = {
            machiavellianism: "Strategic manipulation & self-interest",
            psychopathy: "Emotional detachment & moral flexibility",
            narcissism: "Need for admiration & special status",
          };
          const machComp = sec("dark_triad")?.composites?.find((c) => c.id === "machiavellianism");
          const narcComp = sec("dark_triad")?.composites?.find((c) => c.id === "narcissism");
          const psychComp = sec("dark_triad")?.composites?.find((c) => c.id === "psychopathy");
          return (
            <>
              <p className="section-insight">
                Founders score slightly above population norms on
                Machiavellianism ({machComp?.stats.mean} vs. 1.24) and
                Narcissism ({narcComp?.stats.mean} vs. 1.60) — consistent
                with research showing entrepreneurs at roughly the 63rd
                percentile on narcissism. Psychopathy is at or below the
                general population level ({psychComp?.stats.mean} vs. 1.14).
              </p>
              <div className="trait-list">
                {sec("dark_triad")?.composites?.map((c) => (
                  <TraitScaleBar
                    key={c.id}
                    composite={c}
                    maxVal={4}
                    description={ddDesc[c.id] ?? c.description}
                    baseline={
                      ddBaselines[c.id] != null
                        ? { value: ddBaselines[c.id], label: "Gen. pop." }
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          );
        })()}
        <p className="footnote">
          The Dirty Dozen (Jonason &amp; Webster, 2010) is a brief measure of
          subclinical dark personality traits. Population norms from Czarna et al.
          (2016; N = 634; converted from 1–5 to 0–4 scale). Entrepreneur
          narcissism context from Hmieleski &amp; Lerner (2016). Scores are
          descriptive, not diagnostic. n = {sec("dark_triad")?.composites?.[0]?.answered}.
        </p>
      </AccSection>

      {/* ═══ §16 Neurodivergence ═══════════════════════════════════════ */}

      <AccSection id="neurodivergence" num="16" title="Neurodivergence Diagnoses">
        <p>
          Self-reported formal diagnoses of ADHD, autism, and other
          neurodivergent conditions.
        </p>
        {sec("autism")?.questions
          .filter((aq) => aq.id.startsWith("nd_"))
          .map((aq) => <Distribution key={aq.id} q={aq} />)}
      </AccSection>

      {/* ═══ §17 In Their Own Words ════════════════════════════════════ */}

      <AccSection id="voices" num="17" title="In Their Own Words">
        <p>
          A curated selection of anonymous open-ended responses to
          &ldquo;Is there anything else about your mental health, wellbeing, or
          life as a founder that you&apos;d like to share?&rdquo;
        </p>
        <div className="quotes-grid">
          {CURATED_QUOTES.map((quote, i) => (
            <blockquote key={i} className="founder-quote">
              <p>{quote.text}</p>
              <footer className="quote-footer">
                <cite className="quote-theme">{quote.theme}</cite>
                <span className="quote-bio">{quote.bio}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </AccSection>

      {/* ═══ Methodology ══════════════════════════════════════════════ */}

      <section className="section" style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 14 }}>Methodology note</h3>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Figures are percentages of respondents who answered each question
          ({"​n"} varies by question as not everyone finished every section).
          Composite scores (PHQ-9, GAD-7, ASRS, MBI) require &ge;70% of items
          answered; missing items are prorated. Aggregate counts
          only — no individual responses are shared. Open-ended quotes are
          curated for representativeness; no identifying information is
          included. All respondents consented to anonymous data collection;
          the survey was open April 27 – May 31, 2026.
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
