"use server";

import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canActOnStudent } from "@/lib/auth-helpers";
import { generateCode, normalizeCode } from "@/lib/link-code";
import { linkCodeGenerateRateLimit, linkCodeRedeemRateLimit } from "@/lib/rate-limit";

const MAX_ACTIVE_CODES_PER_STUDENT = 5;
const CODE_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function createLinkCode(
  studentId: string,
  kind: "CLAIM_STUDENT" | "CLAIM_GUARDIAN"
): Promise<{ error: string } | { data: { code: string; expiresAt: Date } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const { role, id: userId } = session.user as { role: string; id: string };

  const ip = (await headers()).get("x-forwarded-for") ?? "anonymous";
  const { success: rateLimitOk } = await linkCodeGenerateRateLimit.limit(`${ip}:${userId}`);
  if (!rateLimitOk) return { error: "Too many requests. Please try again later." };

  // CLAIM_STUDENT: a guardian invites their child → caller must be a linked guardian
  // CLAIM_GUARDIAN: a student/guardian invites a new guardian → caller must be authorized on the student
  if (kind === "CLAIM_STUDENT") {
    if (role !== "GUARDIAN") return { error: "Only guardians can generate a student claim code" };
    const allowed = await canActOnStudent(studentId, userId);
    if (!allowed) return { error: "Unauthorized" };
  } else {
    if (role === "TEACHER") return { error: "Teachers cannot generate guardian claim codes" };
    const allowed = await canActOnStudent(studentId, userId);
    if (!allowed) return { error: "Unauthorized" };
  }

  // Enforce max active codes per student (across all kinds)
  const activeCount = await db.linkCode.count({
    where: {
      studentId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (activeCount >= MAX_ACTIVE_CODES_PER_STUDENT) {
    return { error: "Too many active codes for this student. Revoke an existing code first." };
  }

  // Generate a unique code (retry on collision — astronomically unlikely)
  let code: string;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateCode();
    const exists = await db.linkCode.findUnique({ where: { code } });
    if (!exists) break;
    if (attempt === 4) return { error: "Could not generate a unique code. Please try again." };
  }

  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);

  await db.linkCode.create({
    data: {
      code: code!,
      kind,
      studentId,
      createdById: userId,
      expiresAt,
    },
  });

  return { data: { code: code!, expiresAt } };
}

export async function redeemLinkCode(
  rawCode: string
): Promise<{ error: string } | { data: { studentId: string; studentName: string } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const { role, id: userId } = session.user as { role: string; id: string };
  const code = normalizeCode(rawCode);

  const ip = (await headers()).get("x-forwarded-for") ?? "anonymous";
  const { success: rateLimitOk } = await linkCodeRedeemRateLimit.limit(`${ip}:${userId}`);
  if (!rateLimitOk) return { error: "Too many requests. Please try again later." };

  try {
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const linkCode = await tx.linkCode.findUnique({
        where: { code },
        select: {
          code: true,
          kind: true,
          studentId: true,
          usedAt: true,
          expiresAt: true,
          student: { select: { id: true, name: true, userId: true } },
        },
      });

      if (!linkCode) throw new Error("Code not found");
      if (linkCode.usedAt) throw new Error("This code has already been used");
      if (linkCode.expiresAt < new Date()) throw new Error("This code has expired");

      // Role must match code kind
      if (linkCode.kind === "CLAIM_STUDENT" && role !== "STUDENT") {
        throw new Error("This code is for students only");
      }
      if (linkCode.kind === "CLAIM_GUARDIAN" && role !== "GUARDIAN") {
        throw new Error("This code is for guardians only");
      }

      if (linkCode.kind === "CLAIM_STUDENT") {
        if (linkCode.student.userId) {
          throw new Error("This student account has already been claimed");
        }
        // Check the redeemer doesn't already own a different Student row
        const existing = await tx.student.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (existing && existing.id !== linkCode.studentId) {
          throw new Error("Your account is already linked to a different student");
        }

        await tx.student.update({
          where: { id: linkCode.studentId },
          data: { userId },
        });
      } else {
        // CLAIM_GUARDIAN
        const alreadyLinked = await tx.studentGuardian.findUnique({
          where: {
            studentId_guardianId: { studentId: linkCode.studentId, guardianId: userId },
          },
        });
        if (alreadyLinked) {
          throw new Error("You are already linked to this student");
        }

        await tx.studentGuardian.create({
          data: { studentId: linkCode.studentId, guardianId: userId },
        });
      }

      await tx.linkCode.update({
        where: { code },
        data: { usedAt: new Date(), usedById: userId },
      });

      return { studentId: linkCode.studentId, studentName: linkCode.student.name };
    });

    return { data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to redeem code";
    return { error: message };
  }
}

export async function revokeLinkCode(
  rawCode: string
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const code = normalizeCode(rawCode);

  const linkCode = await db.linkCode.findUnique({
    where: { code },
    select: { createdById: true, usedAt: true },
  });

  if (!linkCode) return { error: "Code not found" };
  if (linkCode.usedAt) return { error: "Code has already been used and cannot be revoked" };
  if (linkCode.createdById !== session.user.id) return { error: "Unauthorized" };

  await db.linkCode.delete({ where: { code } });

  return { data: { success: true } };
}

export async function getActiveLinkCodes(studentId: string): Promise<
  | { error: string }
  | {
      data: Array<{
        code: string;
        kind: "CLAIM_STUDENT" | "CLAIM_GUARDIAN";
        expiresAt: Date;
        createdAt: Date;
      }>;
    }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const allowed = await canActOnStudent(studentId, session.user.id as string);
  if (!allowed) return { error: "Unauthorized" };

  const codes = await db.linkCode.findMany({
    where: {
      studentId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { code: true, kind: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return { data: codes as Array<{ code: string; kind: "CLAIM_STUDENT" | "CLAIM_GUARDIAN"; expiresAt: Date; createdAt: Date }> };
}
