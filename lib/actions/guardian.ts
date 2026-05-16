"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

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
    select: { teacherId: true },
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

  await db.enrollment.create({
    data: { studentId, classId, status: "ACTIVE" },
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
    select: { teacherId: true },
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

  await db.enrollment.create({
    data: { studentId: user.student.id, classId, status: "ACTIVE" },
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
    select: { class: { select: { teacherId: true } } },
  });

  if (!enrollment || enrollment.class.teacherId !== session.user.id) {
    return { error: "Enrollment not found or unauthorized" };
  }

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "ACTIVE" },
  });

  return { data: { success: true } };
}

export async function rejectEnrollment(
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

  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "REJECTED" },
  });

  return { data: { success: true } };
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
    data: guardians.map((g) => ({
      guardianId: g.id,
      guardianName: g.name || "Unnamed",
      guardianEmail: g.email,
      students: g.guardianOf.map((sg) => sg.student),
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
      students: guardian.guardianOf.map((sg) => sg.student),
    },
  };
}
