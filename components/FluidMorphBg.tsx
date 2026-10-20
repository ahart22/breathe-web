"use client";

/** A slow fluid wash for the home screen.
 *
 *  Each blob is a soft radial gradient whose border-radius is animated
 *  between asymmetric values, which is what makes it appear to deform rather
 *  than simply move. Heavy blur dissolves the edges so they read as one body
 *  of liquid rather than as separate shapes, and every blob runs on its own
 *  period so the whole thing never visibly repeats.
 *
 *  Kept slow and dim on purpose: it sits behind the breathing exercise, and
 *  anything quick or bright there is working against the app.
 */
export function FluidMorphBg({ className }: { className?: string }) {
  return (
    <div className={className ? `fluid ${className}` : "fluid"} aria-hidden="true">
      <span className="blob blob-1" />
      <span className="blob blob-2" />
      <span className="blob blob-3" />
      <span className="blob blob-4" />
    </div>
  );
}
