"use client";

import type { ReactNode } from "react";

/** From Uiverse.io by shivam_7937 — gradient glow behind a dark slab. */
export function GlowButton({
  children,
  onClick,
  plain = false,
  small = false,
  arrow = true,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  /** An unchosen option: no glow, an edge instead. */
  plain?: boolean;
  small?: boolean;
  arrow?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const classes = ["glow-button", plain && "plain", small && "small"]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} onClick={onClick} disabled={disabled} type={type}>
      <span>
        {children}
        {arrow && (
          <svg
            className="arrow"
            viewBox="0 0 10 10"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M1 1l4 4-4 4" />
          </svg>
        )}
      </span>
    </button>
  );
}
