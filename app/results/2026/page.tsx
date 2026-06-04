import Link from "next/link";
import type { Metadata } from "next";
import PageChrome from "@/components/PageChrome";
import aggregates from "./aggregates.json";

export const metadata: Metadata = {
  title: "2026 Results — Founder Mental Health Survey",
  description:
    "Aggregate results from the 2026 Founder Mental Health Survey: who responded and the companies they're building. More sections coming soon.",
};

/* ----- types (shape of aggregates.json) ----- */
interface Opt {
  label: string;
  count: number;
  pct: number;
}
interface Question {
  id: string;
  text: string;
  kind: "categorical" | "numeric";
  answered: number;
  options?: Opt[];
  stats?: { median: number; mean: number; min: number; max: number };
  buckets?: Opt[];
}
interface Section {
  title: string;
  questions: Question[];
}

/* A single horizontal bar row. Bars scale to the largest share in the
   question so small distributions stay legible; the printed value is the
   true percentage. */
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

export default function Results2026Page() {
  const a = aggregates as unknown as {
    generatedAt: string;
    totals: { responses: number; completed: number; yc: number; general: number };
    cohort: Question;
    sections: { demographics: Section; company: Section };
  };
  const { totals } = a;
  const ycPct = Math.round((totals.yc / (totals.yc + totals.general)) * 100);

  return (
    <PageChrome
      left="FMHS · 2026 Results"
      right="Aggregate · Anonymous"
      theme="slate"
    >
        <p className="eyebrow">The Founder Mental Health Survey</p>
        <h1 className="fmhs-title">
          Who responded in 2026<span className="accent">.</span>
        </h1>
        <p className="fmhs-deck">
          The survey is closed. Below is the first look at the{" "}
          {totals.responses} founders who took part — who they are and what
          they&apos;re building. We&apos;ll publish the clinical and
          founder-specific findings here as additional sections over the
          coming weeks.
        </p>

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

        <section className="section">
          <h3>01 · Demographics</h3>
          <p>
            Who the founders behind these responses are — role, age, gender,
            and background.
          </p>
          {a.sections.demographics.questions.map((q) => (
            <Distribution key={q.id} q={q} />
          ))}
        </section>

        <section className="section">
          <h3>02 · Their companies</h3>
          <p>
            The companies they&apos;re running — community, industry, stage,
            and size.
          </p>
          <Distribution q={a.cohort} />
          {a.sections.company.questions.map((q) => (
            <Distribution key={q.id} q={q} />
          ))}
        </section>

        <section className="section">
          <h3>More to come</h3>
          <p>
            Future sections will cover the validated clinical screeners
            (depression, anxiety, ADHD, autism traits, burnout) and the
            founder-specific dimensions — cofounder relationships, ambition,
            help-seeking, and more. Check back soon.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Figures are percentages of respondents who answered each question
            ({"n"} varies by question as not everyone finished). Aggregate
            counts only — no individual responses are shared.
          </p>
        </section>

      <div className="nav-row">
        <Link href="/" className="btn-link">
          ← Back to about
        </Link>
        <span className="btn-meta">Updated {a.generatedAt}</span>
      </div>
    </PageChrome>
  );
}
