import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canActOnStudent } from "@/lib/auth-helpers";
import {
  buildIcal,
  fmtICalDate,
  nextWeekdayDate,
  weekdayToken,
  type ICalEvent,
} from "@/lib/ical";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { studentId } = await params;

  if (!(await canActOnStudent(studentId, session.user.id))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      name: true,
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          type: true,
          lessonSession: {
            select: { scheduledAt: true },
          },
          class: {
            select: {
              id: true,
              name: true,
              subject: true,
              dayOfWeek: true,
              startTime: true,
              duration: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const events: ICalEvent[] = student.enrollments.map((enrollment) => {
    const cls = enrollment.class;

    if (enrollment.type === "ONE_TIME" && enrollment.lessonSession) {
      const start = new Date(enrollment.lessonSession.scheduledAt);
      const end = new Date(start.getTime() + cls.duration * 60_000);
      return {
        uid: `classsync-one-time-${enrollment.id}`,
        summary: `${cls.name} (${cls.subject})`,
        description: "One-time session",
        dtstart: fmtICalDate(start),
        dtend: fmtICalDate(end),
      };
    }

    const start = nextWeekdayDate(cls.dayOfWeek, cls.startTime);
    const end = new Date(start.getTime() + cls.duration * 60_000);
    return {
      uid: `classsync-recurring-${cls.id}-${studentId}`,
      summary: `${cls.name} (${cls.subject})`,
      dtstart: fmtICalDate(start),
      dtend: fmtICalDate(end),
      rrule: `FREQ=WEEKLY;BYDAY=${weekdayToken(cls.dayOfWeek)}`,
    };
  });

  const ical = buildIcal(events);
  const filename = `${student.name.replace(/\s+/g, "_")}_schedule.ics`;

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
