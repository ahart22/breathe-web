"use client";

import { useEffect, useMemo, useState } from "react";
import { clock, ENCOURAGEMENT } from "@/lib/session";
import { GlowButton } from "./GlowButton";

type Stage = "processing" | "printing" | "complete";

export function ReceiptPrinter({
  seconds,
  planned,
  breaths,
  completed,
  onDone,
}: {
  seconds: number;
  planned: number;
  breaths: number;
  completed: boolean;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("processing");
  const note = useMemo(
    () => ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)],
    [],
  );

  useEffect(() => {
    const toPrinting = window.setTimeout(() => setStage("printing"), 900);
    const toComplete = window.setTimeout(() => setStage("complete"), 900 + 1900);
    return () => {
      window.clearTimeout(toPrinting);
      window.clearTimeout(toComplete);
    };
  }, []);

  const label =
    stage === "processing"
      ? "Processing your session"
      : stage === "printing"
        ? "Printing your receipt"
        : completed
          ? `${Math.round(seconds / 60)} minutes of breath work complete`
          : `${clock(seconds)} of breath work logged`;

  const today = new Date()
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="printer">
      <div className="machine">
        <div className="screen">
          {stage === "complete" ? (
            <span style={{ color: "var(--green)", fontSize: 14 }} aria-hidden="true">
              ✓
            </span>
          ) : (
            <span className="spinner" aria-hidden="true" />
          )}
          <span aria-live="polite">{label}</span>
        </div>
        <div className="slot" aria-hidden="true" />
      </div>

      {stage !== "processing" && (
        <div className="paper-window">
          <article className="paper">
            <h1>BREATHE</h1>
            <p className="date">{today}</p>
            <div className="rule" />
            <p className="lead">
              {completed ? "Thank you for taking a break" : "Every minute of it counted"}
            </p>
            <p className="note">{note}</p>
            <div className="rule" />
            <dl>
              <dt>Breaths</dt>
              <dd>{breaths}</dd>
              <dt>Duration</dt>
              <dd>{clock(seconds)}</dd>
              {!completed && (
                <>
                  <dt>Planned</dt>
                  <dd>{clock(planned)}</dd>
                </>
              )}
              <dt>Pattern</dt>
              <dd>4-2-6</dd>
            </dl>
            <div className="rule" />
            <p className="foot">see you tomorrow</p>
          </article>
        </div>
      )}

      {stage === "complete" && (
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <GlowButton onClick={onDone}>Done</GlowButton>
        </div>
      )}
    </div>
  );
}
