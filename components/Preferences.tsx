"use client";

import { useEffect, useState } from "react";
import { LENGTHS } from "@/lib/session";
import { GlowButton } from "./GlowButton";
import { TactileButton } from "./TactileButton";

export function Preferences({
  minutes,
  remindersOn,
  intervalMinutes,
  onChange,
}: {
  minutes: number;
  remindersOn: boolean;
  intervalMinutes: number;
  onChange: (patch: {
    minutes?: number;
    reminders_on?: boolean;
    interval_minutes?: number;
  }) => void;
}) {
  const [draft, setDraft] = useState(String(intervalMinutes));
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => setDraft(String(intervalMinutes)), [intervalMinutes]);
  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  function commit(value: number) {
    const clamped = Math.min(Math.max(Math.round(value) || 1, 1), 480);
    onChange({ interval_minutes: clamped });
    setDraft(String(clamped));
  }

  async function toggleReminders() {
    const next = !remindersOn;
    if (next && "Notification" in window && Notification.permission === "default") {
      setPermission(await Notification.requestPermission());
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
        <p>
          A nudge to come back and breathe. Browsers only run timers in an open
          tab, so keep this one open while you work — close it and the
          reminders stop.
        </p>

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
          <TactileButton disabled={!remindersOn} onClick={() => commit(Number(draft))}>
            Set
          </TactileButton>
        </div>

        {remindersOn && permission === "denied" && (
          <p style={{ color: "var(--red)", marginTop: 10 }}>
            Notifications are blocked for this site, so reminders cannot show.
            Allow them in your browser settings.
          </p>
        )}
      </section>
    </div>
  );
}
