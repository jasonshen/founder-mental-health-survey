import Link from "next/link";
import AuthorPair from "@/components/AuthorPair";
import QuoteRotator from "@/components/QuoteRotator";

function Plus() {
  return (
    <svg
      className="plus"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <rect className="plus-h" x="2" y="8" width="14" height="2" rx="1" fill="currentColor" />
      <rect className="plus-v" x="8" y="2" width="2" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

function ScreenerList() {
  return (
    <div className="screeners">
      <span className="screener">
        PHQ-9<span className="lab">depression</span>
      </span>
      <span className="screener">
        GAD-7<span className="lab">anxiety</span>
      </span>
      <span className="screener">
        ASRS<span className="lab">ADHD traits</span>
      </span>
      <span className="screener">
        AQ-10<span className="lab">autism spectrum traits</span>
      </span>
      <span className="screener">
        MBI-GS<span className="lab">burnout</span>
      </span>
    </div>
  );
}

export default function GeneralLandingPage() {
  return (
    <div className="v v-research theme-slate">
      <div className="page">
        <div className="label-row">
          <span className="left">
            FMHS · 2026 Research <span className="tick">●</span>
          </span>
          <span>Confidential · Anonymous · ~10 min</span>
        </div>

        <h1 className="title title-l serif">
          The Founder Mental Health Survey<span className="accent">.</span>
        </h1>

        <p className="lede" style={{ marginTop: 28 }}>
          An anonymous community survey of mental health &amp; well-being for
          startup founders everywhere. Validated clinical screeners (PHQ-9,
          GAD-7, ASRS, AQ-10, MBI-GS) plus founder-specific dimensions of
          ambition, personality, and relationships.
        </p>

        <QuoteRotator variant="rail" label="Real founder quotes" />

        <div className="tagrow">
          <span className="t first">~10 mins</span>
          <span className="t">Compare results to your peers</span>
          <span className="t">Expand understanding of founder mental health</span>
        </div>

        <div className="cta-row">
          <Link href="/results/2026" className="btn">
            See the 2026 results →
          </Link>
          <span className="btn-meta">
            266 founders and counting ·{" "}
            <Link href="/survey/begin?cohort=general" style={{ color: "var(--orange)", textDecoration: "underline" }}>
              Take the survey
            </Link>
          </span>
        </div>

        <div className="acc-list">
          <details className="acc">
            <summary>
              <Plus />
              <span>Why this exists</span>
            </summary>
            <div className="acc-body">
              <p>
                Founders carry a psychological burden that&apos;s mostly
                invisible — to investors, to employees, to family, often to
                themselves. Cofounder conflict, identity-merge with the company,
                money pressure, isolation, the relentless self-judgment.
              </p>
              <p>
                When you see your own results next to other founders&apos;, the
                loneliest stuff stops feeling so unique. You&apos;re not the
                outlier you think you are.
              </p>
              <p>
                Aggregate results will be published openly so the founder
                community has a clearer picture of what mental health and
                well-being actually look like at this stage.
              </p>
            </div>
          </details>

          <details className="acc">
            <summary>
              <Plus />
              <span>What it measures</span>
            </summary>
            <div className="acc-body">
              <p>
                Validated clinical screeners, plus founder-specific sections on
                cofounder relationship, ambition, help-seeking, and substance
                use.
              </p>
              <ScreenerList />
            </div>
          </details>

          <details className="acc">
            <summary>
              <Plus />
              <span>How We Ensure Anonymity</span>
            </summary>
            <div className="acc-body">
              <p>
                Responses are tied to a random access code, not your identity.
                Email (if you leave one) lives in a separate table with no join
                key — even we can&apos;t look you up by email.
              </p>
              <p>
                Don&apos;t take our word for it:{" "}
                <a
                  href="https://github.com/jasonshen/founder-mental-health-survey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  the schema and source are open on GitHub
                </a>
                .
              </p>
            </div>
          </details>
        </div>

        <p className="fmhs-deck short" style={{ marginTop: 32, fontSize: 14, color: "var(--ink-2)" }}>
          Y Combinator alum? We have a{" "}
          <Link href="/yc">YC-specific version</Link> that captures batch info.
        </p>

        <footer className="foot">
          <span>
            <AuthorPair />
          </span>
          <span>Founder Mental Health Survey · 2026</span>
        </footer>
      </div>
    </div>
  );
}
