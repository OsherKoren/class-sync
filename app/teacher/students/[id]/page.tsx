import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTeacherStudentById } from "@/lib/actions/guardian";
import { EnrollStudentInClass } from "@/components/teacher/EnrollStudentInClass";
import { StudentEnrollments } from "@/components/teacher/StudentEnrollments";
import { LinkGuardianByEmail } from "@/components/teacher/LinkGuardianByEmail";
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
              <LinkGuardianByEmail studentId={student.id} />
            </CardContent>
          </Card>

          <StudentEnrollments initialEnrollments={student.enrollments} />

          <EnrollStudentInClass studentId={student.id} studentName={student.name} />
        </div>
      </div>
    </div>
  );
}
