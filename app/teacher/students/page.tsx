import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeacherStudents } from "@/lib/actions/guardian";
import { getTranslations } from "next-intl/server";

export default async function StudentsPage() {
  const result = await getTeacherStudents();
  const t = await getTranslations();

  if ("error" in result) {
    return (
      <div className="p-8">
        <p className="text-destructive">{result.error}</p>
      </div>
    );
  }

  const guardians = result.data;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('teacher.students.title')}</h1>
            <p className="text-muted-foreground">
              {t('teacher.students.subtitle')}
            </p>
          </div>
          <Link href="/teacher/students/new">
            <Button>{t('teacher.students.addGuardian')}</Button>
          </Link>
        </div>

        {guardians.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {t('teacher.students.noGuardians')}{" "}
                <Link
                  href="/teacher/students/new"
                  className="underline underline-offset-4"
                >
                  {t('teacher.students.addFirst')}
                </Link>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {guardians.map((guardian) => (
              <Link
                key={guardian.guardianId}
                href={`/teacher/students/${guardian.guardianId}`}
              >
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{guardian.guardianName}</CardTitle>
                        <CardDescription>{guardian.guardianEmail}</CardDescription>
                      </div>
                      <div className="text-right text-sm font-medium">
                        {guardian.students.length}{" "}
                        {guardian.students.length === 1 ? t('common.student') : t('common.students')}
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
