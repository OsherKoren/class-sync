"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { type StudentClass } from "@/lib/types";

export async function getMyEnrolledClasses(): Promise<
  { error: string } | { data: StudentClass[] }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: {
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
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
              teacher: { select: { name: true } },
              maxCapacity: true,
              _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
            },
          },
        },
      },
    },
  });

  if (!student) return { error: "Student profile not found" };

  return {
    data: student.enrollments.map((e: (typeof student.enrollments)[number]) => ({
      classId: e.class.id,
      name: e.class.name,
      subject: e.class.subject,
      type: e.class.type,
      level: e.class.level,
      grade: e.class.grade,
      dayOfWeek: e.class.dayOfWeek,
      startTime: e.class.startTime,
      duration: e.class.duration,
      teacherName: e.class.teacher.name,
      enrollmentCount: e.class._count.enrollments,
      maxCapacity: e.class.maxCapacity,
    })),
  };
}

export async function getMyAbsences(): Promise<
  { error: string } | { data: Array<{ classId: string; date: string }> }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const today = new Date().toISOString().slice(0, 10);

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: {
      absences: {
        where: { date: { gte: today } },
        select: { classId: true, date: true },
        orderBy: { date: "asc" },
        take: 50,
      },
    },
  });

  if (!student) return { error: "Student profile not found" };

  return { data: student.absences };
}

export async function cancelOneSession(
  classId: string,
  date: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) return { error: "Student profile not found" };

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId } },
    select: { status: true },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") {
    return { error: "Not enrolled in this class" };
  }

  await db.sessionAbsence.upsert({
    where: { studentId_classId_date: { studentId: student.id, classId, date } },
    update: {},
    create: { studentId: student.id, classId, date },
  });

  return { data: { success: true } };
}

export async function getStudentEnrollments(): Promise<
  | { error: string }
  | {
      studentId: string;
      data: Array<{
        enrollmentId: string;
        classId: string;
        status: string;
        rejectionReason: string | null;
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
          id: true,
          classId: true,
          status: true,
          rejectionReason: true,
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

  return {
    studentId: student.id,
    data: student.enrollments.map((e: (typeof student.enrollments)[number]) => ({
      enrollmentId: e.id,
      classId: e.classId,
      status: e.status,
      rejectionReason: e.rejectionReason,
      class: e.class,
    })),
  };
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
        isOpen: boolean;
        maxCapacity: number | null;
        enrollmentCount: number;
        spotsLeft: number | null;
        teacherName: string | null;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { error: "Unauthorized" };
  }

  const classes = await db.class.findMany({
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
      maxCapacity: true,
      teacher: { select: { name: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: classes.map((c: (typeof classes)[number]) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
      type: c.type,
      level: c.level,
      grade: c.grade,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      duration: c.duration,
      isOpen: c.isOpen,
      maxCapacity: c.maxCapacity,
      enrollmentCount: c._count.enrollments,
      spotsLeft: c.maxCapacity !== null ? Math.max(0, c.maxCapacity - c._count.enrollments) : null,
      teacherName: c.teacher.name,
    })),
  };
}

export async function cancelEnrollmentRequest(
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

  if (!student) return { error: "Student profile not found" };

  const enrollment = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId } },
    select: { status: true },
  });

  if (!enrollment || enrollment.status !== "PENDING") {
    return { error: "No pending request found for this class" };
  }

  await db.enrollment.delete({
    where: { studentId_classId: { studentId: student.id, classId } },
  });

  return { data: { success: true } };
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
    select: { id: true, name: true },
  });

  if (!student) {
    return { error: "Student profile not found" };
  }

  const classRecord = await db.class.findUnique({
    where: { id: classId },
    select: { name: true, teacherId: true },
  });

  const existing = await db.enrollment.findUnique({
    where: { studentId_classId: { studentId: student.id, classId } },
    select: { status: true },
  });

  if (existing) {
    if (existing.status === "REJECTED") {
      await db.enrollment.update({
        where: { studentId_classId: { studentId: student.id, classId } },
        data: { status: "PENDING", rejectionReason: null },
      });
      if (classRecord) {
        notifyUser(
          classRecord.teacherId,
          { title: `ClassSync — ${classRecord.name}`, body: `${student.name} re-requested to join.` },
          `${student.name} requested to join ${classRecord.name}.`
        ).catch((err) => console.error("[notify] requestEnrollment:", err));
      }
      return { data: { success: true } };
    }
    return { error: "You have already requested this class" };
  }

  await db.enrollment.create({
    data: {
      studentId: student.id,
      classId,
      status: "PENDING",
    },
  });

  if (classRecord) {
    notifyUser(
      classRecord.teacherId,
      { title: `ClassSync — ${classRecord.name}`, body: `${student.name} requested to join.` },
      `${student.name} requested to join ${classRecord.name}.`
    ).catch((err) => console.error("[notify] requestEnrollment:", err));
  }

  return { data: { success: true } };
}
