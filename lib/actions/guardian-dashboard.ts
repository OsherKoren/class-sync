"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canActOnStudent } from "@/lib/auth-helpers";

type StudentWithEnrollments = {
  id: string;
  name: string;
  hasAccount: boolean;
  enrollments: Array<{
    status: string;
    class: {
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
      teacherName: string | null;
      enrollmentCount: number;
    };
  }>;
};

export async function getMyStudents(): Promise<
  { error: string } | { data: StudentWithEnrollments[] }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GUARDIAN") {
    return { error: "Unauthorized" };
  }

  const rows = await db.studentGuardian.findMany({
    where: { guardianId: session.user.id },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          userId: true,
          enrollments: {
            select: {
              status: true,
              class: {
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
                  teacher: { select: { name: true } },
                  _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  const data = rows.map(({ student }: (typeof rows)[number]) => ({
    id: student.id,
    name: student.name,
    hasAccount: student.userId !== null,
    enrollments: student.enrollments.map((e: (typeof student.enrollments)[number]) => ({
      status: e.status,
      class: {
        id: e.class.id,
        name: e.class.name,
        subject: e.class.subject,
        type: e.class.type,
        level: e.class.level,
        grade: e.class.grade,
        dayOfWeek: e.class.dayOfWeek,
        startTime: e.class.startTime,
        duration: e.class.duration,
        maxCapacity: e.class.maxCapacity,
        teacherName: e.class.teacher.name,
        enrollmentCount: e.class._count.enrollments,
      },
    })),
  }));

  return { data };
}

export async function getStudentForGuardian(studentId: string): Promise<
  { error: string } | { data: { id: string; name: string; hasAccount: boolean } }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GUARDIAN") {
    return { error: "Unauthorized" };
  }

  const allowed = await canActOnStudent(studentId, session.user.id);
  if (!allowed) return { error: "Unauthorized" };

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, userId: true },
  });

  if (!student) return { error: "Student not found" };

  return { data: { id: student.id, name: student.name, hasAccount: student.userId !== null } };
}

export async function createStudentForSelf(input: {
  name: string;
}): Promise<{ error: string } | { data: { id: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GUARDIAN") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.create({
    data: {
      name: input.name,
      guardians: { create: { guardianId: session.user.id } },
    },
    select: { id: true },
  });

  return { data: student };
}
