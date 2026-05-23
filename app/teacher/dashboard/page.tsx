import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getTranslations, getLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function TeacherDashboard() {
  const session = await auth();
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('teacher.dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('teacher.dashboard.welcome', { name: session?.user?.name || '' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline">
                {t('common.signOut')}
              </Button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/teacher/classes">
            <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
              <h2 className="text-lg font-semibold mb-2">{t('teacher.dashboard.classes')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('teacher.dashboard.classesDesc')}
              </p>
            </div>
          </Link>

          <Link href="/teacher/students">
            <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
              <h2 className="text-lg font-semibold mb-2">{t('teacher.dashboard.students')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('teacher.dashboard.studentsDesc')}
              </p>
            </div>
          </Link>

          <div className="rounded-lg border border-border bg-card p-6 opacity-50">
            <h2 className="text-lg font-semibold mb-2">{t('teacher.dashboard.reschedules')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('teacher.dashboard.reschedulesDesc')}
            </p>
          </div>

          <Link href="/teacher/settings">
            <div className="rounded-lg border border-border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
              <h2 className="text-lg font-semibold mb-2">{t('teacher.dashboard.settings')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('teacher.dashboard.settingsDesc')}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
