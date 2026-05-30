import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStudentEnrollments } from "@/lib/actions/student";
import { CancelEnrollmentButton } from "@/components/student/CancelEnrollmentButton";
import { getTranslations } from "next-intl/server";

export default async function StudentDashboard() {
  const session = await auth();
  const result = await getStudentEnrollments();
  const t = await getTranslations();

  const enrollments = "error" in result ? [] : result.data;
  const active = enrollments.filter((e) => e.status === "ACTIVE");
  const pending = enrollments.filter((e) => e.status === "PENDING");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('student.dashboard.title')}</h1>
            <p className="text-muted-foreground">
              {t('student.dashboard.welcome', { name: session?.user?.name || '' })}
            </p>
          </div>
          <Link href="/student/classes">
            <Button variant="outline">{t('student.dashboard.findClasses')}</Button>
          </Link>
        </div>

        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('student.dashboard.pendingTitle')}</h2>
            <div className="grid gap-4">
              {pending.map((enrollment) => (
                <Card key={enrollment.classId}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{enrollment.class.name}</CardTitle>
                        <CardDescription>
                          {enrollment.class.subject}
                        </CardDescription>
                      </div>
                      <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs rounded-full">
                        {t('student.dashboard.pendingStatus')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t(`days.${enrollment.class.dayOfWeek}` as `days.${number}`)} at{" "}
                        {enrollment.class.startTime} • {enrollment.class.duration}{" "}
                        {t('common.minutes')}
                      </p>
                      <CancelEnrollmentButton classId={enrollment.classId} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {active.length === 0 && pending.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">
                {t('student.dashboard.noClasses')}
              </p>
              <div className="text-center">
                <Link href="/student/classes">
                  <Button>{t('student.dashboard.browseClasses')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">{t('student.dashboard.activeTitle')}</h2>
                <div className="grid gap-4">
                  {active.map((enrollment) => (
                    <Card key={enrollment.classId}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{enrollment.class.name}</CardTitle>
                            <CardDescription>
                              {enrollment.class.subject}
                            </CardDescription>
                          </div>
                          <div className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs rounded-full">
                            {t('student.dashboard.activeStatus')}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {t(`days.${enrollment.class.dayOfWeek}` as `days.${number}`)} at{" "}
                          {enrollment.class.startTime} • {enrollment.class.duration}{" "}
                          {t('common.minutes')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
