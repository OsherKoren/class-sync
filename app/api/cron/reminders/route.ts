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
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const in65min = new Date(now.getTime() + 65 * 60 * 1000);

  const sessions = await db.lessonSession.findMany({
    where: {
      status: "SCHEDULED",
      OR: [
        { scheduledAt: { gte: in24h, lte: in25h } },
        { scheduledAt: { gte: in1h, lte: in65min } },
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
    const isIn24h = session.scheduledAt >= in24h;
    const body = isIn24h ? "Your session starts in 24 hours" : "Your session starts in 1 hour";

    for (const e of session.class.enrollments) {
      await notifyStudentAndGuardians(
        e.studentId,
        { title: `ClassSync — ${session.class.name}`, body },
        `Reminder: ${session.class.name} starts ${isIn24h ? "in 24 hours" : "in 1 hour"}.`
      );
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
