"use client";

import { useEffect, useRef } from "react";
import { expansionAt } from "@/lib/session";

/** Dots on a sunflower spiral, each filling like a moon phase.
 *
 *  Every dot sits a golden angle round from the last at a radius proportional
 *  to the square root of its index, which spaces them evenly without any
 *  lining up into rows. A dot is a white disc with a panel-coloured disc slid
 *  across it: fully overlapping reads as dark, slid clear reads as white, and
 *  every crescent between falls out of the geometry for free.
 *
 *  The fill is the breath. A dot's lag grows with its distance from the
 *  centre, so an inhale lights the middle first and travels out to the rim. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const COUNT = 150;
const LAG_SPREAD = 4;
const PANEL = "#111827";

const layout = (() => {
  const scale = 1 / Math.sqrt(COUNT - 0.5);
  const dots = Array.from({ length: COUNT }, (_, index) => {
    // The half-step keeps the first dot off the exact centre; without it the
    // innermost few crowd together and the middle clumps.
    const distance = scale * Math.sqrt(index + 0.5);
    const angle = index * GOLDEN;
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, distance, angle };
  });

  // Size every dot from the closest pair, so none can overlap however many
  // there are — the tightest gap sets the size for all of them.
  let closest = Infinity;
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      closest = Math.min(closest, Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y));
    }
  }

  return { dots, radius: (closest / 2) * 0.93 };
})();

export function BreathDisc({ cycleTime, size = 240 }: { cycleTime: number; size?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const dpr = window.devicePixelRatio || 1;
    element.width = size * dpr;
    element.height = size * dpr;

    const context = element.getContext("2d");
    if (!context) return;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size, size);

    const centre = size / 2;
    const maxRadius = size / 2 - 4;
    const dotRadius = layout.radius * maxRadius;

    for (const dot of layout.dots) {
      const x = centre + dot.x * maxRadius;
      const y = centre + dot.y * maxRadius;
      const fill = expansionAt(cycleTime - LAG_SPREAD * dot.distance);
      const travel = dotRadius * 2.08 * fill;

      context.save();
      context.beginPath();
      context.arc(x, y, dotRadius, 0, Math.PI * 2);
      context.clip();

      context.fillStyle = "#fff";
      context.fill();

      // The cover slides along the dot's own bearing, which is what turns the
      // crescents outward and gives the disc its pinwheel.
      context.beginPath();
      context.arc(
        x + Math.cos(dot.angle) * travel,
        y + Math.sin(dot.angle) * travel,
        dotRadius + 0.7,
        0,
        Math.PI * 2,
      );
      context.fillStyle = PANEL;
      context.fill();
      context.restore();
    }
  }, [cycleTime, size]);

  return <canvas ref={canvas} style={{ width: size, height: size }} aria-hidden="true" />;
}
