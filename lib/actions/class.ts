"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  type: z.enum(["GROUP", "PRIVATE"]),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
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

  const { name, subject, type, dayOfWeek, startTime, duration } = parsed.data;

  // Check for overlapping classes on the same day
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = startTotalMinutes + duration;

  const existingClasses = await db.class.findMany({
    where: {
      teacherId: session.user.id,
      dayOfWeek: dayOfWeek,
    },
    select: {
      id: true,
      startTime: true,
      duration: true,
    },
  });

  // Check if any existing class overlaps with the new one
  for (const existing of existingClasses) {
    const [existingHour, existingMinute] = existing.startTime.split(":").map(Number);
    const existingStart = existingHour * 60 + existingMinute;
    const existingEnd = existingStart + existing.duration;

    // Check for overlap: new class starts before existing ends AND new class ends after existing starts
    if (startTotalMinutes < existingEnd && endTotalMinutes > existingStart) {
      const endHour = Math.floor(existingEnd / 60).toString().padStart(2, "0");
      const endMin = (existingEnd % 60).toString().padStart(2, "0");
      return {
        error: `You already have a class on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek]} from ${existing.startTime} to ${endHour}:${endMin}`,
      };
    }
  }

  const classRecord = await db.class.create({
    data: {
      name,
      subject,
      type,
      dayOfWeek,
      startTime,
      duration,
      teacherId: session.user.id,
    },
    select: { id: true },
  });

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

  const parsed = classSchema.partial().safeParse(input);
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
        dayOfWeek: number;
        startTime: string;
        duration: number;
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
      dayOfWeek: true,
      startTime: true,
      duration: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: classes.map((c) => ({
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
        dayOfWeek: number;
        startTime: string;
        duration: number;
        isOpen: boolean;
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
      dayOfWeek: true,
      startTime: true,
      duration: true,
      isOpen: true,
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
      dayOfWeek: classRecord.dayOfWeek,
      startTime: classRecord.startTime,
      duration: classRecord.duration,
      isOpen: classRecord.isOpen,
      enrollments: classRecord.enrollments.map((e) => ({
        id: e.id,
        studentId: e.student.id,
        studentName: e.student.name,
        status: e.status,
      })),
    },
  };
}
