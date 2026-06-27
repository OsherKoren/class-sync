import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteClassSection } from "@/components/DeleteClassSection";
import { getClassById, getCancelledSessionDates, getRescheduledSessions } from "@/lib/actions/class";
import { EnrollmentManagement } from "@/components/teacher/EnrollmentManagement";
import { ToggleOpenEnrollment } from "@/components/teacher/ToggleOpenEnrollment";
import { EnrollByEmail } from "@/components/teacher/EnrollByEmail";
import { UpcomingSessions } from "@/components/teacher/UpcomingSessions";
import { GRADE_KEYS, SUBJECT_KEYS } from "@/lib/classKeys";
import { getTranslations } from "next-intl/server";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, cancelledResult, rescheduledResult] = await Promise.all([
    getClassById(id),
    getCancelledSessionDates(id),
    getRescheduledSessions(id),
  ]);
  const t = await getTranslations();
  const cancelledDates = "data" in cancelledResult ? cancelledResult.data : [];
  const rescheduledSessions = "data" in rescheduledResult ? rescheduledResult.data : [];

  if ("error" in result) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{result.error}</p>
          <Link href="/teacher/classes" className="mt-4 inline-block">
            <Button>{t('teacher.classDetail.backToClasses')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const classData = result.data;
  const activeEnrollments = classData.enrollments.filter(
    (e) => e.status === "ACTIVE"
  );
  const pendingEnrollments = classData.enrollments.filter(
    (e) => e.status === "PENDING"
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/teacher/classes"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            {t('teacher.classDetail.backToClasses')}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${classData.isRecurring ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"}`}>
              {classData.isRecurring ? t("teacher.createClass.recurringBadge") : t("teacher.createClass.oneTimeBadge")}
            </span>
          </div>
          <p className="text-muted-foreground">{SUBJECT_KEYS.has(classData.subject) ? t(`teacher.createClass.subjects.${classData.subject}` as `teacher.createClass.subjects.${string}`) : classData.subject}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('teacher.classDetail.type')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{t(`classTypes.${classData.type}` as `classTypes.${string}`)}</p>
              {(classData.grade || classData.level) && (
                <p className="text-xs text-muted-foreground">
                  {classData.grade && <span>{GRADE_KEYS.has(classData.grade) ? t(`teacher.createClass.grades.${classData.grade}` as `teacher.createClass.grades.${number}`) : classData.grade}</span>}
                  {classData.grade && classData.level && <span> · </span>}
                  {classData.level && (
                    <span>{t(`classLevels.${classData.level}` as `classLevels.${string}`)}</span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('teacher.classDetail.schedule')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{classData.startTime}</p>
              <p className="text-xs text-muted-foreground">
                {t(`days.${classData.dayOfWeek}` as `days.${number}`)} • {classData.duration} min
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t('teacher.classDetail.enrolled')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {classData.maxCapacity
                  ? `${activeEnrollments.length} / ${classData.maxCapacity}`
                  : activeEnrollments.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {activeEnrollments.length === 1 ? t('common.student') : t('common.students')}
              </p>
            </CardContent>
          </Card>
        </div>

        <ToggleOpenEnrollment
          classId={classData.id}
          isOpen={classData.isOpen}
          maxCapacity={classData.maxCapacity}
          enrollmentCount={activeEnrollments.length}
        />

        {pendingEnrollments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('teacher.classDetail.pendingRequests')}</CardTitle>
              <CardDescription>
                {t('teacher.classDetail.pendingDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{enrollment.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('teacher.classDetail.pendingApproval')}
                      </p>
                    </div>
                    <EnrollmentManagement enrollmentId={enrollment.id} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('teacher.classDetail.enrolledStudents')}</CardTitle>
            <CardDescription>
              {t('teacher.classDetail.enrolledDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeEnrollments.length === 0 ? (
              <p className="text-muted-foreground">
                {t('teacher.classDetail.noStudents')}{" "}
                <Link
                  href="/teacher/students"
                  className="underline underline-offset-4"
                >
                  {t('teacher.classDetail.goToStudents')}
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {activeEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{enrollment.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {enrollment.studentId.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <UpcomingSessions
          classId={classData.id}
          dayOfWeek={classData.dayOfWeek}
          startTime={classData.startTime}
          isRecurring={classData.isRecurring}
          initialCancelledDates={cancelledDates}
          initialRescheduledSessions={rescheduledSessions}
        />

        <EnrollByEmail classId={classData.id} />

        <DeleteClassSection classId={classData.id} />
      </div>
    </div>
  );
}
