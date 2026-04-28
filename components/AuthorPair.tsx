"use client";

/**
 * AuthorPair — renders "Jason Shen and Keegan Walden" with a 50/50 swap
 * decided after mount. SSR renders the canonical order so hydration
 * doesn't warn; the swap happens once on the client. Inline anchors
 * inherit the surrounding `footer.foot a` styles.
 */

import { Fragment, useEffect, useState } from "react";

const AUTHORS = [
  { name: "Jason Shen", href: "https://jasonshen.com" },
  {
    name: "Keegan Walden",
    href: "https://www.linkedin.com/in/keegan-walden-ph-d-672ab9101/",
  },
] as const;

export default function AuthorPair() {
  const [swapped, setSwapped] = useState(false);
  useEffect(() => {
    if (Math.random() < 0.5) setSwapped(true);
  }, []);

  const ordered = swapped ? [AUTHORS[1], AUTHORS[0]] : AUTHORS;

  return (
    <Fragment>
      Created by{" "}
      <a href={ordered[0].href} target="_blank" rel="noopener noreferrer">
        {ordered[0].name}
      </a>{" "}
      and{" "}
      <a href={ordered[1].href} target="_blank" rel="noopener noreferrer">
        {ordered[1].name}
      </a>
    </Fragment>
  );
}
