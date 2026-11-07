// Rules shared by the player, the API and the "Reprendre" lists.

// Below this, there is nothing worth resuming: the content restarts from 0.
export const MIN_RESUME_SECONDS = 10;

// A content counts as finished when it ended, when less than this remains
// (end credits), or past 97 % of its length.
const END_MARGIN_SECONDS = 20;
const END_RATIO = 0.97;

export function isFinished(position: number, duration: number, ended = false): boolean {
  if (ended) return true;
  if (!duration) return false;
  return duration - position <= END_MARGIN_SECONDS || position / duration >= END_RATIO;
}

// Value stored in watch_history.position_seconds: 0 means finished (or never
// tracked), anything else is where the user stopped, even a few seconds in, so
// "barely started" stays distinct from "finished".
export function storedPosition(position: number, duration: number, ended = false): number {
  if (isFinished(position, duration, ended)) return 0;
  return Math.max(1, Math.round(position));
}

export function formatRemaining(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `Reste ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `Reste ${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`;
}
