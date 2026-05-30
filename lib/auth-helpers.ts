import { db } from "@/lib/db";

/**
 * Returns true if the given user is authorized to act on behalf of a student.
 * Authorization passes if the user IS the student (student.userId === userId)
 * OR the user is a linked guardian (a StudentGuardian row exists for the pair).
 */
export async function canActOnStudent(
  studentId: string,
  userId: string
): Promise<boolean> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      guardians: {
        where: { guardianId: userId },
        select: { guardianId: true },
      },
    },
  });

  if (!student) return false;

  return student.userId === userId || student.guardians.length > 0;
}

/**
 * Use in server actions that operate on a specific student.
 * Returns { error } if unauthorized, null if allowed.
 *
 * Usage:
 *   const authError = await requireActOnStudent(studentId, session.user.id);
 *   if (authError) return authError;
 */
export async function requireActOnStudent(
  studentId: string,
  userId: string
): Promise<{ error: string } | null> {
  const allowed = await canActOnStudent(studentId, userId);
  return allowed ? null : { error: "Unauthorized" };
}
