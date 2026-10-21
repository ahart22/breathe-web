"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NoteRow, PreferencesRow, SessionRow } from "@/lib/types";
import {
  breathsFor, clock, cycleTimeOf, guidanceFor, nextPhase,
  PHASE_LABEL, PHASE_SECONDS, type Phase,
} from "@/lib/session";
import { BreathDisc } from "./BreathDisc";
import { GlowButton } from "./GlowButton";
import { Preferences } from "./Preferences";
import { Reflections } from "./Reflections";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { SegmentedPill } from "./SegmentedPill";
import { FluidMorphBg } from "./FluidMorphBg";
import { ReminderBanner } from "./ReminderBanner";
import { SparkleTrail } from "./SparkleTrail";

const TICK = 1 / 60;

export function BreathingApp({
  email,
  userId,
  preferences: initial,
  recent: initialRecent,
  notes: initialNotes,
}: {
  email: string;
  userId: string;
  preferences: PreferencesRow;
  recent: SessionRow[];
  notes: NoteRow[];
}) {
  const [tab, setTab] = useState(0);
  const [prefs, setPrefs] = useState(initial);
  const [recent, setRecent] = useState(initialRecent);
  const [opening, setOpening] = useState(true);

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [breath, setBreath] = useState(0);
  const [outcome, setOutcome] = useState<{
    seconds: number; breaths: number; completed: boolean;
  } | null>(null);

  const [discSize, setDiscSize] = useState(300);
  const runningRef = useRef(false);
  const [reminding, setReminding] = useState(false);
  /** When the next reminder is due, as a timestamp. */
  const dueAt = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const state = useRef({ phase: "idle" as Phase, phaseElapsed: 0, elapsed: 0, breath: 0 });

  const total = prefs.minutes * 60;
  const totalBreaths = breathsFor(prefs.minutes);
  const running = phase === "inhale" || phase === "hold" || phase === "exhale";

  useEffect(() => {
    const id = window.setTimeout(() => setOpening(false), 1700);
    return () => window.clearTimeout(id);
  }, []);

  // The canvas needs real pixels, so the size comes from the viewport rather
  // than from CSS.
  useEffect(() => {
    const measure = () =>
      setDiscSize(
        Math.round(
          Math.max(240, Math.min(440, Math.min(window.innerWidth * 0.46, window.innerHeight * 0.52))),
        ),
      );
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const savePrefs = useCallback(async (patch: Partial<PreferencesRow>) => {
    setPrefs((current) => ({ ...current, ...patch }));
    const supabase = createClient();
    // RLS limits this to the signed-in user's own row, so the filter here is
    // for correctness rather than for safety.
    await supabase.from("preferences").update(patch).eq("user_id", initial.user_id);
  }, [initial.user_id]);

  const record = useCallback(
    async (seconds: number, breaths: number, completed: boolean) => {
      const supabase = createClient();
      const { data } = await supabase
        .from("sessions")
        .insert({
          user_id: initial.user_id,
          pattern: "4-2-6",
          planned_seconds: total,
          actual_seconds: seconds,
          breaths,
          completed,
        })
        .select()
        .single();

      if (data) setRecent((current) => [data as SessionRow, ...current].slice(0, 8));
    },
    [initial.user_id, total],
  );

  const stopTimer = () => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
  };

  function begin() {
    state.current = { phase: "inhale", phaseElapsed: 0, elapsed: 0, breath: 1 };
    setPhase("inhale");
    setProgress(0);
    setElapsed(0);
    setBreath(1);
    setOutcome(null);

    stopTimer();
    timer.current = window.setInterval(() => {
      const s = state.current;
      s.elapsed += TICK;
      s.phaseElapsed += TICK;

      if (s.elapsed >= total) {
        stopTimer();
        setPhase("finished");
        setOutcome({ seconds: total, breaths: totalBreaths, completed: true });
        void record(total, totalBreaths, true);
        return;
      }

      const length = PHASE_SECONDS[s.phase];
      if (length > 0 && s.phaseElapsed >= length) {
        s.phaseElapsed -= length;
        if (s.phase === "exhale") s.breath = Math.min(s.breath + 1, totalBreaths);
        s.phase = nextPhase(s.phase);
        setPhase(s.phase);
        setBreath(s.breath);
      }

      setProgress(s.phaseElapsed / PHASE_SECONDS[s.phase]);
      setElapsed(s.elapsed);
    }, TICK * 1000);
  }

  /** Ends early. The work done still counts, so it finishes into a receipt
   *  rather than being thrown away. */
  function stop() {
    stopTimer();
    const seconds = Math.round(state.current.elapsed);
    const breaths = Math.max(0, state.current.breath - 1);
    setPhase("finished");
    setOutcome({ seconds, breaths, completed: false });
    void record(seconds, breaths, false);
  }

  function reset() {
    stopTimer();
    state.current = { phase: "idle", phaseElapsed: 0, elapsed: 0, breath: 0 };
    setPhase("idle");
    setProgress(0);
    setElapsed(0);
    setBreath(0);
    setOutcome(null);
  }

  useEffect(() => stopTimer, []);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    if (!prefs.reminders_on) {
      dueAt.current = null;
      return;
    }

    const gap = prefs.interval_minutes * 60 * 1000;
    dueAt.current = Date.now() + gap;

    // Checked against the clock rather than trusted to fire on time.
    // Browsers throttle timers in background tabs to about once a minute, so
    // a plain setInterval of the full length drifts badly or is skipped; this
    // only ever runs late, never not at all.
    const check = () => {
      if (runningRef.current) return;
      if (dueAt.current && Date.now() >= dueAt.current) {
        dueAt.current = Date.now() + gap;
        notify();
      }
    };

    const id = window.setInterval(check, 15000);
    // A throttled tab can go quiet entirely; coming back to it catches up.
    document.addEventListener("visibilitychange", check);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [prefs.reminders_on, prefs.interval_minutes]);

  /** The tab title is the one channel that is readable from another tab
   *  without any permission at all. */
  useEffect(() => {
    if (!reminding) {
      document.title = "Breathe";
      return;
    }

    let flipped = true;
    document.title = "\u23F0 Take a breath";
    const id = window.setInterval(() => {
      flipped = !flipped;
      document.title = flipped ? "\u23F0 Take a breath" : "Breathe";
    }, 1100);

    return () => {
      window.clearInterval(id);
      document.title = "Breathe";
    };
  }, [reminding]);

  /** Fires every channel at once, because each one can fail on its own:
   *  the banner is invisible from another tab, the tab title is invisible if
   *  the window is behind something, and an OS notification can be swallowed
   *  by permissions or Do Not Disturb with no error. Together they cover it. */
  function notify() {
    setReminding(true);

    // Only time it out while they are actually looking. A reminder that
    // expired unseen in a background tab would be worse than none.
    if (document.visibilityState === "visible") {
      window.setTimeout(() => setReminding(false), 14000);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Take a breath", {
          body: "You have been at it a while.",
          icon: "/figure-alpha.png",
          // Keeps it on screen rather than auto-dismissing, and stops a
          // stack building up if several fire.
          requireInteraction: true,
          tag: "breathe-reminder",
        });
      } catch {
        // Some platforms refuse the constructor outright; the other two
        // channels have already done the job.
      }
    }
  }

  const remaining = Math.max(1, Math.ceil(PHASE_SECONDS[phase] * (1 - progress)) || 1);

  if (opening) {
    return (
      <div className="app">
        <div className="app-main">
          <h1
            className="gradient-text"
            style={{ fontSize: "clamp(30px, 5vw, 56px)", margin: 0 }}
          >
            Take a breath in
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Home only. Settings, the receipt and the sign-in page keep the
          plain background they had before. */}
      {tab === 0 && phase !== "finished" && <FluidMorphBg />}
      <SparkleTrail />

      {reminding && (
        <ReminderBanner
          onBegin={() => {
            setReminding(false);
            setTab(0);
            begin();
          }}
          onDismiss={() => setReminding(false)}
        />
      )}
      <header className="app-head">
          <span style={{ width: 28 }} />
          {phase === "idle" && (
            <SegmentedPill
              options={["Home", "Settings"]}
              selected={tab}
              onSelect={setTab}
            />
          )}
          {running && <span className="muted">{clock(total - elapsed)}</span>}
        <form action="/auth/signout" method="post">
          <button className="chip-button" title={`Sign out (${email})`} type="submit">
            &#9211;
          </button>
        </form>
      </header>

      {phase === "finished" && outcome ? (
        <div className="app-main">
            <ReceiptPrinter
              seconds={outcome.seconds}
              planned={total}
              breaths={outcome.breaths}
              completed={outcome.completed}
              onDone={reset}
            />
          </div>
      ) : tab === 1 && phase === "idle" ? (
        <div className="app-main" style={{ justifyContent: "flex-start", paddingTop: "4vh" }}>
          <div className="column">
            <Reflections userId={userId} initial={initialNotes} />

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "22px 0 18px" }} />

            <Preferences
              minutes={prefs.minutes}
              remindersOn={prefs.reminders_on}
              intervalMinutes={prefs.interval_minutes}
              onChange={savePrefs}
              onTest={notify}
            />

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "22px 0 18px" }} />

            <section>
              <h2 style={{ fontSize: 15, margin: "0 0 6px", fontWeight: 600 }}>History</h2>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: "0 0 14px" }}>
                Your sessions, saved to your account.
              </p>
              <History rows={recent} />
            </section>
          </div>
        </div>
      ) : (
        <div className="app-main">
            {running ? (
              <BreathDisc cycleTime={cycleTimeOf(phase, progress)} size={discSize} />
            ) : (
              <div
                className="figure"
                role="img"
                aria-label="Someone lying back in the grass"
              />
            )}

            <div>
              <p className="phase">{PHASE_LABEL[phase]}</p>
              <p className="guidance">{guidanceFor(phase, remaining)}</p>
            </div>

            {running ? (
              <>
                <GlowButton arrow={false} disabled>
                  Breath {breath} of {totalBreaths}
                </GlowButton>
                <button className="swap" onClick={stop} style={{ color: "var(--ink-faint)" }}>
                  Stop
                </button>
              </>
          ) : (
            <GlowButton onClick={begin}>Begin &middot; {prefs.minutes} minutes</GlowButton>
          )}
        </div>
      )}
    </div>
  );
}

function History({ rows }: { rows: SessionRow[] }) {
  const done = rows.filter((row) => row.completed);
  const minutes = Math.round(rows.reduce((sum, row) => sum + row.actual_seconds, 0) / 60);

  return (
    <div style={{ width: "100%" }}>
      <div className="cards" style={{ marginBottom: 18 }}>
        <div className="card lit">
          <p className="label">Sessions</p>
          <p className="value">{done.length}</p>
        </div>
        <div className="card">
          <p className="label">Minutes</p>
          <p className="value">{minutes}</p>
        </div>
      </div>

      <div className="log">
        {rows.length === 0 ? (
          <p className="muted">Nothing yet. Your sessions will appear here.</p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id}>
                <span>
                  <span
                    className="dot"
                    style={{ background: row.completed ? "var(--green)" : "var(--yellow)" }}
                  />
                  {new Date(row.started_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short",
                  })}
                </span>
                <span className="muted">
                  {clock(row.actual_seconds)} &middot; {row.breaths} breaths
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
