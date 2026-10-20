"use client";

import { useEffect, useState } from "react";
import { LENGTHS } from "@/lib/session";
import { GlowButton } from "./GlowButton";

export function Preferences({
  minutes,
  remindersOn,
  intervalMinutes,
  onChange,
  onTest,
}: {
  minutes: number;
  remindersOn: boolean;
  intervalMinutes: number;
  onChange: (patch: {
    minutes?: number;
    reminders_on?: boolean;
    interval_minutes?: number;
  }) => void;
  onTest: () => void;
}) {
  const [draft, setDraft] = useState(String(intervalMinutes));

  useEffect(() => setDraft(String(intervalMinutes)), [intervalMinutes]);

  function commit(value: number) {
    const clamped = Math.min(Math.max(Math.round(value) || 1, 1), 480);
    onChange({ interval_minutes: clamped });
    setDraft(String(clamped));
  }

  async function toggleReminders() {
    const next = !remindersOn;
    // Asked for, but not depended on: the reminder shows in the page either
    // way, and an OS notification is a bonus on top.
    if (next && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    onChange({ reminders_on: next });
  }

  return (
    <div className="prefs">
      <section>
        <h2>Session length</h2>
        <p>How long each exercise runs.</p>
        <div className="row">
          {LENGTHS.map((value) => (
            <GlowButton
              key={value}
              small
              arrow={false}
              plain={value !== minutes}
              onClick={() => onChange({ minutes: value })}
            >
              {value} min
            </GlowButton>
          ))}
        </div>
      </section>

      <hr />

      <section>
        <h2>Study reminders</h2>
        <p>A nudge to come back and breathe.</p>

        <div className="row" style={{ marginBottom: 10 }}>
          <button
            className="switch"
            data-on={remindersOn}
            onClick={toggleReminders}
            aria-pressed={remindersOn}
            aria-label="Study reminders"
          />
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
            {remindersOn ? "On" : "Off"}
          </span>
        </div>

        <div className="row" style={{ opacity: remindersOn ? 1 : 0.35 }}>
          <span className="muted">Every</span>
          <button
            className="stepper"
            disabled={!remindersOn || intervalMinutes <= 1}
            onClick={() => commit(intervalMinutes - 5)}
            aria-label="Less often"
          >
            −
          </button>
          <input
            className="number"
            value={draft}
            inputMode="numeric"
            disabled={!remindersOn}
            onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(Number(draft));
            }}
            aria-label="Reminder interval in minutes"
          />
          <button
            className="stepper"
            disabled={!remindersOn || intervalMinutes >= 480}
            onClick={() => commit(intervalMinutes + 5)}
            aria-label="More often"
          >
            +
          </button>
          <span className="muted">minutes</span>
          <GlowButton
            small
            arrow={false}
            disabled={!remindersOn}
            onClick={() => commit(Number(draft))}
          >
            Set
          </GlowButton>
        </div>

        {remindersOn && (
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            <button type="button" className="swap" onClick={onTest}>
              Show a test reminder
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
