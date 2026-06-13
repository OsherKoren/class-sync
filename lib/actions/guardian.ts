"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { notifyStudentAndGuardians } from "@/lib/notifications";

const guardianSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const studentSchema = z.object({
  name: z.string().min(2, "Student name must be at least 2 characters"),
});

export async function createGuardian(
  input: unknown
): Promise<{ error: string } | { data: { userId: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = guardianSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const tempPassword = Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash, role: "GUARDIAN" },
    select: { id: true },
  });

  return { data: { userId: user.id } };
}

export async function addStudent(
  guardianId: string,
  input: unknown
): Promise<{ error: string } | { data: { id: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name } = parsed.data;

  const student = await db.student.create({
    data: { name },
    select: { id: true },
  });

  await db.studentGuardian.create({
    data: { studentId: student.id, guardianId },
  });

  return { data: { id: student.id } };
}

export async function enrollStudent(
  studentId: string,
  classId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true, maxCapacity: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId, classId } },
  });

  if (existing) {
    return { error: "Student is already enrolled in this class" };
  }

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.enrollment.create({
      data: { studentId, classId, status: "ACTIVE" },
    });
    if (classRecord.maxCapacity !== null) {
      const activeCount = await tx.enrollment.count({
        where: { classId, status: "ACTIVE" },
      });
      if (activeCount >= classRecord.maxCapacity) {
        await tx.class.update({ where: { id: classId }, data: { isOpen: false } });
      }
    }
  });

  return { data: { success: true } };
}

export async function findStudentByEmail(
  email: string
): Promise<
  | { error: string }
  | { data: { studentId: string; name: string; email: string } }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      student: { select: { id: true } },
    },
  });

  if (!user || !user.student) {
    return { error: "Student not found" };
  }

  return {
    data: {
      studentId: user.student.id,
      name: user.name || "Student",
      email: user.email,
    },
  };
}

export async function enrollStudentByEmail(
  email: string,
  classId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { teacherId: true, maxCapacity: true },
  });

  if (!classRecord || classRecord.teacherId !== session.user.id) {
    return { error: "Class not found or unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { student: { select: { id: true } } },
  });

  if (!user || !user.student) {
    return { error: "Student not found" };
  }

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: user.student.id, classId } },
  });

  if (existing) {
    return { error: "Student is already enrolled in this class" };
  }

  const studentId = user.student.id;
  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.enrollment.create({
      data: { studentId, classId, status: "ACTIVE" },
    });
    if (classRecord.maxCapacity !== null) {
      const activeCount = await tx.enrollment.count({
        where: { classId, status: "ACTIVE" },
      });
      if (activeCount >= classRecord.maxCapacity) {
        await tx.class.update({ where: { id: classId }, data: { isOpen: false } });
      }
    }
  });

  return { data: { success: true } };
}

export async function approveEnrollment(
  enrollmentId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      studentId: true,
      classId: true,
      class: { select: { name: true, teacherId: true, maxCapacity: true } },
    },
  });

  if (!enrollment || enrollment.class.teacherId !== session.user.id) {
    return { error: "Enrollment not found or unauthorized" };
  }

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    });
    if (enrollment.class.maxCapacity !== null) {
      const activeCount = await tx.enrollment.count({
        where: { classId: enrollment.classId, status: "ACTIVE" },
      });
      if (activeCount >= enrollment.class.maxCapacity) {
        await tx.class.update({
          where: { id: enrollment.classId },
          data: { isOpen: false },
        });
      }
    }
  });

  notifyStudentAndGuardians(
    enrollment.studentId,
    { title: `ClassSync — ${enrollment.class.name}`, body: "Your enrollment was approved!" },
    `Your enrollment in ${enrollment.class.name} was approved.`
  ).catch((err) => console.error("[notify] approveEnrollment:", err));

  return { data: { success: true } };
}

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function rejectEnrollment(
  enrollmentId: string,
  reason?: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = rejectSchema.safeParse({ reason });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      studentId: true,
      class: { select: { name: true, teacherId: true } },
    },
  });

  if (!enrollment || enrollment.class.teacherId !== session.user.id) {
    return { error: "Enrollment not found or unauthorized" };
  }

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason ?? null },
  });

  revalidatePath("/student/dashboard");
  revalidatePath("/student/classes");
  revalidatePath("/teacher/dashboard");

  const rejectMsg = parsed.data.reason
    ? `Your enrollment in ${enrollment.class.name} was not approved. Reason: ${parsed.data.reason}`
    : `Your enrollment in ${enrollment.class.name} was not approved.`;

  notifyStudentAndGuardians(
    enrollment.studentId,
    { title: `ClassSync — ${enrollment.class.name}`, body: "Your enrollment request was not approved." },
    rejectMsg
  ).catch((err) => console.error("[notify] rejectEnrollment:", err));

  return { data: { success: true } };
}

