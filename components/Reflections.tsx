"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NoteRow } from "@/lib/types";

/** The thing a visitor types, saves, and finds again when they come back.
 *  Rows are written with the signed-in user's id and read back under RLS, so
 *  a second account querying the same table sees none of them. */
export function Reflections({ userId, initial }: { userId: string; initial: NoteRow[] }) {
  const [notes, setNotes] = useState<NoteRow[]>(initial);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { data, error: failure } = await supabase
      .from("notes")
      .insert({ user_id: userId, body: text })
      .select()
      .single();

    if (failure) {
      setError(failure.message);
      setBusy(false);
      return;
    }

    // Prepend rather than refetch: the row we just wrote is the row we show.
    setNotes((current) => [data as NoteRow, ...current]);
    setBody("");
    setSaved(true);
    setBusy(false);
  }

  return (
    <section className="panel-card" data-testid="reflections">
      <h2 className="card-title">How are you feeling?</h2>
      <p className="muted card-sub">
        One line is enough. Saved to your account, visible only to you.
      </p>

      <form onSubmit={save} data-testid="note-form">
        <textarea
          name="body"
          className="note-input"
          placeholder="Wrote for two hours and my shoulders are up by my ears."
          rows={3}
          maxLength={2000}
          required
          data-testid="note-input"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setSaved(false);
          }}
        />

        <div className="note-actions">
          <button
            type="submit"
            className="cta"
            disabled={busy || !body.trim()}
            data-testid="note-save"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {saved && (
            <span className="notice" role="status" data-testid="note-saved">
              Saved.
            </span>
          )}
          {error && (
            <span className="error" role="alert" data-testid="note-error">
              {error}
            </span>
          )}
        </div>
      </form>

      <h3 className="card-title list-title">
        Your reflections{" "}
        <span className="muted" data-testid="note-count">
          ({notes.length})
        </span>
      </h3>

      {notes.length === 0 ? (
        <p className="muted" data-testid="note-empty">
          Nothing saved yet. Write a line above and press Save.
        </p>
      ) : (
        <ul className="note-list" data-testid="note-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item" data-testid="note-item">
              <p className="note-body">{note.body}</p>
              <time className="muted note-time" dateTime={note.created_at}>
                {new Date(note.created_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
