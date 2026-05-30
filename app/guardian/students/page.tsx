import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMyStudents } from "@/lib/actions/guardian-dashboard";
import { getTranslations } from "next-intl/server";

export default async function GuardianStudentsPage() {
  const result = await getMyStudents();
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/guardian/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground inline-block mb-4"
          >
            {t("guardian.students.backToDashboard")}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">{t("guardian.students.title")}</h1>
              <p className="text-muted-foreground">{t("guardian.students.subtitle")}</p>
            </div>
            <Link href="/guardian/students/new">
              <Button>{t("guardian.students.addChild")}</Button>
            </Link>
          </div>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">{t("guardian.students.noChildren")}</p>
              <Link href="/guardian/students/new">
                <Button>{t("guardian.students.addFirst")}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {students.map((student) => {
              const active = student.enrollments.filter((e) => e.status === "ACTIVE");
              const pending = student.enrollments.filter((e) => e.status === "PENDING");
              return (
                <Card key={student.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle>{student.name}</CardTitle>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${student.hasAccount ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {student.hasAccount
                            ? t("guardian.students.claimed")
                            : t("guardian.students.notClaimed")}
                        </span>
                      </div>
                      <Link href={`/guardian/students/${student.id}/link`}>
                        <Button variant="outline" size="sm">
                          {t("guardian.students.manageLinks")}
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {active.length > 0 && (
                        <span>{t("guardian.students.enrolledCount", { count: active.length })}</span>
                      )}
                      {pending.length > 0 && (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {t("guardian.students.pendingCount", { count: pending.length })}
                        </span>
                      )}
                      {active.length === 0 && pending.length === 0 && (
                        <span>{t("guardian.students.noEnrollments")}</span>
                      )}
                    </div>
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
