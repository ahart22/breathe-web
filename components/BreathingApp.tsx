"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PreferencesRow, SessionRow } from "@/lib/types";
import {
  breathsFor, clock, cycleTimeOf, guidanceFor, nextPhase,
  PHASE_LABEL, PHASE_SECONDS, type Phase,
} from "@/lib/session";
import { BreathDisc } from "./BreathDisc";
import { GlowButton } from "./GlowButton";
import { Preferences } from "./Preferences";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { SegmentedPill } from "./SegmentedPill";
import { SparkleTrail } from "./SparkleTrail";

const TICK = 1 / 60;

export function BreathingApp({
  email,
  preferences: initial,
  recent: initialRecent,
}: {
  email: string;
  preferences: PreferencesRow;
  recent: SessionRow[];
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

  const timer = useRef<number | null>(null);
  const state = useRef({ phase: "idle" as Phase, phaseElapsed: 0, elapsed: 0, breath: 0 });

  const total = prefs.minutes * 60;
  const totalBreaths = breathsFor(prefs.minutes);
  const running = phase === "inhale" || phase === "hold" || phase === "exhale";

  useEffect(() => {
    const id = window.setTimeout(() => setOpening(false), 1700);
    return () => window.clearTimeout(id);
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
    if (!prefs.reminders_on) return;

    const id = window.setInterval(() => {
      if (running) return;
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Take a breath", {
          body: "You have been at it a while.",
          icon: "/figure.png",
        });
      }
    }, prefs.interval_minutes * 60 * 1000);

    return () => window.clearInterval(id);
  }, [prefs.reminders_on, prefs.interval_minutes, running]);

  const remaining = Math.max(1, Math.ceil(PHASE_SECONDS[phase] * (1 - progress)) || 1);

  if (opening) {
    return (
      <div className="shell">
        <div className="panel">
          <div className="panel-body">
            <h1 className="gradient-text" style={{ fontSize: 28, margin: 0 }}>
              Take a breath in
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <SparkleTrail />
      <div className="panel">
        <header className="panel-head">
          <span style={{ width: 28 }} />
          {phase === "idle" && (
            <SegmentedPill
              options={["Home", "Preferences", "History"]}
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
          <div className="panel-body">
            <ReceiptPrinter
              seconds={outcome.seconds}
              planned={total}
              breaths={outcome.breaths}
              completed={outcome.completed}
              onDone={reset}
            />
          </div>
        ) : tab === 1 && phase === "idle" ? (
          <div className="panel-body" style={{ justifyContent: "flex-start", paddingTop: 20 }}>
            <Preferences
              minutes={prefs.minutes}
              remindersOn={prefs.reminders_on}
              intervalMinutes={prefs.interval_minutes}
              onChange={savePrefs}
            />
          </div>
        ) : tab === 2 && phase === "idle" ? (
          <div className="panel-body" style={{ justifyContent: "flex-start", paddingTop: 20 }}>
            <History rows={recent} />
          </div>
        ) : (
          <div className="panel-body">
            {running ? (
              <BreathDisc cycleTime={cycleTimeOf(phase, progress)} />
            ) : (
              <img className="figure" src="/figure.png" alt="Someone lying back in the grass" />
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
