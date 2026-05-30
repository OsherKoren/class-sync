import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { UserMenu } from "@/components/UserMenu";
import { LogoPill } from "@/components/LogoPill";

export default async function StudentLayout({
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

  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const locale = await getLocale();
  const t = await getTranslations();

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <LogoPill href="/student/dashboard" className="hover:bg-primary/90 transition-colors">
            {t('common.appName')}
          </LogoPill>
          <UserMenu
            name={session.user.name ?? null}
            email={session.user.email ?? null}
            image={session.user.image ?? null}
            currentLocale={locale}
          />
        </div>
      </header>
      <div className="pt-14">{children}</div>
    </>
  );
}
