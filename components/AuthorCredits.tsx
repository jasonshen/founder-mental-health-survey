"use client";

import { useEffect, useState } from "react";

const AUTHORS = [
  {
    name: "Jason Shen",
    href: "https://jasonshen.com",
  },
  {
    name: "Keegan Walden",
    href: "https://www.linkedin.com/in/keegan-walden-ph-d-672ab9101/",
  },
];

export default function AuthorCredits() {
  // SSR renders the canonical order; client shuffles after mount.
  // Avoids hydration mismatch warnings while still giving a 50/50 order
  // across page loads.
  const [swapped, setSwapped] = useState(false);
  useEffect(() => {
    if (Math.random() < 0.5) setSwapped(true);
  }, []);

  const ordered = swapped ? [AUTHORS[1], AUTHORS[0]] : AUTHORS;

  return (
    <p>
      Created by{" "}
      <a
        href={ordered[0].href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-600"
      >
        {ordered[0].name}
      </a>{" "}
      and{" "}
      <a
        href={ordered[1].href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-gray-600"
      >
        {ordered[1].name}
      </a>
    </p>
  );
}
