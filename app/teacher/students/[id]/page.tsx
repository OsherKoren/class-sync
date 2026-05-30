import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherStudentById } from "@/lib/actions/guardian";
import { EnrollStudentInClass } from "@/components/teacher/EnrollStudentInClass";
import { SUBJECT_KEYS } from "@/lib/classKeys";
import { getTranslations } from "next-intl/server";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  const result = await getTeacherStudentById(studentId);
  const t = await getTranslations();

  if ("error" in result) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-destructive">{result.error}</p>
          <Link href="/teacher/students" className="mt-4 inline-block">
            <Button>{t("teacher.studentDetail.backToStudents")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const student = result.data;
  const activeEnrollments = student.enrollments.filter((e) => e.status === "ACTIVE");
  const pendingEnrollments = student.enrollments.filter((e) => e.status === "PENDING");

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/teacher/students"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            {t("teacher.studentDetail.backToStudents")}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${
              student.hasAccount
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {student.hasAccount
                ? t("teacher.studentDetail.claimed")
                : t("teacher.studentDetail.notClaimed")}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("teacher.studentDetail.guardians")}</CardTitle>
              <CardDescription>{t("teacher.studentDetail.guardiansDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {student.guardians.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher.studentDetail.noGuardians")}</p>
              ) : (
                <div className="space-y-2">
                  {student.guardians.map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{g.name || t("common.unnamed")}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{g.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("teacher.studentDetail.enrollments")}</CardTitle>
              <CardDescription>{t("teacher.studentDetail.enrollmentsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {student.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("teacher.studentDetail.noEnrollments")}</p>
              ) : (
                <div className="space-y-2">
                  {activeEnrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{e.class.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SUBJECT_KEYS.has(e.class.subject)
                            ? t(`teacher.createClass.subjects.${e.class.subject}` as `teacher.createClass.subjects.${string}`)
                            : e.class.subject}{" "}
                          · {t(`days.${e.class.dayOfWeek}` as `days.${number}`)} {e.class.startTime}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {t("teacher.studentDetail.active")}
                      </span>
                    </div>
                  ))}
                  {pendingEnrollments.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{e.class.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SUBJECT_KEYS.has(e.class.subject)
                            ? t(`teacher.createClass.subjects.${e.class.subject}` as `teacher.createClass.subjects.${string}`)
                            : e.class.subject}{" "}
                          · {t(`days.${e.class.dayOfWeek}` as `days.${number}`)} {e.class.startTime}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                        {t("teacher.studentDetail.pending")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <EnrollStudentInClass studentId={student.id} studentName={student.name} />
        </div>
      </div>
    </div>
  );
}
