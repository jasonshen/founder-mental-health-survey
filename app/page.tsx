import Link from "next/link";
import AuthorPair from "@/components/AuthorPair";

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

export default function AboutPage() {
  return (
    <div className="v v-research">
      <div className="page">
        <div className="label-row">
          <span className="left">
            FMHS · About <span className="tick">●</span>
          </span>
          <span>Confidential · Anonymous · Open source</span>
        </div>

        <h1 className="title title-l serif">
          The Founder Mental Health Survey<span className="accent">.</span>
        </h1>

        <p className="lede" style={{ marginTop: 28 }}>
          An open, anonymous research project on what mental health and
          well-being actually look like for startup founders right now —
          combining validated clinical screeners with founder-specific
          dimensions of ambition, motivation, and relationships.
        </p>

        <div className="cta-row" style={{ marginTop: 32 }}>
          <Link href="/yc" className="btn">
            YC founders survey
            <Arrow />
          </Link>
          <Link href="/survey" className="btn btn-ghost">
            General founders survey
            <Arrow />
          </Link>
        </div>
        <p
          className="btn-meta"
          style={{ marginTop: 12, display: "block" }}
        >
          Two versions of the same instrument. Pick whichever fits — the
          consent screen will help you find the right one.
        </p>

        <div className="acc-list" style={{ marginTop: 40 }}>
          <details className="acc" open>
            <summary>
              <Plus />
              <span>Why we built this</span>
            </summary>
            <div className="acc-body">
              <p>
                Founders carry a psychological burden that&apos;s mostly
                invisible — to investors, to employees, to family, often to
                themselves. Cofounder conflict, identity-merge with the
                company, money pressure, isolation, the relentless
                self-judgment.
              </p>
              <p>
                The published research on founder mental health is thin and
                mostly draws from broader entrepreneur populations. The
                existing surveys aimed at startup founders are small, not
                peer-reviewed, and rarely use validated clinical instruments.
                We wanted something better: a real instrument, taken
                anonymously, with results shared back to the community.
              </p>
              <p>
                When you see your own results next to other founders&apos;,
                the loneliest stuff stops feeling so unique. You&apos;re not
                the outlier you think you are.
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
                Validated clinical screeners, plus founder-specific sections
                on cofounder relationship, ambition, motivation,
                help-seeking, and substance use.
              </p>
              <ScreenerList />
              <p style={{ marginTop: 16 }}>
                The ambition and life-outlook sections are grounded in
                Self-Determination Theory and the Aspiration Index — they
                capture not just how driven you are but <em>why</em>, and
                what you&apos;re driving toward. See{" "}
                <Link href="/yc">our YC version</Link> or the{" "}
                <Link href="/survey">general version</Link> to take it.
              </p>
            </div>
          </details>

          <details className="acc">
            <summary>
              <Plus />
              <span>Two versions, one instrument</span>
            </summary>
            <div className="acc-body">
              <p>
                The instrument itself is the same in both versions — same
                clinical screeners, same founder-specific sections, same
                scoring. The only difference: the YC version asks for your
                batch (so YC-aggregate results can be reported back to
                Bookface), and the general version skips that question.
              </p>
              <p>
                If you start one version and your answers suggest the other
                fits better, we&apos;ll quietly offer to switch you over.
              </p>
            </div>
          </details>

          <details className="acc">
            <summary>
              <Plus />
              <span>How we ensure anonymity</span>
            </summary>
            <div className="acc-body">
              <p>
                Responses are tied to a random access code, not your
                identity. If you leave an email afterward, it&apos;s stored
                in a separate table with no link back to your answers — even
                we can&apos;t look you up by email.
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

          <details className="acc">
            <summary>
              <Plus />
              <span>Who&apos;s behind this</span>
            </summary>
            <div className="acc-body">
              <p>
                <AuthorPair />
              </p>
              <p>
                We&apos;re founders and coaches working on the question of
                what it actually takes to build something meaningful without
                breaking yourself in the process.
              </p>
            </div>
          </details>
        </div>

        <footer className="foot">
          <span>Founder Mental Health Survey · 2026</span>
          <span>
            <a
              href="https://github.com/jasonshen/founder-mental-health-survey"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source on GitHub
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
