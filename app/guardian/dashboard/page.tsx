import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyStudents } from "@/lib/actions/guardian-dashboard";
import { getTranslations } from "next-intl/server";

export default async function GuardianDashboard() {
  const session = await auth();
  const result = await getMyStudents();
  const students = "error" in result ? [] : result.data;
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('guardian.dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('guardian.dashboard.welcome', { name: session?.user?.name || '' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/guardian/students/new">
              <Button variant="outline">{t('guardian.dashboard.addChild')}</Button>
            </Link>
            <Link href="/guardian/link">
              <Button variant="outline">{t('guardian.dashboard.linkViaCode')}</Button>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline">{t('common.signOut')}</Button>
            </form>
          </div>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">{t('guardian.dashboard.noChildren')}</p>
              <div className="flex gap-2 justify-center">
                <Link href="/guardian/students/new">
                  <Button>{t('guardian.dashboard.addChildBtn')}</Button>
                </Link>
                <Link href="/guardian/link">
                  <Button variant="outline">{t('guardian.dashboard.enterCode')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {students.map((student) => {
              const active = student.enrollments.filter((e) => e.status === "ACTIVE");
              const pending = student.enrollments.filter((e) => e.status === "PENDING");
              return (
                <Card key={student.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{student.name}</CardTitle>
                      <Link href={`/guardian/students/${student.id}/link`}>
                        <Button variant="outline" size="sm">{t('guardian.dashboard.manageLinks')}</Button>
                      </Link>
                    </div>
                    {!student.hasAccount && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        {t('guardian.dashboard.notClaimed')}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {active.length === 0 && pending.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('guardian.dashboard.notEnrolled')}</p>
                    ) : (
                      <div className="space-y-2">
                        {active.map((e) => (
                          <div key={e.class.id} className="flex items-center justify-between text-sm">
                            <span>{e.class.name} — {e.class.subject}</span>
                            <span className="text-muted-foreground">
                              {t(`days.${e.class.dayOfWeek}` as `days.${number}`)} at {e.class.startTime}
                            </span>
                          </div>
                        ))}
                        {pending.map((e) => (
                          <div key={e.class.id} className="flex items-center justify-between text-sm">
                            <span>{e.class.name} — {e.class.subject}</span>
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">{t('guardian.dashboard.pending')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
