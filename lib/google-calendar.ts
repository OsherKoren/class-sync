import { google } from "googleapis";
import { db } from "@/lib/db";

const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
const TIMEZONE = process.env.CALENDAR_TIMEZONE ?? "Asia/Jerusalem";

async function getCalendarClient(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true, expires_at: true },
  });

  if (!account?.access_token) {
    throw new Error("No Google account linked");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Persist refreshed tokens back to the Account row
  oauth2.on("tokens", async (tokens) => {
    await db.account.updateMany({
      where: { userId, provider: "google" },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : account.expires_at,
      },
    });
  });

  return google.calendar({ version: "v3", auth: oauth2 });
}

// Returns a datetime string like "2025-06-12T10:00:00" for the next
// occurrence of the given dayOfWeek (0=Sun … 6=Sat) after today.
function nextOccurrenceISO(dayOfWeek: number, startTime: string): string {
  const now = new Date();
  const todayDow = now.getDay();
  let daysAhead = (dayOfWeek - todayDow + 7) % 7;
  if (daysAhead === 0) daysAhead = 7; // never schedule for today
  const date = new Date(now);
  date.setDate(now.getDate() + daysAhead);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T${startTime}:00`;
}

export async function listCalendars(
  userId: string,
): Promise<Array<{ id: string; summary: string; primary: boolean }>> {
  const cal = await getCalendarClient(userId);
  const res = await cal.calendarList.list({ minAccessRole: "writer" });
  return (res.data.items ?? []).map((c) => ({
    id: c.id!,
    summary: c.summary ?? "Untitled",
    primary: c.primary ?? false,
  }));
}

export async function createRecurringClassEvent(
  userId: string,
  calendarId: string,
  cls: {
    name: string;
    subject: string;
    dayOfWeek: number;
    startTime: string;
    duration: number;
  },
): Promise<string> {
  const cal = await getCalendarClient(userId);
  const startDT = nextOccurrenceISO(cls.dayOfWeek, cls.startTime);

  const [datePart, timePart] = startDT.split("T");
  const [h, min] = timePart.split(":").map(Number);
  const endMinutes = h * 60 + min + cls.duration;
  const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0");
  const endMM = String(endMinutes % 60).padStart(2, "0");
  const endDT = `${datePart}T${endHH}:${endMM}:00`;

  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: `${cls.name} — ${cls.subject}`,
      recurrence: [`RRULE:FREQ=WEEKLY;BYDAY=${DAYS[cls.dayOfWeek]}`],
      start: { dateTime: startDT, timeZone: TIMEZONE },
      end: { dateTime: endDT, timeZone: TIMEZONE },
    },
  });

  if (!res.data.id) throw new Error("Google Calendar returned no event ID");
  return res.data.id;
}

export async function updateClassEvent(
  userId: string,
  calendarId: string,
  eventId: string,
  patch: { summary?: string },
): Promise<void> {
  const cal = await getCalendarClient(userId);
  await cal.events.patch({ calendarId, eventId, requestBody: patch });
}

export async function deleteClassEvent(
  userId: string,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const cal = await getCalendarClient(userId);
  await cal.events.delete({ calendarId, eventId });
}

// Deletes the specific occurrence of a recurring event that falls on `date` (YYYY-MM-DD).
// Searches a full UTC-day window — safe for any timezone up to UTC+14.
export async function cancelCalendarEventOccurrence(
  userId: string,
  calendarId: string,
  eventId: string,
  date: string,
): Promise<void> {
  const cal = await getCalendarClient(userId);
  const instances = await cal.events.instances({
    calendarId,
    eventId,
    timeMin: `${date}T00:00:00Z`,
    timeMax: `${date}T23:59:59Z`,
    maxResults: 1,
  });
  const instance = instances.data.items?.[0];
  if (!instance?.id) return; // no occurrence on that date — nothing to cancel
  await cal.events.delete({ calendarId, eventId: instance.id });
}
