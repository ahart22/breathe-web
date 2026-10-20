export type SessionRow = {
  id: string;
  user_id: string;
  started_at: string;
  pattern: string;
  planned_seconds: number;
  actual_seconds: number;
  breaths: number;
  completed: boolean;
};

export type PreferencesRow = {
  user_id: string;
  minutes: number;
  reminders_on: boolean;
  interval_minutes: number;
  updated_at: string;
};
