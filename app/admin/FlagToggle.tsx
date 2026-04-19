"use client";

import { useState } from "react";

interface FlagToggleProps {
  flagKey: string;
  enabled: boolean;
  description: string | null;
  updatedAt: string | null;
}

export default function FlagToggle({
  flagKey,
  enabled,
  description,
  updatedAt,
}: FlagToggleProps) {
  const [current, setCurrent] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSaving(true);
    setError(null);
    const next = !current;
    try {
      const res = await fetch("/api/admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flagKey, enabled: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update flag");
      }
      setCurrent(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <code className="text-sm font-mono text-gray-900 truncate">
            {flagKey}
          </code>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              current
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {current ? "ON" : "OFF"}
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mb-1">{description}</p>
        )}
        {updatedAt && (
          <p className="text-xs text-gray-400">
            Last updated {new Date(updatedAt).toLocaleString()}
          </p>
        )}
        {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`shrink-0 min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          current
            ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        } disabled:opacity-60 disabled:cursor-wait`}
      >
        {saving ? "…" : current ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
