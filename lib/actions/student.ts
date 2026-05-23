"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getStudentEnrollments(): Promise<
  | { error: string }
  | {
      data: Array<{
        classId: string;
        status: string;
        class: {
          id: string;
          name: string;
          subject: string;
          dayOfWeek: number;
          startTime: string;
          duration: number;
        };
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      enrollments: {
        select: {
          classId: true,
          status: true,
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
    return { error: "Student profile not found" };
  }

  return { data: student.enrollments };
}

export async function getOpenClasses(): Promise<
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
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const classes = await db.class.findMany({
    where: { isOpen: true },
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
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: classes };
}

export async function requestEnrollment(
  classId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return { error: "Student profile not found" };
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId } },
  });

  if (existing) {
    return { error: "You have already requested this class" };
  }

  await db.enrollment.create({
    data: {
      studentId: student.id,
      classId,
      status: "PENDING",
    },
  });

  return { data: { success: true } };
}
