import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LogoPill } from "@/components/LogoPill";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    switch (role) {
      case "TEACHER":
        redirect("/teacher/dashboard");
      case "STUDENT":
        redirect("/student/dashboard");
      case "GUARDIAN":
        redirect("/guardian/dashboard");
    }
  }

  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-screen bg-background px-4 pt-14">
      <header className="fixed top-0 inset-x-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between px-4">
          <LogoPill href="/">{t('common.appName')}</LogoPill>
          <LanguageSwitcher current={locale} />
        </div>
      </header>
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-muted-foreground text-lg">
          {t('home.tagline')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('common.signIn')}
          </Link>
          <Link
            href="/register"
            className="flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t('home.createAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
