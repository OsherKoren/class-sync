import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { getPendingEnrollments } from "@/lib/actions/guardian";
import { EnrollmentManagement } from "@/components/teacher/EnrollmentManagement";

export default async function TeacherDashboard() {
  const session = await auth();
  const t = await getTranslations();
  const pendingResult = await getPendingEnrollments();
  const pending = "data" in pendingResult ? pendingResult.data : [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('teacher.dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('teacher.dashboard.welcome', { name: session?.user?.name || '' })}
          </p>
        </div>

        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('teacher.dashboard.pendingRequestsTitle')}</h2>
            <div className="flex flex-col gap-3">
              {pending.map((item) => (
                <div key={item.enrollmentId} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="font-medium">{item.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('teacher.dashboard.pendingRequestsClass', { className: item.className })}
                    </p>
                  </div>
                  <EnrollmentManagement enrollmentId={item.enrollmentId} />
                </div>
              ))}
            </div>
          </div>
        )}

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
        </div>
      </div>
    </div>
  );
}
