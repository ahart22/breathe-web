"use client";

import { useEffect, useRef, useState } from "react";

type Spark = { id: number; x: number; y: number; w: number; h: number; tilt: number };

/** Four-point sparkles scattered along the cursor's path. Fixed-position and
 *  pointer-events: none, so it can never swallow a click. */
export function SparkleTrail() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const last = useRef<{ x: number; y: number } | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    function onMove(event: MouseEvent) {
      const previous = last.current;
      if (previous) {
        const dx = event.clientX - previous.x;
        const dy = event.clientY - previous.y;
        if (Math.hypot(dx, dy) < 26) return;
      }
      last.current = { x: event.clientX, y: event.clientY };

      const spark: Spark = {
        id: seq.current++,
        x: event.clientX + (Math.random() * 14 - 7),
        y: event.clientY + (Math.random() * 14 - 7),
        w: 13 + Math.random() * 9,
        h: 8 + Math.random() * 5,
        tilt: Math.random() * 48 - 24,
      };

      // A ceiling, so a fast scribble cannot pile up unbounded.
      setSparks((current) => [...current, spark].slice(-16));
      window.setTimeout(
        () => setSparks((current) => current.filter((s) => s.id !== spark.id)),
        680,
      );
    }

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      {sparks.map((spark) => (
        <svg
          key={spark.id}
          className="sparkle"
          width={spark.w}
          height={spark.h}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            left: spark.x - spark.w / 2,
            top: spark.y - spark.h / 2,
            transform: `rotate(${spark.tilt}deg)`,
          }}
          aria-hidden="true"
        >
          {/* Four tapered points with a pinched waist — a sparkle, not a diamond. */}
          <path d="M50 0 Q56.5 43.5 100 50 Q56.5 56.5 50 100 Q43.5 56.5 0 50 Q43.5 43.5 50 0Z" />
        </svg>
      ))}
    </>
  );
}
