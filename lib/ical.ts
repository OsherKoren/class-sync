const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
// 1970-01-01 was a Thursday (day 4) — used as a fixed anchor for stable DTSTART computation.
const EPOCH_DOW = 4;

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

// Format a DTSTART/DTEND value from a UTC date (date part only) and a "HH:mm" local time string.
export function fmtICalDateTime(utcDate: Date, timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  return [
    utcDate.getUTCFullYear(),
    String(utcDate.getUTCMonth() + 1).padStart(2, "0"),
    String(utcDate.getUTCDate()).padStart(2, "0"),
    "T",
    String(h).padStart(2, "0"),
    String(m).padStart(2, "0"),
    "00",
  ].join("");
}

// Add minutes to a "HH:mm" time string, returning a new "HH:mm" string.
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Returns a deterministic UTC anchor date for the given weekday (0=Sun…6=Sat).
// Same input always returns the same date regardless of current time, preventing
// duplicate calendar entries when users re-download the .ics file.
export function nextWeekdayDate(dayOfWeek: number): Date {
  const diff = (dayOfWeek - EPOCH_DOW + 7) % 7;
  return new Date(Date.UTC(1970, 0, 1 + diff));
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
      `DTSTART;TZID=Asia/Jerusalem:${ev.dtstart}`,
      `DTEND;TZID=Asia/Jerusalem:${ev.dtend}`,
      ...(ev.rrule ? [`RRULE:${ev.rrule}`] : []),
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
