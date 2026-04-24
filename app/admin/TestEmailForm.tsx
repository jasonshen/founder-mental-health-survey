"use client";

import { useState } from "react";

export default function TestEmailForm() {
  const [to, setTo] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setMessage("");

    try {
      const res = await fetch("/api/admin/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.sent) {
        setState("error");
        setMessage(
          body.detail || body.error || "Failed to send — check Vercel logs."
        );
        return;
      }

      setState("sent");
      setMessage(`Sent! Resend id: ${body.id}`);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Unexpected error.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-600">
        Sends a sample confirmation email (fake scores, token{" "}
        <code className="text-xs">FMH-TEST</code>) to the address below. Use
        this to verify Resend DNS + template rendering after setup.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          disabled={state === "sending"}
        />
        <button
          type="submit"
          disabled={state === "sending" || !to}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {state === "sending" ? "Sending..." : "Send test"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm ${
            state === "sent" ? "text-green-700" : "text-red-600"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
