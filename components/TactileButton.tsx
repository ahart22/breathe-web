"use client";

import type { ReactNode } from "react";

/** A button with physical depth: the face presses down onto a solid base.
 *  A flat base rather than a blurred shadow — this should read as a key
 *  being pushed, not a card floating. */
export function TactileButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="tactile" onClick={onClick} disabled={disabled} type="button">
      <span>
        {children}
        <svg viewBox="0 0 10 10" width="11" height="11" fill="none"
             stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M0 5h7M1 1l4 4-4 4" />
        </svg>
      </span>
    </button>
  );
}
