const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  rrule?: string;
}

function escape(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function fmtICalDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
    "T",
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    "00",
  ].join("");
}

// Returns the next date that falls on `dayOfWeek` (0=Sun…6=Sat) at `timeStr` ("HH:mm").
// If today is that weekday but the time has already passed, returns next week.
export function nextWeekdayDate(dayOfWeek: number, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  let diff = (dayOfWeek - now.getDay() + 7) % 7;
  if (diff === 0 && d <= now) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export function weekdayToken(dayOfWeek: number): string {
  return BYDAY[dayOfWeek];
}

export function buildIcal(events: ICalEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClassSync//ClassSync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `SUMMARY:${escape(ev.summary)}`,
      ...(ev.description ? [`DESCRIPTION:${escape(ev.description)}`] : []),
      `DTSTART:${ev.dtstart}`,
      `DTEND:${ev.dtend}`,
      ...(ev.rrule ? [`RRULE:${ev.rrule}`] : []),
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
