import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function GuardianLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "GUARDIAN") {
    redirect("/");
  }

  const locale = await getLocale();

  return (
    <>
      <div className="fixed top-3 end-4 z-50">
        <LanguageSwitcher current={locale} />
      </div>
      {children}
    </>
  );
}
