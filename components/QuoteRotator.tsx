"use client";

/**
 * QuoteRotator — word-by-word fade in, hold, fade out, next.
 * Ported from the V5 Research Paper design (rail variant only here).
 *
 * The component is intentionally self-contained: shuffle order is
 * decided after mount to avoid SSR/CSR mismatch on the random pick.
 */

import { Fragment, useEffect, useMemo, useState } from "react";

const QUOTES: readonly string[] = [
  "Desperately want to save my friendship and my company",
  "Blurting stuff out during high stakes negotiations",
  "We argue multiple times a week",
  "How to show up when I have the weakest opinion / voice",
  "Haven't seen family in a while, don't want to socialize with anyone",
  "Just want my old self, my old energy level back",
  "Saying things that are reactive / emotionally charged / raw",
  "I feel like eventually I'm going to be found out",
  "Shut down my last startup, and now I have lost the spark",
  "I feel like I've lost my purpose in life",
  "My todo list is in a bankruptcy state",
  "It takes hours to fall asleep",
  "All I can think about is how our runway gets shorter every day",
] as const;

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuoteRotatorProps {
  variant?: "rail" | "naked" | "inline";
  label?: string;
}

const STAGGER_MS = 55;
const HOLD_MS = 4200;
const FADE_OUT_MS = 380;
const GAP_MS = 220;

export default function QuoteRotator({
  variant = "rail",
  label = "Real founder quotes",
}: QuoteRotatorProps) {
  // Render the canonical first quote during SSR; shuffle on mount.
  const [order, setOrder] = useState<readonly string[]>(QUOTES);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    setOrder(shuffle(QUOTES));
  }, []);

  const text = order[idx];
  const words = useMemo(() => text.split(" "), [text]);

  useEffect(() => {
    setPhase("in");
    const totalIn = words.length * STAGGER_MS + 420;
    const t1 = window.setTimeout(() => setPhase("out"), totalIn + HOLD_MS);
    const t2 = window.setTimeout(() => {
      setIdx((i) => (i + 1) % order.length);
    }, totalIn + HOLD_MS + FADE_OUT_MS + GAP_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [idx, order.length, words.length]);

  const inner = words.map((w, i) => (
    <Fragment key={`${idx}-${i}`}>
      <span
        className={`word ${phase === "in" ? "in" : "out"}`}
        style={{
          transitionDelay: phase === "in" ? `${i * STAGGER_MS}ms` : "0ms",
        }}
      >
        {w}
      </span>
      {i < words.length - 1 ? " " : ""}
    </Fragment>
  ));

  if (variant === "naked") {
    return (
      <p className="quote" aria-live="polite">
        {inner}
      </p>
    );
  }

  // rail (default)
  return (
    <div className="quote-rail" aria-live="polite">
      {label && <span className="label">{label}</span>}
      <p className="quote">{inner}</p>
    </div>
  );
}
