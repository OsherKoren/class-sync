"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

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
