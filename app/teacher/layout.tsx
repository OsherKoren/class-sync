import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { UserMenu } from "@/components/UserMenu";
import { LogoPill } from "@/components/LogoPill";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!session.user.registrationComplete) {
    redirect("/register/complete");
  }

  if (session.user.role !== "TEACHER") {
    redirect("/");
  }

  const locale = await getLocale();
  const t = await getTranslations();

  return (
    <>
      <LogoPill href="/teacher/dashboard" className="fixed top-3 start-4 z-50 hover:bg-primary/90 transition-colors">
        {t('common.appName')}
      </LogoPill>
      <div className="fixed top-3 end-4 z-50">
        <UserMenu
          name={session.user.name ?? null}
          email={session.user.email ?? null}
          image={session.user.image ?? null}
          currentLocale={locale}
        />
      </div>
      <div className="pt-16">{children}</div>
    </>
  );
}
