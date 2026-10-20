"use client";

/** The reminder, shown inside the page.
 *
 *  An OS notification can be silently swallowed — by browser permissions, by
 *  macOS's own per-app switch, or by Do Not Disturb — with no error anywhere.
 *  Drawing it in the page means it always appears, since the tab has to be
 *  open for the timer to run in the first place. */
export function ReminderBanner({
  onBegin,
  onDismiss,
}: {
  onBegin: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="reminder" role="status">
      <span className="reminder-mark" aria-hidden="true" />

      <div className="reminder-text">
        <strong>Take a breath</strong>
        <span>You have been at it a while.</span>
      </div>

      <button className="reminder-go" onClick={onBegin}>
        Begin
      </button>

      <button className="reminder-close" onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  );
}
