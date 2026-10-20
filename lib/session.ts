/** The breath cycle. Four seconds in, two held, six out — a twelve second
 *  cycle, so three minutes is fifteen breaths. Ported straight across from
 *  the macOS app; this is the one part that was never platform-specific. */

export const CYCLE_SECONDS = 12;
export const LENGTHS = [3, 5, 10];

export type Phase = "idle" | "inhale" | "hold" | "exhale" | "finished";

export const PHASE_LABEL: Record<Phase, string> = {
  idle: "Ready to take a breath when you are",
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  finished: "Well done",
};

export const PHASE_SECONDS: Record<Phase, number> = {
  idle: 0,
  inhale: 4,
  hold: 2,
  exhale: 6,
  finished: 0,
};

export function nextPhase(phase: Phase): Phase {
  if (phase === "inhale") return "hold";
  if (phase === "hold") return "exhale";
  if (phase === "exhale") return "inhale";
  return "idle";
}

export function breathsFor(minutes: number) {
  return Math.floor((minutes * 60) / CYCLE_SECONDS);
}

/** Sine ease. Breathing has no hard edges, and a linear ramp feels like
 *  being told to breathe by a machine. */
export function eased(t: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.min(Math.max(t, 0), 1));
}

/** How full the chest is at a given point in the cycle: 0 at rest, 1 at the
 *  top of an inhale. A pure function of cycle time, so the disc can ask what
 *  the breath looked like a moment ago and show the wave trailing outward. */
export function expansionAt(cycleTime: number) {
  let t = cycleTime % CYCLE_SECONDS;
  if (t < 0) t += CYCLE_SECONDS;

  if (t < 4) return eased(t / 4);
  if (t < 6) return 1;
  return 1 - eased((t - 6) / 6);
}

/** Where this breath has got to, in seconds from the start of the cycle. */
export function cycleTimeOf(phase: Phase, progress: number) {
  if (phase === "inhale") return progress * 4;
  if (phase === "hold") return 4 + progress * 2;
  if (phase === "exhale") return 6 + progress * 6;
  return 0;
}

export function guidanceFor(phase: Phase, remaining: number) {
  switch (phase) {
    case "idle":
      return "Four seconds in, two held, six out";
    case "inhale":
      return `Slowly, through your nose · ${remaining}`;
    case "hold":
      return `Keep it in · ${remaining}`;
    case "exhale":
      return `Let it go, longer than you took it in · ${remaining}`;
    default:
      return "";
  }
}

export function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const ENCOURAGEMENT = [
  "Rest is part of the work, not a break from it.",
  "Effort compounds. So does recovery.",
  "A steady mind learns faster than a rushed one.",
  "Short sessions, often, beat long ones rarely.",
  "Attention is trainable. You just trained it.",
  "The work will still be there. So will you.",
  "Progress is quieter than you expect it to be.",
  "Coming back again is the whole skill.",
];
