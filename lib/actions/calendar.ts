"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listCalendars } from "@/lib/google-calendar";

export async function getCalendarStatus(): Promise<
  | { error: string }
  | { data: { connected: boolean; designatedCalendarId: string | null } }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const [user, account] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { designatedCalendarId: true },
    }),
    db.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { access_token: true },
    }),
  ]);

  return {
    data: {
      connected: !!account?.access_token,
      designatedCalendarId: user?.designatedCalendarId ?? null,
    },
  };
}

export async function listTeacherCalendars(): Promise<
  | { error: string }
  | { data: Array<{ id: string; summary: string; primary: boolean }> }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  try {
    const calendars = await listCalendars(session.user.id);
    return { data: calendars };
  } catch (err) {
    console.error("[calendar] listCalendars failed:", err);
    return { error: "Could not fetch calendars. Please re-sign in with Google." };
  }
}

export async function setDesignatedCalendar(calendarId: string): Promise<
  | { error: string }
  | { data: { success: true } }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { designatedCalendarId: calendarId },
  });

  return { data: { success: true } };
}
