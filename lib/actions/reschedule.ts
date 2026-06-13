"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateClassEvent } from "@/lib/google-calendar";

const offerSchema = z.object({
  label: z.string().min(1).max(100),
  scheduledAt: z.string().datetime(),
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

  const existing = await db.rescheduleOffer.findFirst({
    where: { lessonSessionId: sessionId, status: "OPEN" },
    select: { id: true },
  });
  if (existing) return { error: "An open reschedule offer already exists for this session" };

  const offer = await db.rescheduleOffer.create({
    data: {
      lessonSessionId: sessionId,
      options: {
        create: [{ label: parsed.data.label, scheduledAt: new Date(parsed.data.scheduledAt) }],
      },
    },
    select: { id: true },
  });

  return { data: { offerId: offer.id } };
}

export type RescheduleOfferData = {
  id: string;
  status: string;
  lessonSession: { id: string; scheduledAt: string; classId: string; className: string };
  option: { id: string; label: string; scheduledAt: string };
  yesCount: number;
  noCount: number;
  myVote: boolean | null;
  isTeacher: boolean;
};

export async function getRescheduleOffer(
  offerId: string,
): Promise<{ error: string } | { data: RescheduleOfferData }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const offer = await db.rescheduleOffer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      status: true,
      lessonSession: {
        select: {
          id: true,
          scheduledAt: true,
          classId: true,
          class: { select: { name: true, teacherId: true } },
        },
      },
      options: {
        select: { id: true, label: true, scheduledAt: true },
        take: 1,
      },
      votes: {
        select: { studentId: true, canAttend: true },
      },
    },
  });

  if (!offer) return { error: "Offer not found" };
  if (!offer.options[0]) return { error: "Offer has no option" };

  const isTeacher = offer.lessonSession.class.teacherId === session.user.id;
  const yesCount = offer.votes.filter((v) => v.canAttend).length;
  const noCount = offer.votes.filter((v) => !v.canAttend).length;
  const opt = offer.options[0];

  if (!isTeacher) {
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

    const myVoteRow = offer.votes.find((v) => v.studentId === linkedStudent.id);
    return {
      data: {
        id: offer.id,
        status: offer.status,
        lessonSession: {
          id: offer.lessonSession.id,
          scheduledAt: offer.lessonSession.scheduledAt.toISOString(),
          classId: offer.lessonSession.classId,
          className: offer.lessonSession.class.name,
        },
        option: { id: opt.id, label: opt.label, scheduledAt: opt.scheduledAt.toISOString() },
        yesCount,
        noCount,
        myVote: myVoteRow ? myVoteRow.canAttend : null,
        isTeacher: false,
      },
    };
  }

  return {
    data: {
      id: offer.id,
      status: offer.status,
      lessonSession: {
        id: offer.lessonSession.id,
        scheduledAt: offer.lessonSession.scheduledAt.toISOString(),
        classId: offer.lessonSession.classId,
        className: offer.lessonSession.class.name,
      },
      option: { id: opt.id, label: opt.label, scheduledAt: opt.scheduledAt.toISOString() },
      yesCount,
      noCount,
      myVote: null,
      isTeacher: true,
    },
  };
}

export async function submitVote(
  offerId: string,
  canAttend: boolean,
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const offer = await db.rescheduleOffer.findUnique({
    where: { id: offerId },
    select: {
      status: true,
      lessonSession: { select: { classId: true } },
    },
  });

  if (!offer) return { error: "Offer not found" };
  if (offer.status !== "OPEN") return { error: "This offer is no longer open for voting" };

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

  await db.vote.upsert({
    where: { offerId_studentId: { offerId, studentId: linkedStudent.id } },
    update: { canAttend },
    create: { offerId, studentId: linkedStudent.id, canAttend },
  });

  return { data: { success: true } };
}

export async function resolveOffer(
  offerId: string,
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
          class: { select: { teacherId: true, calendarEventId: true, name: true } },
        },
      },
      options: { select: { id: true, scheduledAt: true }, take: 1 },
    },
  });

  if (!offer) return { error: "Offer not found" };
  if (offer.lessonSession.class.teacherId !== session.user.id) return { error: "Unauthorized" };
  if (offer.status !== "OPEN") return { error: "Offer is already resolved" };
  if (!offer.options[0]) return { error: "Offer has no option" };

  const opt = offer.options[0];

  await db.$transaction([
    db.rescheduleOffer.update({
      where: { id: offerId },
      data: { status: "RESOLVED", resolvedOptionId: opt.id },
    }),
    db.lessonSession.update({
      where: { id: offer.lessonSession.id },
      data: { scheduledAt: opt.scheduledAt, status: "RESCHEDULED" },
    }),
  ]);

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
