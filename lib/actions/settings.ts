"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const contactSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format (e.g. +972501234567)")
    .or(z.literal("")),
  whatsappOptIn: z.boolean(),
});

export async function updateContactSettings(
  input: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      phone: parsed.data.phone || null,
      whatsappOptIn: parsed.data.whatsappOptIn,
    },
  });

  return { data: { success: true } };
}

export async function getContactSettings(): Promise<
  { error: string } | { data: { phone: string | null; whatsappOptIn: boolean } }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, whatsappOptIn: true },
  });

  if (!user) return { error: "User not found" };
  return { data: { phone: user.phone, whatsappOptIn: user.whatsappOptIn } };
}

const themeSchema = z.enum(["light", "dark", "system"]);

export async function updateTheme(
  theme: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) return { error: "Invalid theme" };

  const session = await auth();
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: { theme: parsed.data },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set("theme", parsed.data, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  return { data: { success: true } };
}

const localeSchema = z.enum(["he", "en"]);

export async function updateLocale(
  locale: unknown
): Promise<{ error: string } | { data: { success: true } }> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return { error: "Invalid locale" };

  const session = await auth();
  if (session?.user?.id) {
    await db.user.update({
      where: { id: session.user.id },
      data: { locale: parsed.data },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set("locale", parsed.data, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });

  return { data: { success: true } };
}
