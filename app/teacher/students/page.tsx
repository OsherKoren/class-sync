import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherStudentsAll } from "@/lib/actions/guardian";
import { getTranslations } from "next-intl/server";
import { FindStudentByEmail } from "@/components/teacher/FindStudentByEmail";

export default async function StudentsPage() {
  const result = await getTeacherStudentsAll();
  const t = await getTranslations();

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const students = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("teacher.students.title")}</h1>
            <p className="text-muted-foreground">{t("teacher.students.subtitle")}</p>
          </div>
          <Link href="/teacher/students/new">
            <Button>{t("teacher.students.addGuardian")}</Button>
          </Link>
        </div>

        <div className="mb-8">
          <FindStudentByEmail />
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t("teacher.students.noStudents")}{" "}
                <Link href="/teacher/students/new" className="underline underline-offset-4">
                  {t("teacher.students.addFirst")}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {students.map((student) => (
              <Link key={student.id} href={`/teacher/students/${student.id}`}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <CardTitle className="text-base">{student.name}</CardTitle>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          student.hasAccount
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {student.hasAccount
                            ? t("teacher.students.accountClaimed")
                            : t("teacher.students.noAccount")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        {student.activeEnrollments > 0 && (
                          <span className="text-muted-foreground">
                            {t("teacher.students.activeCount", { count: student.activeEnrollments })}
                          </span>
                        )}
                        {student.pendingEnrollments > 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
                            {t("teacher.students.pendingCount", { count: student.pendingEnrollments })}
                          </span>
                        )}
                        {student.guardians.length > 0 && (
                          <span className="text-muted-foreground truncate max-w-48">
                            {student.guardians.map((g) => g.name || g.email).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
