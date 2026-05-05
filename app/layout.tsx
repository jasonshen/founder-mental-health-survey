import type { Metadata } from "next";
import {
  Inter,
  Source_Serif_4,
  Caveat,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// The opengraph image, favicon, and apple-touch-icon are picked up
// automatically from app/opengraph-image.png, app/icon.png, and
// app/apple-icon.png per the Next 15 file conventions — they don't
// need to be listed here. The icons block below adds two extra sizes
// served from /public so browsers that prefer a smaller or larger
// favicon can pick the right one.
const SHARE_DESCRIPTION =
  "Anonymous. ~10 min. Founder-specific stressors plus clinically validated depression, anxiety, burnout measures. By YC founders, for YC founders. Compare your results to your peers.";

export const metadata: Metadata = {
  title: "The Founder Mental Health Survey",
  description: SHARE_DESCRIPTION,
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "The Founder Mental Health Survey",
    description: SHARE_DESCRIPTION,
    type: "website",
    siteName: "Founder Mental Health Survey",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Founder Mental Health Survey",
    description: SHARE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} ${caveat.variable} ${jetBrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[color:var(--ink)] focus:text-white focus:px-4 focus:py-2 focus:rounded-md"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
