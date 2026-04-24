import Link from "next/link";
import AuthorCredits from "@/components/AuthorCredits";
import Disclosure from "@/components/Disclosure";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Founder Mental Health Survey
        </h1>
        <p className="text-lg text-gray-500">
          A confidential check-in for startup founders.
        </p>
      </div>

      <p className="text-gray-700 leading-relaxed mb-6 text-lg">
        Running a company is one of the most psychologically demanding things a
        person can do. This survey gives you a clearer picture of how you&apos;re
        actually doing.
      </p>

      <div className="flex flex-wrap gap-2 mb-10 text-sm">
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
          ~10 minutes
        </span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
          Anonymous
        </span>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700">
          Results immediately
        </span>
      </div>

      <div className="text-center mb-12">
        <Link
          href="/consent"
          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-lg"
        >
          Take the Survey
        </Link>
      </div>

      <div className="space-y-3 mb-16">
        <Disclosure summary="What does it measure?">
          <p>
            Validated clinical screeners for depression (PHQ-9), anxiety
            (GAD-7), ADHD (ASRS), autism (AQ-10), and burnout (MBI-GS).
          </p>
          <p>
            Plus founder-specific sections: life outlook, ambition,
            founder-specific challenges, cofounder relationship, personality,
            social support, help-seeking, medication, and substance use.
          </p>
        </Disclosure>

        <Disclosure summary="How anonymous is it, really?">
          <p>
            Your responses are tied to a random access code, not your identity.
            If you leave an email for the report, it lives in a separate table
            with no join key to your responses — even we can&apos;t look you up
            by email.
          </p>
        </Disclosure>

        <Disclosure summary="What do I get?">
          <p>
            Your scores with severity bands, how you compare to the general
            population, and (when the cohort is large enough) how you compare
            to other founders who&apos;ve taken the survey.
          </p>
          <p>
            Optionally leave an email for a detailed report and information on
            coaching, retreats, and research updates.
          </p>
        </Disclosure>
      </div>

      <footer className="text-center text-sm text-gray-400 border-t pt-6">
        <AuthorCredits />
      </footer>
    </div>
  );
}
