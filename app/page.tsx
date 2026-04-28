import Link from "next/link";
import AuthorPair from "@/components/AuthorPair";
import QuoteRotator from "@/components/QuoteRotator";

/* Arrow icon used inside the primary CTA. */
function Arrow() {
  return (
    <svg
      className="arrow"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/* Chevron used on the accordion summaries. */
function Chev() {
  return (
    <svg
      className="chev"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
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

export default function HomePage() {
  return (
    <div className="v v-research">
      <div className="page">
        <div className="label-row">
          <span className="left">
            FMHS · 2026 Research <span className="tick">●</span>
          </span>
          <span>Confidential · Anonymous · ~10 min</span>
        </div>

        <h1 className="title title-l serif">
          <span style={{ whiteSpace: "nowrap" }}>
            The
            <span className="caret-edit" aria-label="unofficial">
              <span className="mark">
                <span className="word-mark">unofficial</span>
                <span className="caret-glyph">∧</span>
              </span>
            </span>
            {" "}YC
          </span>{" "}
          Founder Community Mental Health Survey<span className="accent">.</span>
        </h1>

        <p className="lede" style={{ marginTop: 28 }}>
          An anonymous community survey of mental health &amp; well-being by YC
          founders, for YC founders. Validated clinical screeners (PHQ-9,
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
          <Link href="/consent" className="btn">
            Begin the survey
            <Arrow />
          </Link>
          <span className="btn-meta">Survey ends May 31, 2026</span>
        </div>

        <div className="acc-list">
          <details className="acc">
            <summary>
              <span>Why this exists</span>
              <Chev />
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
                The overall community results will be shared back on Bookface,
                helping everyone get a better snapshot of what it&apos;s like
                right now as a YC founder.
              </p>
            </div>
          </details>

          <details className="acc">
            <summary>
              <span>What it measures</span>
              <Chev />
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
              <span>How We Ensure Anonymity</span>
              <Chev />
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

        <footer className="foot">
          <span>
            <AuthorPair />
          </span>
          <span>YC Founder Mental Health Survey · 2026</span>
        </footer>
      </div>
    </div>
  );
}
