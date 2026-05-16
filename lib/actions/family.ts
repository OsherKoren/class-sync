"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

const familySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const studentSchema = z.object({
  name: z.string().min(2, "Student name must be at least 2 characters"),
});

export async function createFamily(
  input: unknown
): Promise<{ error: string } | { data: { userId: string; familyId: string } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const parsed = familySchema.safeParse(input);
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
    data: {
      name,
      email,
      passwordHash,
      role: "FAMILY",
    },
    select: { id: true },
  });

  const family = await db.family.create({
    data: { userId: user.id },
    select: { id: true },
  });

  // TODO: Send email with temporary password to family

  return { data: { userId: user.id, familyId: family.id } };
}

export async function addStudent(
  familyId: string,
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
    data: {
      name,
      familyId,
    },
    select: { id: true },
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
  | {
      data: {
        studentId: string;
        name: string;
        email: string;
      };
    }
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
    where: {
      studentId_classId: { studentId: user.student.id, classId },
    },
  });

  if (existing) {
    return { error: "Student is already enrolled in this class" };
  }

  await db.enrollment.create({
    data: {
      studentId: user.student.id,
      classId,
      status: "ACTIVE",
    },
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

export async function getTeacherFamilies(): Promise<
  | { error: string }
  | {
      data: Array<{
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        studentCount: number;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const families = await db.family.findMany({
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: families.map((f) => ({
      id: f.id,
      userId: f.user.id,
      userName: f.user.name || "Unnamed",
      userEmail: f.user.email,
      studentCount: f._count.students,
    })),
  };
}

export async function getFamilyById(familyId: string): Promise<
  | { error: string }
  | {
      data: {
        id: string;
        userId: string;
        userName: string;
        userEmail: string;
        students: Array<{
          id: string;
          name: string;
        }>;
      };
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "TEACHER") {
    return { error: "Unauthorized" };
  }

  const family = await db.family.findUnique({
    where: { id: familyId },
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
      students: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!family) {
    return { error: "Family not found" };
  }

  return {
    data: {
      id: family.id,
      userId: family.user.id,
      userName: family.user.name || "Unnamed",
      userEmail: family.user.email,
      students: family.students,
    },
  };
}
