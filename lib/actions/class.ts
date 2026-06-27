"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  createRecurringClassEvent,
  cancelCalendarEventOccurrence,
} from "@/lib/google-calendar";

const classSchemaBase = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  type: z.enum(["GROUP", "PRIVATE"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  grade: z.string().min(1, "Grade is required").max(50),
  isRecurring: z.boolean().default(true),
  // recurring: dayOfWeek required; one-time: sessionDate (YYYY-MM-DD) required
  dayOfWeek: z.number().min(0).max(6).optional(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  isOpen: z.boolean().optional(),
  maxCapacity: z.number().int().min(1).optional().nullable(),
});

const classSchema = classSchemaBase.superRefine((d, ctx) => {
  if (d.isRecurring && d.dayOfWeek === undefined) {
    ctx.addIssue({ code: "custom", path: ["dayOfWeek"], message: "Day of week is required for recurring classes" });
  }
  if (!d.isRecurring && !d.sessionDate) {
    ctx.addIssue({ code: "custom", path: ["sessionDate"], message: "Session date is required for one-time classes" });
  }
});

export async function createClass(
  input: unknown
): Promise<{ error: string } | { data: { id: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = classSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, subject, type, level, grade, isRecurring, dayOfWeek: rawDayOfWeek, sessionDate, startTime, duration, maxCapacity } = parsed.data;

  // Resolve dayOfWeek — for one-time classes compute it from sessionDate
  const dayOfWeek = isRecurring
    ? rawDayOfWeek!
    : new Date(`${sessionDate}T12:00:00`).getDay();

  if (isRecurring) {
    // Check for overlapping recurring classes on the same day
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = startTotalMinutes + duration;

    const existingClasses = await db.class.findMany({
      where: { teacherId: session.user.id, dayOfWeek, isRecurring: true },
      select: { id: true, startTime: true, duration: true },
    });

    for (const existing of existingClasses) {
      const [existingHour, existingMinute] = existing.startTime.split(":").map(Number);
      const existingStart = existingHour * 60 + existingMinute;
      const existingEnd = existingStart + existing.duration;
      if (startTotalMinutes < existingEnd && endTotalMinutes > existingStart) {
        const endHour = Math.floor(existingEnd / 60).toString().padStart(2, "0");
        const endMin = (existingEnd % 60).toString().padStart(2, "0");
        return {
          error: `You already have a class on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]} from ${existing.startTime} to ${endHour}:${endMin}`,
        };
      }
    }
  }

  const classRecord = await db.class.create({
    data: {
      name,
      subject,
      type,
      level,
      grade,
      dayOfWeek,
      startTime,
      duration,
      isRecurring,
      maxCapacity: maxCapacity ?? (type === "GROUP" ? 4 : null),
      teacherId: session.user.id,
    },
    select: { id: true },
  });

  // For one-time classes: create the single LessonSession immediately
  if (!isRecurring && sessionDate) {
    await db.lessonSession.create({
      data: {
        classId: classRecord.id,
        scheduledAt: new Date(`${sessionDate}T00:00:00.000Z`),
        status: "SCHEDULED",
      },
    });
  }

  // Sync to Google Calendar if the teacher has a designated calendar (recurring only)
  if (isRecurring) {
    const teacher = await db.user.findUnique({
      where: { id: session.user.id },
      select: { designatedCalendarId: true },
    });

    if (teacher?.designatedCalendarId) {
      try {
        const eventId = await createRecurringClassEvent(
          session.user.id,
          teacher.designatedCalendarId,
          { name, subject, dayOfWeek, startTime, duration },
        );
        await db.class.update({
          where: { id: classRecord.id },
          data: { calendarEventId: eventId },
        });
      } catch (err) {
        console.error("[calendar] Failed to create event for class:", classRecord.id, err);
      }
    }
  }

  return { data: { id: classRecord.id } };
}

export async function updateClass(
  classId: string,
  input: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = classSchemaBase.partial().safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  await db.class.update({
    where: { id: classId },
    data: parsed.data,
  });

  return { data: { success: true } };
}

export async function deleteClass(
  classId: string,
  confirmation?: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  if (confirmation !== "delete") {
    return { error: "Please type 'delete' to confirm" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true, name: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  await db.class.delete({ where: { id: classId } });

  return { data: { success: true } };
}

export async function getTeacherClasses(): Promise<
  | { error: string }
  | {
      data: Array<{
        id: string;
        name: string;
        subject: string;
        type: string;
        level: string | null;
        grade: string | null;
        dayOfWeek: number;
        startTime: string;
        duration: number;
        maxCapacity: number | null;
        isRecurring: boolean;
        enrollmentCount: number;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classes = await db.class.findMany({
    where: { teacherId: session.user.id },
    select: {
      id: true,
      name: true,
      subject: true,
      type: true,
      level: true,
      grade: true,
      dayOfWeek: true,
      startTime: true,
      duration: true,
      maxCapacity: true,
      isRecurring: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: classes.map((c: (typeof classes)[number]) => ({
      ...c,
      enrollmentCount: c._count.enrollments,
    })),
  };
}

export async function getClassById(classId: string): Promise<
  | { error: string }
  | {
      data: {
        id: string;
        name: string;
        subject: string;
        type: string;
        level: string | null;
        grade: string | null;
        dayOfWeek: number;
        startTime: string;
        duration: number;
        isOpen: boolean;
        isRecurring: boolean;
        maxCapacity: number | null;
        enrollments: Array<{
          id: string;
          studentId: string;
          studentName: string;
          status: string;
        }>;
      };
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      subject: true,
      type: true,
      level: true,
      grade: true,
      dayOfWeek: true,
      startTime: true,
      duration: true,
      isOpen: true,
      isRecurring: true,
      maxCapacity: true,
      teacherId: true,
      enrollments: {
        select: {
          id: true,
          status: true,
          student: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  return {
    data: {
      id: classRecord.id,
      name: classRecord.name,
      subject: classRecord.subject,
      type: classRecord.type,
      level: classRecord.level,
      grade: classRecord.grade,
      dayOfWeek: classRecord.dayOfWeek,
      startTime: classRecord.startTime,
      duration: classRecord.duration,
      isOpen: classRecord.isOpen,
      isRecurring: classRecord.isRecurring,
      maxCapacity: classRecord.maxCapacity,
      enrollments: classRecord.enrollments.map((e: (typeof classRecord.enrollments)[number]) => ({
        id: e.id,
        studentId: e.student.id,
        studentName: e.student.name,
        status: e.status,
      })),
    },
  };
}

export async function getCancelledSessionDates(classId: string): Promise<
  { error: string } | { data: string[] }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  const now = new Date();
  const sessions = await db.lessonSession.findMany({
    where: { classId, status: "CANCELLED", scheduledAt: { gte: now } },
    select: { scheduledAt: true },
    orderBy: { scheduledAt: "asc" },
  });

  return { data: sessions.map((s) => s.scheduledAt.toISOString().slice(0, 10)) };
}

export async function cancelClassSession(
  classId: string,
  date: string,
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { error: "Invalid date format" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true, calendarEventId: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  const scheduledAt = new Date(`${date}T00:00:00.000Z`);

  const existing = await db.lessonSession.findFirst({
    where: {
      classId,
      scheduledAt: { gte: scheduledAt, lt: new Date(scheduledAt.getTime() + 86400000) },
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "CANCELLED") {
    return { data: { success: true } }; // already cancelled — idempotent
  }

  if (existing) {
    await db.lessonSession.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });
  } else {
    await db.lessonSession.create({
      data: { classId, scheduledAt, status: "CANCELLED" },
    });
  }

  if (classRecord.calendarEventId) {
    const teacher = await db.user.findUnique({
      where: { id: session.user.id },
      select: { designatedCalendarId: true },
    });
    if (teacher?.designatedCalendarId) {
      try {
        await cancelCalendarEventOccurrence(
          session.user.id,
          teacher.designatedCalendarId,
          classRecord.calendarEventId,
          date,
        );
      } catch (err) {
        console.error("[calendar] Failed to cancel occurrence for class", classId, date, err);
        // DB is the source of truth — calendar failure is non-fatal
      }
    }
  }

  return { data: { success: true } };
}

// Creates or finds a LessonSession for a given class + date (YYYY-MM-DD).
// Used by the reschedule flow and one-time enrollment.
export async function findOrCreateLessonSession(
  classId: string,
  date: string,
): Promise<{ error: string } | { data: { sessionId: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  const scheduledAt = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(scheduledAt.getTime() + 86400000);

  const existing = await db.lessonSession.findFirst({
    where: { classId, scheduledAt: { gte: scheduledAt, lt: dayEnd } },
    select: { id: true },
  });

  if (existing) return { data: { sessionId: existing.id } };

  const created = await db.lessonSession.create({
    data: { classId, scheduledAt, originalScheduledAt: scheduledAt, status: "SCHEDULED" },
    select: { id: true },
  });

  return { data: { sessionId: created.id } };
}

export type RescheduledSessionInfo = {
  originalDate: string;
  proposedScheduledAt: string;
  offerId: string;
  confirmed: boolean;
};

export async function getRescheduledSessions(classId: string): Promise<
  { error: string } | { data: RescheduledSessionInfo[] }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  // Sessions with an OPEN offer (pending vote) — status still SCHEDULED
  const openSessions = await db.lessonSession.findMany({
    where: {
      classId,
      originalScheduledAt: { not: null },
      rescheduleOffers: { some: { status: "OPEN" } },
    },
    select: {
      originalScheduledAt: true,
      rescheduleOffers: {
        where: { status: "OPEN" },
        select: { id: true, options: { select: { scheduledAt: true }, take: 1 } },
        take: 1,
      },
    },
  });

  // Sessions already confirmed (RESCHEDULED status)
  const resolvedSessions = await db.lessonSession.findMany({
    where: { classId, status: "RESCHEDULED", originalScheduledAt: { not: null } },
    select: {
      originalScheduledAt: true,
      scheduledAt: true,
      rescheduleOffers: {
        where: { status: "RESOLVED" },
        select: { id: true },
        take: 1,
      },
    },
  });

  const result: RescheduledSessionInfo[] = [
    ...openSessions
      .filter((s) => s.rescheduleOffers[0]?.options[0])
      .map((s) => ({
        originalDate: s.originalScheduledAt!.toISOString().slice(0, 10),
        proposedScheduledAt: s.rescheduleOffers[0].options[0].scheduledAt.toISOString(),
        offerId: s.rescheduleOffers[0].id,
        confirmed: false,
      })),
    ...resolvedSessions
      .filter((s) => s.rescheduleOffers[0])
      .map((s) => ({
        originalDate: s.originalScheduledAt!.toISOString().slice(0, 10),
        proposedScheduledAt: s.scheduledAt.toISOString(),
        offerId: s.rescheduleOffers[0].id,
        confirmed: true,
      })),
  ];

  return { data: result };
}

export async function getSessionAttendeeCount(
  lessonSessionId: string,
): Promise<{ error: string } | { data: { count: number } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const lessonSession = await db.lessonSession.findUnique({
    where: { id: lessonSessionId },
    select: { classId: true },
  });

  if (!lessonSession) return { error: "Session not found" };

  const [recurringCount, oneTimeCount] = await Promise.all([
    db.enrollment.count({
      where: { classId: lessonSession.classId, status: "ACTIVE", type: "RECURRING" },
    }),
    db.enrollment.count({
      where: { lessonSessionId, status: "ACTIVE", type: "ONE_TIME" },
    }),
  ]);

  return { data: { count: recurringCount + oneTimeCount } };
}
