import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Mental Health Survey",
  description: "A confidential screening tool for startup founders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
