"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canActOnStudent } from "@/lib/auth-helpers";
import { updateClassEvent } from "@/lib/google-calendar";

const offerSchema = z.object({
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        scheduledAt: z.string().datetime(),
      }),
    )
    .min(1)
    .max(2),
});

export async function createRescheduleOffer(
  sessionId: string,
  input: unknown,
): Promise<{ error: string } | { data: { offerId: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = offerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lessonSession = await db.lessonSession.findUnique({
    where: { id: sessionId },
    select: { id: true, class: { select: { teacherId: true } } },
  });

  if (!lessonSession || lessonSession.class.teacherId !== session.user.id) {
    return { error: "Session not found or unauthorized" };
  }

  // Only one open offer per session at a time
  const existing = await db.rescheduleOffer.findFirst({
    where: { lessonSessionId: sessionId, status: "OPEN" },
    select: { id: true },
  });
  if (existing) return { error: "An open reschedule offer already exists for this session" };

  const offer = await db.rescheduleOffer.create({
    data: {
      lessonSessionId: sessionId,
      options: {
        create: parsed.data.options.map((o) => ({
          label: o.label,
          scheduledAt: new Date(o.scheduledAt),
        })),
      },
    },
    select: { id: true },
  });

  return { data: { offerId: offer.id } };
}

export async function getRescheduleOffer(offerId: string): Promise<
  | { error: string }
  | {
      data: {
        id: string;
        status: string;
        resolvedOptionId: string | null;
        lessonSession: { id: string; scheduledAt: string; classId: string; className: string };
        options: Array<{ id: string; label: string; scheduledAt: string; voteCount: number }>;
        myVoteOptionId: string | null;
        isTeacher: boolean;
      };
    }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const offer = await db.rescheduleOffer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      status: true,
      resolvedOptionId: true,
      lessonSession: {
        select: {
          id: true,
          scheduledAt: true,
          classId: true,
          class: { select: { name: true, teacherId: true } },
        },
      },
      options: {
        select: {
          id: true,
          label: true,
          scheduledAt: true,
          _count: { select: { votes: true } },
        },
        orderBy: { scheduledAt: "asc" },
      },
      votes: {
        select: { studentId: true, optionId: true },
      },
    },
  });

  if (!offer) return { error: "Offer not found" };

  const isTeacher = offer.lessonSession.class.teacherId === session.user.id;

  // For students/guardians: check they have access via a Student record
  if (!isTeacher) {
    const student = await db.student.findFirst({
      where: {
        enrollments: { some: { classId: offer.lessonSession.classId, status: "ACTIVE" } },
      },
      select: { id: true },
    });
    // Find any student linked to this user who is enrolled
    const linkedStudent = await db.student.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { guardians: { some: { guardianId: session.user.id } } },
        ],
        enrollments: { some: { classId: offer.lessonSession.classId, status: "ACTIVE" } },
      },
      select: { id: true },
    });
    if (!linkedStudent) return { error: "Not authorized to view this offer" };

    const myVote = offer.votes.find((v) => v.studentId === linkedStudent.id);
    return {
      data: {
        id: offer.id,
        status: offer.status,
        resolvedOptionId: offer.resolvedOptionId,
        lessonSession: {
          id: offer.lessonSession.id,
          scheduledAt: offer.lessonSession.scheduledAt.toISOString(),
          classId: offer.lessonSession.classId,
          className: offer.lessonSession.class.name,
        },
        options: offer.options.map((o) => ({
          id: o.id,
          label: o.label,
          scheduledAt: o.scheduledAt.toISOString(),
          voteCount: o._count.votes,
        })),
        myVoteOptionId: myVote?.optionId ?? null,
        isTeacher: false,
      },
    };
  }

  return {
    data: {
      id: offer.id,
      status: offer.status,
      resolvedOptionId: offer.resolvedOptionId,
      lessonSession: {
        id: offer.lessonSession.id,
        scheduledAt: offer.lessonSession.scheduledAt.toISOString(),
        classId: offer.lessonSession.classId,
        className: offer.lessonSession.class.name,
      },
      options: offer.options.map((o) => ({
        id: o.id,
        label: o.label,
        scheduledAt: o.scheduledAt.toISOString(),
        voteCount: o._count.votes,
      })),
      myVoteOptionId: null,
      isTeacher: true,
    },
  };
}

export async function submitVote(
  offerId: string,
  optionId: string,
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const offer = await db.rescheduleOffer.findUnique({
    where: { id: offerId },
    select: {
      status: true,
      lessonSession: { select: { classId: true } },
      options: { select: { id: true } },
    },
  });

  if (!offer) return { error: "Offer not found" };
  if (offer.status !== "OPEN") return { error: "This offer is no longer open for voting" };
  if (!offer.options.some((o) => o.id === optionId)) return { error: "Invalid option" };

  // Find the student linked to this user who is enrolled in the class
  const linkedStudent = await db.student.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { guardians: { some: { guardianId: session.user.id } } },
      ],
      enrollments: { some: { classId: offer.lessonSession.classId, status: "ACTIVE" } },
    },
    select: { id: true },
  });

  if (!linkedStudent) return { error: "Not authorized to vote on this offer" };

  // Upsert: co-guardians or student voting again just update the choice
  await db.vote.upsert({
    where: { offerId_studentId: { offerId, studentId: linkedStudent.id } },
    update: { optionId },
    create: { offerId, optionId, studentId: linkedStudent.id },
  });

  return { data: { success: true } };
}

export async function resolveOffer(
  offerId: string,
  winningOptionId: string,
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const offer = await db.rescheduleOffer.findUnique({
    where: { id: offerId },
    select: {
      status: true,
      lessonSession: {
        select: {
          id: true,
          classId: true,
          class: {
            select: {
              teacherId: true,
              calendarEventId: true,
              name: true,
              subject: true,
            },
          },
        },
      },
      options: { select: { id: true, scheduledAt: true } },
    },
  });

  if (!offer) return { error: "Offer not found" };
  if (offer.lessonSession.class.teacherId !== session.user.id) return { error: "Unauthorized" };
  if (offer.status !== "OPEN") return { error: "Offer is already resolved" };

  const winningOption = offer.options.find((o) => o.id === winningOptionId);
  if (!winningOption) return { error: "Invalid option" };

  await db.$transaction([
    db.rescheduleOffer.update({
      where: { id: offerId },
      data: { status: "RESOLVED", resolvedOptionId: winningOptionId },
    }),
    db.lessonSession.update({
      where: { id: offer.lessonSession.id },
      data: { scheduledAt: winningOption.scheduledAt, status: "RESCHEDULED" },
    }),
  ]);

  // Update Google Calendar event summary/time if connected
  const teacher = await db.user.findUnique({
    where: { id: session.user.id },
    select: { designatedCalendarId: true },
  });

  const calEventId = offer.lessonSession.class.calendarEventId;
  if (teacher?.designatedCalendarId && calEventId) {
    try {
      await updateClassEvent(session.user.id, teacher.designatedCalendarId, calEventId, {
        summary: `${offer.lessonSession.class.name} — RESCHEDULED`,
      });
    } catch (err) {
      console.error("[calendar] Failed to update event after resolve:", err);
    }
  }

  return { data: { success: true } };
}