export async function getPendingEnrollments(): Promise<
  | { error: string }
  | {
      data: Array<{
        enrollmentId: string;
        studentName: string;
        className: string;
        classId: string;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      status: "PENDING",
      class: { teacherId: session.user.id },
    },
    select: {
      id: true,
      classId: true,
      student: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    data: enrollments.map((e: (typeof enrollments)[number]) => ({
      enrollmentId: e.id,
      studentName: e.student.name,
      className: e.class.name,
      classId: e.classId,
    })),
  };
}

export async function getTeacherStudents(): Promise<
  | { error: string }
  | {
      data: Array<{
        guardianId: string;
        guardianName: string;
        guardianEmail: string;
        students: Array<{ id: string; name: string }>;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const guardians = await db.user.findMany({
    where: { role: "GUARDIAN" },
    select: {
      id: true,
      name: true,
      email: true,
      guardianOf: {
        select: { student: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: guardians.map((g: (typeof guardians)[number]) => ({
      guardianId: g.id,
      guardianName: g.name || "Unnamed",
      guardianEmail: g.email,
      students: g.guardianOf.map((sg: (typeof g.guardianOf)[number]) => sg.student),
    })),
  };
}

export async function getGuardianStudents(guardianId: string): Promise<
  | { error: string }
  | {
      data: {
        guardianId: string;
        guardianName: string;
        guardianEmail: string;
        students: Array<{ id: string; name: string }>;
      };
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const guardian = await db.user.findUnique({
    where: { id: guardianId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      guardianOf: {
        select: { student: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!guardian || guardian.role !== "GUARDIAN") {
    return { error: "Guardian not found" };
  }

  return {
    data: {
      guardianId: guardian.id,
      guardianName: guardian.name || "Unnamed",
      guardianEmail: guardian.email,
      students: guardian.guardianOf.map((sg: (typeof guardian.guardianOf)[number]) => sg.student),
    },
  };
}

export async function getTeacherStudentsAll(): Promise<
  | { error: string }
  | {
      data: Array<{
        id: string;
        name: string;
        hasAccount: boolean;
        guardians: Array<{ id: string; name: string | null; email: string }>;
        activeEnrollments: number;
        pendingEnrollments: number;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const students = await db.student.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      guardians: {
        select: {
          guardian: { select: { id: true, name: true, email: true } },
        },
      },
      enrollments: {
        where: { status: { in: ["ACTIVE", "PENDING"] } },
        select: { status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: students.map((s: (typeof students)[number]) => ({
      id: s.id,
      name: s.name,
      hasAccount: s.userId !== null,
      guardians: s.guardians.map((sg: (typeof s.guardians)[number]) => sg.guardian),
      activeEnrollments: s.enrollments.filter((e: (typeof s.enrollments)[number]) => e.status === "ACTIVE").length,
      pendingEnrollments: s.enrollments.filter((e: (typeof s.enrollments)[number]) => e.status === "PENDING").length,
    })),
  };
}

export async function unenrollStudent(
  enrollmentId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { class: { select: { teacherId: true } } },
  });

  if (!enrollment || enrollment.class.teacherId !== session.user.id) {
    return { error: "Enrollment not found or unauthorized" };
  }

  await db.enrollment.delete({ where: { id: enrollmentId } });

  return { data: { success: true } };
}

export async function findGuardianByEmail(
  email: string
): Promise<{ error: string } | { data: { id: string; name: string | null; email: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user || user.role !== "GUARDIAN") {
    return { error: "Guardian not found" };
  }

  return { data: { id: user.id, name: user.name, email: user.email } };
}

export async function linkGuardianToStudent(
  guardianEmail: string,
  studentId: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const guardian = await db.user.findUnique({
    where: { email: guardianEmail },
    select: { id: true, role: true },
  });

  if (!guardian || guardian.role !== "GUARDIAN") {
    return { error: "Guardian not found" };
  }

  const existing = await db.studentGuardian.findUnique({
    where: { studentId_guardianId: { studentId, guardianId: guardian.id } },
  });

  if (existing) {
    return { error: "Guardian is already linked to this student" };
  }

  await db.studentGuardian.create({
    data: { studentId, guardianId: guardian.id },
  });

  return { data: { success: true } };
}

export async function getTeacherStudentById(studentId: string): Promise<
  | { error: string }
  | {
      data: {
        id: string;
        name: string;
        hasAccount: boolean;
        guardians: Array<{ id: string; name: string | null; email: string }>;
        enrollments: Array<{
          id: string;
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
      };
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      userId: true,
      guardians: {
        select: {
          guardian: { select: { id: true, name: true, email: true } },
        },
      },
      enrollments: {
        select: {
          id: true,
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!student) return { error: "Student not found" };

  return {
    data: {
      id: student.id,
      name: student.name,
      hasAccount: student.userId !== null,
      guardians: student.guardians.map((sg: (typeof student.guardians)[number]) => sg.guardian),
      enrollments: student.enrollments,
    },
  };
}
