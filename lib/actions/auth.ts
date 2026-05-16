"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function createAccountWithEmail(
  input: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { name, email, passwordHash },
  });

  return { data: { success: true } };
}

export async function completeRegistration(
  role: "GUARDIAN" | "STUDENT" | "TEACHER"
): Promise<{ error: string } | { data: { success: true } }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, student: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (role === "GUARDIAN") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "GUARDIAN" },
      });
    } else if (role === "STUDENT") {
      if (user.student) {
        return { error: "Profile already set up" };
      }
      try {
        await db.student.create({
          data: { name: user.name || "Student", userId: user.id },
        });
      } catch (err) {
        console.error("Error creating student:", err);
        return { error: "Failed to create student profile" };
      }
      await db.user.update({
        where: { id: user.id },
        data: { role: "STUDENT" },
      });
    } else if (role === "TEACHER") {
      await db.user.update({
        where: { id: user.id },
        data: { role: "TEACHER" },
      });
    }

    return { data: { success: true } };
  } catch (err) {
    console.error("Error in completeRegistration:", err);
    return { error: "An error occurred during setup. Please try again." };
  }
}

export async function registerGuardian(
  input: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { name, email, passwordHash, role: "GUARDIAN" },
    select: { id: true },
  });

  return { data: { success: true } };
}

export async function registerStudent(
  input: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash, role: "STUDENT" },
    select: { id: true },
  });

  await db.student.create({
    data: { name, userId: user.id },
  });

  return { data: { success: true } };
}

export async function requestPasswordReset(
  email: string
): Promise<{ error: string } | { data: { success: true } }> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { error: "No account found with this email" };
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    },
  });

  // TODO: Send email with reset link
  // For now, log the token (in production, send via email service)
  console.log(`Reset link: /reset-password/${token}`);

  return { data: { success: true } };
}

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetPassword(
  token: string,
  password: string
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = resetSchema.safeParse({ password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await db.user.findUnique({
    where: { passwordResetToken: token },
    select: { id: true, passwordResetExpiry: true },
  });

  if (!user) {
    return { error: "Invalid or expired reset link" };
  }

  if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    return { error: "This reset link has expired" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  return { data: { success: true } };
}
