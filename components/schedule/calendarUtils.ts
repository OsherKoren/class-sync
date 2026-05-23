export const HOUR_HEIGHT = 64; // px per hour

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function gridRange(classes: { startTime: string; duration: number }[]): {
  startHour: number;
  endHour: number;
} {
  if (classes.length === 0) return { startHour: 8, endHour: 18 };
  const starts = classes.map((c) => toMinutes(c.startTime));
  const ends = classes.map((c) => toMinutes(c.startTime) + c.duration);
  return {
    startHour: Math.max(0, Math.floor(Math.min(...starts) / 60) - 1),
    endHour: Math.min(24, Math.ceil(Math.max(...ends) / 60) + 1),
  };
}
