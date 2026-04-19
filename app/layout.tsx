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
      </body>
    </html>
  );
}
