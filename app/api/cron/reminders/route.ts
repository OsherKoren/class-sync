import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyStudentAndGuardians } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // With once-daily execution at 08:00 UTC, use full-day lookahead windows:
  // "today" covers sessions starting in the next 0–24 h (today's classes).
  // "tomorrow" covers sessions starting in the next 24–48 h (tomorrow's classes).
  const sessions = await db.lessonSession.findMany({
    where: {
      status: "SCHEDULED",
      OR: [
        { scheduledAt: { gte: in24h, lte: in48h } },
        { scheduledAt: { gte: now, lt: in24h } },
      ],
    },
    select: {
      scheduledAt: true,
      class: {
        select: {
          name: true,
          enrollments: { where: { status: "ACTIVE" }, select: { studentId: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const session of sessions) {
    const isTomorrow = session.scheduledAt >= in24h;
    const body = isTomorrow ? "Your session starts tomorrow" : "Your session starts today";

    for (const e of session.class.enrollments) {
      await notifyStudentAndGuardians(
        e.studentId,
        { title: `ClassSync — ${session.class.name}`, body },
        `Reminder: ${session.class.name} starts ${isTomorrow ? "tomorrow" : "today"}.`
      );
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
