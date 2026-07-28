export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function isNewActive(markedNewAt: string | null): boolean {
  if (!markedNewAt) return false;
  return Date.now() - new Date(markedNewAt).getTime() < NEW_WINDOW_MS;
}
