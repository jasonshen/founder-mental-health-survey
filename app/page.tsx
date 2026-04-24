import Link from "next/link";
import AuthorCredits from "@/components/AuthorCredits";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Founder Mental Health Survey
        </h1>
        <p className="text-lg text-gray-500">
          A confidential screening tool for startup founders
        </p>
      </div>

      <div className="space-y-6 text-gray-700 leading-relaxed mb-12">
        <p>
          Starting and running a company is one of the most psychologically
          demanding things a person can do. Yet founders rarely have the time or
          space to check in on their own mental health.
        </p>

        <p>
          <strong>What it measures:</strong> This survey uses validated clinical
          instruments to screen for depression (PHQ-9), anxiety (GAD-7), and
          ADHD traits (ASRS), plus founder-specific stressors like runway
          pressure, isolation, and identity fusion with your company.
        </p>

        <p>
          <strong>What you get:</strong> Immediate results with your scores,
          severity levels, and how you compare to the general population. You can
          optionally receive a detailed report and learn about resources
          including coaching, retreats, and more.
        </p>

        <p>
          <strong>How long it takes:</strong> About 3-5 minutes.
        </p>

        <p>
          <strong>Anonymity:</strong> Your responses are completely anonymous.
          You receive a unique token to access your results. No personally
          identifiable information is collected unless you choose to provide your
          email afterward.
        </p>
      </div>

      <div className="text-center mb-16">
        <Link
          href="/consent"
          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-lg"
        >
          Take the Survey
        </Link>
      </div>

      <footer className="text-center text-sm text-gray-400 border-t pt-6">
        <AuthorCredits />
      </footer>
    </div>
  );
}
