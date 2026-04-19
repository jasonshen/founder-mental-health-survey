"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("global_error_boundary", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#fff",
          color: "#111",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
            Something went very wrong
          </h1>
          <p style={{ color: "#555", marginBottom: 24 }}>
            We hit a fatal error. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.6rem 1.2rem",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          {error.digest && (
            <p style={{ color: "#888", fontSize: "0.75rem", marginTop: 24 }}>
              Error reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
