import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Mental Health Survey",
  description:
    "A confidential screening tool for startup founders. Get your scores on depression, anxiety, and ADHD — plus founder-specific stressors.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Founder Mental Health Survey",
    description:
      "A confidential screening tool for startup founders — validated PHQ-9, GAD-7, ASRS plus founder-specific stressors.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-gray-900 focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
        <footer className="border-t border-gray-100 mt-16">
          <div className="max-w-2xl mx-auto px-4 py-6 text-xs text-gray-500 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-between">
            <p>
              Anonymous by design. Your email and your responses live in{" "}
              <strong>separate tables with no join key</strong> — we can&apos;t
              look you up by email.{" "}
              <a
                href="https://github.com/jasonshen/founder-mental-health-survey/blob/main/supabase/migrations/005_privacy_hardening.sql"
                className="underline hover:text-gray-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                See the schema
              </a>
              .
            </p>
            <p>
              <a
                href="https://github.com/jasonshen/founder-mental-health-survey"
                className="underline hover:text-gray-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
